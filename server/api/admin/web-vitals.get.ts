/**
 * GET /api/admin/web-vitals
 *
 * Admin endpoint for aggregated Web Vitals data.
 * Returns: p50, p75, p95 per metric, grouped by route.
 * Query params: days (default 7), route (optional filter)
 */
import { getQuery } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireRole } from '../../utils/rbac'
import { safeError } from '../../utils/safeError'

// Good/Needs Improvement/Poor thresholds per metric
const THRESHOLDS: Record<string, { good: number; poor: number }> = {
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)]
}

export default defineEventHandler(async (event) => {
  await requireRole(event, 'admin')

  const query = getQuery(event)
  const days = Math.min(90, Math.max(1, Number(query.days) || 7))
  const routeFilter = typeof query.route === 'string' ? query.route : undefined

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const db = serverSupabaseServiceRole(event)

  let dbQuery = db
    .from('web_vitals')
    .select('metric_name, metric_value, route, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(5000)

  if (routeFilter) {
    dbQuery = dbQuery.eq('route', routeFilter)
  }

  const { data, error } = await dbQuery

  if (error) {
    if (error.code === '42P01') {
      return { metrics: {}, routes: [], period: { days, since }, totalSamples: 0 }
    }
    throw safeError(500, `Query failed: ${error.message}`)
  }

  const rows = data ?? []

  // Group by metric name
  const byMetric: Record<string, number[]> = {}
  const routeSet = new Set<string>()

  for (const row of rows) {
    const name = row.metric_name as string
    if (!byMetric[name]) byMetric[name] = []
    byMetric[name].push(row.metric_value as number)
    routeSet.add(row.route as string)
  }

  // Calculate percentiles per metric
  const metrics: Record<string, { p50: number; p75: number; p95: number; count: number; rating: string }> = {}

  for (const [name, values] of Object.entries(byMetric)) {
    const sorted = [...values].sort((a, b) => a - b)
    const p75Value = percentile(sorted, 75)
    const threshold = THRESHOLDS[name]
    let rating = 'unknown'
    if (threshold) {
      rating = p75Value <= threshold.good ? 'good' : p75Value <= threshold.poor ? 'needs-improvement' : 'poor'
    }

    metrics[name] = {
      p50: percentile(sorted, 50),
      p75: p75Value,
      p95: percentile(sorted, 95),
      count: sorted.length,
      rating,
    }
  }

  return {
    period: { days, since },
    totalSamples: rows.length,
    metrics,
    routes: [...routeSet].sort(),
    thresholds: THRESHOLDS,
  }
})
