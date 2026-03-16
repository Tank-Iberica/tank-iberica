import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { serverSupabaseUser } from '#supabase/server'
import { isAllowedUrl } from '../../utils/isAllowedUrl'
import { verifyCsrf } from '../../utils/verifyCsrf'
import { safeError } from '../../utils/safeError'
import { validateBody } from '../../utils/validateBody'

// Supported tier slugs (matches subscription_tiers.slug)
const TIER_SLUGS = ['classic', 'premium'] as const
const checkoutSchema = z.object({
  plan: z.enum(TIER_SLUGS),
  interval: z.enum(['month', 'year']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
})

interface SubscriptionTier {
  id: string
  slug: string
  name_en: string
  price_cents_monthly: number
  price_cents_yearly: number
  stripe_price_id_monthly: string | null
  stripe_price_id_yearly: string | null
}

export default defineEventHandler(async (event) => {
  // CSRF + Auth check
  verifyCsrf(event)
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw safeError(401, 'Authentication required')
  }

  const { plan, interval, successUrl, cancelUrl } = await validateBody(event, checkoutSchema)

  if (!isAllowedUrl(successUrl)) {
    throw safeError(400, 'Invalid successUrl')
  }
  if (!isAllowedUrl(cancelUrl)) {
    throw safeError(400, 'Invalid cancelUrl')
  }

  const config = useRuntimeConfig()

  // Import Stripe (handle missing key gracefully)
  const stripeKey = config.stripeSecretKey || process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return {
      url: '/precios?mock=true',
      sessionId: `mock_session_${Date.now()}`,
      message: 'Service not configured',
    }
  }

  const { default: Stripe } = await import('stripe')
  const stripe = new Stripe(stripeKey)

  const supabaseUrl = process.env.SUPABASE_URL || ''
  const supabaseKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!supabaseUrl || !supabaseKey) {
    throw safeError(500, 'Service not configured')
  }

  const authHeaders = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  }

  // Fetch tier config from subscription_tiers
  const tierRes = await fetch(
    `${supabaseUrl}/rest/v1/subscription_tiers?slug=eq.${plan}&is_active=eq.true&select=id,slug,name_en,price_cents_monthly,price_cents_yearly,stripe_price_id_monthly,stripe_price_id_yearly`,
    { headers: authHeaders },
  )
  const tiers = (await tierRes.json()) as SubscriptionTier[]
  const tier = tiers[0]

  if (!tier) {
    throw safeError(400, `Unknown plan: ${plan}`)
  }

  const unitAmount = interval === 'year' ? tier.price_cents_yearly : tier.price_cents_monthly
  const stripePriceId =
    interval === 'year' ? tier.stripe_price_id_yearly : tier.stripe_price_id_monthly

  // Check existing subscription (for customer ID + trial eligibility)
  const subRes = await fetch(
    `${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${user.id}&select=id,stripe_customer_id,has_had_trial`,
    { headers: authHeaders },
  )
  const subData = await subRes.json()
  const existingCustomerId = subData?.[0]?.stripe_customer_id || null
  const hasHadTrial = !!subData?.[0]?.has_had_trial
  const isFirstSubscription = (!Array.isArray(subData) || subData.length === 0) && !hasHadTrial

  // Build line item — prefer Stripe Price ID if configured, else inline price_data
  const lineItem = stripePriceId
    ? { price: stripePriceId, quantity: 1 }
    : {
        price_data: {
          currency: 'eur',
          product_data: { name: `${getSiteName()} ${tier.name_en}` },
          unit_amount: unitAmount,
          recurring: { interval },
        },
        quantity: 1,
      }

  const sessionParams: Record<string, unknown> = {
    mode: 'subscription',
    line_items: [lineItem],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      user_id: user.id,
      plan,
      tier_id: tier.id,
      vertical: process.env.NUXT_PUBLIC_VERTICAL || 'tracciona',
    },
  }

  if (existingCustomerId) {
    sessionParams.customer = existingCustomerId
  }

  // 14-day trial for first-time subscribers
  if (isFirstSubscription) {
    sessionParams.subscription_data = {
      trial_period_days: 14,
      metadata: {
        user_id: user.id,
        plan,
        tier_id: tier.id,
        vertical: process.env.NUXT_PUBLIC_VERTICAL || 'tracciona',
      },
    }
  }

  const session = await stripe.checkout.sessions.create(
    sessionParams as Parameters<typeof stripe.checkout.sessions.create>[0],
  )

  // Insert pending payment record
  await fetch(`${supabaseUrl}/rest/v1/payments`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({
      user_id: user.id,
      type: 'subscription',
      status: 'pending',
      amount_cents: unitAmount,
      currency: 'eur',
      stripe_checkout_session_id: session.id,
      metadata: {
        plan,
        interval,
        tier_id: tier.id,
        vertical: process.env.NUXT_PUBLIC_VERTICAL || 'tracciona',
      },
    }),
  })

  return { url: session.url ?? '', sessionId: session.id }
})
