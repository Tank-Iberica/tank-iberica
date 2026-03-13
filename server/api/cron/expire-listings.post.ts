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
import { verifyCronSecret } from '~~/server/utils/verifyCronSecret'
import { logger } from '~~/server/utils/logger'

/** Default listing duration in days if not set per dealer/vertical */
const DEFAULT_DURATION_DAYS = 60

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  verifyCronSecret(event, body?.secret)

  const supabase = serverSupabaseServiceRole(event)

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - DEFAULT_DURATION_DAYS)
  const cutoffIso = cutoff.toISOString()

  // Find published vehicles that were published before cutoff
  const { data: expiredVehicles, error: fetchErr } = await supabase
    .from('vehicles')
    .select('id, dealer_id, make, model, year, published_at')
    .eq('status', 'published')
    .lt('published_at', cutoffIso)
    .limit(500)

  if (fetchErr) {
    logger.error({ error: fetchErr }, '[expire-listings] Failed to fetch expired vehicles')
    return { ok: false, error: fetchErr.message }
  }

  const vehicles = expiredVehicles ?? []
  if (vehicles.length === 0) {
    logger.info('[expire-listings] No expired listings found')
    return { ok: true, expired: 0, notified: 0 }
  }

  const ids = vehicles.map((v) => v.id)

  // Bulk update to 'expired'
  const { error: updateErr } = await supabase
    .from('vehicles')
    .update({ status: 'expired', updated_at: new Date().toISOString() })
    .in('id', ids)

  if (updateErr) {
    logger.error({ error: updateErr }, '[expire-listings] Failed to update expired vehicles')
    return { ok: false, error: updateErr.message }
  }

  // Log transitions as analytics_events
  const events = vehicles.map((v) => ({
    event_type: 'status_transition',
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

  await supabase.from('analytics_events').insert(events).then(({ error }) => {
    if (error) logger.warn({ error }, '[expire-listings] Failed to log some transitions')
  })

  // Group by dealer for notifications
  const byDealer = new Map<string, typeof vehicles>()
  for (const v of vehicles) {
    const existing = byDealer.get(v.dealer_id) ?? []
    existing.push(v)
    byDealer.set(v.dealer_id, existing)
  }

  let notified = 0

  for (const [dealerId, dealerVehicles] of byDealer) {
    // Get dealer email
    const { data: dealer } = await supabase
      .from('dealers')
      .select('email, company_name')
      .eq('id', dealerId)
      .maybeSingle()

    if (!dealer?.email) continue

    // Queue email notification
    const { error: emailErr } = await supabase.from('email_queue').insert({
      to: dealer.email,
      template: 'listings_expired',
      data: {
        company_name: dealer.company_name,
        count: dealerVehicles.length,
        vehicles: dealerVehicles.slice(0, 5).map((v) => `${v.make} ${v.model} ${v.year}`),
        renewal_url: `${process.env.SITE_URL ?? 'https://tracciona.es'}/dashboard/vehiculos`,
      },
    })

    if (emailErr) {
      logger.warn({ error: emailErr, dealerId }, '[expire-listings] Failed to queue notification')
    } else {
      notified++
    }
  }

  logger.info({ expired: ids.length, notified }, '[expire-listings] Completed')

  return { ok: true, expired: ids.length, notified }
})
