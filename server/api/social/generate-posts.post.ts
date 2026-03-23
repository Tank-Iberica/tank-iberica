/**
 * Generate Social Media Posts for a Vehicle
 *
 * POST /api/social/generate-posts
 * Body: { vehicleId: string }
 *
 * Creates social_posts rows with status='pending' for each platform
 * (LinkedIn, Facebook, Instagram, X). Tries AI generation via callAI first,
 * falling back to static templates if AI is unavailable or fails.
 */
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { getSiteUrl } from '~~/server/utils/siteConfig'
import { callAI } from '~~/server/services/aiProvider'
import { safeError } from '~~/server/utils/safeError'
import { validateBody } from '~~/server/utils/validateBody'
import { logger } from '../../utils/logger'

const generatePostsSchema = z.object({
  vehicleId: z.string().uuid('vehicleId must be a valid UUID'),
})

type Platform = 'linkedin' | 'facebook' | 'instagram' | 'x'

interface VehicleData {
  id: string
  brand: string
  model: string
  year: number | null
  price: number | null
  location: string | null
  slug: string
  dealer_id: string
  subcategories: { name: Record<string, string> | null } | null
  vehicle_images: { url: string; position: number }[]
}

interface GeneratePostsResponse {
  postIds: string[]
  count: number
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(cents / 100)
}

function formatPriceEn(cents: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(cents / 100)
}

function getVehicleTitle(v: VehicleData): string {
  const parts = [v.brand, v.model]
  if (v.year) parts.push(String(v.year))
  return parts.join(' ')
}

function getSubcategorySlug(v: VehicleData): string {
  const name = v.subcategories?.name
  if (!name) return 'vehiculos'
  const es = name.es || name.en || Object.values(name)[0] || 'vehiculos'
  return es
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036F]/g, '')
    .replaceAll(/[^a-z0-9]+/g, '')
}

// ============================================
// CONTENT TEMPLATES PER PLATFORM
// ============================================

function generateLinkedIn(v: VehicleData, url: string): Record<string, string> {
  const title = getVehicleTitle(v)
  const location = v.location || 'Espana'
  const priceEs = v.price ? formatPrice(v.price) : 'Consultar'
  const priceEn = v.price ? formatPriceEn(v.price) : 'On request'

  return {
    es: [
      `\uD83D\uDE9B Nuevo en ${getSiteName()}: ${title}`,
      `\uD83D\uDCCD ${location} | \uD83D\uDCB0 ${priceEs}`,
      `\u2705 Disponible ahora`,
      `\uD83D\uDC49 ${url}`,
    ].join('\n'),
    en: [
      `\uD83D\uDE9B New on ${getSiteName()}: ${title}`,
      `\uD83D\uDCCD ${location} | \uD83D\uDCB0 ${priceEn}`,
      `\u2705 Available now`,
      `\uD83D\uDC49 ${url}`,
    ].join('\n'),
  }
}

function generateFacebook(v: VehicleData, url: string): Record<string, string> {
  const title = getVehicleTitle(v)
  const location = v.location || 'Espana'
  const priceEs = v.price ? formatPrice(v.price) : 'Consultar'
  const priceEn = v.price ? formatPriceEn(v.price) : 'On request'

  return {
    es: [
      `\u00A1Nuevo vehiculo disponible! ${title}`,
      `\uD83D\uDCCD ${location}`,
      `\uD83D\uDCB0 ${priceEs}`,
      `\uD83D\uDD17 Ver ficha completa: ${url}`,
    ].join('\n'),
    en: [
      `New vehicle available! ${title}`,
      `\uD83D\uDCCD ${location}`,
      `\uD83D\uDCB0 ${priceEn}`,
      `\uD83D\uDD17 See full listing: ${url}`,
    ].join('\n'),
  }
}

function generateInstagram(v: VehicleData): Record<string, string> {
  const title = getVehicleTitle(v)
  const location = v.location || 'Espana'
  const priceEs = v.price ? formatPrice(v.price) : 'Consultar'
  const priceEn = v.price ? formatPriceEn(v.price) : 'On request'
  const typeTag = getSubcategorySlug(v)

  return {
    es: [
      `${title} disponible en ${getSiteName()} \uD83D\uDE9B`,
      `\uD83D\uDCCD ${location}`,
      `\uD83D\uDCB0 ${priceEs}`,
      ``,
      `#vehiculosindustriales #transporte #tracciona #camiones #${typeTag}`,
    ].join('\n'),
    en: [
      `${title} available on ${getSiteName()} \uD83D\uDE9B`,
      `\uD83D\uDCCD ${location}`,
      `\uD83D\uDCB0 ${priceEn}`,
      ``,
      `#industrialvehicles #transport #tracciona #trucks #${typeTag}`,
    ].join('\n'),
  }
}

function generateX(v: VehicleData, url: string): Record<string, string> {
  const title = getVehicleTitle(v)
  const location = v.location || 'ES'
  const priceEs = v.price ? formatPrice(v.price) : 'Consultar'
  const priceEn = v.price ? formatPriceEn(v.price) : 'On request'

  return {
    es: `\uD83D\uDE9B ${title} | ${priceEs} | ${location}\n${url}`,
    en: `\uD83D\uDE9B ${title} | ${priceEn} | ${location}\n${url}`,
  }
}

// ============================================
// AI GENERATION WITH TEMPLATE FALLBACK
// ============================================

async function generateWithAI(
  vehicle: VehicleData,
  vehicleUrl: string,
): Promise<Record<Platform, Record<string, string>> | null> {
  try {
    const title = getVehicleTitle(vehicle)
    const location = vehicle.location || 'España'
    const priceEs = vehicle.price ? formatPrice(vehicle.price) : 'Consultar'

    const prompt = `Generate social media posts for an industrial vehicle listing.

Vehicle: ${title}
Location: ${location}
Price: ${priceEs}
URL: ${vehicleUrl}

Generate posts for 4 platforms in JSON format. Each post should have "es" (Spanish) and "en" (English) versions.
Return ONLY valid JSON, no markdown:
{
  "linkedin": { "es": "...", "en": "..." },
  "facebook": { "es": "...", "en": "..." },
  "instagram": { "es": "...", "en": "..." },
  "x": { "es": "...", "en": "..." }
}

Rules:
- LinkedIn: professional tone, 3-4 lines with emojis
- Facebook: casual, engaging, include link
- Instagram: include hashtags, no link (bio link)
- X: max 280 chars including URL
- Include vehicle emoji 🚛 in all posts`

    const response = await callAI(
      { messages: [{ role: 'user', content: prompt }], maxTokens: 1000 },
      'deferred',
      'fast',
    )

    // Parse the AI response
    let cleaned = response.text.trim()
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\n?```\s*$/, '')
    }

    const parsed = JSON.parse(cleaned) as Record<Platform, Record<string, string>>

    // Validate the structure
    const platforms: Platform[] = ['linkedin', 'facebook', 'instagram', 'x']
    for (const p of platforms) {
      if (!parsed[p]?.es || !parsed[p]?.en) return null
    }

    return parsed
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.warn(`[social/generate-posts] AI generation failed, using templates: ${message}`)
    return null
  }
}

// ============================================
// HANDLER
// ============================================

export default defineEventHandler(async (event): Promise<GeneratePostsResponse> => {
  // 1. Authenticate
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw safeError(401, 'Authentication required')
  }

  // 2. Service role client
  const supabase = serverSupabaseServiceRole(event)

  // 3. Validate body
  const { vehicleId } = await validateBody(event, generatePostsSchema)

  // 4. Fetch vehicle data
  const { data: vehicleRaw, error: vehicleErr } = await supabase
    .from('vehicles')
    .select(
      'id, brand, model, year, price, location, slug, dealer_id, subcategories(name), vehicle_images(url, position)',
    )
    .eq('id', vehicleId)
    .order('position', { referencedTable: 'vehicle_images', ascending: true })
    .single()

  if (vehicleErr || !vehicleRaw) {
    throw safeError(404, 'Vehicle not found')
  }

  const vehicle = vehicleRaw as unknown as VehicleData

  // 5. Verify vehicle ownership
  const { data: userDealer, error: dealerErr } = await supabase
    .from('dealers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (dealerErr || vehicle.dealer_id !== userDealer?.id) {
    // User has no dealer account or doesn't own this vehicle — verify admin role
    const { data: userData, error: userErr } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userErr || userData?.role !== 'admin') {
      throw safeError(403, 'You do not have permission to generate posts for this vehicle')
    }
  }

  // 6. Select best image (first by position)
  const bestImage = vehicle.vehicle_images?.[0]?.url || null

  // 7. Build vehicle URL
  const baseUrl = getSiteUrl()
  const vehicleUrl = `${baseUrl}/vehiculo/${vehicle.slug}`

  // 7b. Try AI generation first, fall back to templates
  let platformContents: Record<Platform, Record<string, string>> | null = null

  try {
    platformContents = await generateWithAI(vehicle, vehicleUrl)
  } catch {
    // AI failed, will use templates
  }

  const platforms: { platform: Platform; content: Record<string, string> }[] = platformContents
    ? [
        { platform: 'linkedin' as Platform, content: platformContents.linkedin },
        { platform: 'facebook' as Platform, content: platformContents.facebook },
        { platform: 'instagram' as Platform, content: platformContents.instagram },
        { platform: 'x' as Platform, content: platformContents.x },
      ]
    : [
        { platform: 'linkedin' as Platform, content: generateLinkedIn(vehicle, vehicleUrl) },
        { platform: 'facebook' as Platform, content: generateFacebook(vehicle, vehicleUrl) },
        { platform: 'instagram' as Platform, content: generateInstagram(vehicle) },
        { platform: 'x' as Platform, content: generateX(vehicle, vehicleUrl) },
      ]

  // 8. Insert social_posts rows
  const inserts = platforms.map(({ platform, content }) => ({
    vehicle_id: vehicleId,
    article_id: null,
    platform,
    content,
    image_url: bestImage,
    status: 'draft' as const,
    impressions: 0,
    clicks: 0,
  }))

  const { data: insertedRaw, error: insertErr } = await supabase
    .from('social_posts')
    .insert(inserts as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    .select('id')

  if (insertErr) {
    throw safeError(500, `Failed to create social posts: ${insertErr.message}`)
  }

  const inserted = (insertedRaw as unknown as { id: string }[]) || []

  return {
    postIds: inserted.map((r) => r.id),
    count: inserted.length,
  }
})
