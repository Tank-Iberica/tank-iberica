/**
 * POST /api/cron/price-drop-alert
 *
 * Cron job that checks the price_history table for price drops in the last 24h,
 * finds users who have those vehicles in their favorites, and prepares email
 * notifications for each affected user.
 *
 * Protected by x-cron-secret header.
 */
import { defineEventHandler, readBody } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import { safeError } from '../../utils/safeError'
import { serverSupabaseServiceRole } from '#supabase/server'
import { verifyCronSecret } from '../../utils/verifyCronSecret'
import { acquireCronLock } from '../../utils/cronLock'
import { logger } from '../../utils/logger'

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
  userName: string | null
  locale: string
  vehicleTitle: string
  vehicleSlug: string
  oldPriceCents: number
  newPriceCents: number
  dropPercent: number
}

/**
 * Tier enforcement for price-drop alerts (#13).
 * Returns whether this user's plan allows receiving a price-drop email today.
 * - free/basic: only on Mondays (≈ weekly)
 * - classic/premium/founding: always (daily cron)
 */
export function isPriceDropEligible(planSlug: string, now: Date): boolean {
  if (planSlug === 'premium' || planSlug === 'founding' || planSlug === 'classic') return true
  // basic/free: allow only on Mondays (day=1)
  return now.getDay() === 1
}

async function buildPriceDropNotifications(
  supabase: SupabaseClient,
  drops: PriceHistoryRow[],
  vehicleMap: Map<string, VehicleInfo>,
): Promise<Notification[]> {
  const notifications: Notification[] = []
  for (const drop of drops) {
    const vehicle = vehicleMap.get(drop.vehicle_id)
    if (!vehicle) continue

    const { data: favorites, error: favsError } = await supabase
      .from('favorites')
      .select('user_id, users(id, email, name, lang)')
      .eq('vehicle_id', drop.vehicle_id)

    if (favsError) {
      logger.error(
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

    const dropNotifications = typedFavorites
      .filter(
        (fav): fav is FavoriteRow & { users: NonNullable<FavoriteRow['users']> } =>
          !!fav.users?.email,
      )
      .map((fav) => ({
        userId: fav.users.id,
        email: fav.users.email,
        userName: fav.users.name,
        locale: fav.users.lang ?? 'es',
        vehicleTitle,
        vehicleSlug: vehicle.slug,
        oldPriceCents: drop.previous_price_cents,
        newPriceCents: drop.price_cents,
        dropPercent,
      }))
    notifications.push(...dropNotifications)
  }
  return notifications
}

function groupNotificationsByUser(notifications: Notification[]): Map<string, Notification[]> {
  const byUser = new Map<string, Notification[]>()
  for (const n of notifications) {
    const existing = byUser.get(n.userId)
    if (existing) existing.push(n)
    else byUser.set(n.userId, [n])
  }
  return byUser
}

async function sendPriceDropEmail(
  first: Notification,
  userNotifications: Notification[],
  internalSecret: string | undefined,
): Promise<boolean> {
  const vehicles = userNotifications.map((n) => ({
    title: n.vehicleTitle,
    slug: n.vehicleSlug,
    oldPrice: n.oldPriceCents,
    newPrice: n.newPriceCents,
    dropPercent: n.dropPercent,
  }))

  try {
    await $fetch('/api/email/send', {
      method: 'POST',
      headers: internalSecret ? { 'x-internal-secret': internalSecret } : {},
      body: {
        templateKey: 'favorite_price_drop',
        to: first.email,
        userId: first.userId,
        locale: first.locale,
        variables: { userName: first.userName ?? first.email, vehicles },
      },
    })
    return true
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    logger.error(`[price-drop-alert] Failed to send email to user ${first.userId}: ${errorMessage}`)
    return false
  }
}

// -- Handler ------------------------------------------------------------------

export default defineEventHandler(async (event) => {
  // 1. Verify cron secret
  const body = await readBody<CronBody>(event).catch(() => ({}) as CronBody)
  verifyCronSecret(event, body?.secret)

  const supabase = serverSupabaseServiceRole(event)

  // Cron lock — prevent duplicate emails if scheduler fires twice in the same hour
  if (!(await acquireCronLock(supabase, 'price-drop-alert'))) {
    return { skipped: true, reason: 'already_ran_in_window', timestamp: new Date().toISOString() }
  }

  const _internalSecret = useRuntimeConfig().cronSecret || process.env.CRON_SECRET
  const now = new Date()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

  // 2. Fetch recent price drops from price_history (last 24h)
  const { data: priceChanges, error: historyError } = await supabase
    .from('price_history')
    .select('id, vehicle_id, previous_price_cents, price_cents, changed_at')
    .gte('changed_at', twentyFourHoursAgo)
    .limit(500)

  if (historyError) {
    throw safeError(500, `Failed to fetch price_history: ${historyError.message}`)
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
    throw safeError(500, `Failed to fetch vehicles: ${vehiclesError.message}`)
  }

  const vehicleMap = new Map<string, VehicleInfo>()
  for (const v of (vehicles || []) as unknown as VehicleInfo[]) {
    vehicleMap.set(v.id, v)
  }

  // 4. For each vehicle with a price drop, find users who have it in favorites
  const notifications = await buildPriceDropNotifications(supabase, drops, vehicleMap)

  // 5. Group notifications by userId so each user gets ONE email with all their drops
  const byUser = groupNotificationsByUser(notifications)

  // 5b. Fetch subscription plans to apply tier enforcement (#13)
  const notifUserIds = [...byUser.keys()]
  const { data: subsData } = await supabase
    .from('subscriptions')
    .select('user_id, plan')
    .in('user_id', notifUserIds)
    .eq('status', 'active')

  const userPlanMap = new Map<string, string>()
  for (const sub of (subsData ?? []) as Array<{ user_id: string; plan: string }>) {
    userPlanMap.set(sub.user_id, sub.plan)
  }

  // 6. Send one email per user with all their price-dropped favorites
  let emailsSent = 0

  for (const [userId, userNotifications] of byUser) {
    const plan = userPlanMap.get(userId) ?? 'free'
    if (!isPriceDropEligible(plan, now)) continue
    const first = userNotifications[0]!
    const sent = await sendPriceDropEmail(first, userNotifications, _internalSecret)
    if (sent) emailsSent++
  }

  logger.info('[price-drop-alert]', {
    emailsSent,
    vehiclesWithDrops: vehicleIds.length,
  })

  return {
    checked: drops.length,
    sent: emailsSent,
    usersNotified: byUser.size,
    timestamp: now.toISOString(),
  }
})
