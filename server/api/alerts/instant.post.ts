/**
 * POST /api/alerts/instant
 *
 * Instant alert processor for Pro subscribers (#212).
 * When a vehicle is published, compares it against all active instant-frequency
 * search alerts from premium/founding users and sends notifications.
 *
 * Auth: x-internal-secret header (server-to-server).
 *
 * Body: { vehicle_id: string }
 *
 * Channels: email (always), push (if subscribed).
 */
import { defineEventHandler, getHeader, readBody } from 'h3'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { safeError } from '../../utils/safeError'
import { matchesVehicle } from '../../utils/alertMatcher'
import { logger } from '../../utils/logger'
import { normalizePlan } from '../../services/subscriptionLimits'
import { processBatch } from '../../utils/batchProcessor'
import { getSiteUrl } from '../../utils/siteConfig'
import type { AlertFilters, VehicleForMatching } from '../../utils/alertMatcher'

// -- Types ------------------------------------------------------------------

interface AlertRow {
  id: string
  user_id: string
  filters: AlertFilters
  frequency: string | null
  last_sent_at: string | null
  channels: string[] | null
}

interface UserRow {
  id: string
  email: string
  name: string | null
  lang: string | null
  phone: string | null
}

interface SubscriptionRow {
  user_id: string
  plan: string
}

interface MatchedNotification {
  user: UserRow
  alerts: AlertRow[]
  channels: string[]
}

// -- Handler ----------------------------------------------------------------

export default defineEventHandler(async (event) => {
  // ── Auth: internal secret OR authenticated user ────────────────────────
  const config = useRuntimeConfig()
  const internalSecret =
    config.internalApiSecret ||
    process.env.INTERNAL_API_SECRET ||
    config.cronSecret ||
    process.env.CRON_SECRET
  const headerSecret = getHeader(event, 'x-internal-secret')
  const isInternal = internalSecret && headerSecret === internalSecret

  if (!isInternal) {
    // Fallback: allow authenticated users (for client-side publish triggers)
    const user = await serverSupabaseUser(event)
    if (!user) {
      throw safeError(401, 'Unauthorized')
    }
  }

  // ── Parse body ────────────────────────────────────────────────────────
  const body = await readBody<{ vehicle_id?: string }>(event).catch(() => ({}) as { vehicle_id?: string })
  const vehicleId = body?.vehicle_id

  if (!vehicleId || typeof vehicleId !== 'string') {
    throw safeError(400, 'vehicle_id is required')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = serverSupabaseServiceRole(event) as any
  const now = new Date()
  let notificationsSent = 0

  // ── 1. Fetch the published vehicle ────────────────────────────────────
  const { data: vehicleData, error: vehicleErr } = await supabase
    .from('vehicles')
    .select(
      'id, brand, model, price, year, km, category_id, subcategory_id, location_country, location_region, slug',
    )
    .eq('id', vehicleId)
    .eq('status', 'published')
    .single()

  if (vehicleErr || !vehicleData) {
    // Vehicle not found or not published — silently exit (not an error)
    return { matched: 0, notified: 0, skipped: true, reason: 'vehicle_not_found_or_not_published' }
  }

  const vehicle = vehicleData as unknown as VehicleForMatching

  // ── 2. Fetch active instant alerts from Pro users ─────────────────────
  // First get all premium/founding subscriptions
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('user_id, plan')
    .eq('status', 'active')

  if (!subs || subs.length === 0) {
    return { matched: 0, notified: 0, reason: 'no_active_subscriptions' }
  }

  // Filter to Pro-tier users (premium/founding = instant eligible)
  const proUserIds = (subs as unknown as SubscriptionRow[])
    .filter((s) => {
      const plan = normalizePlan(s.plan)
      return plan === 'premium' || plan === 'founding'
    })
    .map((s) => s.user_id)

  if (proUserIds.length === 0) {
    return { matched: 0, notified: 0, reason: 'no_pro_users' }
  }

  // Fetch active alerts for these Pro users
  const { data: alerts, error: alertsErr } = await supabase
    .from('search_alerts')
    .select('id, user_id, filters, frequency, last_sent_at, channels')
    .eq('active', true)
    .in('user_id', proUserIds)
    .limit(500)

  if (alertsErr) {
    logger.error(`[instant-alerts] Error fetching alerts: ${alertsErr.message}`)
    throw safeError(500, `Error fetching alerts: ${alertsErr.message}`)
  }

  const typedAlerts = (alerts ?? []) as unknown as AlertRow[]

  if (typedAlerts.length === 0) {
    return { matched: 0, notified: 0, reason: 'no_active_alerts' }
  }

  // ── 3. Match vehicle against each alert's filters ─────────────────────
  const matchedAlerts = typedAlerts.filter((alert) => {
    const filters = alert.filters ?? {}
    return matchesVehicle(vehicle, filters)
  })

  if (matchedAlerts.length === 0) {
    return { matched: 0, notified: 0, reason: 'no_matches' }
  }

  // ── 4. Group by user for deduplication ────────────────────────────────
  const userAlertMap = new Map<string, AlertRow[]>()
  for (const alert of matchedAlerts) {
    // Skip if already notified recently (60s cooldown)
    if (alert.last_sent_at) {
      const lastSent = new Date(alert.last_sent_at)
      if (now.getTime() - lastSent.getTime() < 60_000) continue
    }

    const existing = userAlertMap.get(alert.user_id)
    if (existing) {
      existing.push(alert)
    } else {
      userAlertMap.set(alert.user_id, [alert])
    }
  }

  if (userAlertMap.size === 0) {
    return { matched: matchedAlerts.length, notified: 0, reason: 'all_on_cooldown' }
  }

  // ── 5. Fetch user info for all matched users ──────────────────────────
  const matchedUserIds = [...userAlertMap.keys()]
  const { data: users } = await supabase
    .from('users')
    .select('id, email, name, lang, phone')
    .in('id', matchedUserIds)

  if (!users || users.length === 0) {
    return { matched: matchedAlerts.length, notified: 0, reason: 'users_not_found' }
  }

  const usersMap = new Map<string, UserRow>()
  for (const u of users as unknown as UserRow[]) {
    usersMap.set(u.id, u)
  }

  // Build notification list
  const notifications: MatchedNotification[] = []
  for (const [userId, userAlerts] of userAlertMap) {
    const user = usersMap.get(userId)
    if (!user) continue

    // Merge channels from all matched alerts (deduplicated)
    const channelSet = new Set<string>()
    for (const alert of userAlerts) {
      for (const ch of alert.channels ?? ['email']) {
        channelSet.add(ch)
      }
    }

    notifications.push({
      user,
      alerts: userAlerts,
      channels: [...channelSet],
    })
  }

  // ── 6. Send notifications ─────────────────────────────────────────────
  const _internalSecret = String(
    config.internalApiSecret ||
    process.env.INTERNAL_API_SECRET ||
    config.cronSecret ||
    process.env.CRON_SECRET ||
    '',
  )

  await processBatch({
    items: notifications,
    batchSize: 20,
    processor: async (notification: MatchedNotification) => {
      const { user, channels } = notification
      const locale = user.lang ?? 'es'

      const vehicleTitle = `${vehicle.brand ?? ''} ${vehicle.model ?? ''}`.trim()
      const priceStr = vehicle.price == null ? '' : vehicle.price.toLocaleString('es-ES') + ' €'
      const yearStr = vehicle.year ? ` (${vehicle.year})` : ''

      // ── Email ───────────────────────────────────────────────────────
      if (channels.includes('email')) {
        try {
          await $fetch('/api/email/send', {
            method: 'POST',
            headers: _internalSecret ? { 'x-internal-secret': _internalSecret } : {},
            body: {
              templateKey: 'instant_alert_match',
              to: user.email,
              userId: user.id,
              variables: {
                user_name: user.name ?? user.email,
                vehicle_title: `${vehicleTitle}${yearStr}`,
                vehicle_price: priceStr,
                vehicle_url: `${getSiteUrl()}/vehiculo/${vehicle.slug}`,
                alert_count: notification.alerts.length.toString(),
              },
              locale,
            },
          })
          notificationsSent++
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          logger.error(`[instant-alerts] Email failed for user ${user.id}: ${msg}`)
        }
      }

      // ── Push ────────────────────────────────────────────────────────
      if (channels.includes('push')) {
        try {
          await $fetch('/api/push/send', {
            method: 'POST',
            headers: _internalSecret ? { 'x-internal-secret': _internalSecret } : {},
            body: {
              userId: user.id,
              title:
                locale === 'es'
                  ? `Nuevo vehículo: ${vehicleTitle}`
                  : `New vehicle: ${vehicleTitle}`,
              body:
                locale === 'es'
                  ? `${vehicleTitle}${yearStr}${priceStr ? ' — ' + priceStr : ''} coincide con tu alerta`
                  : `${vehicleTitle}${yearStr}${priceStr ? ' — ' + priceStr : ''} matches your alert`,
              url: `${getSiteUrl()}/vehiculo/${vehicle.slug}`,
            },
          })
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          logger.error(`[instant-alerts] Push failed for user ${user.id}: ${msg}`)
        }
      }

      // ── Update last_sent_at on all matched alerts ───────────────────
      const alertIds = notification.alerts.map((a) => a.id)
      await supabase
        .from('search_alerts')
        .update({
          last_sent_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .in('id', alertIds)
    },
  })

  logger.info(
    `[instant-alerts] Vehicle ${vehicleId}: ${matchedAlerts.length} matches, ${notificationsSent} notifications sent`,
  )

  return {
    vehicle_id: vehicleId,
    matched: matchedAlerts.length,
    notified: notificationsSent,
    users: notifications.length,
  }
})
