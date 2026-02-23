/**
 * WhatsApp Submission Processor (POST)
 *
 * Processes a WhatsApp submission using Claude Vision:
 * 1. Downloads images from WhatsApp Media API
 * 2. Sends images + text to Claude Vision for analysis
 * 3. Uploads images to Cloudinary
 * 4. Creates a draft vehicle in Supabase
 * 5. Notifies the dealer via WhatsApp
 *
 * POST /api/whatsapp/process
 * Body: { submissionId: string }
 */
import { serverSupabaseServiceRole } from '#supabase/server'
import { defineEventHandler, readBody, createError, getHeader, getRequestIP } from 'h3'
import Anthropic from '@anthropic-ai/sdk'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ── Types ──

interface ProcessBody {
  submissionId: string
}

interface SubmissionRow {
  id: string
  dealer_id: string | null
  phone_number: string
  media_ids: string[]
  text_content: string | null
  status: string
}

interface DealerRow {
  id: string
  user_id: string | null
  company_name: Record<string, string> | null
}

interface CategoryRow {
  id: string
  name_es: string
  name_en: string | null
  slug: string
}

interface ClaudeVehicleAnalysis {
  brand: string
  model: string
  year: number | null
  category_name_es: string
  subcategory_name_es: string | null
  license_plate: string | null
  title_es: string
  title_en: string
  description_es: string
  description_en: string
  attributes_json: Record<string, unknown>
  suggested_slug: string
  condition: string | null
  image_alt_texts: string[]
}

interface CloudinaryUploadResponse {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
}

// ── Supabase REST helpers for whatsapp_submissions (not yet in generated types) ──

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

// ── Helpers ──

/** Sanitize a slug: lowercase, ASCII only, hyphens for spaces */
function sanitizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

/** Upload an image buffer to Cloudinary (server-side unsigned upload) */
async function uploadToCloudinary(
  imageBuffer: Buffer,
  filename: string,
  cloudName: string,
  uploadPreset: string,
  folder: string,
): Promise<CloudinaryUploadResponse | null> {
  if (!cloudName || !uploadPreset) {
    console.warn('[WhatsApp Process] Cloudinary not configured, skipping upload')
    return null
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`

  // Convert buffer to base64 data URI
  const base64 = imageBuffer.toString('base64')
  const dataUri = `data:image/jpeg;base64,${base64}`

  const formBody = new URLSearchParams({
    file: dataUri,
    upload_preset: uploadPreset,
    folder,
    public_id: filename,
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody.toString(),
  })

  if (!response.ok) {
    await response.text()
    console.error(
      `[WhatsApp Process] Cloudinary upload failed: ${response.status} ${response.statusText}`,
    )
    return null
  }

  return (await response.json()) as CloudinaryUploadResponse
}

/** Build the Claude Vision prompt */
function buildClaudePrompt(textContent: string | null): string {
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
  "category_name_es": "string -- main category in Spanish: one of 'Cabezas tractoras', 'Camiones', 'Semirremolques', 'Remolques', 'Cisternas', 'Furgonetas', 'Otros'",
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

// ── Handler ──

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabase = serverSupabaseServiceRole(event)

  // ── Auth: internal secret (cron/retry) OR Turnstile (external caller) ──
  const internalSecret = config.cronSecret || process.env.CRON_SECRET
  const internalHeader = getHeader(event, 'x-internal-secret')
  const isInternalCall = internalSecret && internalHeader === internalSecret

  // Read body once at the start
  const body = await readBody<ProcessBody & { turnstileToken?: string }>(event)

  if (!isInternalCall) {
    // External call — require Turnstile token
    if (body.turnstileToken) {
      const ip = getRequestIP(event, { xForwardedFor: true }) || undefined
      const turnstileValid = await verifyTurnstile(body.turnstileToken, ip)
      if (!turnstileValid) {
        throw createError({ statusCode: 403, message: 'CAPTCHA verification failed' })
      }
    } else {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }
  }

  // Supabase REST credentials for whatsapp_submissions (not yet in generated types)
  const supabaseUrl = (process.env.SUPABASE_URL || '') as string
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '') as string

  // 1. Validate input

  if (!body.submissionId || !UUID_REGEX.test(body.submissionId)) {
    throw createError({ statusCode: 400, message: 'submissionId must be a valid UUID' })
  }

  const submissionId = body.submissionId

  // 2. Load submission
  const submission = await fetchSubmission(supabaseUrl, supabaseKey, submissionId)

  if (!submission) {
    throw createError({ statusCode: 404, message: 'Submission not found' })
  }

  if (submission.status !== 'received') {
    return { status: 'skipped', reason: `Submission already in status: ${submission.status}` }
  }

  // 3. Mark as processing
  await updateSubmission(supabaseUrl, supabaseKey, submissionId, { status: 'processing' })

  try {
    // 4. Load dealer info
    let _dealer: DealerRow | null = null
    if (submission.dealer_id) {
      const { data: dealerRaw } = await supabase
        .from('dealers')
        .select('id, user_id, company_name')
        .eq('id', submission.dealer_id)
        .single()

      _dealer = dealerRaw as unknown as DealerRow | null
    }

    // 5. Check if ANTHROPIC_API_KEY is available
    const anthropicKey = config.anthropicApiKey as string

    if (!anthropicKey) {
      // Dev mode: create placeholder vehicle without AI processing
      console.warn('[WhatsApp Process] No ANTHROPIC_API_KEY -- creating placeholder vehicle')

      const placeholderSlug = sanitizeSlug(`whatsapp-${Date.now()}`)

      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .insert({
          brand: 'Pendiente',
          model: 'WhatsApp',
          slug: placeholderSlug,
          category: 'venta' as const,
          status: 'draft' as const,
          dealer_id: submission.dealer_id,
          description_es:
            submission.text_content || 'Vehiculo enviado por WhatsApp (pendiente de procesar)',
          description_en:
            submission.text_content || 'Vehicle sent via WhatsApp (pending processing)',
          ai_generated: true,
          attributes_json: {
            source: 'whatsapp',
            submission_id: submissionId,
            media_ids: submission.media_ids,
          },
        })
        .select('id, slug')
        .single()

      if (vehicleError || !vehicle) {
        throw new Error(`Failed to create placeholder vehicle: ${vehicleError?.message}`)
      }

      const vehicleData = vehicle as unknown as { id: string; slug: string }

      await updateSubmission(supabaseUrl, supabaseKey, submissionId, {
        status: 'processed',
        vehicle_id: vehicleData.id,
        claude_response: { dev_mode: true, placeholder: true },
      })

      return { status: 'processed', vehicleId: vehicleData.id, dev: true }
    }

    // 6. Download images from WhatsApp
    const imageBuffers: Buffer[] = []
    for (const mediaId of submission.media_ids) {
      try {
        const buffer = await downloadWhatsAppMedia(mediaId)
        if (buffer.length > 0) {
          imageBuffers.push(buffer)
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error(`[WhatsApp Process] Failed to download media (id redacted):`, message)
      }
    }

    // 7. Call Claude Vision
    const anthropic = new Anthropic({ apiKey: anthropicKey })

    const imageContent: Anthropic.ImageBlockParam[] = imageBuffers.map((buffer) => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: 'image/jpeg' as const,
        data: buffer.toString('base64'),
      },
    }))

    const userContent: (Anthropic.ImageBlockParam | Anthropic.TextBlockParam)[] = [
      ...imageContent,
      {
        type: 'text' as const,
        text:
          imageBuffers.length > 0
            ? `Analyze these ${imageBuffers.length} image(s) of an industrial vehicle.`
            : 'No images could be downloaded. Analyze based on the text content provided in the system prompt.',
      },
    ]

    const claudeResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: buildClaudePrompt(submission.text_content),
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
    })

    // Extract text response
    const responseText = claudeResponse.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')

    const analysis = parseClaudeResponse(responseText)

    // 8. Upload images to Cloudinary
    const cloudName = config.public.cloudinaryCloudName as string
    const uploadPreset = config.public.cloudinaryUploadPreset as string
    const folder = 'tracciona/vehicles'

    const uploadedImages: { url: string; publicId: string; altText: string; position: number }[] =
      []

    for (let i = 0; i < imageBuffers.length; i++) {
      const currentBuffer = imageBuffers[i]
      if (!currentBuffer) continue

      const filename = `${sanitizeSlug(analysis.suggested_slug)}-${i + 1}-${Date.now()}`
      const altText =
        analysis.image_alt_texts[i] || `${analysis.brand} ${analysis.model} imagen ${i + 1}`

      const result = await uploadToCloudinary(
        currentBuffer,
        filename,
        cloudName,
        uploadPreset,
        folder,
      )

      if (result) {
        uploadedImages.push({
          url: result.secure_url,
          publicId: result.public_id,
          altText,
          position: i,
        })
      }
    }

    // 9. Match category from database
    const { data: categoriesRaw } = await supabase
      .from('categories')
      .select('id, name_es, name_en, slug')

    const categories = (categoriesRaw ?? []) as unknown as CategoryRow[]
    const matchedCategory = categories.find(
      (c) =>
        c.name_es.toLowerCase() === analysis.category_name_es.toLowerCase() ||
        c.slug.toLowerCase() === analysis.category_name_es.toLowerCase(),
    )

    // 10. Create vehicle with status='draft'
    const vehicleSlug = sanitizeSlug(
      analysis.suggested_slug || `${analysis.brand}-${analysis.model}-${Date.now()}`,
    )

    const { data: newVehicle, error: vehicleInsertError } = await supabase
      .from('vehicles')
      .insert({
        brand: analysis.brand,
        model: analysis.model,
        year: analysis.year,
        slug: vehicleSlug,
        category: 'venta' as const,
        category_id: matchedCategory?.id ?? null,
        status: 'draft' as const,
        dealer_id: submission.dealer_id,
        description_es: analysis.description_es,
        description_en: analysis.description_en,
        plate: analysis.license_plate,
        ai_generated: true,
        attributes_json: {
          ...analysis.attributes_json,
          source: 'whatsapp',
          submission_id: submissionId,
          condition: analysis.condition,
          title_es: analysis.title_es,
          title_en: analysis.title_en,
          subcategory_name_es: analysis.subcategory_name_es,
        },
      })
      .select('id, slug')
      .single()

    if (vehicleInsertError || !newVehicle) {
      throw new Error(`Failed to create vehicle: ${vehicleInsertError?.message}`)
    }

    const vehicleResult = newVehicle as unknown as { id: string; slug: string }

    // 11. Insert vehicle_images
    if (uploadedImages.length > 0) {
      const imageInserts = uploadedImages.map((img) => ({
        vehicle_id: vehicleResult.id,
        url: img.url,
        cloudinary_public_id: img.publicId,
        alt_text: img.altText,
        position: img.position,
      }))

      const { error: imageInsertError } = await supabase.from('vehicle_images').insert(imageInserts)

      if (imageInsertError) {
        console.error(
          '[WhatsApp Process] Failed to insert vehicle images:',
          imageInsertError.message,
        )
      }
    }

    // 12. Update submission
    await updateSubmission(supabaseUrl, supabaseKey, submissionId, {
      status: 'processed',
      vehicle_id: vehicleResult.id,
      claude_response: analysis,
    })

    // 13. Notify dealer via WhatsApp
    const title = analysis.title_es || `${analysis.brand} ${analysis.model}`
    await sendWhatsAppMessage(
      submission.phone_number,
      `\u2705 Tu veh\u00EDculo ha sido procesado: ${title}. Un admin lo revisar\u00E1 pronto. Enlace: https://tracciona.com/vehiculo/${vehicleResult.slug}`,
    )

    return {
      status: 'processed',
      vehicleId: vehicleResult.id,
      slug: vehicleResult.slug,
      imagesUploaded: uploadedImages.length,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown processing error'
    console.error(`[WhatsApp Process] Error processing submission ${submissionId}:`, message)

    // Update submission with error
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
      console.error('[WhatsApp Process] Failed to send error notification')
    }

    throw createError({ statusCode: 500, message: `Processing failed: ${message}` })
  }
})
