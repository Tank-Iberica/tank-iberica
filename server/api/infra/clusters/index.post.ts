/**
 * POST /api/infra/clusters
 *
 * Create a new infrastructure cluster.
 * Admin-only endpoint.
 *
 * Body: { name, supabase_url, supabase_anon_key?, supabase_service_role_key?, weight_limit? }
 */
import { defineEventHandler } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import { safeError } from '../../../utils/safeError'
import { validateBody } from '../../../utils/validateBody'

const createClusterSchema = z.object({
  name: z.string().min(1).max(128),
  supabase_url: z.string().url().max(512),
  supabase_anon_key: z.string().max(512).optional(),
  supabase_service_role_key: z.string().max(512).optional(),
  weight_limit: z.number().positive().optional(),
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

  // ── Validate body ──────────────────────────────────────────────────────
  const body = await validateBody(event, createClusterSchema)

  // ── Insert cluster ─────────────────────────────────────────────────────
  const { data, error } = await supabase
    .from('infra_clusters')
    .insert({
      name: body.name.trim(),
      supabase_url: body.supabase_url.trim(),
      supabase_anon_key: body.supabase_anon_key?.trim() ?? null,
      supabase_service_role_key: body.supabase_service_role_key?.trim() ?? null,
      weight_limit: body.weight_limit ?? 1,
      weight_used: 0,
      verticals: [],
      status: 'active',
      metadata: {},
    } as never)
    .select('*')
    .single()

  if (error) {
    throw safeError(500, `Failed to create cluster: ${error.message}`)
  }

  return data
})
