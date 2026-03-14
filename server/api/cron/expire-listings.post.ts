/**
 * POST /api/cron/expire-listings
 *
 * Detects published listings that have been active past their configured duration,
 * marks them as 'expired', and notifies the dealer.
 *
 * Run daily (e.g., 02:00 UTC).
 * Authorization: x-cron-secret header.
 */
import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { verifyCronSecret } from '../../utils/verifyCronSecret'
import { logger } from '../../utils/logger'

/** Default listing duration in days if not set per dealer/vertical */
const DEFAULT_DURATION_DAYS = 60

// -- Types ------------------------------------------------------------------

interface CronBody {
  secret?: string
}

interface ExpiredVehicle {
  id: string
  dealer_id: string | null
  brand: string
  model: string
  year: number | null
  created_at: string | null
}

interface DealerInfo {
  email: string | null
  company_name: unknown
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CronBody>(event).catch(() => ({}) as CronBody)
  verifyCronSecret(event, body?.secret)

  const supabase = serverSupabaseServiceRole(event)

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - DEFAULT_DURATION_DAYS)
  const cutoffIso = cutoff.toISOString()

  // Find published vehicles that were published before cutoff
  // Uses created_at as proxy since published_at is not yet in generated types
  const { data: expiredVehicles, error: fetchErr } = await supabase
    .from('vehicles')
    .select('id, dealer_id, brand, model, year, created_at')
    .eq('status', 'published')
    .lt('created_at', cutoffIso)
    .limit(500)

  if (fetchErr) {
    logger.error(`[expire-listings] Failed to fetch expired vehicles: ${fetchErr.message}`)
    return { ok: false, error: fetchErr.message }
  }

  const vehicles = (expiredVehicles ?? []) as unknown as ExpiredVehicle[]
  if (vehicles.length === 0) {
    logger.info('[expire-listings] No expired listings found')
    return { ok: true, expired: 0, notified: 0 }
  }

  const ids = vehicles.map((v: ExpiredVehicle) => v.id)

  // Bulk update to 'expired'
  const { error: updateErr } = await supabase
    .from('vehicles')
    .update({ status: 'expired', updated_at: new Date().toISOString() } as never)
    .in('id', ids)

  if (updateErr) {
    logger.error(`[expire-listings] Failed to update expired vehicles: ${updateErr.message}`)
    return { ok: false, error: updateErr.message }
  }

  // Log transitions as analytics_events
  const events = vehicles.map((v: ExpiredVehicle) => ({
    event_type: 'status_transition' as const,
    entity_type: 'vehicle',
    entity_id: v.id,
    metadata: {
      from: 'published',
      to: 'expired',
      reason: 'auto_expire',
      dealer_id: v.dealer_id,
      timestamp: new Date().toISOString(),
    },
  }))

  await supabase
    .from('analytics_events')
    .insert(events as never)
    .then(({ error }: { error: { message: string } | null }) => {
      if (error) logger.warn(`[expire-listings] Failed to log some transitions: ${error.message}`)
    })

  // Group by dealer for notifications
  const byDealer = new Map<string, ExpiredVehicle[]>()
  for (const v of vehicles) {
    const key = v.dealer_id ?? '__unknown__'
    const existing = byDealer.get(key) ?? []
    existing.push(v)
    byDealer.set(key, existing)
  }

  let notified = 0

  for (const [dealerId, dealerVehicles] of Array.from(byDealer.entries())) {
    if (dealerId === '__unknown__') continue

    // Get dealer email
    const { data: dealer } = await supabase
      .from('dealers')
      .select('email, company_name')
      .eq('id', dealerId)
      .maybeSingle()

    const typedDealer = dealer as unknown as DealerInfo | null
    if (!typedDealer?.email) continue

    // Queue email notification
    const { error: emailErr } = await (supabase as unknown as { from: (t: string) => { insert: (r: Record<string, unknown>) => Promise<{ error: { message: string } | null }> } })
      .from('email_queue')
      .insert({
        to: typedDealer.email,
        template: 'listings_expired',
        data: {
          company_name: typedDealer.company_name,
          count: dealerVehicles.length,
          vehicles: dealerVehicles.slice(0, 5).map((v: ExpiredVehicle) => `${v.brand} ${v.model} ${v.year ?? ''}`),
          renewal_url: `${process.env.SITE_URL ?? 'https://tracciona.es'}/dashboard/vehiculos`,
        },
      })

    if (emailErr) {
      logger.warn(`[expire-listings] Failed to queue notification for dealer ${dealerId}: ${emailErr.message}`)
    } else {
      notified++
    }
  }

  logger.info('[expire-listings] Completed', { expired: ids.length, notified })

  return { ok: true, expired: ids.length, notified }
})
