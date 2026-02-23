/**
 * POST /api/infra/migrate-images
 *
 * Admin-only. Batch migrates existing Cloudinary images to CF Images
 * using the hybrid image pipeline.
 *
 * Body: { batchSize?: number } (default: 50)
 * Returns: { processed: number, remaining: number, errors: number }
 */
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { defineEventHandler, readBody, createError } from 'h3'

// ── Types ─────────────────────────────────────────────────────────────────────

interface MigrateImagesBody {
  batchSize?: number
}

interface MigrateImagesResponse {
  processed: number
  remaining: number
  errors: number
}

interface PipelineResult {
  urls: {
    thumb: string
    card: string
    gallery: string
    og: string
  }
  original: string
  pipeline: string
}

interface VehicleImageRow {
  id: string
  url: string
  vehicle_id: string
  thumbnail_url: string | null
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_BATCH_SIZE = 50
const MAX_BATCH_SIZE = 200

// ── Handler ───────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event): Promise<MigrateImagesResponse> => {
  // 1. Admin auth check
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const supabase = serverSupabaseServiceRole(event)
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

  if (userData?.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  // 2. Read body
  const body = (await readBody<MigrateImagesBody>(event)) ?? {}
  const batchSize = Math.min(Math.max(body.batchSize ?? DEFAULT_BATCH_SIZE, 1), MAX_BATCH_SIZE)

  // 3. Validate pipeline config
  const config = useRuntimeConfig()
  const cfApiToken = config.cloudflareImagesApiToken as string | undefined
  const cfAccountId = config.cloudflareAccountId as string | undefined
  const cfDeliveryUrl = config.cloudflareImagesDeliveryUrl as string | undefined

  if (!cfApiToken || !cfAccountId || !cfDeliveryUrl) {
    throw createError({
      statusCode: 500,
      message:
        'Missing Cloudflare Images configuration. Required: CLOUDFLARE_IMAGES_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_IMAGES_DELIVERY_URL',
    })
  }

  // 4. Query images that still reference Cloudinary (not yet migrated)
  //    Images that have been migrated will have a CF Images delivery URL instead.
  const { data: images, error: queryError } = await supabase
    .from('vehicle_images')
    .select('id, url, vehicle_id, thumbnail_url')
    .like('url', '%cloudinary.com%')
    .limit(batchSize)

  if (queryError) {
    throw createError({
      statusCode: 500,
      message: `Database query failed: ${queryError.message}`,
    })
  }

  const imagesToProcess = (images ?? []) as VehicleImageRow[]

  if (imagesToProcess.length === 0) {
    // Count remaining to confirm zero
    const { count } = await supabase
      .from('vehicle_images')
      .select('id', { count: 'exact', head: true })
      .like('url', '%cloudinary.com%')

    return {
      processed: 0,
      remaining: count ?? 0,
      errors: 0,
    }
  }

  // 5. Process each image through the pipeline
  let processed = 0
  let errorCount = 0

  for (const image of imagesToProcess) {
    try {
      // Call the image process pipeline endpoint
      const pipelineResult = await $fetch<PipelineResult>('/api/images/process', {
        method: 'POST',
        body: {
          cloudinaryUrl: image.url,
          vehicleId: image.vehicle_id,
        },
      })

      // Only update if the pipeline actually used CF Images
      if (pipelineResult.pipeline !== 'cloudinary') {
        // Update the image record with the new CF Images gallery URL as the main URL
        // and the thumb URL as the thumbnail
        const { error: updateError } = await supabase
          .from('vehicle_images')
          .update({
            url: pipelineResult.urls.gallery,
            thumbnail_url: pipelineResult.urls.thumb,
          } as never)
          .eq('id', image.id)

        if (updateError) {
          errorCount++
          continue
        }

        processed++
      } else {
        // Pipeline fell back to cloudinary mode — skip this image
        errorCount++
      }
    } catch {
      errorCount++
    }
  }

  // 6. Count remaining images still on Cloudinary
  const { count: remainingCount } = await supabase
    .from('vehicle_images')
    .select('id', { count: 'exact', head: true })
    .like('url', '%cloudinary.com%')

  return {
    processed,
    remaining: remainingCount ?? 0,
    errors: errorCount,
  }
})
