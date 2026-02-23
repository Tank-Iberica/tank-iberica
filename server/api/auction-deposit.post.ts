import { createError, defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { auctionId, registrationId } = body

  if (!auctionId || !registrationId) {
    throw createError({ statusCode: 400, message: 'Missing auctionId or registrationId' })
  }

  // Get Supabase client (server-side, service role)
  const config = useRuntimeConfig()

  // Import Stripe (handle missing key gracefully)
  const stripeKey = config.stripeSecretKey || process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    // Return a mock response for development
    return {
      clientSecret: `pi_mock_${Date.now()}_secret_mock`,
      message: 'Stripe not configured — mock deposit created',
    }
  }

  // Dynamic import to avoid build errors if stripe is not installed
  const { default: Stripe } = await import('stripe')
  const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' })

  // Fetch auction deposit amount from Supabase
  const supabaseUrl = config.public?.supabaseUrl || process.env.SUPABASE_URL
  const supabaseKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw createError({ statusCode: 500, message: 'Supabase not configured' })
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
    throw createError({ statusCode: 404, message: 'Auction not found' })
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

  return { clientSecret: paymentIntent.client_secret }
})
