/**
 * Claude Vision Auto-Verification
 *
 * Accepts: { documentId, vehicleId, imageUrl, declaredData: { brand, model, year, km } }
 * Returns: { match, confidence, extractedData, discrepancies }
 *
 * When Claude Vision API is configured, this will analyze uploaded
 * vehicle documents (ITV sheets, registration cards, etc.) and compare
 * the extracted data against declared vehicle information.
 *
 * POST /api/verify-document
 */
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { defineEventHandler } from 'h3'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { callAI } from '~~/server/services/aiProvider'
import { safeError } from '~~/server/utils/safeError'
import { validateBody } from '~~/server/utils/validateBody'
import { logger } from '../utils/logger'
import { logAdminAction } from '../utils/auditLog'

const verifyDocumentSchema = z.object({
  documentId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  imageUrl: z.string().url().max(2048),
  declaredData: z.object({
    brand: z.string().trim().min(1).max(128),
    model: z.string().trim().min(1).max(128),
    year: z
      .number()
      .int()
      .min(1950)
      .max(new Date().getFullYear() + 2),
    km: z.number().nonnegative(),
  }),
})

type DeclaredData = z.infer<typeof verifyDocumentSchema>['declaredData']

interface ExtractedData {
  brand: string | null
  model: string | null
  year: number | null
  km: number | null
  matricula: string | null
  vin: string | null
}

interface VerifyDocumentResponse {
  match: boolean
  confidence: number
  extractedData?: ExtractedData
  discrepancies: string[]
  documentId: string
  status: 'verified' | 'pending'
}

async function checkVehicleAccess(
  supabase: SupabaseClient,
  userId: string,
  dealerId: string | null,
): Promise<boolean> {
  const { data: userDealer, error: dealerErr } = await supabase
    .from('dealers')
    .select('id')
    .eq('user_id', userId)
    .single()

  const ownsVehicle = !dealerErr && userDealer?.id === dealerId
  if (ownsVehicle) return true

  const { data: userData, error: userErr } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  return !userErr && userData?.role === 'admin'
}

function compareExtractedData(extracted: ExtractedData, declared: DeclaredData): string[] {
  const discrepancies: string[] = []

  if (extracted.brand !== null && extracted.brand.toLowerCase() !== declared.brand.toLowerCase()) {
    discrepancies.push(
      `Brand mismatch: declared "${declared.brand}", extracted "${extracted.brand}"`,
    )
  }
  if (extracted.model !== null && extracted.model.toLowerCase() !== declared.model.toLowerCase()) {
    discrepancies.push(
      `Model mismatch: declared "${declared.model}", extracted "${extracted.model}"`,
    )
  }
  if (extracted.year !== null && extracted.year !== declared.year) {
    discrepancies.push(`Year mismatch: declared ${declared.year}, extracted ${extracted.year}`)
  }
  if (extracted.km !== null) {
    const kmDifference = Math.abs(extracted.km - declared.km)
    if (kmDifference > declared.km * 0.05) {
      discrepancies.push(
        `Km mismatch: declared ${declared.km}, extracted ${extracted.km} (difference: ${kmDifference})`,
      )
    }
  }

  return discrepancies
}

export default defineEventHandler(async (event): Promise<VerifyDocumentResponse> => {
  // 1. Authenticate user
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw safeError(401, 'Authentication required')
  }

  // 2. Get Supabase service role client for DB operations
  const supabase = serverSupabaseServiceRole(event)

  // 3. Read and validate body
  const body = await validateBody(event, verifyDocumentSchema)

  const { documentId, vehicleId, imageUrl, declaredData } = body

  // 4. Verify the vehicle exists and check ownership FIRST (before exposing any document data)
  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('id, brand, model, year, dealer_id')
    .eq('id', vehicleId)
    .single()

  if (vehicleError || !vehicle) {
    throw safeError(404, 'Vehicle not found')
  }

  // 5. Verify vehicle ownership before accessing any documents
  const hasAccess = await checkVehicleAccess(supabase, user.id, vehicle.dealer_id)
  if (!hasAccess) {
    throw safeError(403, 'You do not have permission to verify documents for this vehicle')
  }

  // 6. Verify the document exists and belongs to the vehicle (ownership already confirmed)
  const { data: existingDoc, error: docError } = await supabase
    .from('verification_documents')
    .select('id, vehicle_id, doc_type, status')
    .eq('id', documentId)
    .eq('vehicle_id', vehicleId)
    .single()

  if (docError || !existingDoc) {
    throw safeError(404, 'Verification document not found')
  }

  // 7. Call AI Vision for document analysis (with fallback to mock)
  let extractedData: ExtractedData | null

  try {
    const aiResponse = await callAI(
      {
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this vehicle document image at URL: ${imageUrl}

Extract the following fields from the document:
- Brand/Make
- Model
- Year of first registration
- Kilometers (if visible)
- License plate (matricula)
- VIN number (if visible)

Return ONLY valid JSON with this exact structure (no markdown, no code fences):
{ "brand": "string or null", "model": "string or null", "year": null or number, "km": null or number, "matricula": "string or null", "vin": "string or null" }

Use null for fields not found in the document.`,
              },
            ],
          },
        ],
        maxTokens: 1024,
        system:
          'You are a vehicle document analysis expert. Extract structured data from vehicle registration documents, ITV sheets, and similar official documents.',
      },
      'background',
      'vision',
    )

    let cleaned = aiResponse.text.trim()
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\n?```\s*$/, '')
    }
    extractedData = JSON.parse(cleaned) as ExtractedData
  } catch {
    // AI unavailable — cannot verify. Mark as pending_review for manual check.
    logger.warn('[verify-document] AI unavailable, marking as pending_review (no auto-approve)')
    extractedData = null
  }

  // 8. Compare extracted data with declared data (only if AI succeeded)
  let discrepancies: ReturnType<typeof compareExtractedData> = []
  let isMatch = false
  let confidence = 0
  let newStatus: 'verified' | 'pending' | 'pending_review'

  if (extractedData) {
    discrepancies = compareExtractedData(extractedData, declaredData)
    isMatch = discrepancies.length === 0
    confidence = isMatch ? 0.95 : 0.4
    newStatus = isMatch ? 'verified' : 'pending'
  } else {
    // No AI extraction — cannot auto-verify, require manual review
    newStatus = 'pending'
    confidence = 0
  }
  const now = new Date().toISOString()

  // 9. Update the verification document based on the result
  const updatePayload: Record<string, unknown> = {
    status: newStatus,
    data: {
      extractedData,
      declaredData,
      discrepancies,
      confidence,
      analyzedAt: now,
      analyzedBy: 'auto-vision',
      imageUrl,
    },
  }

  if (isMatch) {
    updatePayload.verified_by = user.id
  }

  const { error: updateError } = await supabase
    .from('verification_documents')
    .update(updatePayload)
    .eq('id', documentId)

  if (updateError) {
    throw safeError(500, `Failed to update document status: ${updateError.message}`)
  }

  // 10. Audit log the verification action (fire-and-forget)
  await logAdminAction(supabase, event, {
    action: 'vehicle.document_verify',
    resourceType: 'vehicle',
    resourceId: vehicleId,
    actorId: user.id,
    actorEmail: user.email ?? undefined,
    metadata: { documentId, match: isMatch, confidence, discrepancyCount: discrepancies.length },
  })

  return {
    match: isMatch,
    confidence,
    extractedData: extractedData ?? undefined,
    discrepancies,
    documentId,
    status: newStatus,
  }
})
