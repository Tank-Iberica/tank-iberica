/**
 * GET /api/admin/dealers/health-scores
 *
 * Returns health score metadata for all dealers (admin only).
 * Used in the admin dealers health overview.
 *
 * Returns: { dealers: Array<{ id, company_name, total, badge }> }
 */
import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { safeError } from '~~/server/utils/safeError'
import { logger } from '~~/server/utils/logger'

type BadgeLevel = 'top' | 'verified' | 'none'

function scoreToBadge(total: number): BadgeLevel {
  if (total >= 80) return 'top'
  if (total >= 60) return 'verified'
  return 'none'
}

export interface DealerHealthRow {
  id: string
  company_name: string | null
  avg_response_time_hours: number | null
  logo_url: string | null
  activeVehicles: number
  imageCount: number
  healthTotal: number
  badge: BadgeLevel
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw safeError(401, 'Unauthorized')

  const supabase = serverSupabaseServiceRole(event)

  // Admin guard
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') throw safeError(403, 'Admin required')

  const query = getQuery(event) ?? {}
  const limit = Math.min(Number((query as any).limit ?? 50), 200)
  const offset = Number((query as any).offset ?? 0)

  // Fetch dealers with basic stats in parallel
  const [dealersRes, vehicleCountRes, imageCountRes] = await Promise.all([
    supabase
      .from('dealers')
      .select('id, company_name, avg_response_time_hours, logo_url')
      .order('company_name', { ascending: true })
      .range(offset, offset + limit - 1),

    supabase
      .from('vehicles')
      .select('dealer_id')
      .eq('status', 'published'),

    supabase
      .from('vehicle_images')
      .select('vehicles!inner(dealer_id)')
      .not('vehicles.dealer_id', 'is', null),
  ])

  if (dealersRes.error) {
    logger.error({ error: dealersRes.error }, 'Failed to fetch dealers')
    throw safeError(500, 'Failed to fetch dealer health scores')
  }

  const dealers = dealersRes.data ?? []

  // Build lookup maps
  const vehiclesByDealer = new Map<string, number>()
  for (const v of (vehicleCountRes.data ?? []) as Array<{ dealer_id: string }>) {
    vehiclesByDealer.set(v.dealer_id, (vehiclesByDealer.get(v.dealer_id) ?? 0) + 1)
  }

  const imagesByDealer = new Map<string, number>()
  for (const img of (imageCountRes.data ?? []) as Array<{ vehicles: { dealer_id: string } }>) {
    const did = img.vehicles?.dealer_id
    if (did) imagesByDealer.set(did, (imagesByDealer.get(did) ?? 0) + 1)
  }

  // Calculate simplified health score per dealer
  const rows: DealerHealthRow[] = dealers.map((dealer) => {
    const activeVehicles = vehiclesByDealer.get(dealer.id) ?? 0
    const imageCount = imagesByDealer.get(dealer.id) ?? 0

    // Simplified scoring (profile + vehicles + photos)
    const profileFields = [dealer.logo_url].filter(Boolean).length
    const profileScore = Math.round((profileFields / 1) * 10)

    const avgPhotos = activeVehicles > 0 ? imageCount / activeVehicles : 0
    const photosScore = avgPhotos > 3 ? 10 : Math.round((avgPhotos / 3) * 10)

    const groups = Math.floor(activeVehicles / 5)
    const vehiclesScore = Math.min(groups * 10, 40)

    const responseHours = dealer.avg_response_time_hours
    let responseScore = 0
    if (responseHours !== null) {
      if (responseHours <= 24) responseScore = 20
      else if (responseHours < 72) responseScore = Math.round(((72 - responseHours) / 48) * 20)
    }

    const healthTotal = Math.min(profileScore + photosScore + vehiclesScore + responseScore, 100)

    return {
      id: dealer.id,
      company_name: dealer.company_name,
      avg_response_time_hours: dealer.avg_response_time_hours,
      logo_url: dealer.logo_url,
      activeVehicles,
      imageCount,
      healthTotal,
      badge: scoreToBadge(healthTotal),
    }
  })

  return {
    ok: true,
    total: rows.length,
    dealers: rows,
  }
})
