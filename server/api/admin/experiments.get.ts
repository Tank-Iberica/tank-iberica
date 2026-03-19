/**
 * GET /api/admin/experiments
 *
 * List all experiments with optional status filter.
 * Admin-only endpoint.
 *
 * Query params:
 * - status: 'draft' | 'active' | 'paused' | 'completed' (optional)
 * - page: number (default 1)
 * - limit: number (default 20, max 100)
 */
import { defineEventHandler, getQuery, createError } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireRole } from '../../utils/rbac'

export default defineEventHandler(async (event) => {
  await requireRole(event, 'admin')

  const query = getQuery(event)
  const status = query.status as string | undefined
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const offset = (page - 1) * limit

  const validStatuses = ['draft', 'active', 'paused', 'completed']
  if (status && !validStatuses.includes(status)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid status. Valid: ${validStatuses.join(', ')}`,
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = serverSupabaseServiceRole(event) as any

  let queryBuilder = client
    .from('experiments')
    .select(
      'id, key, name, description, status, variants, target_sample_size, created_at, updated_at, ended_at',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) {
    queryBuilder = queryBuilder.eq('status', status)
  }

  const { data, count, error } = await queryBuilder

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch experiments: ${error.message}`,
    })
  }

  // Get participant counts per experiment
  const experimentIds = (data || []).map((e: Record<string, unknown>) => e.id as string)
  let participantCounts: Record<string, number> = {}

  if (experimentIds.length > 0) {
    const { data: assignments } = await client
      .from('experiment_assignments')
      .select('experiment_id')
      .in('experiment_id', experimentIds)

    participantCounts = (assignments || []).reduce(
      (acc: Record<string, number>, a: Record<string, unknown>) => {
        const expId = a.experiment_id as string
        acc[expId] = (acc[expId] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
  }

  return {
    experiments: (data || []).map((exp: Record<string, unknown>) => ({
      ...exp,
      participant_count: participantCounts[exp.id as string] || 0,
    })),
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
    },
  }
})
