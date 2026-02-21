import { createError, defineEventHandler, readRawBody } from 'h3'

export default defineEventHandler(async (event) => {
  const rawBody = await readRawBody(event)

  if (!rawBody) {
    throw createError({ statusCode: 400, message: 'Missing request body' })
  }

  const config = useRuntimeConfig()

  const stripeKey = config.stripeSecretKey || process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    throw createError({ statusCode: 500, message: 'Stripe not configured' })
  }

  // Dynamic import to avoid build errors if stripe is not installed
  const { default: Stripe } = await import('stripe')
  const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' })

  // Supabase REST API config
  const supabaseUrl = config.public?.supabaseUrl || process.env.SUPABASE_URL
  const supabaseKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw createError({ statusCode: 500, message: 'Supabase not configured' })
  }

  // Verify webhook signature
  const sig = event.node.req.headers['stripe-signature'] as string
  const webhookSecret = config.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET

  let stripeEvent: { type: string; data: { object: Record<string, unknown> } }

  if (webhookSecret) {
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        webhookSecret,
      ) as typeof stripeEvent
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      throw createError({
        statusCode: 400,
        message: `Webhook signature verification failed: ${message}`,
      })
    }
  } else {
    // Dev mode: process without signature verification
    console.warn(
      '[Stripe Webhook] No webhook secret configured — processing without signature verification',
    )
    stripeEvent = JSON.parse(rawBody) as typeof stripeEvent
  }

  const obj = stripeEvent.data.object

  // Helper: Supabase REST PATCH
  async function supabasePatch(table: string, filter: string, data: Record<string, unknown>) {
    await fetch(`${supabaseUrl}/rest/v1/${table}?${filter}`, {
      method: 'PATCH',
      headers: {
        apikey: supabaseKey as string,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(data),
    })
  }

  // Helper: Supabase REST POST
  async function supabaseInsert(table: string, data: Record<string, unknown>) {
    await fetch(`${supabaseUrl}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey as string,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(data),
    })
  }

  switch (stripeEvent.type) {
    case 'checkout.session.completed': {
      const session = obj as Record<string, unknown>
      const metadata = session.metadata as Record<string, string> | undefined
      const userId = metadata?.user_id
      const plan = metadata?.plan

      if (userId && plan) {
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        // Determine expires_at based on plan interval (default 1 month)
        const now = new Date()
        const expiresAt = new Date(now)
        // We check the subscription to determine interval; default to month
        expiresAt.setMonth(expiresAt.getMonth() + 1)

        // Upsert subscription via Supabase REST
        // First check if subscription exists
        const existingRes = await fetch(
          `${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${userId}&select=id`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
          },
        )
        const existingData = await existingRes.json()

        if (existingData?.length) {
          // Update existing subscription
          await supabasePatch('subscriptions', `user_id=eq.${userId}`, {
            plan,
            status: 'active',
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customerId,
            started_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
          })
        } else {
          // Insert new subscription
          await supabaseInsert('subscriptions', {
            user_id: userId,
            plan,
            status: 'active',
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customerId,
            started_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
          })
        }

        // Update payment status
        const sessionId = session.id as string
        await supabasePatch('payments', `stripe_checkout_session_id=eq.${sessionId}`, {
          status: 'succeeded',
        })

        // Auto-create invoice for the subscription payment
        const amountTotal = session.amount_total as number
        if (amountTotal) {
          // Find dealer_id from users table
          const dealerRes = await fetch(
            `${supabaseUrl}/rest/v1/dealers?user_id=eq.${userId}&select=id`,
            {
              headers: {
                apikey: supabaseKey as string,
                Authorization: `Bearer ${supabaseKey}`,
              },
            },
          )
          const dealerData = await dealerRes.json()
          const dealerId = dealerData?.[0]?.id

          await supabaseInsert('invoices', {
            user_id: userId,
            dealer_id: dealerId || null,
            stripe_invoice_id: subscriptionId,
            service_type: 'subscription',
            amount_cents: amountTotal,
            tax_cents: Math.round((amountTotal * 21) / 121),
            currency: 'eur',
            status: 'paid',
          })
        }
      }
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = obj as Record<string, unknown>
      const subscriptionId = invoice.subscription as string
      const customerId = invoice.customer as string
      const amountPaid = invoice.amount_paid as number

      if (subscriptionId) {
        // Renew subscription: update status and extend expires_at
        const newExpiry = new Date()
        newExpiry.setMonth(newExpiry.getMonth() + 1)

        await supabasePatch('subscriptions', `stripe_subscription_id=eq.${subscriptionId}`, {
          status: 'active',
          expires_at: newExpiry.toISOString(),
        })

        // Insert payment record
        await supabaseInsert('payments', {
          type: 'subscription',
          status: 'succeeded',
          amount_cents: amountPaid || 0,
          currency: 'eur',
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          metadata: { event: 'invoice.payment_succeeded' },
        })

        // Auto-create invoice for renewal payment
        if (amountPaid) {
          // Find user_id and dealer_id from subscription
          const subRes = await fetch(
            `${supabaseUrl}/rest/v1/subscriptions?stripe_subscription_id=eq.${subscriptionId}&select=user_id`,
            {
              headers: {
                apikey: supabaseKey as string,
                Authorization: `Bearer ${supabaseKey}`,
              },
            },
          )
          const subData = await subRes.json()
          const subUserId = subData?.[0]?.user_id

          if (subUserId) {
            const dealerRes = await fetch(
              `${supabaseUrl}/rest/v1/dealers?user_id=eq.${subUserId}&select=id`,
              {
                headers: {
                  apikey: supabaseKey as string,
                  Authorization: `Bearer ${supabaseKey}`,
                },
              },
            )
            const dealerData = await dealerRes.json()

            await supabaseInsert('invoices', {
              user_id: subUserId,
              dealer_id: dealerData?.[0]?.id || null,
              stripe_invoice_id: (invoice.id as string) || null,
              service_type: 'subscription',
              amount_cents: amountPaid,
              tax_cents: Math.round((amountPaid * 21) / 121),
              currency: 'eur',
              status: 'paid',
            })
          }
        }
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = obj as Record<string, unknown>
      const subscriptionId = invoice.subscription as string
      const customerId = invoice.customer as string
      const amountDue = invoice.amount_due as number

      if (subscriptionId) {
        // Mark subscription as past_due
        await supabasePatch('subscriptions', `stripe_subscription_id=eq.${subscriptionId}`, {
          status: 'past_due',
        })

        // Insert failed payment record
        await supabaseInsert('payments', {
          type: 'subscription',
          status: 'failed',
          amount_cents: amountDue || 0,
          currency: 'eur',
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          metadata: { event: 'invoice.payment_failed' },
        })
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = obj as Record<string, unknown>
      const subscriptionId = subscription.id as string

      if (subscriptionId) {
        await supabasePatch('subscriptions', `stripe_subscription_id=eq.${subscriptionId}`, {
          status: 'canceled',
          plan: 'free',
        })
      }
      break
    }
  }

  return { received: true }
})
