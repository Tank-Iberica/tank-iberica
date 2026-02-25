/**
 * WhatsApp submission processor — orchestrates the full flow.
 *
 * 1. Download images from WhatsApp Media API
 * 2. Call Claude Vision via callAI for vehicle analysis
 * 3. Upload images via imageUploader
 * 4. Create vehicle via vehicleCreator
 * 5. Notify dealer via notifications service
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { callAI, type AIContentBlock } from './aiProvider'
import { uploadImage } from './imageUploader'
import { sanitizeSlug, createVehicleFromAI, type ClaudeVehicleAnalysis } from './vehicleCreator'
import { getSiteUrl } from '~/server/utils/siteConfig'

// Re-export for convenience
export { uploadImage } from './imageUploader'
export { createVehicle, createVehicleFromAI, sanitizeSlug } from './vehicleCreator'
export { notify, notifyDealer, notifyAdmin, notifyBuyer } from './notifications'

// ── Types ──

interface SubmissionRow {
  id: string
  dealer_id: string | null
  phone_number: string
  media_ids: string[]
  text_content: string | null
  status: string
}

interface ProcessResult {
  vehicleId: string
  slug: string
  imagesUploaded: number
}

// ── Supabase REST helpers for whatsapp_submissions ──

async function fetchSubmission(
  supabaseUrl: string,
  supabaseKey: string,
  submissionId: string,
): Promise<SubmissionRow | null> {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/whatsapp_submissions?id=eq.${submissionId}&select=id,dealer_id,phone_number,media_ids,text_content,status`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    },
  )

  if (!response.ok) return null
  const rows = (await response.json()) as SubmissionRow[]
  return rows[0] ?? null
}

async function updateSubmission(
  supabaseUrl: string,
  supabaseKey: string,
  submissionId: string,
  data: Record<string, unknown>,
): Promise<void> {
  await fetch(`${supabaseUrl}/rest/v1/whatsapp_submissions?id=eq.${submissionId}`, {
    method: 'PATCH',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(data),
  })
}

// ── Claude Vision prompt ──

function buildClaudePrompt(textContent: string | null, categoryList?: string): string {
  const cats =
    categoryList ||
    "'Cabezas tractoras', 'Camiones', 'Semirremolques', 'Remolques', 'Cisternas', 'Furgonetas', 'Otros'"

  const textSection = textContent
    ? `\n\nThe dealer also sent this text message with the images:\n"${textContent}"\n\nUse this text to supplement your analysis — it may contain brand, model, year, plate, or other details.`
    : ''

  return `You are an expert industrial vehicle analyst for Tracciona.com, a marketplace for industrial vehicles (trucks, trailers, tankers, tractor units, etc.).

Analyze the provided images of an industrial vehicle and extract all available information.${textSection}

Return a JSON object with EXACTLY this structure (no markdown, no code fences, just valid JSON):
{
  "brand": "string -- vehicle manufacturer (e.g. Renault, Volvo, Scania, MAN, DAF, Mercedes-Benz)",
  "model": "string -- specific model name/number",
  "year": null or number,
  "category_name_es": "string -- main category in Spanish: one of ${cats}",
  "subcategory_name_es": "string or null -- subcategory in Spanish if identifiable",
  "license_plate": "string or null -- license plate if visible in any image",
  "title_es": "string -- SEO title in Spanish (brand + model + key feature, max 70 chars)",
  "title_en": "string -- SEO title in English (brand + model + key feature, max 70 chars)",
  "description_es": "string -- SEO-optimized description in Spanish, 150-300 words",
  "description_en": "string -- SEO-optimized description in English, 150-300 words",
  "attributes_json": {
    "axles": null or number,
    "mma_kg": null or number,
    "tara_kg": null or number,
    "capacity_kg": null or number,
    "capacity_liters": null or number,
    "km": null or number,
    "engine_power_cv": null or number,
    "fuel_type": null or string,
    "transmission": null or string,
    "suspension": null or string,
    "dimensions_m": null or string,
    "color": null or string,
    "additional_features": []
  },
  "suggested_slug": "string -- URL-friendly slug: brand-model-year-type (lowercase, hyphens, no accents)",
  "condition": "string or null -- 'nuevo', 'seminuevo', 'usado', 'para_piezas'",
  "image_alt_texts": ["string -- descriptive alt text for each image in order, in Spanish"]
}

Be thorough but accurate. If you cannot determine a value, use null. Do not invent data that is not visible or deducible from the images and text.`
}

/** Parse Claude's response, stripping any markdown code fences */
function parseClaudeResponse(text: string): ClaudeVehicleAnalysis {
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\n?```\s*$/, '')
  }

  return JSON.parse(cleaned) as ClaudeVehicleAnalysis
}

/**
 * Process a WhatsApp submission end-to-end.
 *
 * @param submissionId - UUID of the whatsapp_submissions row
 * @param supabase - Supabase service-role client
 */
export async function processWhatsAppSubmission(
  submissionId: string,
  supabase: SupabaseClient,
): Promise<ProcessResult> {
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  // 1. Load submission
  const submission = await fetchSubmission(supabaseUrl, supabaseKey, submissionId)
  if (!submission) {
    throw new Error('Submission not found')
  }

  if (submission.status !== 'received') {
    throw new Error(`Submission already in status: ${submission.status}`)
  }

  // 2. Mark as processing
  await updateSubmission(supabaseUrl, supabaseKey, submissionId, { status: 'processing' })

  try {
    // 3. Download images from WhatsApp
    const imageBuffers: Buffer[] = []
    for (const mediaId of submission.media_ids) {
      try {
        const buffer = await downloadWhatsAppMedia(mediaId)
        if (buffer.length > 0) {
          imageBuffers.push(buffer)
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error('[whatsappProcessor] Failed to download media:', message)
      }
    }

    // 4. Get category names from DB for the prompt
    const { data: categoryNamesRaw } = await supabase.from('categories').select('name_es')
    const categoryNames = (categoryNamesRaw ?? []) as unknown as { name_es: string }[]
    const categoryList =
      categoryNames.length > 0 ? categoryNames.map((c) => `'${c.name_es}'`).join(', ') : undefined

    // 5. Call AI Vision (uses callAI with failover)
    const imageBlocks: AIContentBlock[] = imageBuffers.map((buffer) => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: 'image/jpeg',
        data: buffer.toString('base64'),
      },
    }))

    const textBlock: AIContentBlock = {
      type: 'text',
      text:
        imageBuffers.length > 0
          ? `Analyze these ${imageBuffers.length} image(s) of an industrial vehicle.`
          : 'No images could be downloaded. Analyze based on the text content provided in the system prompt.',
    }

    const aiResponse = await callAI(
      {
        messages: [{ role: 'user', content: [...imageBlocks, textBlock] }],
        maxTokens: 4096,
        system: buildClaudePrompt(submission.text_content, categoryList),
      },
      'background',
      'vision',
    )

    const analysis = parseClaudeResponse(aiResponse.text)

    // 6. Upload images
    const uploadedImages: Array<{
      result: { publicId: string; secureUrl: string; width: number; height: number; format: string }
      altText: string
      position: number
    }> = []

    for (let i = 0; i < imageBuffers.length; i++) {
      const currentBuffer = imageBuffers[i]
      if (!currentBuffer) continue

      const filename = `${sanitizeSlug(analysis.suggested_slug)}-${i + 1}-${Date.now()}`
      const altText =
        analysis.image_alt_texts[i] || `${analysis.brand} ${analysis.model} imagen ${i + 1}`

      const result = await uploadImage(currentBuffer, { filename })

      if (result) {
        uploadedImages.push({ result, altText, position: i })
      }
    }

    // 7. Create vehicle + images
    const vehicleResult = await createVehicleFromAI(
      supabase,
      analysis,
      submission.dealer_id,
      uploadedImages,
      submissionId,
    )

    // 8. Update submission
    await updateSubmission(supabaseUrl, supabaseKey, submissionId, {
      status: 'processed',
      vehicle_id: vehicleResult.id,
      claude_response: analysis,
    })

    // 9. Notify dealer via WhatsApp
    const title = analysis.title_es || `${analysis.brand} ${analysis.model}`
    try {
      await sendWhatsAppMessage(
        submission.phone_number,
        `\u2705 Tu veh\u00EDculo ha sido procesado: ${title}. Un admin lo revisar\u00E1 pronto. Enlace: ${getSiteUrl()}/vehiculo/${vehicleResult.slug}`,
      )
    } catch {
      console.error('[whatsappProcessor] Failed to send success notification')
    }

    return {
      vehicleId: vehicleResult.id,
      slug: vehicleResult.slug,
      imagesUploaded: uploadedImages.length,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown processing error'
    console.error(`[whatsappProcessor] Error processing submission ${submissionId}:`, message)

    await updateSubmission(supabaseUrl, supabaseKey, submissionId, {
      status: 'failed',
      error_message: message,
    })

    // Notify dealer of failure
    try {
      await sendWhatsAppMessage(
        submission.phone_number,
        'Lo sentimos, hubo un error procesando tu env\u00EDo. Nuestro equipo lo revisar\u00E1 manualmente. Gracias por tu paciencia.',
      )
    } catch {
      console.error('[whatsappProcessor] Failed to send error notification')
    }

    throw err
  }
}
