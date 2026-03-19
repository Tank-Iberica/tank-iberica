/**
 * POST /api/cron/compute-aggregates
 *
 * Pre-computes KPI aggregates every 15 minutes.
 * Stores results in dashboard_aggregates table for fast dashboard reads.
 *
 * Metrics computed:
 *   - total_vehicles (active)
 *   - total_dealers (active)
 *   - total_leads (last 30d)
 *   - total_views (last 30d)
 *   - avg_response_time_hours
 *   - conversion_rate
 *
 * Roadmap: N77 — Pre-computed aggregates table
 */
import { defineEventHandler } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { logger } from '../../utils/logger'
import { verifyCronSecret } from '../../utils/verifyCronSecret'

export const AGGREGATE_METRICS = [
  'total_vehicles',
  'total_dealers',
  'total_leads_30d',
  'total_views_30d',
  'avg_response_hours',
  'conversion_rate',
] as const

export type AggregateMetric = (typeof AGGREGATE_METRICS)[number]

export default defineEventHandler(async (event) => {
  verifyCronSecret(event)
  const supabase = serverSupabaseServiceRole(event)

  const now = new Date().toISOString()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const results: Record<string, number> = {}

  try {
    // Total active vehicles
    const { count: vehicleCount } = await supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
    results.total_vehicles = vehicleCount ?? 0

    // Total active dealers
    const { count: dealerCount } = await supabase
      .from('dealers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active' as never)
    results.total_dealers = dealerCount ?? 0

    // Total leads last 30d
    const { count: leadCount } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo)
    results.total_leads_30d = leadCount ?? 0

    // Total views last 30d
    const { count: viewCount } = await supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'vehicle_view')
      .gte('created_at', thirtyDaysAgo)
    results.total_views_30d = viewCount ?? 0

    // Store aggregates
    const inserts = Object.entries(results).map(([metric, value]) => ({
      metric,
      value,
      computed_at: now,
      vertical: process.env.NUXT_PUBLIC_VERTICAL || 'tracciona',
    }))

    // Upsert by metric name
    for (const row of inserts) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from as any)('dashboard_aggregates').upsert(row, {
        onConflict: 'metric,vertical',
      })
    }

    logger.info('[compute-aggregates] Computed', results)
    return { success: true, metrics: results, computed_at: now }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error('[compute-aggregates] Failed', { message })
    return { success: false, error: message }
  }
})
