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
import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { serverSupabaseUser } from '#supabase/server'
import { safeError } from '../../utils/safeError'
import { validateBody } from '../../utils/validateBody'

// ── Types ─────────────────────────────────────────────────────────────────────

type PipelineMode = 'cloudinary' | 'hybrid' | 'cf_images_only'
type VariantName = 'thumb' | 'card' | 'gallery' | 'og'

const processImageSchema = z.object({
  cloudinaryUrl: z
    .string()
    .url()
    .max(2048)
    .refine((u) => u.startsWith('https://') && new URL(u).hostname.endsWith('.cloudinary.com'), {
      message: 'URL must be a valid HTTPS Cloudinary URL',
    }),
  vehicleId: z.string().uuid().optional(),
})

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

function buildCloudinaryVariants(cloudinaryUrl: string): VariantUrls {
  return {
    thumb: buildCloudinaryVariantUrl(cloudinaryUrl, CLOUDINARY_TRANSFORMS.thumb),
    card: buildCloudinaryVariantUrl(cloudinaryUrl, CLOUDINARY_TRANSFORMS.card),
    gallery: buildCloudinaryVariantUrl(cloudinaryUrl, CLOUDINARY_TRANSFORMS.gallery),
    og: buildCloudinaryVariantUrl(cloudinaryUrl, CLOUDINARY_TRANSFORMS.og),
  }
}

async function processAllVariants(
  cloudinaryUrl: string,
  mode: PipelineMode,
  cfAccountId: string,
  cfApiToken: string,
  cfDeliveryUrl: string,
  vehicleId?: string,
): Promise<{ urls: Partial<VariantUrls>; errors: string[] }> {
  const urls: Partial<VariantUrls> = {}
  const errors: string[] = []
  for (const variant of VARIANT_NAMES) {
    try {
      urls[variant] = await processVariant(
        variant,
        cloudinaryUrl,
        mode,
        cfAccountId,
        cfApiToken,
        cfDeliveryUrl,
        vehicleId,
      )
    } catch (err: unknown) {
      errors.push(`${variant}: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }
  // Fallback to Cloudinary for failed variants
  for (const variant of VARIANT_NAMES) {
    if (!urls[variant]) {
      urls[variant] = buildCloudinaryVariantUrl(cloudinaryUrl, CLOUDINARY_TRANSFORMS[variant])
    }
  }
  return { urls, errors }
}

async function processVariant(
  variant: VariantName,
  cloudinaryUrl: string,
  mode: PipelineMode,
  cfAccountId: string,
  cfApiToken: string,
  cfDeliveryUrl: string,
  vehicleId?: string,
): Promise<string> {
  const imageBuffer =
    mode === 'hybrid'
      ? await fetchImageBuffer(
          buildCloudinaryVariantUrl(cloudinaryUrl, CLOUDINARY_TRANSFORMS[variant]),
        )
      : await fetchImageBuffer(cloudinaryUrl)

  const metadata: Record<string, string> = { variant, source: 'tracciona-pipeline' }
  if (vehicleId) metadata.vehicleId = vehicleId

  const cfResult = await uploadToCfImages(imageBuffer, cfAccountId, cfApiToken, metadata)

  if (!cfResult.success) {
    throw safeError(502, 'CF Images upload failed')
  }

  return `${cfDeliveryUrl}/${cfResult.result.id}/${variant}`
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event): Promise<ProcessImageResponse> => {
  // Auth: verify user is logged in
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw safeError(401, 'Unauthorized')
  }

  // 1. Read and validate body (Zod validates HTTPS Cloudinary URL — anti-SSRF)
  const body = await validateBody(event, processImageSchema)

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
    return {
      urls: buildCloudinaryVariants(body.cloudinaryUrl),
      original: body.cloudinaryUrl,
      pipeline: 'cloudinary',
    }
  }

  // 5. Hybrid or CF-only mode: upload to CF Images
  const { urls, errors } = await processAllVariants(
    body.cloudinaryUrl,
    effectiveMode,
    cfAccountId as string,
    cfApiToken as string,
    cfDeliveryUrl as string,
    body.vehicleId,
  )

  if (Object.keys(urls).length === 0) {
    throw safeError(502, `Image pipeline failed for all variants: ${errors.join('; ')}`)
  }

  return { urls: urls as VariantUrls, original: body.cloudinaryUrl, pipeline: effectiveMode }
})
