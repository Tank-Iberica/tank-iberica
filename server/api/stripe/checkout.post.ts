import { createError, defineEventHandler, readBody } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { isAllowedUrl } from '../../utils/isAllowedUrl'
import { verifyCsrf } from '../../utils/verifyCsrf'

interface CheckoutBody {
  plan: 'basic' | 'premium'
  interval: 'month' | 'year'
  successUrl: string
  cancelUrl: string
}

const PRICES: Record<string, Record<string, number>> = {
  basic: { month: 2900, year: 29000 },
  premium: { month: 7900, year: 79000 },
}

const PLAN_NAMES: Record<string, string> = {
  basic: 'Tracciona Basic',
  premium: 'Tracciona Premium',
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CheckoutBody>(event)

  // CSRF + Auth check
  verifyCsrf(event)
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  const { plan, interval, successUrl, cancelUrl } = body

  if (!plan || !interval || !successUrl || !cancelUrl) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields: plan, interval, successUrl, cancelUrl',
    })
  }

  if (!isAllowedUrl(successUrl)) {
    throw createError({ statusCode: 400, message: 'Invalid successUrl' })
  }
  if (!isAllowedUrl(cancelUrl)) {
    throw createError({ statusCode: 400, message: 'Invalid cancelUrl' })
  }

  if (!['basic', 'premium'].includes(plan)) {
    throw createError({ statusCode: 400, message: 'Invalid plan. Must be basic or premium' })
  }

  if (!['month', 'year'].includes(interval)) {
    throw createError({ statusCode: 400, message: 'Invalid interval. Must be month or year' })
  }

  const config = useRuntimeConfig()

  // Import Stripe (handle missing key gracefully)
  const stripeKey = config.stripeSecretKey || process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return {
      url: '/precios?mock=true',
      sessionId: `mock_session_${Date.now()}`,
      message: 'Stripe not configured — mock checkout created',
    }
  }

  // Dynamic import to avoid build errors if stripe is not installed
  const { default: Stripe } = await import('stripe')
  const stripe = new Stripe(stripeKey)

  // Supabase REST API config
  const supabaseUrl = config.public?.supabaseUrl || process.env.SUPABASE_URL
  const supabaseKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw createError({ statusCode: 500, message: 'Supabase not configured' })
  }

  // Check if user already has a stripe_customer_id in subscriptions table
  const subRes = await fetch(
    `${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${user.id}&select=stripe_customer_id`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    },
  )
  const subData = await subRes.json()
  const existingCustomerId = subData?.[0]?.stripe_customer_id || null

  // Determine price
  const unitAmount = PRICES[plan][interval]

  // Create Stripe Checkout Session
  const sessionParams: Record<string, unknown> = {
    mode: 'subscription',
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: PLAN_NAMES[plan],
          },
          unit_amount: unitAmount,
          recurring: {
            interval,
          },
        },
        quantity: 1,
      },
    ],
    success_url: successUrl.replace('{CHECKOUT_SESSION_ID}', '{CHECKOUT_SESSION_ID}'),
    cancel_url: cancelUrl,
    metadata: {
      user_id: user.id,
      plan,
      vertical: process.env.NUXT_PUBLIC_VERTICAL || 'tracciona',
    },
  }

  if (existingCustomerId) {
    sessionParams.customer = existingCustomerId
  }

  const session = await stripe.checkout.sessions.create(
    sessionParams as Parameters<typeof stripe.checkout.sessions.create>[0],
  )

  // Insert pending payment record into payments table
  await fetch(`${supabaseUrl}/rest/v1/payments`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      user_id: user.id,
      type: 'subscription',
      status: 'pending',
      amount_cents: unitAmount,
      currency: 'eur',
      stripe_checkout_session_id: session.id,
      metadata: { plan, interval, vertical: process.env.NUXT_PUBLIC_VERTICAL || 'tracciona' },
    }),
  })

  return { url: session.url ?? '', sessionId: session.id }
})
