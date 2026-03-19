/**
 * GET /api/admin/subscriptions
 *
 * Admin endpoint to list all active/cancelled subscriptions.
 * Reads from dealers table (subscription_tier, subscription_status fields).
 *
 * Query params:
 *   - status: filter by subscription_status ('active', 'cancelled', 'past_due', 'all')
 *   - page: pagination (default 1)
 *   - limit: items per page (default 20, max 100)
 *
 * #274 — Admin panel suscripciones
 */
import { getQuery } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireRole } from '../../utils/rbac'
import { safeError } from '../../utils/safeError'

const VALID_STATUSES = ['active', 'cancelled', 'past_due', 'trialing', 'all'] as const

export default defineEventHandler(async (event) => {
  await requireRole(event, 'admin')

  const query = getQuery(event)
  const status =
    typeof query.status === 'string' && VALID_STATUSES.includes(query.status as never)
      ? query.status
      : 'all'
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const offset = (page - 1) * limit

  const supabase = serverSupabaseServiceRole(event)

  try {
    let dbQuery = supabase
      .from('dealers')
      .select(
        'id, business_name, email, subscription_tier, subscription_status, stripe_customer_id, created_at, updated_at',
        { count: 'exact' },
      )
      .not('subscription_tier', 'is', null)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status !== 'all') {
      dbQuery = dbQuery.eq('subscription_status', status)
    }

    const { data, count, error } = await dbQuery

    if (error) throw safeError(500, `Query failed: ${error.message}`)

    // Summary counts
    const { data: summaryData } = await supabase
      .from('dealers')
      .select('subscription_status')
      .not('subscription_tier', 'is', null)

    const summary: Record<string, number> = {}
    for (const row of (summaryData ?? []) as Array<{ subscription_status: string | null }>) {
      const s = row.subscription_status || 'unknown'
      summary[s] = (summary[s] || 0) + 1
    }

    return {
      subscriptions: data ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
      summary,
      filter: status,
    }
  } catch (err) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw safeError(
      500,
      `Failed to list subscriptions: ${err instanceof Error ? err.message : String(err)}`,
    )
  }
})
