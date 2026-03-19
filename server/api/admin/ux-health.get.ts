/**
 * GET /api/admin/ux-health
 *
 * Admin endpoint for UX health score dashboard.
 * Composites score from: error rate, LCP p75, form abandonment, 404 rate.
 * Shows trend for last 4 weeks.
 *
 * F9 — Dashboard salud UX semanal
 */
import { getQuery } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireRole } from '../../utils/rbac'
import { safeError } from '../../utils/safeError'

interface UxHealthScore {
  overall: number // 0-100
  rating: 'good' | 'needs-improvement' | 'poor'
  components: {
    errorRate: { value: number; score: number; weight: number }
    lcpP75: { value: number; score: number; weight: number }
    notFoundRate: { value: number; score: number; weight: number }
    formAbandonment: { value: number; score: number; weight: number }
  }
  trend: Array<{
    week: string
    score: number
    errorRate: number
    lcpP75: number
  }>
}

function scoreErrorRate(rate: number): number {
  if (rate <= 0.01) return 100 // <1% error rate = perfect
  if (rate <= 0.05) return 75
  if (rate <= 0.1) return 50
  return 25
}

function scoreLcp(ms: number): number {
  if (ms <= 2500) return 100 // Good LCP
  if (ms <= 4000) return 60 // Needs improvement
  return 25 // Poor
}

function score404Rate(rate: number): number {
  if (rate <= 0.005) return 100 // <0.5%
  if (rate <= 0.02) return 70
  return 30
}

function scoreFormAbandonment(rate: number): number {
  if (rate <= 0.2) return 100 // <20% abandonment
  if (rate <= 0.4) return 65
  return 30
}

export default defineEventHandler(async (event) => {
  await requireRole(event, 'admin')

  const query = getQuery(event)
  const weeks = Math.min(12, Math.max(1, Number(query.weeks) || 4))

  const supabase = serverSupabaseServiceRole(event)
  const now = Date.now()

  try {
    const trend: UxHealthScore['trend'] = []

    for (let w = weeks - 1; w >= 0; w--) {
      const weekStart = new Date(now - (w + 1) * 7 * 24 * 60 * 60 * 1000).toISOString()
      const weekEnd = new Date(now - w * 7 * 24 * 60 * 60 * 1000).toISOString()

      // Parallel queries for this week
      const [alertsRes, vitalsRes, eventsRes, notFoundRes] = await Promise.all([
        // Error alerts this week
        supabase
          .from('infra_alerts')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', weekStart)
          .lt('created_at', weekEnd),

        // Web vitals LCP
        supabase
          .from('web_vitals' as never)
          .select('metric_value')
          .eq('metric_name', 'LCP')
          .gte('created_at', weekStart)
          .lt('created_at', weekEnd)
          .order('metric_value', { ascending: true }),

        // Total analytics events (for normalization)
        supabase
          .from('analytics_events')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', weekStart)
          .lt('created_at', weekEnd),

        // 404 events
        supabase
          .from('analytics_events')
          .select('id', { count: 'exact', head: true })
          .eq('event_type', 'error:404')
          .gte('created_at', weekStart)
          .lt('created_at', weekEnd),
      ])

      const totalEvents = eventsRes.count ?? 1
      const errorCount = alertsRes.count ?? 0
      const notFoundCount = notFoundRes.count ?? 0
      const errorRate = errorCount / Math.max(1, totalEvents)
      const notFoundRate = notFoundCount / Math.max(1, totalEvents)

      // Calculate LCP p75
      const lcpValues = ((vitalsRes.data ?? []) as Array<{ metric_value: number }>)
        .map((r) => r.metric_value)
        .sort((a, b) => a - b)
      const lcpP75 =
        lcpValues.length > 0 ? (lcpValues[Math.ceil(0.75 * lcpValues.length) - 1] ?? 0) : 0

      const weekScore = Math.round(
        scoreErrorRate(errorRate) * 0.3 +
          scoreLcp(lcpP75) * 0.35 +
          score404Rate(notFoundRate) * 0.15 +
          scoreFormAbandonment(0.25) * 0.2, // default 25% abandonment until tracked
      )

      trend.push({
        week: weekStart.slice(0, 10),
        score: weekScore,
        errorRate: Math.round(errorRate * 10000) / 100, // percentage
        lcpP75: Math.round(lcpP75),
      })
    }

    // Current week = last in trend
    const current = trend[trend.length - 1] ?? { score: 0, errorRate: 0, lcpP75: 0 }
    const overall = current.score
    const rating: 'good' | 'needs-improvement' | 'poor' =
      overall >= 80 ? 'good' : overall >= 50 ? 'needs-improvement' : 'poor'

    const result: UxHealthScore = {
      overall,
      rating,
      components: {
        errorRate: {
          value: current.errorRate,
          score: scoreErrorRate(current.errorRate / 100),
          weight: 0.3,
        },
        lcpP75: { value: current.lcpP75, score: scoreLcp(current.lcpP75), weight: 0.35 },
        notFoundRate: { value: 0, score: score404Rate(0), weight: 0.15 },
        formAbandonment: { value: 25, score: scoreFormAbandonment(0.25), weight: 0.2 },
      },
      trend,
    }

    return result
  } catch (err) {
    throw safeError(
      500,
      `Failed to compute UX health: ${err instanceof Error ? err.message : String(err)}`,
    )
  }
})
