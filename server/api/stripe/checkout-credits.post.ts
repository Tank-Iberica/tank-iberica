import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { serverSupabaseUser } from '#supabase/server'
import { isAllowedUrl } from '../../utils/isAllowedUrl'
import { verifyCsrf } from '../../utils/verifyCsrf'
import { safeError } from '../../utils/safeError'
import { validateBody } from '../../utils/validateBody'

const checkoutCreditsSchema = z.object({
  packSlug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, 'packSlug must be lowercase alphanumeric with dashes'),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
})

export default defineEventHandler(async (event) => {
  verifyCsrf(event)
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw safeError(401, 'Authentication required')
  }

  const { packSlug, successUrl, cancelUrl } = await validateBody(event, checkoutCreditsSchema)

  if (!isAllowedUrl(successUrl)) {
    throw safeError(400, 'Invalid successUrl')
  }
  if (!isAllowedUrl(cancelUrl)) {
    throw safeError(400, 'Invalid cancelUrl')
  }

  const config = useRuntimeConfig()
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const supabaseKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!supabaseUrl || !supabaseKey) {
    throw safeError(500, 'Service not configured')
  }

  // Fetch pack from DB
  const packRes = await fetch(
    `${supabaseUrl}/rest/v1/credit_packs?slug=eq.${encodeURIComponent(packSlug)}&is_active=eq.true&select=id,name_es,name_en,credits,price_cents`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    },
  )
  const packs = (await packRes.json()) as Array<{
    id: string
    name_es: string
    name_en: string
    credits: number
    price_cents: number
  }>

  if (!packs.length) {
    throw safeError(404, 'Credit pack not found or inactive')
  }

  // packs.length guaranteed by check above

  const pack = packs[0]!

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

  // Check existing Stripe customer
  const subRes = await fetch(
    `${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${user.id}&select=stripe_customer_id`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    },
  )
  const subData = (await subRes.json()) as Array<{ stripe_customer_id: string | null }>
  const existingCustomerId = subData?.[0]?.stripe_customer_id || null

  const sessionParams: Record<string, unknown> = {
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: pack.name_es,
            description: `${pack.credits} crédito${pack.credits > 1 ? 's' : ''}`,
          },
          unit_amount: pack.price_cents,
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      user_id: user.id,
      type: 'credits',
      pack_id: pack.id,
      pack_slug: packSlug,
      credits: String(pack.credits),
      vertical: process.env.NUXT_PUBLIC_VERTICAL || 'tracciona',
    },
  }

  if (existingCustomerId) {
    sessionParams.customer = existingCustomerId
  }

  const session = await stripe.checkout.sessions.create(
    sessionParams as Parameters<typeof stripe.checkout.sessions.create>[0],
  )

  // Insert pending payment record
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
      type: 'credits',
      status: 'pending',
      amount_cents: pack.price_cents,
      currency: 'eur',
      stripe_checkout_session_id: session.id,
      metadata: {
        pack_slug: packSlug,
        pack_id: pack.id,
        credits: pack.credits,
        vertical: process.env.NUXT_PUBLIC_VERTICAL || 'tracciona',
      },
    }),
  })

  return { url: session.url ?? '', sessionId: session.id }
})
