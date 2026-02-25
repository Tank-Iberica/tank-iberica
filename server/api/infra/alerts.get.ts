/**
 * GET /api/infra/alerts
 *
 * Admin-only endpoint to query infrastructure alerts.
 * Query params:
 *   - all: 'true' to include acknowledged alerts (history), default only unacknowledged
 *
 * Returns alerts sorted by sent_at DESC.
 */
import { defineEventHandler, createError, getQuery } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

// ── Types ──────────────────────────────────────────────────────────────────────

interface AlertsQuery {
  all?: string
}

interface UserRow {
  role: string | null
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
  const query = getQuery(event) as AlertsQuery
  const showAll = query.all === 'true'

  // ── Build query ───────────────────────────────────────────────────────────
  let dbQuery = supabase
    .from('infra_alerts')
    .select(
      'id, component, metric_name, alert_level, message, usage_percent, sent_at, acknowledged_at, acknowledged_by',
    )
    .order('sent_at', { ascending: false })
    .limit(200)

  if (!showAll) {
    dbQuery = dbQuery.is('acknowledged_at', null)
  }

  const { data: alerts, error } = await dbQuery

  if (error) {
    throw safeError(500, `Failed to fetch alerts: ${error.message}`)
  }

  return {
    alerts: alerts ?? [],
    showAll,
    count: alerts?.length ?? 0,
  }
})
