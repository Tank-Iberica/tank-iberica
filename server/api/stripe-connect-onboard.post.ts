import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { serverSupabaseUser } from '#supabase/server'
import { isAllowedUrl } from '../utils/isAllowedUrl'
import { verifyCsrf } from '../utils/verifyCsrf'
import { safeError } from '../utils/safeError'
import { validateBody } from '../utils/validateBody'

const connectOnboardSchema = z.object({
  dealerId: z.string().uuid(),
  returnUrl: z.string().url().max(2048),
  refreshUrl: z.string().url().max(2048),
})

export default defineEventHandler(async (event) => {
  // CSRF + Auth check
  verifyCsrf(event)
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw safeError(401, 'Authentication required')
  }

  const { dealerId, returnUrl, refreshUrl } = await validateBody(event, connectOnboardSchema)

  const config = useRuntimeConfig()

  // Import Stripe (handle missing key gracefully)
  const stripeKey = config.stripeSecretKey || process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    if (process.env.NODE_ENV === 'production') {
      throw safeError(503, 'Payment service unavailable')
    }
    return {
      url: `${returnUrl}?connect=mock`,
      accountId: `acct_mock_${Date.now()}`,
      message: 'Service not configured',
    }
  }

  // Dynamic import to avoid build errors if stripe is not installed
  const { default: Stripe } = await import('stripe')
  const stripe = new Stripe(stripeKey)

  // Supabase REST API config
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const supabaseKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!supabaseUrl || !supabaseKey) {
    throw safeError(500, 'Service not configured')
  }

  // Verify dealer belongs to this user
  const dealerCheckRes = await fetch(
    `${supabaseUrl}/rest/v1/dealers?id=eq.${dealerId}&user_id=eq.${user.id}&select=id`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    },
  )
  const dealerCheckData = await dealerCheckRes.json()
  if (!Array.isArray(dealerCheckData) || dealerCheckData.length === 0) {
    throw safeError(403, 'Forbidden: dealer does not belong to user')
  }

  if (!isAllowedUrl(returnUrl)) {
    throw safeError(400, 'Invalid returnUrl')
  }
  if (!isAllowedUrl(refreshUrl)) {
    throw safeError(400, 'Invalid refreshUrl')
  }

  // Check if dealer already has a Stripe Connect account
  const existingRes = await fetch(
    `${supabaseUrl}/rest/v1/dealer_stripe_accounts?dealer_id=eq.${dealerId}&select=stripe_account_id`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    },
  )
  const existingData = await existingRes.json()
  let stripeAccountId = existingData?.[0]?.stripe_account_id || null

  if (!stripeAccountId) {
    // Create new Stripe Connect account (Express)
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'ES',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        dealer_id: dealerId,
        vertical: process.env.NUXT_PUBLIC_VERTICAL || 'tracciona',
      },
    })

    stripeAccountId = account.id

    // Insert dealer_stripe_accounts record
    await fetch(`${supabaseUrl}/rest/v1/dealer_stripe_accounts`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        dealer_id: dealerId,
        stripe_account_id: stripeAccountId,
      }),
    })
  }

  // Create account link for onboarding
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    type: 'account_onboarding',
    return_url: returnUrl,
    refresh_url: refreshUrl,
  })

  return { url: accountLink.url, accountId: stripeAccountId }
})
