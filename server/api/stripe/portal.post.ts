import { defineEventHandler } from 'h3'
import { z } from 'zod'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { isAllowedUrl } from '../../utils/isAllowedUrl'
import { verifyCsrf } from '../../utils/verifyCsrf'
import { safeError } from '../../utils/safeError'
import { validateBody } from '../../utils/validateBody'

const portalSchema = z.object({
  customerId: z.string().startsWith('cus_', 'Stripe customer ID must start with cus_'),
  returnUrl: z.string().url(),
})

export default defineEventHandler(async (event) => {
  // CSRF + Auth check
  verifyCsrf(event)
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw safeError(401, 'Authentication required')
  }

  const { customerId, returnUrl } = await validateBody(event, portalSchema)

  // Verify the customerId belongs to this user
  const supabase = serverSupabaseServiceRole(event)
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  if (!sub) {
    throw safeError(403, 'Forbidden: customer does not belong to user')
  }

  if (!isAllowedUrl(returnUrl)) {
    throw safeError(400, 'Invalid returnUrl')
  }

  const config = useRuntimeConfig()

  // Import Stripe (handle missing key gracefully)
  const stripeKey = config.stripeSecretKey || process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return {
      url: `${returnUrl}?portal=mock`,
      message: 'Service not configured',
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
