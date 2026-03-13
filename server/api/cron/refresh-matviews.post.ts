/**
 * POST /api/cron/refresh-matviews
 *
 * Refreshes all materialized views concurrently to keep dashboard KPIs
 * and search facets fresh without locking reads.
 *
 * Views refreshed:
 *   - mv_dashboard_kpis   (KPI counters for admin dashboard)
 *   - mv_search_facets    (category/brand/location counts for filters)
 *
 * CONCURRENTLY = readers are not blocked during refresh.
 * Requires a UNIQUE index on each matview (created in migration 00119).
 *
 * Requires: CRON_SECRET in Authorization header.
 * Schedule: every 15min via cron/scheduler.
 *
 * #144 Bloque 18
 */
import { defineEventHandler } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { logger } from '../../utils/logger'
import { verifyCronSecret } from '../../utils/verifyCronSecret'

const MATVIEWS = ['mv_dashboard_kpis', 'mv_search_facets'] as const

export default defineEventHandler(async (event) => {
  verifyCronSecret(event)

  const supabase = serverSupabaseServiceRole(event)
  const results: Record<string, 'ok' | 'error'> = {}
  const startMs = Date.now()

  for (const view of MATVIEWS) {
    const t0 = Date.now()
    const { error } = await supabase.rpc(
      'refresh_matview' as never,
      { view_name: view },
    )

    if (error) {
      logger.error(`[refresh-matviews] Failed to refresh ${view}`, { error: error.message })
      results[view] = 'error'
    } else {
      const ms = Date.now() - t0
      logger.info(`[refresh-matviews] Refreshed ${view}`, { ms })
      results[view] = 'ok'
    }
  }

  const totalMs = Date.now() - startMs
  const failed = Object.values(results).filter((r) => r === 'error').length

  logger.info('[refresh-matviews] Complete', { results, totalMs, failed })

  return {
    ok: failed === 0,
    results,
    durationMs: totalMs,
    failed,
  }
})
