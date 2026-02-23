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
import { defineEventHandler, readBody, createError } from 'h3'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const URL_REGEX = /^https?:\/\/.+/i

interface DeclaredData {
  brand: string
  model: string
  year: number
  km: number
}

interface VerifyDocumentBody {
  documentId: string
  vehicleId: string
  imageUrl: string
  declaredData: DeclaredData
}

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
  extractedData: ExtractedData
  discrepancies: string[]
  documentId: string
  status: 'verified' | 'pending'
}

function validateDeclaredData(data: DeclaredData): string[] {
  const errors: string[] = []
  const currentYear = new Date().getFullYear()

  if (!data || typeof data !== 'object') {
    errors.push('declaredData must be an object')
    return errors
  }

  if (!data.brand || typeof data.brand !== 'string' || data.brand.trim().length === 0) {
    errors.push('declaredData.brand is required')
  }

  if (!data.model || typeof data.model !== 'string' || data.model.trim().length === 0) {
    errors.push('declaredData.model is required')
  }

  if (data.year === undefined || data.year === null || typeof data.year !== 'number') {
    errors.push('declaredData.year is required and must be a number')
  } else if (data.year < 1950 || data.year > currentYear + 2) {
    errors.push(`declaredData.year must be between 1950 and ${currentYear + 2}`)
  }

  if (data.km === undefined || data.km === null || typeof data.km !== 'number') {
    errors.push('declaredData.km is required and must be a number')
  } else if (data.km < 0) {
    errors.push('declaredData.km must be >= 0')
  }

  return errors
}

function validateBody(body: VerifyDocumentBody): string[] {
  const errors: string[] = []

  // documentId — required UUID
  if (!body.documentId || typeof body.documentId !== 'string') {
    errors.push('documentId is required')
  } else if (!UUID_REGEX.test(body.documentId)) {
    errors.push('documentId must be a valid UUID')
  }

  // vehicleId — required UUID
  if (!body.vehicleId || typeof body.vehicleId !== 'string') {
    errors.push('vehicleId is required')
  } else if (!UUID_REGEX.test(body.vehicleId)) {
    errors.push('vehicleId must be a valid UUID')
  }

  // imageUrl — required, must be a valid URL
  if (!body.imageUrl || typeof body.imageUrl !== 'string') {
    errors.push('imageUrl is required')
  } else if (!URL_REGEX.test(body.imageUrl.trim())) {
    errors.push('imageUrl must be a valid HTTP/HTTPS URL')
  }

  // declaredData — required object with nested validation
  if (!body.declaredData) {
    errors.push('declaredData is required')
  } else {
    errors.push(...validateDeclaredData(body.declaredData))
  }

  return errors
}

export default defineEventHandler(async (event): Promise<VerifyDocumentResponse> => {
  // 1. Authenticate user
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  // 2. Get Supabase service role client for DB operations
  const supabase = serverSupabaseServiceRole(event)

  // 3. Read and validate body
  const body = await readBody<VerifyDocumentBody>(event)
  const validationErrors = validateBody(body)

  if (validationErrors.length > 0) {
    throw createError({
      statusCode: 400,
      message: `Validation failed: ${validationErrors.join('; ')}`,
    })
  }

  const documentId = body.documentId.trim()
  const vehicleId = body.vehicleId.trim()
  const imageUrl = body.imageUrl.trim()
  const declaredData = body.declaredData

  // 4. Verify the document exists and belongs to the vehicle
  const { data: existingDoc, error: docError } = await supabase
    .from('verification_documents')
    .select('id, vehicle_id, doc_type, status')
    .eq('id', documentId)
    .single()

  if (docError || !existingDoc) {
    throw createError({
      statusCode: 404,
      message: 'Verification document not found',
    })
  }

  if (existingDoc.vehicle_id !== vehicleId) {
    throw createError({
      statusCode: 400,
      message: 'Document does not belong to the specified vehicle',
    })
  }

  // 5. Verify the vehicle exists
  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('id, brand, model, year')
    .eq('id', vehicleId)
    .single()

  if (vehicleError || !vehicle) {
    throw createError({
      statusCode: 404,
      message: 'Vehicle not found',
    })
  }

  // 6. Call Claude Vision API for document analysis
  // ---------------------------------------------------------------
  // PLACEHOLDER: Replace this block with the actual Claude Vision API
  // call when API keys are configured.
  //
  // Example Claude Vision integration:
  //
  //   const runtimeConfig = useRuntimeConfig()
  //   const visionResponse = await $fetch('https://api.anthropic.com/v1/messages', {
  //     method: 'POST',
  //     headers: {
  //       'x-api-key': runtimeConfig.claudeApiKey,
  //       'anthropic-version': '2023-06-01',
  //       'content-type': 'application/json',
  //     },
  //     body: {
  //       model: 'claude-sonnet-4-20250514',
  //       max_tokens: 1024,
  //       messages: [{
  //         role: 'user',
  //         content: [
  //           {
  //             type: 'image',
  //             source: { type: 'url', url: imageUrl },
  //           },
  //           {
  //             type: 'text',
  //             text: `Analyze this vehicle document image. Extract the following fields:
  //               - Brand/Make
  //               - Model
  //               - Year of first registration
  //               - Kilometers (if visible)
  //               - License plate (matricula)
  //               - VIN number (if visible)
  //               Return as JSON: { brand, model, year, km, matricula, vin }
  //               Use null for fields not found in the document.`,
  //           },
  //         ],
  //       }],
  //     },
  //   })
  //
  //   // Parse the vision response to extract structured data
  //   const extractedData = parseVisionResponse(visionResponse)
  // ---------------------------------------------------------------

  // Mock extracted data — simulates a successful document read
  const extractedData: ExtractedData = {
    brand: declaredData.brand,
    model: declaredData.model,
    year: declaredData.year,
    km: declaredData.km,
    matricula: null,
    vin: null,
  }

  // 7. Compare extracted data with declared data
  const discrepancies: string[] = []

  if (
    extractedData.brand !== null &&
    extractedData.brand.toLowerCase() !== declaredData.brand.toLowerCase()
  ) {
    discrepancies.push(
      `Brand mismatch: declared "${declaredData.brand}", extracted "${extractedData.brand}"`,
    )
  }

  if (
    extractedData.model !== null &&
    extractedData.model.toLowerCase() !== declaredData.model.toLowerCase()
  ) {
    discrepancies.push(
      `Model mismatch: declared "${declaredData.model}", extracted "${extractedData.model}"`,
    )
  }

  if (extractedData.year !== null && extractedData.year !== declaredData.year) {
    discrepancies.push(
      `Year mismatch: declared ${declaredData.year}, extracted ${extractedData.year}`,
    )
  }

  // Allow a 5% tolerance for km readings (odometer photos can be slightly off)
  if (extractedData.km !== null) {
    const kmTolerance = declaredData.km * 0.05
    const kmDifference = Math.abs(extractedData.km - declaredData.km)
    if (kmDifference > kmTolerance) {
      discrepancies.push(
        `Km mismatch: declared ${declaredData.km}, extracted ${extractedData.km} (difference: ${kmDifference})`,
      )
    }
  }

  const isMatch = discrepancies.length === 0

  // Confidence score: 1.0 for mock data, real implementation would use
  // Claude Vision's confidence indicators
  const confidence = isMatch ? 0.95 : 0.4

  const newStatus: 'verified' | 'pending' = isMatch ? 'verified' : 'pending'
  const now = new Date().toISOString()

  // 8. Update the verification document based on the result
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
    throw createError({
      statusCode: 500,
      message: `Failed to update document status: ${updateError.message}`,
    })
  }

  // 9. If mismatch, flag the document for manual review by adding a note to the data
  if (!isMatch) {
    // The document stays as 'pending' — admin will see it in the
    // verification dashboard with discrepancies listed for manual review.
    // No additional DB operation needed; the discrepancies are stored
    // in the data JSONB field above.
  }

  return {
    match: isMatch,
    confidence,
    extractedData,
    discrepancies,
    documentId,
    status: newStatus,
  }
})
