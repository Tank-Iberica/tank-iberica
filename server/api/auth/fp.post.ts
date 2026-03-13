/**
 * POST /api/auth/fp
 *
 * Records the authenticated user's device fingerprint in the DB.
 * Called client-side (fire-and-forget) after successful authentication.
 *
 * Returns 204 No Content on success.
 * Returns 401 if not authenticated.
 */
import { serverSupabaseUser } from '#supabase/server'
import { defineEventHandler, setResponseStatus } from 'h3'
import { safeError } from '~~/server/utils/safeError'
import { recordFingerprint } from '~~/server/utils/recordFingerprint'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw safeError(401, 'Authentication required')
  }

  // Record fingerprint (fire-and-forget inside recordFingerprint)
  recordFingerprint(event, user.id)

  setResponseStatus(event, 204)
})
