import { createError, defineEventHandler, readRawBody } from 'h3'
import { safeError } from '../../utils/safeError'
import {
  supabaseRestPatch,
  supabaseRestInsert,
  supabaseRestGet,
  getSubscriptionUserInfo,
  sendDunningEmail,
  createAutoInvoice,
  type SupabaseRestConfig,
} from '../../services/billing'

export default defineEventHandler(async (event) => {
  const rawBody = await readRawBody(event)

  if (!rawBody) {
    throw createError({ statusCode: 400, message: 'Missing request body' })
  }

  const config = useRuntimeConfig()

  const stripeKey = config.stripeSecretKey || process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    throw createError({ statusCode: 500, message: 'Service not configured' })
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

  const sbConfig: SupabaseRestConfig = {
    url: supabaseUrl as string,
    serviceRoleKey: supabaseKey as string,
  }

  // Verify webhook signature (fail-closed)
  const sig = event.node.req.headers['stripe-signature'] as string
  const webhookSecret = config.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET

  let stripeEvent: { type: string; data: { object: Record<string, unknown> } }

  if (!webhookSecret) {
    if (process.env.NODE_ENV === 'production') {
      throw createError({ statusCode: 500, message: 'Webhook secret not configured' })
    }
    // Dev mode: warn and parse without signature verification
    console.warn(
      '[Stripe Webhook] No webhook secret configured — dev mode, processing without verification',
    )
    stripeEvent = JSON.parse(rawBody) as unknown as typeof stripeEvent
  } else {
    if (!sig) {
      throw createError({ statusCode: 400, message: 'Missing stripe-signature header' })
    }
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        webhookSecret,
      ) as unknown as typeof stripeEvent
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      throw safeError(400, `Webhook signature verification failed: ${message}`)
    }
  }

  const obj = stripeEvent.data.object

  // Plan listing limits for vehicle pause/reactivation
  const PLAN_LIMITS: Record<string, number> = {
    free: 3,
    basic: 20,
    premium: Infinity,
    founding: Infinity,
  }
  let vehiclesPaused = 0
  let vehiclesReactivated = 0

  // Shorthand helpers bound to this request's config
  const patch = (table: string, filter: string, data: Record<string, unknown>) =>
    supabaseRestPatch(sbConfig, table, filter, data)
  const insert = (table: string, data: Record<string, unknown>) =>
    supabaseRestInsert(sbConfig, table, data)

  switch (stripeEvent.type) {
    case 'checkout.session.completed': {
      const session = obj as Record<string, unknown>
      const metadata = session.metadata as Record<string, string> | undefined
      const userId = metadata?.user_id
      const plan = metadata?.plan

      // Idempotency check: skip if this checkout was already processed
      const sessionId = session.id as string
      const existingPaymentData = await supabaseRestGet<{ id: string }>(
        sbConfig,
        'payments',
        `stripe_checkout_session_id=eq.${sessionId}&status=eq.succeeded`,
        'id',
      )
      if (existingPaymentData.length > 0) {
        return { received: true, idempotent: true, event: 'checkout.session.completed' }
      }

      const paymentType = metadata?.type

      // Branch: credit purchase (one-time)
      if (userId && paymentType === 'credits') {
        const credits = Number.parseInt(metadata?.credits ?? '0', 10)
        const packId = metadata?.pack_id ?? null

        await patch('payments', `stripe_checkout_session_id=eq.${sessionId}`, {
          status: 'succeeded',
        })

        if (credits > 0) {
          // Upsert user_credits balance
          const existingCredits = await supabaseRestGet<{
            balance: number
            total_purchased: number
          }>(sbConfig, 'user_credits', `user_id=eq.${userId}`, 'balance,total_purchased')
          const currentBalance = existingCredits[0]?.balance ?? 0
          const currentTotal = existingCredits[0]?.total_purchased ?? 0
          const newBalance = currentBalance + credits

          if (existingCredits.length > 0) {
            await patch('user_credits', `user_id=eq.${userId}`, {
              balance: newBalance,
              total_purchased: currentTotal + credits,
            })
          } else {
            await insert('user_credits', {
              user_id: userId,
              balance: newBalance,
              total_purchased: credits,
            })
          }

          // Log transaction
          await insert('credit_transactions', {
            user_id: userId,
            type: 'purchase',
            credits,
            balance_after: newBalance,
            pack_id: packId,
            reference: sessionId,
            metadata: { pack_slug: metadata?.pack_slug, vertical: metadata?.vertical },
          })

          // Auto-invoice
          const amountForCredits = session.amount_total as number
          if (amountForCredits) {
            await createAutoInvoice(sbConfig, {
              userId,
              stripeInvoiceId: sessionId,
              amountCents: amountForCredits,
            })
          }
        }
        break
      }

      if (userId && plan) {
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        // Determine expires_at based on plan interval (default 1 month)
        const now = new Date()
        const expiresAt = new Date(now)
        // We check the subscription to determine interval; default to month
        expiresAt.setMonth(expiresAt.getMonth() + 1)

        // Upsert subscription via Supabase REST
        const existingData = await supabaseRestGet<{ id: string }>(
          sbConfig,
          'subscriptions',
          `user_id=eq.${userId}`,
          'id',
        )

        if (existingData.length > 0) {
          // Update existing subscription
          await patch('subscriptions', `user_id=eq.${userId}`, {
            plan,
            status: 'active',
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customerId,
            started_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
          })
        } else {
          // Insert new subscription
          await insert('subscriptions', {
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
        await patch('payments', `stripe_checkout_session_id=eq.${sessionId}`, {
          status: 'succeeded',
        })

        // Mark trial usage if this checkout started a trial
        const paymentStatus = session.payment_status as string
        if (paymentStatus === 'no_payment_required') {
          await patch('subscriptions', `user_id=eq.${userId}`, {
            has_had_trial: true,
          }).catch(() => null) // best-effort
        }

        // Reactivate paused vehicles up to the new plan limit
        try {
          const newLimit = PLAN_LIMITS[plan] ?? 3
          const dealerData = await supabaseRestGet<{ id: string }>(
            sbConfig,
            'dealers',
            `user_id=eq.${userId}`,
            'id',
          )
          const dealerId = dealerData[0]?.id
          if (dealerId) {
            const publishedData = await supabaseRestGet<{ id: string }>(
              sbConfig,
              'vehicles',
              `dealer_id=eq.${dealerId}&status=eq.published`,
              'id',
            )
            const currentPublished = publishedData.length
            const slotsAvailable = Number.isFinite(newLimit)
              ? newLimit - currentPublished
              : Infinity

            if (slotsAvailable > 0) {
              const pausedData = await supabaseRestGet<{ id: string }>(
                sbConfig,
                'vehicles',
                `dealer_id=eq.${dealerId}&status=eq.paused&order=created_at.asc`,
                'id',
              )
              const toReactivate = Number.isFinite(slotsAvailable)
                ? pausedData.slice(0, slotsAvailable)
                : pausedData
              if (toReactivate.length > 0) {
                const ids = toReactivate.map((v) => v.id).join(',')
                await patch('vehicles', `id=in.(${ids})`, { status: 'published' })
                vehiclesReactivated = toReactivate.length
              }
            }
          }
        } catch {
          /* best-effort vehicle reactivation */
        }

        // Auto-create invoice for the subscription payment
        const amountTotal = session.amount_total as number
        if (amountTotal) {
          await createAutoInvoice(sbConfig, {
            userId,
            stripeInvoiceId: subscriptionId,
            amountCents: amountTotal,
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

      // Idempotency check: skip if this invoice was already processed
      const invoiceId = invoice.id as string
      const existingInvoiceData = await supabaseRestGet<{ id: string }>(
        sbConfig,
        'payments',
        `metadata->>event_invoice_id=eq.${invoiceId}`,
        'id',
      )
      if (existingInvoiceData.length > 0) {
        return { received: true, idempotent: true, event: 'invoice.payment_succeeded' }
      }

      if (subscriptionId) {
        // Renew subscription: update status and extend expires_at
        const newExpiry = new Date()
        newExpiry.setMonth(newExpiry.getMonth() + 1)

        await patch('subscriptions', `stripe_subscription_id=eq.${subscriptionId}`, {
          status: 'active',
          expires_at: newExpiry.toISOString(),
        })

        // Insert payment record
        await insert('payments', {
          type: 'subscription',
          status: 'succeeded',
          amount_cents: amountPaid || 0,
          currency: 'eur',
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          metadata: { event: 'invoice.payment_succeeded', event_invoice_id: invoiceId },
        })

        // Auto-create invoice for renewal payment
        if (amountPaid) {
          const subData = await supabaseRestGet<{ user_id: string }>(
            sbConfig,
            'subscriptions',
            `stripe_subscription_id=eq.${subscriptionId}`,
            'user_id',
          )
          const subUserId = subData[0]?.user_id

          if (subUserId) {
            await createAutoInvoice(sbConfig, {
              userId: subUserId,
              stripeInvoiceId: (invoice.id as string) || null,
              amountCents: amountPaid,
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

      // Idempotency: skip if already recorded this failed invoice
      const failedInvoiceId = invoice.id as string
      const existingFailedData = await supabaseRestGet<{ id: string }>(
        sbConfig,
        'payments',
        `metadata->>event_invoice_id=eq.${failedInvoiceId}&status=eq.failed`,
        'id',
      )
      if (existingFailedData.length > 0) {
        return { received: true, idempotent: true, event: 'invoice.payment_failed' }
      }

      if (subscriptionId) {
        // Mark subscription as past_due
        await patch('subscriptions', `stripe_subscription_id=eq.${subscriptionId}`, {
          status: 'past_due',
        })

        // Insert failed payment record
        await insert('payments', {
          type: 'subscription',
          status: 'failed',
          amount_cents: amountDue || 0,
          currency: 'eur',
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          metadata: { event: 'invoice.payment_failed', event_invoice_id: failedInvoiceId },
        })

        // Send dunning email based on attempt count
        const attemptCount = (invoice.attempt_count as number) || 1
        const userInfo = await getSubscriptionUserInfo(sbConfig, subscriptionId)
        if (userInfo) {
          const graceDays = attemptCount <= 1 ? 14 : attemptCount <= 2 ? 7 : 3
          const baseUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://tracciona.com'
          const internalSecret = config.cronSecret || process.env.CRON_SECRET
          await sendDunningEmail(
            baseUrl,
            internalSecret,
            'dealer_payment_failed',
            userInfo.email,
            userInfo.userId,
            {
              name: userInfo.name,
              plan: userInfo.plan,
              updateCardUrl: 'https://tracciona.com/dashboard/suscripcion',
              gracePeriodDays: String(graceDays),
            },
          )
        }
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = obj as Record<string, unknown>
      const subscriptionId = subscription.id as string

      // Idempotency: skip if subscription is already canceled
      const existingSubData = await supabaseRestGet<{ id: string }>(
        sbConfig,
        'subscriptions',
        `stripe_subscription_id=eq.${subscriptionId}&status=eq.canceled`,
        'id',
      )
      if (existingSubData.length > 0) {
        return { received: true, idempotent: true, event: 'customer.subscription.deleted' }
      }

      if (subscriptionId) {
        // Get user info BEFORE downgrading (to capture previous plan name)
        const cancelledUserInfo = await getSubscriptionUserInfo(sbConfig, subscriptionId)

        await patch('subscriptions', `stripe_subscription_id=eq.${subscriptionId}`, {
          status: 'canceled',
          plan: 'free',
        })

        // Pause vehicles exceeding free plan limit (3)
        if (cancelledUserInfo) {
          try {
            const dealerData = await supabaseRestGet<{ id: string }>(
              sbConfig,
              'dealers',
              `user_id=eq.${cancelledUserInfo.userId}`,
              'id',
            )
            const dealerId = dealerData[0]?.id
            if (dealerId) {
              const publishedData = await supabaseRestGet<{ id: string }>(
                sbConfig,
                'vehicles',
                `dealer_id=eq.${dealerId}&status=eq.published&order=created_at.asc`,
                'id',
              )
              const freeLimit = PLAN_LIMITS['free'] ?? 3
              if (publishedData.length > freeLimit) {
                const toPause = publishedData.slice(freeLimit)
                const ids = toPause.map((v) => v.id).join(',')
                await patch('vehicles', `id=in.(${ids})`, { status: 'paused' })
                vehiclesPaused = toPause.length
              }
            }
          } catch {
            /* best-effort vehicle pausing */
          }
        }

        // Send cancellation email
        if (cancelledUserInfo) {
          const baseUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://tracciona.com'
          const internalSecret = config.cronSecret || process.env.CRON_SECRET
          await sendDunningEmail(
            baseUrl,
            internalSecret,
            'dealer_subscription_cancelled',
            cancelledUserInfo.email,
            cancelledUserInfo.userId,
            {
              name: cancelledUserInfo.name,
              plan: cancelledUserInfo.plan,
              resubscribeUrl: 'https://tracciona.com/precios',
            },
          )
        }
      }
      break
    }
  }

  return { received: true, vehiclesPaused, vehiclesReactivated }
})
