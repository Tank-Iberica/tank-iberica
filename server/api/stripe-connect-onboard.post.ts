import { createError, defineEventHandler, readBody } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { isAllowedUrl } from '../utils/isAllowedUrl'
import { verifyCsrf } from '../utils/verifyCsrf'

interface ConnectOnboardBody {
  dealerId: string
  returnUrl: string
  refreshUrl: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ConnectOnboardBody>(event)
  const { dealerId, returnUrl, refreshUrl } = body

  // CSRF + Auth check
  verifyCsrf(event)
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  if (!dealerId || !returnUrl || !refreshUrl) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields: dealerId, returnUrl, refreshUrl',
    })
  }

  const config = useRuntimeConfig()

  // Import Stripe (handle missing key gracefully)
  const stripeKey = config.stripeSecretKey || process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
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
  const supabaseUrl = config.public?.supabaseUrl || process.env.SUPABASE_URL
  const supabaseKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw createError({ statusCode: 500, message: 'Service not configured' })
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
    throw createError({ statusCode: 403, message: 'Forbidden: dealer does not belong to user' })
  }

  if (!isAllowedUrl(returnUrl)) {
    throw createError({ statusCode: 400, message: 'Invalid returnUrl' })
  }
  if (!isAllowedUrl(refreshUrl)) {
    throw createError({ statusCode: 400, message: 'Invalid refreshUrl' })
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
