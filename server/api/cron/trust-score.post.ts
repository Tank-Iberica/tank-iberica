/**
 * POST /api/cron/trust-score
 *
 * Daily cron job that recalculates trust_score (0-100) for every active dealer.
 * Uses a 9-criterion model; updates trust_score, trust_score_breakdown,
 * and trust_score_updated_at on the dealers table.
 *
 * Protected by x-cron-secret header or body.secret field.
 * Uses a cron lock to prevent duplicate runs within the same day.
 */
import { defineEventHandler, readBody } from 'h3'
import { safeError } from '../../utils/safeError'
import { serverSupabaseServiceRole } from '#supabase/server'
import { verifyCronSecret } from '../../utils/verifyCronSecret'
import { acquireDbCronLock } from '../../utils/cronLock'
import { processBatch } from '../../utils/batchProcessor'
import { logger } from '../../utils/logger'
import { calculateTrustScore, type DealerForTrustScore } from '../../utils/trustScore'

// ── Types ─────────────────────────────────────────────────────────────────────

interface CronBody {
  secret?: string
}

interface DealerRow extends DealerForTrustScore {
  id: string
  status: string | null
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  // 1. Verify cron secret
  const body = await readBody<CronBody>(event).catch(() => ({}) as CronBody)
  verifyCronSecret(event, body?.secret)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = serverSupabaseServiceRole(event) as any

  // 2. Acquire cron lock (runs once per day)
  if (!(await acquireDbCronLock(supabase, 'trust-score'))) {
    return { skipped: true, reason: 'already_ran_in_window', timestamp: new Date().toISOString() }
  }

  const now = new Date()
  let updated = 0
  let errors = 0

  // 3. Fetch all active dealers (fields needed for trust score calculation)
  const { data: dealers, error: fetchError } = await supabase
    .from('dealers')
    .select(
      'id, status, logo_url, bio, phone, email, cif_nif, created_at, active_listings, response_rate_pct, total_reviews, rating, verified',
    )
    .eq('status', 'active')
    .limit(500)

  if (fetchError) {
    throw safeError(500, 'Failed to fetch dealers')
  }

  if (!dealers || dealers.length === 0) {
    return { updated: 0, errors: 0, total: 0, timestamp: now.toISOString() }
  }

  // 4. Calculate and update trust score for each dealer
  await processBatch({
    items: dealers as unknown as DealerRow[],
    batchSize: 50,
    processor: async (dealer: DealerRow) => {
      const { score, breakdown } = calculateTrustScore(dealer, now)

      const { error: updateError } = await supabase
        .from('dealers')
        .update({
          trust_score: score,
          trust_score_breakdown: breakdown,
          trust_score_updated_at: now.toISOString(),
        })
        .eq('id', dealer.id)

      if (updateError) {
        logger.warn('[trust-score] Failed to update dealer', {
          dealerId: dealer.id,
          error: updateError.message,
        })
        errors++
      } else {
        updated++
      }
    },
  })

  logger.info('[trust-score] Recalculation complete', {
    updated,
    errors,
    total: dealers.length,
  })

  return {
    updated,
    errors,
    total: dealers.length,
    timestamp: now.toISOString(),
  }
})
