/**
 * POST /api/cron/reservation-expiry
 *
 * Cron job that auto-expires reservations past their expiry date
 * and refunds the Stripe deposit when applicable.
 *
 * Processes reservations with status 'pending' or 'active' where
 * expires_at < now(). For each, attempts a Stripe refund and updates
 * the status to 'refunded' (if refund succeeded) or 'expired'.
 *
 * Protected by x-cron-secret header.
 */
import { createError, defineEventHandler, readBody } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { verifyCronSecret } from '../../utils/verifyCronSecret'

// -- Types ------------------------------------------------------------------

interface CronBody {
  secret?: string
}

interface ExpiredReservation {
  id: string
  stripe_payment_intent_id: string | null
  status: string
  deposit_cents: number
  buyer_id: string
  vehicle_id: string
}

interface ExpiryResult {
  processed: number
  refunded: number
  errors: number
  timestamp: string
}

// -- Handler ----------------------------------------------------------------

export default defineEventHandler(async (event): Promise<ExpiryResult> => {
  // ── 1. Verify cron secret ─────────────────────────────────────────────────
  const body = await readBody<CronBody>(event).catch(() => ({}) as CronBody)
  verifyCronSecret(event, body?.secret)

  // ── 2. Get Supabase service role client ───────────────────────────────────
  const supabase = serverSupabaseServiceRole(event)
  const now = new Date()

  // ── 3. Fetch expired reservations ─────────────────────────────────────────
  const { data: reservations, error: fetchError } = await supabase
    .from('reservations')
    .select('id, stripe_payment_intent_id, status, deposit_cents, buyer_id, vehicle_id')
    .in('status', ['pending', 'active'])
    .lt('expires_at', now.toISOString())
    .limit(200)

  if (fetchError) {
    throw createError({
      statusCode: 500,
      message: `Failed to fetch expired reservations: ${fetchError.message}`,
    })
  }

  if (!reservations || reservations.length === 0) {
    return { processed: 0, refunded: 0, errors: 0, timestamp: now.toISOString() }
  }

  const typedReservations = reservations as unknown as ExpiredReservation[]

  // ── 4. Set up Stripe (if configured) ──────────────────────────────────────
  const config = useRuntimeConfig()
  const stripeKey = config.stripeSecretKey || process.env.STRIPE_SECRET_KEY

  let stripe: InstanceType<typeof import('stripe').default> | null = null
  if (stripeKey) {
    const { default: Stripe } = await import('stripe')
    stripe = new Stripe(stripeKey)
  }

  let refundedCount = 0
  let errorCount = 0

  // ── 5. Process each expired reservation ───────────────────────────────────
  for (const reservation of typedReservations) {
    let newStatus = 'expired'

    // Attempt Stripe refund if a payment intent exists
    if (reservation.stripe_payment_intent_id && stripe) {
      try {
        await stripe.refunds.create({
          payment_intent: reservation.stripe_payment_intent_id,
        })
        newStatus = 'refunded'
        refundedCount++
      } catch (err: unknown) {
        // Refund may fail if the payment was never captured or already refunded.
        // In that case we still mark the reservation as expired.
        const errorMessage = err instanceof Error ? err.message : 'Unknown Stripe error'
        console.error(
          `[reservation-expiry] Refund failed for reservation ${reservation.id}: ${errorMessage}`,
        )
        errorCount++
      }
    }

    // Update reservation status
    const { error: updateError } = await supabase
      .from('reservations')
      .update({ status: newStatus })
      .eq('id', reservation.id)

    if (updateError) {
      console.error(
        `[reservation-expiry] Failed to update reservation ${reservation.id}: ${updateError.message}`,
      )
      errorCount++
    }
  }

  // ── 6. Return summary ─────────────────────────────────────────────────────
  return {
    processed: typedReservations.length,
    refunded: refundedCount,
    errors: errorCount,
    timestamp: now.toISOString(),
  }
})
