/**
 * GET /api/admin/crm-pipeline
 *
 * List CRM pipeline items with optional filters.
 * Admin-only endpoint.
 *
 * Query params:
 *  - stage?: crm_pipeline_stage
 *  - page?: number (default 1)
 *  - limit?: number (default 50, max 100)
 */
import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { safeError } from '../../utils/safeError'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw safeError(401, 'Unauthorized')

  const supabase = serverSupabaseServiceRole(event)

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

  if (userData?.role !== 'admin') throw safeError(403, 'Forbidden')

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 50))
  const offset = (page - 1) * limit

  let q = supabase
    .from('crm_pipeline')
    .select(
      'id, dealer_id, stage, notes, next_action_date, next_action_desc, assigned_to, entered_stage_at, created_at, updated_at',
      { count: 'exact' },
    )

  if (query.stage) {
    q = q.eq('stage', query.stage as string)
  }

  const {
    data,
    error: err,
    count,
  } = await q.order('updated_at', { ascending: false }).range(offset, offset + limit - 1)

  if (err) throw safeError(500, err.message)

  return {
    items: data ?? [],
    total: count ?? 0,
    page,
    limit,
  }
})
