/**
 * POST /api/reservations/create
 *
 * Creates a vehicle reservation with a Stripe deposit payment.
 * The deposit amount depends on the buyer's subscription tier:
 *   - Free plan: 50 EUR
 *   - Basic plan (with freebies): 25 EUR
 *   - Premium plan (with freebies): 10 EUR
 *
 * Idempotent via Idempotency-Key header (24h cache).
 * Returns a Stripe clientSecret for the frontend to confirm payment.
 */
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { safeError } from '../../utils/safeError'
import { validateBody } from '../../utils/validateBody'
import {
  getIdempotencyKey,
  checkIdempotency,
  storeIdempotencyResponse,
} from '../../utils/idempotency'

// -- Types ------------------------------------------------------------------

interface CreateReservationResponse {
  clientSecret: string | null
  reservationId: string
  depositCents: number
}

const createReservationSchema = z.object({
  vehicleId: z.string().uuid('vehicleId must be a valid UUID'),
})

// -- Handler ----------------------------------------------------------------

export default defineEventHandler(async (event): Promise<CreateReservationResponse> => {
  // ── 0. Idempotency check ──────────────────────────────────────────────────
  const idempotencyKey = getIdempotencyKey(event.node.req.headers as Record<string, string>)
  const supabase = serverSupabaseServiceRole(event)

  if (idempotencyKey) {
    const cached = await checkIdempotency(supabase, idempotencyKey)
    if (cached) {
      return cached as CreateReservationResponse
    }
  }

  // ── 1. Auth check ─────────────────────────────────────────────────────────
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw safeError(401, 'Authentication required')
  }

  // ── 2. Read and validate body ─────────────────────────────────────────────
  const { vehicleId } = await validateBody(event, createReservationSchema)

  // ── 3. Get Supabase service role client ───────────────────────────────────
  // (already initialized above for idempotency check)

  // ── 4. Fetch vehicle and determine seller ─────────────────────────────────
  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('id, dealer_id, status, dealers(user_id)')
    .eq('id', vehicleId)
    .single()

  if (vehicleError || !vehicle) {
    throw safeError(404, 'Vehicle not found')
  }

  if (vehicle.status !== 'published') {
    throw safeError(409, 'Vehicle is not available for reservation')
  }

  // Extract seller user ID from the dealer join
  const dealerData = vehicle.dealers as unknown as { user_id: string } | null
  const sellerId = dealerData?.user_id
  if (!sellerId) {
    throw safeError(422, 'Vehicle has no associated seller')
  }

  // Buyer cannot reserve their own vehicle
  if (sellerId === user.id) {
    throw safeError(409, 'You cannot reserve your own vehicle')
  }

  // ── 5. Check no active reservation exists for this vehicle + buyer ────────
  const { data: existingReservation } = await supabase
    .from('reservations')
    .select('id')
    .eq('vehicle_id', vehicleId)
    .eq('buyer_id', user.id)
    .in('status', ['pending', 'active', 'seller_responded'])
    .maybeSingle()

  if (existingReservation) {
    throw safeError(409, 'An active reservation already exists for this vehicle')
  }

  // ── 6. Determine deposit based on subscription tier ───────────────────────
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  let depositCents = 5000 // Default: 50 EUR
  const isFreebie = false
  const plan = sub?.plan || 'free'

  if (plan === 'premium') {
    depositCents = 1000 // 10 EUR discounted
  } else if (plan === 'basic') {
    depositCents = 2500 // 25 EUR discounted
  }

  // ── 7. Create Stripe PaymentIntent ────────────────────────────────────────
  const config = useRuntimeConfig()
  const stripeKey = config.stripeSecretKey || process.env.STRIPE_SECRET_KEY

  if (!stripeKey) {
    if (process.env.NODE_ENV === 'production') {
      throw safeError(503, 'Payment service unavailable')
    }
    // Dev/mock fallback when Stripe is not configured
    const mockId = `res_mock_${Date.now()}`
    await supabase.from('reservations').insert({
      vehicle_id: vehicleId,
      buyer_id: user.id,
      seller_id: sellerId,
      deposit_cents: depositCents,
      stripe_payment_intent_id: `pi_mock_${Date.now()}`,
      status: 'pending',
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      subscription_freebie: isFreebie,
    })

    return {
      clientSecret: `pi_mock_${Date.now()}_secret_mock`,
      reservationId: mockId,
      depositCents,
    }
  }

  const { default: Stripe } = await import('stripe')
  const stripe = new Stripe(stripeKey)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: depositCents,
    currency: 'eur',
    metadata: {
      type: 'vehicle_reservation',
      vehicleId,
      buyerId: user.id,
    },
  })

  // ── 8. Insert reservation row ─────────────────────────────────────────────
  const { data: reservation, error: insertError } = await supabase
    .from('reservations')
    .insert({
      vehicle_id: vehicleId,
      buyer_id: user.id,
      seller_id: sellerId,
      deposit_cents: depositCents,
      stripe_payment_intent_id: paymentIntent.id,
      status: 'pending',
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      subscription_freebie: isFreebie,
    })
    .select('id')
    .single()

  if (insertError || !reservation) {
    throw safeError(500, `Failed to create reservation: ${insertError?.message ?? 'unknown error'}`)
  }

  // ── 9. Return client secret for frontend payment confirmation ─────────────
  const response: CreateReservationResponse = {
    clientSecret: paymentIntent.client_secret,
    reservationId: reservation.id as string,
    depositCents,
  }

  // Store in idempotency cache if key provided
  if (idempotencyKey) {
    await storeIdempotencyResponse(
      supabase,
      idempotencyKey,
      'POST /api/reservations/create',
      response,
    )
  }

  return response
})
