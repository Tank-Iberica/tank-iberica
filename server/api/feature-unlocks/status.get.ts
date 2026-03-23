/**
 * GET /api/feature-unlocks/status?features=saved_searches,alerts
 *
 * Returns unlock status for the requested features.
 */
import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { safeError } from '../../utils/safeError'

const VALID_FEATURES = ['saved_searches', 'alerts'] as const

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw safeError(401, 'Authentication required')

  const query = getQuery(event)
  const featuresParam = typeof query.features === 'string' ? query.features : ''
  const requested = featuresParam
    .split(',')
    .map((f) => f.trim())
    .filter((f): f is (typeof VALID_FEATURES)[number] =>
      VALID_FEATURES.includes(f as (typeof VALID_FEATURES)[number]),
    )

  if (!requested.length) {
    return { unlocks: {} }
  }

  const supabase = serverSupabaseServiceRole(event)

  const { data } = await supabase
    .from('feature_unlocks')
    .select('feature')
    .eq('user_id', user.id)
    .in('feature', requested)

  const unlocks: Record<string, boolean> = {}
  for (const f of requested) {
    unlocks[f] = !!data?.some((row) => row.feature === f)
  }

  return { unlocks }
})
