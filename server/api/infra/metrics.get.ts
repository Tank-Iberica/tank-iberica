/**
 * GET /api/infra/metrics
 *
 * Admin-only endpoint to query infrastructure metric snapshots.
 * Query params:
 *   - component: filter by component name (e.g. 'supabase', 'cloudinary')
 *   - period: time window — '24h' (default), '7d', '30d'
 *
 * Returns metrics sorted by recorded_at DESC.
 */
import { defineEventHandler, createError, getQuery } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

// ── Types ──────────────────────────────────────────────────────────────────────

interface MetricsQuery {
  component?: string
  period?: '24h' | '7d' | '30d'
}

interface UserRow {
  role: string | null
}

// ── Period helpers ─────────────────────────────────────────────────────────────

const PERIOD_MS: Record<string, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
}

// ── Handler ────────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  // ── Admin auth check ──────────────────────────────────────────────────────
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const supabase = serverSupabaseServiceRole(event)

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

  const typedUser = userData as unknown as UserRow | null
  if (typedUser?.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  // ── Parse query params ────────────────────────────────────────────────────
  const query = getQuery(event) as MetricsQuery
  const period = query.period && PERIOD_MS[query.period] ? query.period : '24h'
  const sinceDate = new Date(Date.now() - (PERIOD_MS[period] ?? 0)).toISOString()

  // ── Build query ───────────────────────────────────────────────────────────
  let dbQuery = supabase
    .from('infra_metrics')
    .select(
      'id, vertical, component, metric_name, metric_value, metric_limit, usage_percent, recorded_at, metadata',
    )
    .gte('recorded_at', sinceDate)
    .order('recorded_at', { ascending: false })
    .limit(500)

  if (query.component) {
    dbQuery = dbQuery.eq('component', query.component)
  }

  const { data: metrics, error } = await dbQuery

  if (error) {
    throw safeError(500, `Failed to fetch metrics: ${error.message}`)
  }

  return {
    metrics: metrics ?? [],
    period,
    component: query.component ?? 'all',
    count: metrics?.length ?? 0,
  }
})
