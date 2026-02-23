/**
 * POST /api/infra/clusters
 *
 * Create a new infrastructure cluster.
 * Admin-only endpoint.
 *
 * Body: { name, supabase_url, supabase_anon_key?, supabase_service_role_key?, weight_limit? }
 */
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

interface CreateClusterBody {
  name: string
  supabase_url: string
  supabase_anon_key?: string
  supabase_service_role_key?: string
  weight_limit?: number
}

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

  // ── Validate body ──────────────────────────────────────────────────────
  const body = await readBody<CreateClusterBody>(event)
  const errors: string[] = []

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.push('name is required')
  }

  if (
    !body.supabase_url ||
    typeof body.supabase_url !== 'string' ||
    body.supabase_url.trim().length === 0
  ) {
    errors.push('supabase_url is required')
  }

  if (body.supabase_anon_key !== undefined && typeof body.supabase_anon_key !== 'string') {
    errors.push('supabase_anon_key must be a string')
  }

  if (
    body.supabase_service_role_key !== undefined &&
    typeof body.supabase_service_role_key !== 'string'
  ) {
    errors.push('supabase_service_role_key must be a string')
  }

  if (body.weight_limit !== undefined) {
    if (typeof body.weight_limit !== 'number' || body.weight_limit <= 0) {
      errors.push('weight_limit must be a positive number')
    }
  }

  if (errors.length > 0) {
    throw createError({
      statusCode: 400,
      message: `Validation failed: ${errors.join('; ')}`,
    })
  }

  // ── Insert cluster ─────────────────────────────────────────────────────
  const { data, error } = await supabase
    .from('infra_clusters')
    .insert({
      name: body.name.trim(),
      supabase_url: body.supabase_url.trim(),
      supabase_anon_key: body.supabase_anon_key?.trim() ?? null,
      supabase_service_role_key: body.supabase_service_role_key?.trim() ?? null,
      weight_limit: body.weight_limit ?? 1.0,
      weight_used: 0,
      verticals: [],
      status: 'active',
      metadata: {},
    } as never)
    .select('*')
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      message: `Failed to create cluster: ${error.message}`,
    })
  }

  return data
})
