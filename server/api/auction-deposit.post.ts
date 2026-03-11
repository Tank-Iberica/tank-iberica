import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { safeError } from '../utils/safeError'
import { validateBody } from '../utils/validateBody'
import { getIdempotencyKey, checkIdempotency, storeIdempotencyResponse } from '../utils/idempotency'

const auctionDepositSchema = z.object({
  auctionId: z.string().uuid(),
  registrationId: z.string().uuid(),
})

export default defineEventHandler(async (event) => {
  // Idempotency check
  const idempotencyKey = getIdempotencyKey(event.node.req.headers as Record<string, string>)
  const supabase = serverSupabaseServiceRole(event)

  if (idempotencyKey) {
    const cached = await checkIdempotency(supabase, idempotencyKey)
    if (cached) {
      return cached
    }
  }

  const { auctionId, registrationId } = await validateBody(event, auctionDepositSchema)

  // Auth: verify user is logged in
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw safeError(401, 'Unauthorized')
  }

  // Get Supabase client (server-side, service role)
  const config = useRuntimeConfig()

  // Import Stripe (handle missing key gracefully)
  const stripeKey = config.stripeSecretKey || process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    // Return a mock response for development
    return {
      clientSecret: `pi_mock_${Date.now()}_secret_mock`,
      message: 'Service not configured',
    }
  }

  // Dynamic import to avoid build errors if stripe is not installed
  const { default: Stripe } = await import('stripe')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' as any })

  // Fetch auction deposit amount from Supabase
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const supabaseKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!supabaseUrl || !supabaseKey) {
    throw safeError(500, 'Service not configured')
  }

  // Verify registrationId belongs to the authenticated user
  const registrationRes = await fetch(
    `${supabaseUrl}/rest/v1/auction_registrations?id=eq.${registrationId}&user_id=eq.${user.id}&select=id`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    },
  )
  const registrationData = await registrationRes.json()
  if (!registrationData?.length) {
    throw safeError(403, 'Registration not found or does not belong to user')
  }

  // Fetch auction deposit_cents
  const auctionRes = await fetch(
    `${supabaseUrl}/rest/v1/auctions?id=eq.${auctionId}&select=deposit_cents`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    },
  )
  const auctionData = await auctionRes.json()
  if (!auctionData?.length) {
    throw safeError(404, 'Auction not found')
  }

  const depositCents = auctionData[0].deposit_cents || 100000 // Default 1000€

  // Create PaymentIntent with manual capture
  const paymentIntent = await stripe.paymentIntents.create({
    amount: depositCents,
    currency: 'eur',
    capture_method: 'manual', // KEY: holds but does NOT charge
    metadata: {
      auction_id: auctionId,
      registration_id: registrationId,
      type: 'auction_deposit',
    },
  })

  // Update registration with PaymentIntent ID
  await fetch(`${supabaseUrl}/rest/v1/auction_registrations?id=eq.${registrationId}`, {
    method: 'PATCH',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      stripe_payment_intent_id: paymentIntent.id,
      deposit_cents: depositCents,
      deposit_status: 'pending',
    }),
  })

  const response = { clientSecret: paymentIntent.client_secret }

  // Store in idempotency cache if key provided
  if (idempotencyKey) {
    await storeIdempotencyResponse(supabase, idempotencyKey, 'POST /api/auction-deposit', response)
  }

  return response
})
