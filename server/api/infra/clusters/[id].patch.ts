/**
 * PATCH /api/infra/clusters/:id
 *
 * Update an existing infrastructure cluster.
 * Admin-only endpoint.
 *
 * Body can include: name, supabase_url, supabase_anon_key, supabase_service_role_key,
 *                   verticals, weight_used, weight_limit, status, metadata
 */
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

interface UpdateClusterBody {
  name?: string
  supabase_url?: string
  supabase_anon_key?: string
  supabase_service_role_key?: string
  verticals?: string[]
  weight_used?: number
  weight_limit?: number
  status?: string
  metadata?: Record<string, unknown>
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  // ── Auth: admin only ────────────────────────────────────────────────────
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const supabase = serverSupabaseServiceRole(event)

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

  if (userData?.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  // ── Validate params ────────────────────────────────────────────────────
  const clusterId = getRouterParam(event, 'id')
  if (!clusterId || !UUID_REGEX.test(clusterId)) {
    throw createError({ statusCode: 400, message: 'Invalid cluster ID' })
  }

  // ── Validate body ──────────────────────────────────────────────────────
  const body = await readBody<UpdateClusterBody>(event)
  const errors: string[] = []
  const updateFields: Record<string, unknown> = {}

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      errors.push('name must be a non-empty string')
    } else {
      updateFields.name = body.name.trim()
    }
  }

  if (body.supabase_url !== undefined) {
    if (typeof body.supabase_url !== 'string' || body.supabase_url.trim().length === 0) {
      errors.push('supabase_url must be a non-empty string')
    } else {
      updateFields.supabase_url = body.supabase_url.trim()
    }
  }

  if (body.supabase_anon_key !== undefined) {
    if (typeof body.supabase_anon_key !== 'string') {
      errors.push('supabase_anon_key must be a string')
    } else {
      updateFields.supabase_anon_key = body.supabase_anon_key.trim()
    }
  }

  if (body.supabase_service_role_key !== undefined) {
    if (typeof body.supabase_service_role_key !== 'string') {
      errors.push('supabase_service_role_key must be a string')
    } else {
      updateFields.supabase_service_role_key = body.supabase_service_role_key.trim()
    }
  }

  if (body.verticals !== undefined) {
    if (
      !Array.isArray(body.verticals) ||
      !body.verticals.every((v: unknown) => typeof v === 'string')
    ) {
      errors.push('verticals must be an array of strings')
    } else {
      updateFields.verticals = body.verticals
    }
  }

  if (body.weight_used !== undefined) {
    if (typeof body.weight_used !== 'number' || body.weight_used < 0) {
      errors.push('weight_used must be a non-negative number')
    } else {
      updateFields.weight_used = body.weight_used
    }
  }

  if (body.weight_limit !== undefined) {
    if (typeof body.weight_limit !== 'number' || body.weight_limit <= 0) {
      errors.push('weight_limit must be a positive number')
    } else {
      updateFields.weight_limit = body.weight_limit
    }
  }

  if (body.status !== undefined) {
    const validStatuses = ['active', 'migrating', 'maintenance', 'offline']
    if (typeof body.status !== 'string' || !validStatuses.includes(body.status)) {
      errors.push(`status must be one of: ${validStatuses.join(', ')}`)
    } else {
      updateFields.status = body.status
    }
  }

  if (body.metadata !== undefined) {
    if (
      typeof body.metadata !== 'object' ||
      Array.isArray(body.metadata) ||
      body.metadata === null
    ) {
      errors.push('metadata must be an object')
    } else {
      updateFields.metadata = body.metadata
    }
  }

  if (errors.length > 0) {
    throw createError({
      statusCode: 400,
      message: `Validation failed: ${errors.join('; ')}`,
    })
  }

  if (Object.keys(updateFields).length === 0) {
    throw createError({
      statusCode: 400,
      message: 'No valid fields provided for update',
    })
  }

  // ── Update cluster ─────────────────────────────────────────────────────
  const { data, error } = await supabase
    .from('infra_clusters')
    .update(updateFields as never)
    .eq('id', clusterId)
    .select('*')
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      message: `Failed to update cluster: ${error.message}`,
    })
  }

  if (!data) {
    throw createError({
      statusCode: 404,
      message: 'Cluster not found',
    })
  }

  return data
})
