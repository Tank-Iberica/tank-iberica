/**
 * POST /api/saved-searches
 *
 * Creates a saved search. Gating: 1 free per user, unlimited if feature unlocked.
 * Returns 402 if limit reached and not unlocked.
 *
 * Body: { name, filters, searchQuery?, locationLevel? }
 */
import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { verifyCsrf } from '../../utils/verifyCsrf'
import { safeError } from '../../utils/safeError'
import { validateBody } from '../../utils/validateBody'

const schema = z.object({
  name: z.string().min(1).max(100),
  filters: z.record(z.unknown()),
  searchQuery: z.string().max(500).optional(),
  locationLevel: z.string().max(50).optional(),
})

export default defineEventHandler(async (event) => {
  verifyCsrf(event)
  const user = await serverSupabaseUser(event)
  if (!user) throw safeError(401, 'Authentication required')

  const body = await validateBody(event, schema)
  const supabase = serverSupabaseServiceRole(event)

  // Check if feature is unlocked
  const { data: unlock } = await supabase
    .from('feature_unlocks')
    .select('id')
    .eq('user_id', user.id)
    .eq('feature', 'saved_searches')
    .maybeSingle()

  if (!unlock) {
    // Count existing searches
    const { count } = await supabase
      .from('saved_searches')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if ((count ?? 0) >= 1) {
      return { error: 'limit_reached', canUnlock: true }
    }
  }

  const { data, error } = await supabase
    .from('saved_searches')
    .insert({
      user_id: user.id,
      name: body.name,
      filters: body.filters,
      search_query: body.searchQuery ?? null,
      location_level: body.locationLevel ?? null,
      last_used_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw safeError(500, `DB error: ${error.message}`)

  return { search: data }
})
