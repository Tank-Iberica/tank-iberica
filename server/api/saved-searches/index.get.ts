/**
 * GET /api/saved-searches
 *
 * Returns all saved searches for the authenticated user.
 * Ordered: favorites first, then by last_used_at DESC.
 */
import { defineEventHandler } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { safeError } from '../../utils/safeError'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw safeError(401, 'Authentication required')

  const supabase = serverSupabaseServiceRole(event)

  const { data, error } = await supabase
    .from('saved_searches')
    .select(
      'id, name, filters, search_query, location_level, is_favorite, last_used_at, use_count, created_at, updated_at',
    )
    .eq('user_id', user.id)
    .order('is_favorite', { ascending: false })
    .order('last_used_at', { ascending: false, nullsFirst: false })

  if (error) throw safeError(500, `DB error: ${error.message}`)

  return { searches: data ?? [] }
})
