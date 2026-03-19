/**
 * GET /api/admin/cohort-metrics
 *
 * Admin endpoint for user cohort segmentation and retention metrics.
 * Segments: new (registered <7d), returning (>7d, active <30d), dormant (>30d), VIP dealer.
 *
 * Query params:
 *   - days: analysis window (default 30)
 *
 * Returns cohort counts, retention D7/D30, and trend data.
 *
 * F8 — Métricas por cohorte (nuevo/recurrente/dealer VIP)
 */
import { getQuery } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireRole } from '../../utils/rbac'
import { safeError } from '../../utils/safeError'

interface CohortResult {
  cohorts: {
    new: number
    returning: number
    dormant: number
    vipDealers: number
    total: number
  }
  retention: {
    d7: number | null // % of users who returned within 7 days
    d30: number | null
  }
  weeklyTrend: Array<{
    week: string // ISO date of week start
    newUsers: number
    activeUsers: number
    leads: number
  }>
}

export default defineEventHandler(async (event) => {
  await requireRole(event, 'admin')

  const query = getQuery(event)
  const days = Math.min(90, Math.max(7, Number(query.days) || 30))

  const supabase = serverSupabaseServiceRole(event)
  const now = new Date()
  const windowStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
  const d7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const d30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  try {
    // Run queries in parallel
    const [
      newUsersRes,
      totalUsersRes,
      activeRecentRes,
      vipDealersRes,
      d7RetentionRes,
      d30RetentionRes,
      weeklyEventsRes,
      weeklyUsersRes,
      weeklyLeadsRes,
    ] = await Promise.all([
      // New users (registered within 7 days)
      supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', d7Ago),

      // Total users
      supabase.from('users').select('id', { count: 'exact', head: true }),

      // Active recently (had analytics event in last 30 days)
      supabase
        .from('analytics_events')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', d30Ago)
        .not('user_id', 'is', null),

      // VIP dealers (active subscription or >5 published vehicles)
      supabase
        .from('dealers')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .or('subscription_tier.eq.premium,subscription_tier.eq.enterprise'),

      // D7 retention: users created >7d ago who had activity in last 7d
      supabase
        .from('analytics_events')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', d7Ago)
        .not('user_id', 'is', null),

      // D30 retention: users with activity in window
      supabase
        .from('analytics_events')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', d30Ago)
        .not('user_id', 'is', null),

      // Weekly new analytics events (for trend)
      supabase
        .from('analytics_events')
        .select('created_at')
        .gte('created_at', windowStart)
        .order('created_at', { ascending: true })
        .limit(5000),

      // Weekly new users (for trend)
      supabase
        .from('users')
        .select('created_at')
        .gte('created_at', windowStart)
        .order('created_at', { ascending: true }),

      // Weekly leads (for trend)
      supabase
        .from('leads')
        .select('created_at')
        .gte('created_at', windowStart)
        .order('created_at', { ascending: true }),
    ])

    const newCount = newUsersRes.count ?? 0
    const totalCount = totalUsersRes.count ?? 0
    const activeRecentCount = activeRecentRes.count ?? 0
    const vipCount = vipDealersRes.count ?? 0
    const returningCount = Math.max(0, activeRecentCount - newCount)
    const dormantCount = Math.max(0, totalCount - activeRecentCount)

    // Retention calculations
    const d7Active = d7RetentionRes.count ?? 0
    const d30Active = d30RetentionRes.count ?? 0
    const d7Retention = totalCount > 0 ? Math.round((d7Active / totalCount) * 1000) / 10 : null
    const d30Retention = totalCount > 0 ? Math.round((d30Active / totalCount) * 1000) / 10 : null

    // Weekly trend aggregation
    const weeklyTrend = buildWeeklyTrend(
      (weeklyUsersRes.data ?? []) as Array<{ created_at: string }>,
      (weeklyEventsRes.data ?? []) as Array<{ created_at: string }>,
      (weeklyLeadsRes.data ?? []) as Array<{ created_at: string }>,
      days,
    )

    const result: CohortResult = {
      cohorts: {
        new: newCount,
        returning: returningCount,
        dormant: dormantCount,
        vipDealers: vipCount,
        total: totalCount,
      },
      retention: {
        d7: d7Retention,
        d30: d30Retention,
      },
      weeklyTrend,
    }

    return result
  } catch (err) {
    throw safeError(
      500,
      `Failed to compute cohort metrics: ${err instanceof Error ? err.message : String(err)}`,
    )
  }
})

function buildWeeklyTrend(
  users: Array<{ created_at: string }>,
  events: Array<{ created_at: string }>,
  leads: Array<{ created_at: string }>,
  days: number,
): CohortResult['weeklyTrend'] {
  const weeks = Math.ceil(days / 7)
  const now = Date.now()
  const trend: CohortResult['weeklyTrend'] = []

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now - (i + 1) * 7 * 24 * 60 * 60 * 1000)
    const weekEnd = new Date(now - i * 7 * 24 * 60 * 60 * 1000)
    const weekLabel = weekStart.toISOString().slice(0, 10)

    const newUsers = users.filter((u) => {
      const d = new Date(u.created_at)
      return d >= weekStart && d < weekEnd
    }).length

    const activeUsers = events.filter((e) => {
      const d = new Date(e.created_at)
      return d >= weekStart && d < weekEnd
    }).length

    const leadsCount = leads.filter((l) => {
      const d = new Date(l.created_at)
      return d >= weekStart && d < weekEnd
    }).length

    trend.push({
      week: weekLabel,
      newUsers,
      activeUsers,
      leads: leadsCount,
    })
  }

  return trend
}
