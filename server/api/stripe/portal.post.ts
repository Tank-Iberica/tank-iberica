import { createError, defineEventHandler, readBody } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { isAllowedUrl } from '../../utils/isAllowedUrl'
import { verifyCsrf } from '../../utils/verifyCsrf'

interface PortalBody {
  customerId: string
  returnUrl: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<PortalBody>(event)
  const { customerId, returnUrl } = body

  // CSRF + Auth check
  verifyCsrf(event)
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  if (!customerId || !returnUrl) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields: customerId, returnUrl',
    })
  }

  // Verify the customerId belongs to this user
  const supabase = serverSupabaseServiceRole(event)
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  if (!sub) {
    throw createError({ statusCode: 403, message: 'Forbidden: customer does not belong to user' })
  }

  if (!isAllowedUrl(returnUrl)) {
    throw createError({ statusCode: 400, message: 'Invalid returnUrl' })
  }

  const config = useRuntimeConfig()

  // Import Stripe (handle missing key gracefully)
  const stripeKey = config.stripeSecretKey || process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return {
      url: `${returnUrl}?portal=mock`,
      message: 'Stripe not configured — mock portal session created',
    }
  }

  // Dynamic import to avoid build errors if stripe is not installed
  const { default: Stripe } = await import('stripe')
  const stripe = new Stripe(stripeKey)

  // Create Stripe Customer Portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return { url: session.url }
})
