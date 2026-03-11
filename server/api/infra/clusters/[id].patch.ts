/**
 * PATCH /api/infra/clusters/:id
 *
 * Update an existing infrastructure cluster.
 * Admin-only endpoint.
 *
 * Body can include: name, supabase_url, supabase_anon_key, supabase_service_role_key,
 *                   verticals, weight_used, weight_limit, status, metadata
 */
import { defineEventHandler, getRouterParam } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import { safeError } from '../../../utils/safeError'
import { validateBody } from '../../../utils/validateBody'

const updateClusterSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  supabase_url: z.string().url().max(512).optional(),
  supabase_anon_key: z.string().max(512).optional(),
  supabase_service_role_key: z.string().max(512).optional(),
  verticals: z.array(z.string()).optional(),
  weight_used: z.number().nonnegative().optional(),
  weight_limit: z.number().positive().optional(),
  status: z.enum(['active', 'migrating', 'maintenance', 'offline']).optional(),
  metadata: z.record(z.unknown()).optional(),
})

export default defineEventHandler(async (event) => {
  // ── Auth: admin only ────────────────────────────────────────────────────
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw safeError(401, 'Unauthorized')
  }

  const supabase = serverSupabaseServiceRole(event)

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

  if (userData?.role !== 'admin') {
    throw safeError(403, 'Forbidden')
  }

  // ── Validate params ────────────────────────────────────────────────────
  const clusterId = getRouterParam(event, 'id')
  if (!clusterId || !/^[0-9a-f-]{36}$/i.test(clusterId)) {
    throw safeError(400, 'Invalid cluster ID')
  }

  // ── Validate body ──────────────────────────────────────────────────────
  const body = await validateBody(event, updateClusterSchema)

  const updateFields = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined))

  if (Object.keys(updateFields).length === 0) {
    throw safeError(400, 'No valid fields provided for update')
  }

  // ── Update cluster ─────────────────────────────────────────────────────
  const { data, error } = await supabase
    .from('infra_clusters')
    .update(updateFields as never)
    .eq('id', clusterId)
    .select('*')
    .single()

  if (error) {
    throw safeError(500, `Failed to update cluster: ${error.message}`)
  }

  if (!data) {
    throw safeError(404, 'Cluster not found')
  }

  return data
})
