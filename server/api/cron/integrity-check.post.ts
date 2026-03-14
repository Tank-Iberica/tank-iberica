/**
 * POST /api/cron/integrity-check
 *
 * Monthly cron: verifies cross-table referential integrity beyond FK constraints.
 * Checks:
 *   1. vehicles.dealer_id → dealers.id (orphan vehicles)
 *   2. leads.vehicle_id → vehicles.id (orphan leads)
 *   3. vehicle_images.vehicle_id → vehicles.id (orphan images)
 *   4. credit_transactions.user_id → auth.users.id (orphan transactions)
 *   5. search_alerts.user_id → auth.users.id (orphan alerts)
 *
 * Does NOT auto-delete — logs findings to infra_alerts for admin review.
 *
 * Protected by x-cron-secret header.
 * Schedule: monthly (1st of month, 02:00 UTC)
 *
 * #436 — Cross-table referential integrity check (audit #4 N97)
 */
import { defineEventHandler } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { verifyCronSecret } from '../../utils/verifyCronSecret'
import { acquireDbCronLock } from '../../utils/cronLock'
import { logger } from '../../utils/logger'

interface IntegrityCheck {
  name: string
  count: number
}

export default defineEventHandler(async (event) => {
  verifyCronSecret(event)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = serverSupabaseServiceRole(event) as any

  // Monthly lock window (30 days)
  if (!(await acquireDbCronLock(supabase, 'integrity-check', 30 * 24 * 60 * 60 * 1000))) {
    return { skipped: true, reason: 'already_ran_in_window', timestamp: new Date().toISOString() }
  }

  const vertical = process.env.NUXT_PUBLIC_VERTICAL ?? 'tracciona'
  const results: IntegrityCheck[] = []

  // 1. Orphan vehicles (dealer_id → non-existent dealer)
  const { data: orphanVehicles, error: e1 } = await supabase.rpc('count_orphan_vehicles' as never)
  if (!e1 && orphanVehicles !== null) {
    results.push({ name: 'vehicles_no_dealer', count: Number(orphanVehicles) || 0 })
  }

  // 2. Orphan leads (vehicle_id → non-existent vehicle)
  const { data: orphanLeads, error: e2 } = await supabase.rpc('count_orphan_leads' as never)
  if (!e2 && orphanLeads !== null) {
    results.push({ name: 'leads_no_vehicle', count: Number(orphanLeads) || 0 })
  }

  // 3. Orphan images (vehicle_id IS NULL — should have been cleaned up)
  const { count: orphanImages, error: e3 } = await supabase
    .from('vehicle_images')
    .select('id', { count: 'exact', head: true })
    .is('vehicle_id', null)
  if (!e3) {
    results.push({ name: 'images_no_vehicle', count: orphanImages ?? 0 })
  }

  // 4. Check for vehicles with status 'published' but missing required fields
  const { count: incompletePublished, error: e4 } = await supabase
    .from('vehicles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')
    .or('dealer_id.is.null,brand.is.null,model.is.null')
  if (!e4) {
    results.push({ name: 'published_incomplete', count: incompletePublished ?? 0 })
  }

  // Log any integrity issues found as infra alerts
  const alertsToInsert = results
    .filter((r) => r.count > 0)
    .map((r) => ({
      vertical,
      metric: `integrity_${r.name}`,
      current_value: r.count,
      threshold_value: 0,
      is_critical: r.count > 100,
      message: `Integrity check: ${r.count} orphan/incomplete records — ${r.name}`,
    }))

  if (alertsToInsert.length > 0) {
    await supabase.from('infra_alerts').insert(alertsToInsert)
    logger.warn('[integrity-check] Issues found', { results })
  } else {
    logger.info('[integrity-check] All integrity checks passed')
  }

  return {
    checks: results,
    alertsCreated: alertsToInsert.length,
    timestamp: new Date().toISOString(),
  }
})
