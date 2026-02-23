/**
 * GET /api/infra/clusters
 *
 * List all infrastructure clusters with their verticals and weight.
 * Admin-only endpoint.
 */
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

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

  // ── Fetch clusters ──────────────────────────────────────────────────────
  const { data, error } = await supabase.from('infra_clusters').select('*').order('created_at')

  if (error) {
    throw createError({
      statusCode: 500,
      message: `Failed to fetch clusters: ${error.message}`,
    })
  }

  return data ?? []
})
