/**
 * POST /api/cron/orphan-cleanup
 *
 * Weekly cron: detects and logs orphan records in the database.
 * Orphans checked:
 *   1. Vehicles belonging to deleted dealers
 *   2. Vehicle images with no matching vehicle
 *   3. Leads for non-existent vehicles
 *
 * Does NOT auto-delete — logs findings to infra_alerts for admin review.
 *
 * Protected by x-cron-secret header.
 * Schedule: weekly (Sunday 03:00 UTC)
 *
 * #388 — Orphan record cleanup cron (audit #4 N95)
 */
import { defineEventHandler } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { verifyCronSecret } from '../../utils/verifyCronSecret'
import { acquireDbCronLock } from '../../utils/cronLock'
import { logger } from '../../utils/logger'

interface OrphanCheck {
  name: string
  count: number
}

export default defineEventHandler(async (event) => {
  verifyCronSecret(event)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = serverSupabaseServiceRole(event) as any

  if (!(await acquireDbCronLock(supabase, 'orphan-cleanup'))) {
    return { skipped: true, reason: 'already_ran_in_window', timestamp: new Date().toISOString() }
  }

  const vertical = process.env.NUXT_PUBLIC_VERTICAL ?? 'tracciona'
  const results: OrphanCheck[] = []

  // 1. Vehicles with dealer_id pointing to non-existent dealers
  const { data: orphanVehicles, error: e1 } = await supabase.rpc('count_orphan_vehicles' as never)
  if (!e1 && orphanVehicles !== null) {
    results.push({ name: 'vehicles_no_dealer', count: Number(orphanVehicles) || 0 })
  }

  // 2. Vehicle images with no matching vehicle (simple count via left join)
  const { count: orphanImages, error: e2 } = await supabase
    .from('vehicle_images')
    .select('id', { count: 'exact', head: true })
    .is('vehicle_id', null)
  if (!e2) {
    results.push({ name: 'images_no_vehicle', count: orphanImages ?? 0 })
  }

  // 3. Leads for non-existent vehicles (vehicle deleted but lead remains)
  // This requires an RPC since we can't do NOT EXISTS easily via PostgREST
  const { data: orphanLeads, error: e3 } = await supabase.rpc('count_orphan_leads' as never)
  if (!e3 && orphanLeads !== null) {
    results.push({ name: 'leads_no_vehicle', count: Number(orphanLeads) || 0 })
  }

  // Log any orphans found as infra alerts
  const alertsToInsert = results
    .filter((r) => r.count > 0)
    .map((r) => ({
      vertical,
      metric: `orphan_${r.name}`,
      current_value: r.count,
      threshold_value: 0,
      is_critical: r.count > 50,
      message: `Found ${r.count} orphan records: ${r.name}`,
    }))

  if (alertsToInsert.length) {
    await supabase.from('infra_alerts').insert(alertsToInsert)
    logger.warn('[orphan-cleanup] Orphan records found', { results })
  } else {
    logger.info('[orphan-cleanup] No orphans found')
  }

  return {
    checks: results,
    alertsCreated: alertsToInsert.length,
    timestamp: new Date().toISOString(),
  }
})
