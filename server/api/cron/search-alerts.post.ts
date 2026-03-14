/**
 * POST /api/cron/search-alerts
 *
 * Cron job for search alert matching. Queries active search_alerts whose
 * frequency matches (instant, daily, weekly), finds newly published vehicles
 * matching their saved filters, and sends notification emails.
 *
 * Protected by x-cron-secret header.
 */
import { defineEventHandler, readBody } from 'h3'
import { safeError } from '../../utils/safeError'
import { serverSupabaseServiceRole } from '#supabase/server'
import { verifyCronSecret } from '../../utils/verifyCronSecret'
import { processBatch } from '../../utils/batchProcessor'
import { logger } from '../../utils/logger'

// -- Types --------------------------------------------------------------------

interface SearchAlertRow {
  id: string
  user_id: string
  filters: SearchAlertFilters
  frequency: string | null
  last_sent_at: string | null
  active: boolean | null
}

interface SearchAlertFilters {
  category_id?: string
  price_min?: number
  price_max?: number
  year_min?: number
  year_max?: number
  brand?: string
  location_country?: string
  location_region?: string
  [key: string]: string | number | boolean | undefined
}

interface UserRow {
  id: string
  email: string
  name: string | null
  lang: string | null
}

interface VehicleRow {
  id: string
  brand: string
  model: string
  price: number | null
  year: number | null
  slug: string
  category_id: string | null
  location_country: string | null
  location_region: string | null
  created_at: string | null
}

interface CronBody {
  secret?: string
}

// -- Helpers ------------------------------------------------------------------

/** Max alert frequency allowed per subscription plan (backlog #12) */
const PLAN_MAX_FREQUENCY: Record<string, string> = {
  free: 'weekly',
  basic: 'weekly',
  classic: 'daily',
  premium: 'instant',
  founding: 'instant',
}

/** Numeric rank so we can cap frequencies — higher = faster */
const FREQUENCY_RANK: Record<string, number> = { weekly: 0, daily: 1, instant: 2 }

/** Returns the effective frequency respecting the plan cap */
export function effectiveFrequency(alertFreq: string | null, planSlug: string): string {
  const freq = alertFreq ?? 'daily'
  const planMax = PLAN_MAX_FREQUENCY[planSlug] ?? 'weekly'
  return (FREQUENCY_RANK[freq] ?? 0) <= (FREQUENCY_RANK[planMax] ?? 0) ? freq : planMax
}

function isAlertEligible(alert: SearchAlertRow, now: Date, planSlug: string): boolean {
  const frequency = effectiveFrequency(alert.frequency, planSlug)
  const lastSent = alert.last_sent_at ? new Date(alert.last_sent_at) : null
  if (frequency === 'instant') return !lastSent || now.getTime() - lastSent.getTime() > 60_000
  if (frequency === 'daily')
    return !lastSent || now.getTime() - lastSent.getTime() > 24 * 60 * 60 * 1000
  if (frequency === 'weekly')
    return !lastSent || now.getTime() - lastSent.getTime() > 7 * 24 * 60 * 60 * 1000
  return false
}

function applyAlertFilters<
  Q extends {
    eq: (col: string, val: unknown) => Q
    gte: (col: string, val: unknown) => Q
    lte: (col: string, val: unknown) => Q
    ilike: (col: string, val: string) => Q
  },
>(query: Q, filters: SearchAlertFilters): Q {
  if (filters.category_id) query = query.eq('category_id', filters.category_id)
  if (filters.price_min != null) query = query.gte('price', filters.price_min)
  if (filters.price_max != null) query = query.lte('price', filters.price_max)
  if (filters.year_min != null) query = query.gte('year', filters.year_min)
  if (filters.year_max != null) query = query.lte('year', filters.year_max)
  if (filters.brand) query = query.ilike('brand', filters.brand)
  if (filters.location_country) query = query.eq('location_country', filters.location_country)
  if (filters.location_region) query = query.eq('location_region', filters.location_region)
  return query
}

// -- Handler ------------------------------------------------------------------

export default defineEventHandler(async (event) => {
  // -- Verify cron secret -----------------------------------------------------
  const body = await readBody<CronBody>(event).catch(() => ({}) as CronBody)
  verifyCronSecret(event, body?.secret)

  const supabase = serverSupabaseServiceRole(event)
  const _internalSecret = useRuntimeConfig().cronSecret || process.env.CRON_SECRET
  const now = new Date()
  let alertsProcessed = 0
  let emailsSent = 0

  // -- 1. Query all active search alerts --------------------------------------
  const { data: alerts, error: alertsError } = await supabase
    .from('search_alerts')
    .select('id, user_id, filters, frequency, last_sent_at, active')
    .eq('active', true)
    .limit(200)

  if (alertsError) {
    throw safeError(500, `Failed to fetch search alerts: ${alertsError.message}`)
  }

  if (!alerts || alerts.length === 0) {
    return { alertsProcessed: 0, emailsSent: 0, timestamp: now.toISOString() }
  }

  const typedAlerts = alerts as unknown as SearchAlertRow[]

  // -- 2. Fetch subscription plans for all alert owners (#12 tier enforcement) -
  const userIds = [...new Set(typedAlerts.map((a) => a.user_id))]
  const { data: subsData } = await supabase
    .from('subscriptions')
    .select('user_id, plan')
    .in('user_id', userIds)
    .eq('status', 'active')

  const userPlanMap = new Map<string, string>()
  for (const sub of (subsData ?? []) as Array<{ user_id: string; plan: string }>) {
    userPlanMap.set(sub.user_id, sub.plan)
  }

  // -- 3. Filter alerts by frequency eligibility (capped by plan tier) --------
  const eligibleAlerts = typedAlerts.filter((alert) =>
    isAlertEligible(alert, now, userPlanMap.get(alert.user_id) ?? 'free'),
  )

  // -- 4. For each eligible alert, find matching vehicles ---------------------
  const result = await processBatch({
    items: eligibleAlerts,
    batchSize: 50,
    delayBetweenBatchesMs: 5000,
    processor: async (alert: SearchAlertRow) => {
      alertsProcessed++

      // Determine the cutoff time (only vehicles published since last notification)
      const sinceDate =
        alert.last_sent_at ?? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const filters = alert.filters ?? {}

      // Build vehicle query
      const baseQuery = supabase
        .from('vehicles')
        .select(
          'id, brand, model, price, year, slug, category_id, location_country, location_region, created_at',
        )
        .eq('status', 'published')
        .gte('created_at', sinceDate)
        .order('created_at', { ascending: false })
        .limit(20)

      const { data: vehicles, error: vehiclesError } = await (applyAlertFilters(
        baseQuery as Parameters<typeof applyAlertFilters>[0],
        filters,
      ) as unknown as Promise<{ data: unknown[] | null; error: { message: string } | null }>)

      if (vehiclesError) {
        logger.error(
          `[search-alerts] Error querying vehicles for alert ${alert.id}: ${vehiclesError.message}`,
        )
        return
      }

      const typedVehicles = (vehicles ?? []) as unknown as VehicleRow[]

      if (typedVehicles.length === 0) {
        return // No matches -- skip sending
      }

      // -- 4. Get user info for email -------------------------------------------
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, name, lang')
        .eq('id', alert.user_id)
        .single()

      if (userError || !userData) {
        logger.error(
          `[search-alerts] User not found for alert ${alert.id}: ${userError?.message ?? 'no data'}`,
        )
        return
      }

      const typedUser = userData as unknown as UserRow

      // -- 5. Build vehicle list for email variables ----------------------------
      const vehicleListHtml = typedVehicles
        .slice(0, 10) // Cap at 10 vehicles in the email
        .map(
          (v) =>
            `${v.brand} ${v.model}${v.year ? ' (' + v.year + ')' : ''}${v.price ? ' - ' + v.price.toLocaleString('es-ES') + ' EUR' : ''}`,
        )
        .join(', ')

      const variables: Record<string, string> = {
        user_name: typedUser.name ?? typedUser.email,
        match_count: typedVehicles.length.toString(),
        vehicle_list: vehicleListHtml,
        search_url: `${getSiteUrl()}/catalogo`,
      }

      // -- 6. Send email via internal route -------------------------------------
      try {
        const emailPayload = {
          templateKey: 'search_alert_match',
          to: typedUser.email,
          userId: typedUser.id,
          variables,
          locale: typedUser.lang ?? 'es',
        }

        // Call the email send endpoint internally using $fetch
        await $fetch('/api/email/send', {
          method: 'POST',
          headers: _internalSecret ? { 'x-internal-secret': _internalSecret } : {},
          body: emailPayload,
        })

        emailsSent++
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        logger.error(`[search-alerts] Failed to send email for alert ${alert.id}: ${errorMessage}`)
      }

      // -- 7. Update last_sent_at on the alert ----------------------------------
      await supabase
        .from('search_alerts')
        .update({
          last_sent_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', alert.id)
    },
  })

  return {
    alertsProcessed,
    emailsSent,
    batchResult: { processed: result.processed, errors: result.errors },
    timestamp: now.toISOString(),
  }
})
