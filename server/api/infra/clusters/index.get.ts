/**
 * GET /api/infra/clusters
 *
 * List all infrastructure clusters with their verticals and weight.
 * Admin-only endpoint.
 */
import { defineEventHandler } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { safeError } from '../../../utils/safeError'

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

  // ── Fetch clusters ──────────────────────────────────────────────────────
  const { data, error } = await supabase.from('infra_clusters').select('id, name, vertical, provider, region, status, is_primary, host, port, database, max_connections, storage_gb, version, metadata, created_at, updated_at').order('created_at')

  if (error) {
    throw safeError(500, `Failed to fetch clusters: ${error.message}`)
  }

  return data ?? []
})
