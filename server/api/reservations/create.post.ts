/**
 * POST /api/reservations/create
 *
 * Creates a vehicle reservation with a Stripe deposit payment.
 * The deposit amount depends on the buyer's subscription tier:
 *   - Free plan: 50 EUR
 *   - Basic plan (with freebies): 25 EUR
 *   - Premium plan (with freebies): 10 EUR
 *
 * Returns a Stripe clientSecret for the frontend to confirm payment.
 */
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { defineEventHandler, readBody, createError } from 'h3'

// -- Types ------------------------------------------------------------------

interface CreateReservationBody {
  vehicleId: string
}

interface CreateReservationResponse {
  clientSecret: string | null
  reservationId: string
  depositCents: number
}

// UUID v4 format validation
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// -- Handler ----------------------------------------------------------------

export default defineEventHandler(async (event): Promise<CreateReservationResponse> => {
  // ── 1. Auth check ─────────────────────────────────────────────────────────
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  // ── 2. Read and validate body ─────────────────────────────────────────────
  const body = await readBody<CreateReservationBody>(event)
  const { vehicleId } = body

  if (!vehicleId || !UUID_RE.test(vehicleId)) {
    throw createError({ statusCode: 400, message: 'Invalid or missing vehicleId (UUID expected)' })
  }

  // ── 3. Get Supabase service role client ───────────────────────────────────
  const supabase = serverSupabaseServiceRole(event)

  // ── 4. Fetch vehicle and determine seller ─────────────────────────────────
  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('id, dealer_id, status, dealers(user_id)')
    .eq('id', vehicleId)
    .single()

  if (vehicleError || !vehicle) {
    throw createError({ statusCode: 404, message: 'Vehicle not found' })
  }

  if (vehicle.status !== 'published') {
    throw createError({ statusCode: 409, message: 'Vehicle is not available for reservation' })
  }

  // Extract seller user ID from the dealer join
  const dealerData = vehicle.dealers as unknown as { user_id: string } | null
  const sellerId = dealerData?.user_id
  if (!sellerId) {
    throw createError({ statusCode: 422, message: 'Vehicle has no associated seller' })
  }

  // Buyer cannot reserve their own vehicle
  if (sellerId === user.id) {
    throw createError({ statusCode: 409, message: 'You cannot reserve your own vehicle' })
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
    throw createError({
      statusCode: 409,
      message: 'An active reservation already exists for this vehicle',
    })
  }

  // ── 6. Determine deposit based on subscription tier ───────────────────────
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, freebies_used_this_month')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  let depositCents = 5000 // Default: 50 EUR
  let isFreebie = false
  const plan = sub?.plan || 'free'

  if (plan === 'premium' && (sub?.freebies_used_this_month || 0) < 3) {
    depositCents = 1000 // 10 EUR discounted
    isFreebie = false // Still charges but discounted
  } else if (plan === 'basic' && (sub?.freebies_used_this_month || 0) < 1) {
    depositCents = 2500 // 25 EUR discounted
  }

  // ── 7. Create Stripe PaymentIntent ────────────────────────────────────────
  const config = useRuntimeConfig()
  const stripeKey = config.stripeSecretKey || process.env.STRIPE_SECRET_KEY

  if (!stripeKey) {
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
    throw createError({
      statusCode: 500,
      message: `Failed to create reservation: ${insertError?.message ?? 'unknown error'}`,
    })
  }

  // ── 9. Return client secret for frontend payment confirmation ─────────────
  return {
    clientSecret: paymentIntent.client_secret,
    reservationId: reservation.id as string,
    depositCents,
  }
})
