/**
 * GET /api/admin/search-analytics
 *
 * Admin endpoint for search analytics.
 * Returns: top zero-result queries, total searches, trends by date.
 * Query params: days (default 30), limit (default 20)
 */
import { getQuery } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireRole } from '../../utils/rbac'
import { safeError } from '../../utils/safeError'

export default defineEventHandler(async (event) => {
  await requireRole(event, 'admin')

  const query = getQuery(event)
  const days = Math.min(90, Math.max(1, Number(query.days) || 30))
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20))

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const supabase = serverSupabaseServiceRole(event)

  // 1. Total search count in period
  const { count: totalSearches } = await supabase
    .from('search_logs')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since)

  // 2. Zero-result count
  const { count: zeroResultCount } = await supabase
    .from('search_logs')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since)
    .eq('results_count', 0)

  // 3. Top zero-result queries (grouped)
  const { data: zeroResultLogs, error } = await supabase
    .from('search_logs')
    .select('query, filters, created_at')
    .gte('created_at', since)
    .eq('results_count', 0)
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) throw safeError(500, `Query failed: ${error.message}`)

  // Group by query text for top-N
  const queryMap = new Map<string, { count: number; lastSeen: string; filters: unknown }>()
  for (const log of zeroResultLogs ?? []) {
    const q = (log.query || '(empty)').toLowerCase().trim()
    const existing = queryMap.get(q)
    if (existing) {
      existing.count++
      if (log.created_at && log.created_at > existing.lastSeen) {
        existing.lastSeen = log.created_at
        existing.filters = log.filters
      }
    } else {
      queryMap.set(q, { count: 1, lastSeen: log.created_at ?? '', filters: log.filters })
    }
  }

  const topZeroResults = [...queryMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([queryText, data]) => ({
      query: queryText,
      count: data.count,
      lastSeen: data.lastSeen,
      filters: data.filters,
    }))

  // 4. Daily trend (searches per day)
  const dailyMap = new Map<string, { total: number; zeroResults: number }>()
  for (const log of zeroResultLogs ?? []) {
    const day = (log.created_at ?? '').slice(0, 10)
    const existing = dailyMap.get(day)
    if (existing) {
      existing.zeroResults++
    } else {
      dailyMap.set(day, { total: 0, zeroResults: 1 })
    }
  }

  const dailyTrend = [...dailyMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => ({ date, ...data }))

  return {
    period: { days, since },
    summary: {
      totalSearches: totalSearches ?? 0,
      zeroResultSearches: zeroResultCount ?? 0,
      zeroResultRate: totalSearches
        ? Math.round(((zeroResultCount ?? 0) / totalSearches) * 100)
        : 0,
    },
    topZeroResults,
    dailyTrend,
  }
})
