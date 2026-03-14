/**
 * POST /api/credits/unlock-advanced-comparison
 *
 * Deducts 1 credit to unlock advanced comparison metrics for the current session.
 * The unlock state is stored client-side (localStorage). This endpoint only
 * handles the credit deduction and records it in credit_transactions.
 *
 * Body: { comparisonId?: string }  (stored in transaction metadata for reference)
 * Requires: auth, CSRF, ≥1 credit.
 */
import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { verifyCsrf } from '../../utils/verifyCsrf'
import { safeError } from '../../utils/safeError'
import { deductUserCredits } from '../../utils/creditService'

const ADVANCED_COMPARISON_COST = 1

export default defineEventHandler(async (event) => {
  verifyCsrf(event)
  const user = await serverSupabaseUser(event)
  if (!user) throw safeError(401, 'Authentication required')

  const body = await readBody<{ comparisonId?: string }>(event).catch(() => ({}))
  const comparisonId = typeof body?.comparisonId === 'string' ? body.comparisonId : undefined

  const creditResult = await deductUserCredits(
    user.id,
    ADVANCED_COMPARISON_COST,
    'Desbloqueo comparación avanzada',
  )

  if (!creditResult.success) {
    if (creditResult.reason === 'insufficient') throw safeError(402, 'Insufficient credits')
    throw safeError(500, 'Credit service unavailable')
  }

  return {
    unlocked: true,
    comparisonId,
    creditsRemaining: creditResult.newBalance,
  }
})
