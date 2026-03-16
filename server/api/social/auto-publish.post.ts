/**
 * POST /api/social/auto-publish
 *
 * Called when a vehicle is approved (status changes to 'active').
 * Creates social posts for all configured platforms and publishes immediately
 * if the platform has valid OAuth tokens and auto_publish is enabled in config.
 *
 * Body: { vehicleId: string }
 * Auth: Service role (called from admin vehicle update flow)
 */
import { defineEventHandler } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { safeError } from '../../utils/safeError'
import { validateBody } from '../../utils/validateBody'
import { logger } from '../../utils/logger'
import { z } from 'zod'
import { getSiteUrl } from '../../utils/siteConfig'

const AutoPublishSchema = z.object({
  vehicleId: z.string().uuid('vehicleId must be a valid UUID'),
})

type SocialPlatform = 'linkedin' | 'facebook' | 'instagram' | 'x'

interface VehicleData {
  id: string
  brand: string
  model: string
  year: number | null
  price: number | null
  location: string | null
  slug: string
  vehicle_images: { url: string; position: number }[]
  subcategories: { name: Record<string, string> } | null
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(cents / 100)
}

function getVehicleTitle(v: VehicleData): string {
  const parts = [v.brand, v.model, v.year].filter(Boolean)
  return parts.join(' ')
}

function buildPostContent(v: VehicleData, platform: SocialPlatform, locale: string): string {
  const title = getVehicleTitle(v)
  const price = v.price
    ? formatPrice(v.price)
    : locale === 'es'
      ? 'Precio a consultar'
      : 'Price on request'
  const location = v.location || (locale === 'es' ? 'España' : 'Spain')
  const url = `${getSiteUrl()}/${locale === 'es' ? 'vehiculo' : 'vehicle'}/${v.slug}`

  const LIMITS: Record<SocialPlatform, number> = {
    linkedin: 3000,
    facebook: 63206,
    instagram: 2200,
    x: 280,
  }

  if (locale === 'en') {
    const content =
      platform === 'x'
        ? `🚛 ${title} | ${price} | ${location}\n${url}`
        : `🚛 New on ${getSiteName()}: ${title}\n📍 ${location} | 💰 ${price}\n✅ Available now\n${url}`
    return content.substring(0, LIMITS[platform])
  }

  const content =
    platform === 'x'
      ? `🚛 ${title} | ${price} | ${location}\n${url}`
      : `🚛 Nuevo en ${getSiteName()}: ${title}\n📍 ${location} | 💰 ${price}\n✅ Disponible ahora\n${url}`
  return content.substring(0, LIMITS[platform])
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SocialClient = ReturnType<typeof serverSupabaseServiceRole<any>>

async function processPlatformPost(
  supabase: SocialClient,
  platform: SocialPlatform,
  v: VehicleData,
  vehicleId: string,
  imageUrl: string | null,
  postIds: string[],
  autoPublished: string[],
  errors: string[],
): Promise<void> {
  const { data: tokenConfig } = await supabase
    .from('vertical_config')
    .select('value')
    .eq('key', `social_tokens_${platform}`)
    .single()

  const tokens = (tokenConfig as { value: { access_token?: string; expires_at?: string } } | null)
    ?.value

  const { data: autoConfig } = await supabase
    .from('vertical_config')
    .select('value')
    .eq('key', `social_auto_publish_${platform}`)
    .single()

  const autoPublishEnabled = !!(autoConfig as { value: boolean } | null)?.value

  const contentEs = buildPostContent(v, platform, 'es')
  const contentEn = buildPostContent(v, platform, 'en')

  const { data: postData, error: insertErr } = await supabase
    .from('social_posts')
    .insert({
      vehicle_id: vehicleId,
      article_id: null,
      platform,
      content: { es: contentEs, en: contentEn },
      image_url: imageUrl,
      status: tokens?.access_token && autoPublishEnabled ? 'approved' : 'pending',
      impressions: 0,
      clicks: 0,
    } as never)
    .select('id')
    .single()

  if (insertErr || !postData) {
    errors.push(`${platform}: Failed to create post`)
    logger.error('Failed to create social post', { platform, vehicleId, err: String(insertErr) })
    return
  }

  const createdPost = postData as { id: string }
  postIds.push(createdPost.id)

  if (!tokens?.access_token || !autoPublishEnabled) return

  if (tokens.expires_at && new Date(tokens.expires_at) < new Date()) {
    logger.warn('Token expired, skipping auto-publish', { platform })
    errors.push(`${platform}: Token expired`)
    return
  }

  try {
    const publishResp = await fetch(`${getSiteUrl()}/api/social/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-service': process.env.CRON_SECRET || '',
      },
      body: JSON.stringify({ postId: createdPost.id }),
    })

    if (publishResp.ok) {
      autoPublished.push(platform)
      logger.info('Auto-published to social', { platform, vehicleId, postId: createdPost.id })
    } else {
      const err = await publishResp.text()
      errors.push(`${platform}: Auto-publish failed - ${err}`)
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'auto-publish error'
    errors.push(`${platform}: ${msg}`)
    logger.error('Auto-publish error', { platform, vehicleId, err: String(err) })
  }
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw safeError(401, 'Unauthorized')

  const { vehicleId } = await validateBody(event, AutoPublishSchema)
  const supabase = serverSupabaseServiceRole(event)

  // Fetch vehicle
  const { data: vehicle, error: vehicleErr } = await supabase
    .from('vehicles')
    .select(
      'id, brand, model, year, price, location, slug, vehicle_images(url, position), subcategories(name)',
    )
    .eq('id', vehicleId)
    .single()

  if (vehicleErr || !vehicle) throw safeError(404, 'Vehicle not found')

  const v = vehicle as VehicleData
  const imageUrl = v.vehicle_images?.toSorted((a, b) => a.position - b.position)[0]?.url || null

  const platforms: SocialPlatform[] = ['linkedin', 'facebook', 'instagram', 'x']
  const postIds: string[] = []
  const autoPublished: string[] = []
  const errors: string[] = []

  for (const platform of platforms) {
    await processPlatformPost(
      supabase,
      platform,
      v,
      vehicleId,
      imageUrl,
      postIds,
      autoPublished,
      errors,
    )
  }

  return {
    ok: true,
    vehicleId,
    postIds,
    autoPublished,
    pendingCount: postIds.length - autoPublished.length,
    errors,
  }
})
