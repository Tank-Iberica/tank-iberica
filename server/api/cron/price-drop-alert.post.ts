/**
 * POST /api/cron/price-drop-alert
 *
 * Cron job that checks the price_history table for price drops in the last 24h,
 * finds users who have those vehicles in their favorites, and prepares email
 * notifications for each affected user.
 *
 * Protected by x-cron-secret header.
 */
import { createError, defineEventHandler, readBody } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { verifyCronSecret } from '../../utils/verifyCronSecret'

// -- Types --------------------------------------------------------------------

interface CronBody {
  secret?: string
}

interface PriceHistoryRow {
  id: string
  vehicle_id: string
  previous_price_cents: number
  price_cents: number
  changed_at: string
}

interface VehicleInfo {
  id: string
  brand: string
  model: string
  slug: string
}

interface FavoriteRow {
  user_id: string
  users: {
    id: string
    email: string
    name: string | null
    lang: string | null
  } | null
}

interface Notification {
  userId: string
  email: string
  vehicleTitle: string
  vehicleSlug: string
  oldPriceCents: number
  newPriceCents: number
  dropPercent: number
}

// -- Handler ------------------------------------------------------------------

export default defineEventHandler(async (event) => {
  // 1. Verify cron secret
  const body = await readBody<CronBody>(event).catch(() => ({}) as CronBody)
  verifyCronSecret(event, body?.secret)

  const supabase = serverSupabaseServiceRole(event)
  const now = new Date()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

  // 2. Fetch recent price drops from price_history (last 24h)
  const { data: priceChanges, error: historyError } = await supabase
    .from('price_history')
    .select('id, vehicle_id, previous_price_cents, price_cents, changed_at')
    .gte('changed_at', twentyFourHoursAgo)
    .limit(500)

  if (historyError) {
    throw createError({
      statusCode: 500,
      message: `Failed to fetch price_history: ${historyError.message}`,
    })
  }

  if (!priceChanges || priceChanges.length === 0) {
    return { checked: 0, sent: 0, notifications: [], timestamp: now.toISOString() }
  }

  // Filter to actual price drops (previous > current)
  const drops = (priceChanges as unknown as PriceHistoryRow[]).filter(
    (row) => row.previous_price_cents > row.price_cents,
  )

  if (drops.length === 0) {
    return {
      checked: priceChanges.length,
      sent: 0,
      notifications: [],
      timestamp: now.toISOString(),
    }
  }

  // 3. Get unique vehicle IDs and fetch vehicle info
  const vehicleIds = [...new Set(drops.map((d) => d.vehicle_id))]

  const { data: vehicles, error: vehiclesError } = await supabase
    .from('vehicles')
    .select('id, brand, model, slug')
    .in('id', vehicleIds)

  if (vehiclesError) {
    throw createError({
      statusCode: 500,
      message: `Failed to fetch vehicles: ${vehiclesError.message}`,
    })
  }

  const vehicleMap = new Map<string, VehicleInfo>()
  for (const v of (vehicles || []) as unknown as VehicleInfo[]) {
    vehicleMap.set(v.id, v)
  }

  // 4. For each vehicle with a price drop, find users who have it in favorites
  const notifications: Notification[] = []

  for (const drop of drops) {
    const vehicle = vehicleMap.get(drop.vehicle_id)
    if (!vehicle) continue

    const { data: favorites, error: favsError } = await supabase
      .from('favorites')
      .select('user_id, users(id, email, name, lang)')
      .eq('vehicle_id', drop.vehicle_id)

    if (favsError) {
      console.error(
        `[price-drop-alert] Error fetching favorites for vehicle ${drop.vehicle_id}: ${favsError.message}`,
      )
      continue
    }

    if (!favorites || favorites.length === 0) continue

    const typedFavorites = favorites as unknown as FavoriteRow[]
    const vehicleTitle = `${vehicle.brand} ${vehicle.model}`
    const dropPercent = Math.round(
      ((drop.previous_price_cents - drop.price_cents) / drop.previous_price_cents) * 100,
    )

    for (const fav of typedFavorites) {
      const user = fav.users
      if (!user || !user.email) continue

      notifications.push({
        userId: user.id,
        email: user.email,
        vehicleTitle,
        vehicleSlug: vehicle.slug,
        oldPriceCents: drop.previous_price_cents,
        newPriceCents: drop.price_cents,
        dropPercent,
      })
    }
  }

  // 5. Log notifications (email sending infrastructure handles actual delivery)
  if (notifications.length > 0) {
    console.info(
      `[price-drop-alert] ${notifications.length} notification(s) to send for ${vehicleIds.length} vehicle(s)`,
    )
    for (const n of notifications) {
      console.info(
        `[price-drop-alert] -> user ${n.userId}: ${n.vehicleTitle} dropped ${n.dropPercent}%`,
      )
    }
  }

  return {
    checked: drops.length,
    sent: notifications.length,
    notifications,
    timestamp: now.toISOString(),
  }
})
