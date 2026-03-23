/**
 * PATCH /api/saved-searches/:id
 *
 * Updates a saved search: name, is_favorite, or bumps last_used_at/use_count.
 */
import { defineEventHandler, getRouterParam } from 'h3'
import { z } from 'zod'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { verifyCsrf } from '../../utils/verifyCsrf'
import { safeError } from '../../utils/safeError'
import { validateBody } from '../../utils/validateBody'

const schema = z.object({
  name: z.string().min(1).max(100).optional(),
  is_favorite: z.boolean().optional(),
  bump_usage: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  verifyCsrf(event)
  const user = await serverSupabaseUser(event)
  if (!user) throw safeError(401, 'Authentication required')

  const id = getRouterParam(event, 'id')
  if (!id) throw safeError(400, 'Missing search ID')

  const body = await validateBody(event, schema)
  const supabase = serverSupabaseServiceRole(event)

  // Build update payload
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.name !== undefined) update.name = body.name
  if (body.is_favorite !== undefined) update.is_favorite = body.is_favorite
  if (body.bump_usage) {
    update.last_used_at = new Date().toISOString()
    // Increment use_count via raw SQL would be ideal, but for simplicity fetch+increment
    const { data: current } = await supabase
      .from('saved_searches')
      .select('use_count')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    update.use_count = (current?.use_count ?? 0) + 1
  }

  const { data, error } = await supabase
    .from('saved_searches')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw safeError(500, `DB error: ${error.message}`)
  if (!data) throw safeError(404, 'Search not found')

  return { search: data }
})
