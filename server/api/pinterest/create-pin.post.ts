/**
 * POST /api/pinterest/create-pin
 *
 * Creates a Pinterest pin for a newly approved vehicle.
 * Uses Pinterest v5 API.
 *
 * Requires:
 * - PINTEREST_ACCESS_TOKEN — OAuth2 bearer token
 * - PINTEREST_BOARD_ID — target board ID
 * Both stored as env vars OR in vertical_config as
 * 'pinterest_access_token' and 'pinterest_board_id'.
 *
 * Body: { vehicleId: string }
 * Auth: Admin only
 */
import { defineEventHandler } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { safeError } from '../../utils/safeError'
import { validateBody } from '../../utils/validateBody'
import { logger } from '../../utils/logger'
import { getSiteUrl } from '../../utils/siteConfig'
import { z } from 'zod'

const CreatePinSchema = z.object({
  vehicleId: z.string().uuid('vehicleId must be a valid UUID'),
})

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

interface PinterestPinPayload {
  board_id: string
  title: string
  description: string
  link: string
  media_source: {
    source_type: 'image_url'
    url: string
  }
}

interface PinterestPinResponse {
  id: string
  created_at?: string
  link?: string
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(cents / 100)
}

export async function createPinterestPin(
  payload: PinterestPinPayload,
  accessToken: string,
): Promise<PinterestPinResponse> {
  const resp = await fetch('https://api.pinterest.com/v5/pins', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!resp.ok) {
    const text = await resp.text()
    logger.error('[pinterest/create-pin] External service error', {
      status: resp.status,
      body: text,
    })
    throw safeError(502, 'External service error')
  }

  return (await resp.json()) as PinterestPinResponse
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw safeError(401, 'Unauthorized')

  const { vehicleId } = await validateBody(event, CreatePinSchema)
  const supabase = serverSupabaseServiceRole(event)

  // Get Pinterest credentials — env vars override vertical_config
  let accessToken = process.env.PINTEREST_ACCESS_TOKEN
  let boardId = process.env.PINTEREST_BOARD_ID

  // Fallback to vertical_config
  if (!accessToken || !boardId) {
    const { data: configData } = await supabase
      .from('vertical_config')
      .select('key, value')
      .in('key', ['pinterest_access_token', 'pinterest_board_id'])

    const configs = configData as { key: string; value: string }[] | null
    if (configs) {
      for (const c of configs) {
        if (c.key === 'pinterest_access_token') accessToken = c.value
        if (c.key === 'pinterest_board_id') boardId = c.value
      }
    }
  }

  if (!accessToken || !boardId) {
    logger.warn('Pinterest pin skipped: credentials not configured', { vehicleId })
    return { ok: false, skipped: true, reason: 'Pinterest not configured' }
  }

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

  // Get primary image
  const images = v.vehicle_images?.toSorted((a, b) => a.position - b.position)
  const imageUrl = images?.[0]?.url

  if (!imageUrl) {
    logger.warn('Pinterest pin skipped: no image available', { vehicleId })
    return { ok: false, skipped: true, reason: 'No image available for pin' }
  }

  const title = [v.brand, v.model, v.year].filter(Boolean).join(' ')
  const price = v.price ? formatPrice(v.price) : null
  const location = v.location || 'España'
  const categoryName =
    v.subcategories?.name?.es || v.subcategories?.name?.en || 'Maquinaria industrial'
  const vehicleUrl = `${getSiteUrl()}/vehiculo/${v.slug}`

  const descParts = [
    price ? `💰 ${price}` : null,
    `📍 ${location}`,
    categoryName,
    `Encuentra este y otros vehículos industriales en ${getSiteName()}`,
  ].filter(Boolean)

  const payload: PinterestPinPayload = {
    board_id: boardId,
    title: title.substring(0, 100),
    description: descParts.join(' · ').substring(0, 500),
    link: vehicleUrl,
    media_source: {
      source_type: 'image_url',
      url: imageUrl,
    },
  }

  try {
    const pin = await createPinterestPin(payload, accessToken)

    logger.info('Pinterest pin created', { vehicleId, pinId: pin.id })
    return { ok: true, vehicleId, pinId: pin.id, pinUrl: pin.link }
  } catch (err: unknown) {
    logger.error('[pinterest/create-pin] Pin creation failed', { vehicleId, err: String(err) })
    throw safeError(502, 'External service error')
  }
})
