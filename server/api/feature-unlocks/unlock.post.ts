/**
 * POST /api/feature-unlocks/unlock
 *
 * Spends 1 credit to permanently unlock a feature (saved_searches or alerts).
 * Body: { feature: 'saved_searches' | 'alerts' }
 */
import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { verifyCsrf } from '../../utils/verifyCsrf'
import { safeError } from '../../utils/safeError'
import { validateBody } from '../../utils/validateBody'
import { deductUserCredits } from '../../utils/creditService'
import { CREDIT_COSTS } from '../../utils/creditsConfig'

const schema = z.object({
  feature: z.enum(['saved_searches', 'alerts']),
})

export default defineEventHandler(async (event) => {
  verifyCsrf(event)
  const user = await serverSupabaseUser(event)
  if (!user) throw safeError(401, 'Authentication required')

  const body = await validateBody(event, schema)
  const supabase = serverSupabaseServiceRole(event)

  // Check if already unlocked
  const { data: existing } = await supabase
    .from('feature_unlocks')
    .select('id')
    .eq('user_id', user.id)
    .eq('feature', body.feature)
    .maybeSingle()

  if (existing) {
    return { unlocked: true, alreadyUnlocked: true }
  }

  // Determine cost
  const cost =
    body.feature === 'saved_searches'
      ? CREDIT_COSTS.UNLOCK_SAVED_SEARCHES
      : CREDIT_COSTS.UNLOCK_ALERTS

  const description =
    body.feature === 'saved_searches'
      ? 'Desbloqueo búsquedas guardadas ilimitadas'
      : 'Desbloqueo alertas ilimitadas'

  const creditResult = await deductUserCredits(user.id, cost, description)

  if (!creditResult.success) {
    if (creditResult.reason === 'insufficient') throw safeError(402, 'Insufficient credits')
    throw safeError(500, 'Credit service unavailable')
  }

  // Record unlock
  const { error } = await supabase.from('feature_unlocks').insert({
    user_id: user.id,
    feature: body.feature,
    credits_spent: cost,
  })

  if (error) throw safeError(500, `DB error: ${error.message}`)

  return {
    unlocked: true,
    creditsRemaining: creditResult.newBalance,
  }
})
