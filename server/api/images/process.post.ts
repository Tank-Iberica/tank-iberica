/**
 * POST /api/images/process
 *
 * Hybrid image pipeline processor.
 * Receives a Cloudinary URL and creates optimized variants on CF Images.
 *
 * Pipeline modes (IMAGE_PIPELINE_MODE):
 *   - cloudinary       → return URL as-is (backward compatible)
 *   - hybrid           → process via Cloudinary transforms, then upload to CF Images
 *   - cf_images_only   → upload directly to CF Images without Cloudinary processing
 */
import { defineEventHandler, readBody, createError } from 'h3'

// ── Types ─────────────────────────────────────────────────────────────────────

type PipelineMode = 'cloudinary' | 'hybrid' | 'cf_images_only'
type VariantName = 'thumb' | 'card' | 'gallery' | 'og'

interface ProcessImageBody {
  cloudinaryUrl: string
  vehicleId?: string
}

interface VariantUrls {
  thumb: string
  card: string
  gallery: string
  og: string
}

interface ProcessImageResponse {
  urls: VariantUrls
  original: string
  pipeline: PipelineMode
}

interface CloudflareImageUploadResult {
  result: {
    id: string
    variants: string[]
  }
  success: boolean
  errors: Array<{ message: string }>
}

// ── Cloudinary variant transform strings ──────────────────────────────────────

const CLOUDINARY_TRANSFORMS: Record<VariantName, string> = {
  thumb: 'w_300,h_200,c_fill,g_auto,e_improve,q_auto,f_webp',
  card: 'w_600,h_400,c_fill,g_auto,e_improve,q_auto,f_webp',
  gallery: 'w_1200,h_800,c_fill,g_auto,e_improve,q_auto,f_webp',
  og: 'w_1200,h_630,c_fill,g_auto,e_improve,q_auto,f_webp',
}

const VARIANT_NAMES: VariantName[] = ['thumb', 'card', 'gallery', 'og']

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Insert a Cloudinary transformation into an existing Cloudinary URL.
 * Handles both /upload/ and /image/upload/ patterns.
 */
function buildCloudinaryVariantUrl(originalUrl: string, transform: string): string {
  const uploadMarker = '/upload/'
  const uploadIndex = originalUrl.indexOf(uploadMarker)
  if (uploadIndex === -1) {
    return originalUrl
  }
  const beforeUpload = originalUrl.slice(0, uploadIndex + uploadMarker.length)
  const afterUpload = originalUrl.slice(uploadIndex + uploadMarker.length)

  // Remove existing transformations if present (they start before the public_id)
  // Cloudinary URLs: .../upload/[transformations/]public_id.ext
  // We insert our transform right after /upload/
  return `${beforeUpload}${transform}/${afterUpload}`
}

/**
 * Fetch an image from a URL and return it as an ArrayBuffer.
 */
async function fetchImageBuffer(url: string): Promise<ArrayBuffer> {
  const response = await $fetch<ArrayBuffer>(url, {
    responseType: 'arrayBuffer',
  })
  return response
}

/**
 * Upload an image buffer to Cloudflare Images.
 */
async function uploadToCfImages(
  buffer: ArrayBuffer,
  accountId: string,
  apiToken: string,
  metadata: Record<string, string>,
): Promise<CloudflareImageUploadResult> {
  const formData = new FormData()
  const blob = new Blob([buffer], { type: 'image/webp' })
  formData.append('file', blob)
  formData.append('metadata', JSON.stringify(metadata))

  const result = await $fetch<CloudflareImageUploadResult>(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      body: formData,
    },
  )

  return result
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event): Promise<ProcessImageResponse> => {
  // 1. Read and validate body
  const body = await readBody<ProcessImageBody>(event)

  if (!body.cloudinaryUrl || typeof body.cloudinaryUrl !== 'string') {
    throw createError({ statusCode: 400, message: 'cloudinaryUrl is required' })
  }

  if (!body.cloudinaryUrl.includes('cloudinary.com')) {
    throw createError({ statusCode: 400, message: 'Invalid Cloudinary URL' })
  }

  // 2. Read runtime config
  const config = useRuntimeConfig()
  const cfApiToken = config.cloudflareImagesApiToken as string | undefined
  const cfAccountId = config.cloudflareAccountId as string | undefined
  const cfDeliveryUrl = config.cloudflareImagesDeliveryUrl as string | undefined
  const pipelineMode = (config.imagePipelineMode as PipelineMode | undefined) ?? 'cloudinary'

  // 3. Determine effective mode — fall back to cloudinary if CF keys are missing
  let effectiveMode: PipelineMode = pipelineMode
  if (effectiveMode !== 'cloudinary' && (!cfApiToken || !cfAccountId || !cfDeliveryUrl)) {
    effectiveMode = 'cloudinary'
  }

  // 4. Cloudinary-only mode: return URL as-is for all variants
  if (effectiveMode === 'cloudinary') {
    const urls: VariantUrls = {
      thumb: buildCloudinaryVariantUrl(body.cloudinaryUrl, CLOUDINARY_TRANSFORMS.thumb),
      card: buildCloudinaryVariantUrl(body.cloudinaryUrl, CLOUDINARY_TRANSFORMS.card),
      gallery: buildCloudinaryVariantUrl(body.cloudinaryUrl, CLOUDINARY_TRANSFORMS.gallery),
      og: buildCloudinaryVariantUrl(body.cloudinaryUrl, CLOUDINARY_TRANSFORMS.og),
    }
    return {
      urls,
      original: body.cloudinaryUrl,
      pipeline: 'cloudinary',
    }
  }

  // 5. Hybrid or CF-only mode: upload to CF Images
  const urls: Partial<VariantUrls> = {}
  const errors: string[] = []

  for (const variant of VARIANT_NAMES) {
    try {
      let imageBuffer: ArrayBuffer

      if (effectiveMode === 'hybrid') {
        // Fetch Cloudinary-transformed image
        const transformedUrl = buildCloudinaryVariantUrl(
          body.cloudinaryUrl,
          CLOUDINARY_TRANSFORMS[variant],
        )
        imageBuffer = await fetchImageBuffer(transformedUrl)
      } else {
        // cf_images_only: fetch the original Cloudinary image without transforms
        imageBuffer = await fetchImageBuffer(body.cloudinaryUrl)
      }

      // Upload to CF Images
      const metadata: Record<string, string> = {
        variant,
        source: 'tracciona-pipeline',
      }
      if (body.vehicleId) {
        metadata.vehicleId = body.vehicleId
      }

      const cfResult = await uploadToCfImages(
        imageBuffer,
        cfAccountId as string,
        cfApiToken as string,
        metadata,
      )

      if (!cfResult.success) {
        const errorMsg = cfResult.errors?.[0]?.message ?? 'Unknown CF Images error'
        errors.push(`${variant}: ${errorMsg}`)
        continue
      }

      // Build the delivery URL with the variant name
      const imageId = cfResult.result.id
      urls[variant] = `${cfDeliveryUrl}/${imageId}/${variant}`
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      errors.push(`${variant}: ${message}`)
    }
  }

  // 6. If no variants were uploaded successfully, throw
  if (Object.keys(urls).length === 0) {
    throw createError({
      statusCode: 502,
      message: `Image pipeline failed for all variants: ${errors.join('; ')}`,
    })
  }

  // 7. For any variant that failed, fall back to Cloudinary transform URL
  for (const variant of VARIANT_NAMES) {
    if (!urls[variant]) {
      urls[variant] = buildCloudinaryVariantUrl(body.cloudinaryUrl, CLOUDINARY_TRANSFORMS[variant])
    }
  }

  return {
    urls: urls as VariantUrls,
    original: body.cloudinaryUrl,
    pipeline: effectiveMode,
  }
})
