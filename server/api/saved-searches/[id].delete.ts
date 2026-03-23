/**
 * DELETE /api/saved-searches/:id
 *
 * Deletes a saved search owned by the authenticated user.
 */
import { defineEventHandler, getRouterParam } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { verifyCsrf } from '../../utils/verifyCsrf'
import { safeError } from '../../utils/safeError'

export default defineEventHandler(async (event) => {
  verifyCsrf(event)
  const user = await serverSupabaseUser(event)
  if (!user) throw safeError(401, 'Authentication required')

  const id = getRouterParam(event, 'id')
  if (!id) throw safeError(400, 'Missing search ID')

  const supabase = serverSupabaseServiceRole(event)

  const { error } = await supabase
    .from('saved_searches')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw safeError(500, `DB error: ${error.message}`)

  return { deleted: true }
})
