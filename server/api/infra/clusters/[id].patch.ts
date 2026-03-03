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
const VALID_STATUSES = ['active', 'migrating', 'maintenance', 'offline']

interface FieldRule {
  key: keyof UpdateClusterBody
  check: (v: unknown) => string | null
  transform?: (v: unknown) => unknown
}

const trimStr = (v: unknown) => (v as string).trim()

const CLUSTER_FIELD_RULES: FieldRule[] = [
  {
    key: 'name',
    check: (v) =>
      typeof v !== 'string' || !(v as string).trim() ? 'name must be a non-empty string' : null,
    transform: trimStr,
  },
  {
    key: 'supabase_url',
    check: (v) =>
      typeof v !== 'string' || !(v as string).trim()
        ? 'supabase_url must be a non-empty string'
        : null,
    transform: trimStr,
  },
  {
    key: 'supabase_anon_key',
    check: (v) => (typeof v !== 'string' ? 'supabase_anon_key must be a string' : null),
    transform: trimStr,
  },
  {
    key: 'supabase_service_role_key',
    check: (v) => (typeof v !== 'string' ? 'supabase_service_role_key must be a string' : null),
    transform: trimStr,
  },
  {
    key: 'verticals',
    check: (v) =>
      !Array.isArray(v) || !(v as unknown[]).every((x) => typeof x === 'string')
        ? 'verticals must be an array of strings'
        : null,
  },
  {
    key: 'weight_used',
    check: (v) =>
      typeof v !== 'number' || (v as number) < 0
        ? 'weight_used must be a non-negative number'
        : null,
  },
  {
    key: 'weight_limit',
    check: (v) =>
      typeof v !== 'number' || (v as number) <= 0 ? 'weight_limit must be a positive number' : null,
  },
  {
    key: 'status',
    check: (v) =>
      typeof v !== 'string' || !VALID_STATUSES.includes(v as string)
        ? `status must be one of: ${VALID_STATUSES.join(', ')}`
        : null,
  },
  {
    key: 'metadata',
    check: (v) =>
      typeof v !== 'object' || Array.isArray(v) || v === null ? 'metadata must be an object' : null,
  },
]

function validateClusterBody(body: UpdateClusterBody): {
  errors: string[]
  updateFields: Record<string, unknown>
} {
  const errors: string[] = []
  const updateFields: Record<string, unknown> = {}
  for (const rule of CLUSTER_FIELD_RULES) {
    const val = body[rule.key]
    if (val === undefined) continue
    const error = rule.check(val)
    if (error) errors.push(error)
    else updateFields[rule.key] = rule.transform ? rule.transform(val) : val
  }
  return { errors, updateFields }
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

  // ── Validate params ────────────────────────────────────────────────────
  const clusterId = getRouterParam(event, 'id')
  if (!clusterId || !UUID_REGEX.test(clusterId)) {
    throw createError({ statusCode: 400, message: 'Invalid cluster ID' })
  }

  // ── Validate body ──────────────────────────────────────────────────────
  const body = await readBody<UpdateClusterBody>(event)
  const { errors, updateFields } = validateClusterBody(body)

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
