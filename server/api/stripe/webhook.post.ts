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

// Plan listing limits for vehicle pause/reactivation
const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  basic: 20,
  premium: Infinity,
  founding: Infinity,
}

type PatchFn = (table: string, filter: string, data: Record<string, unknown>) => Promise<unknown>
type InsertFn = (table: string, data: Record<string, unknown>) => Promise<unknown>

// ── Credit purchase handler ────────────────────────────────────────────────

async function handleCreditPurchase(
  sbConfig: SupabaseRestConfig,
  patch: PatchFn,
  insert: InsertFn,
  session: Record<string, unknown>,
  metadata: Record<string, string>,
  userId: string,
): Promise<void> {
  const sessionId = session.id as string
  const credits = Number.parseInt(metadata.credits ?? '0', 10)
  const packId = metadata.pack_id ?? null

  await patch('payments', `stripe_checkout_session_id=eq.${sessionId}`, { status: 'succeeded' })

  if (credits <= 0) return

  const existingCredits = await supabaseRestGet<{ balance: number; total_purchased: number }>(
    sbConfig,
    'user_credits',
    `user_id=eq.${userId}`,
    'balance,total_purchased',
  )
  const currentBalance = existingCredits[0]?.balance ?? 0
  const currentTotal = existingCredits[0]?.total_purchased ?? 0
  const newBalance = currentBalance + credits

  if (existingCredits.length > 0) {
    await patch('user_credits', `user_id=eq.${userId}`, {
      balance: newBalance,
      total_purchased: currentTotal + credits,
    })
  } else {
    await insert('user_credits', { user_id: userId, balance: newBalance, total_purchased: credits })
  }

  await insert('credit_transactions', {
    user_id: userId,
    type: 'purchase',
    credits,
    balance_after: newBalance,
    pack_id: packId,
    reference: sessionId,
    metadata: { pack_slug: metadata.pack_slug, vertical: metadata.vertical },
  })

  const amountForCredits = session.amount_total as number
  if (amountForCredits) {
    await createAutoInvoice(sbConfig, {
      userId,
      stripeInvoiceId: sessionId,
      amountCents: amountForCredits,
    })
  }
}

// ── Vehicle reactivation on upgrade ────────────────────────────────────────

async function reactivateVehicles(
  sbConfig: SupabaseRestConfig,
  patch: PatchFn,
  userId: string,
  plan: string,
): Promise<number> {
  try {
    const newLimit = PLAN_LIMITS[plan] ?? 3
    const dealerData = await supabaseRestGet<{ id: string }>(
      sbConfig,
      'dealers',
      `user_id=eq.${userId}`,
      'id',
    )
    const dealerId = dealerData[0]?.id
    if (!dealerId) return 0

    const publishedData = await supabaseRestGet<{ id: string }>(
      sbConfig,
      'vehicles',
      `dealer_id=eq.${dealerId}&status=eq.published`,
      'id',
    )
    const slotsAvailable = Number.isFinite(newLimit) ? newLimit - publishedData.length : Infinity
    if (slotsAvailable <= 0) return 0

    const pausedData = await supabaseRestGet<{ id: string }>(
      sbConfig,
      'vehicles',
      `dealer_id=eq.${dealerId}&status=eq.paused&order=created_at.asc`,
      'id',
    )
    const toReactivate = Number.isFinite(slotsAvailable)
      ? pausedData.slice(0, slotsAvailable)
      : pausedData
    if (toReactivate.length === 0) return 0

    const ids = toReactivate.map((v) => v.id).join(',')
    await patch('vehicles', `id=in.(${ids})`, { status: 'published' })
    return toReactivate.length
  } catch {
    return 0
  }
}

// ── Subscription checkout handler ──────────────────────────────────────────

async function handleSubscriptionCheckout(
  sbConfig: SupabaseRestConfig,
  patch: PatchFn,
  insert: InsertFn,
  session: Record<string, unknown>,
  userId: string,
  plan: string,
): Promise<number> {
  const sessionId = session.id as string
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string
  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setMonth(expiresAt.getMonth() + 1)

  const existingData = await supabaseRestGet<{ id: string }>(
    sbConfig,
    'subscriptions',
    `user_id=eq.${userId}`,
    'id',
  )
  const subFields = {
    plan,
    status: 'active',
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: customerId,
    started_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  }

  if (existingData.length > 0) {
    await patch('subscriptions', `user_id=eq.${userId}`, subFields)
  } else {
    await insert('subscriptions', { user_id: userId, ...subFields })
  }

  await patch('payments', `stripe_checkout_session_id=eq.${sessionId}`, { status: 'succeeded' })

  if ((session.payment_status as string) === 'no_payment_required') {
    await patch('subscriptions', `user_id=eq.${userId}`, { has_had_trial: true }).catch(() => null)
  }

  const vehiclesReactivated = await reactivateVehicles(sbConfig, patch, userId, plan)

  const amountTotal = session.amount_total as number
  if (amountTotal) {
    await createAutoInvoice(sbConfig, {
      userId,
      stripeInvoiceId: subscriptionId,
      amountCents: amountTotal,
    })
  }

  return vehiclesReactivated
}

// ── Invoice payment succeeded handler ──────────────────────────────────────

async function handleInvoiceSucceeded(
  sbConfig: SupabaseRestConfig,
  patch: PatchFn,
  insert: InsertFn,
  invoice: Record<string, unknown>,
): Promise<void> {
  const subscriptionId = invoice.subscription as string
  if (!subscriptionId) return

  const newExpiry = new Date()
  newExpiry.setMonth(newExpiry.getMonth() + 1)

  await patch('subscriptions', `stripe_subscription_id=eq.${subscriptionId}`, {
    status: 'active',
    expires_at: newExpiry.toISOString(),
  })

  await insert('payments', {
    type: 'subscription',
    status: 'succeeded',
    amount_cents: (invoice.amount_paid as number) || 0,
    currency: 'eur',
    stripe_customer_id: invoice.customer as string,
    stripe_subscription_id: subscriptionId,
    metadata: { event: 'invoice.payment_succeeded', event_invoice_id: invoice.id as string },
  })

  const amountPaid = invoice.amount_paid as number
  if (amountPaid) {
    const subData = await supabaseRestGet<{ user_id: string }>(
      sbConfig,
      'subscriptions',
      `stripe_subscription_id=eq.${subscriptionId}`,
      'user_id',
    )
    if (subData[0]?.user_id) {
      await createAutoInvoice(sbConfig, {
        userId: subData[0].user_id,
        stripeInvoiceId: (invoice.id as string) || null,
        amountCents: amountPaid,
      })
    }
  }
}

// ── Invoice payment failed handler ─────────────────────────────────────────

const GRACE_DAYS_BY_ATTEMPT: [number, number][] = [
  [1, 14],
  [2, 7],
]
const DEFAULT_GRACE_DAYS = 3

function getGraceDays(attemptCount: number): number {
  return GRACE_DAYS_BY_ATTEMPT.find(([max]) => attemptCount <= max)?.[1] ?? DEFAULT_GRACE_DAYS
}

async function handleInvoiceFailed(
  sbConfig: SupabaseRestConfig,
  patch: PatchFn,
  insert: InsertFn,
  invoice: Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any,
): Promise<void> {
  const subscriptionId = invoice.subscription as string
  if (!subscriptionId) return

  await patch('subscriptions', `stripe_subscription_id=eq.${subscriptionId}`, {
    status: 'past_due',
  })

  await insert('payments', {
    type: 'subscription',
    status: 'failed',
    amount_cents: (invoice.amount_due as number) || 0,
    currency: 'eur',
    stripe_customer_id: invoice.customer as string,
    stripe_subscription_id: subscriptionId,
    metadata: { event: 'invoice.payment_failed', event_invoice_id: invoice.id as string },
  })

  const userInfo = await getSubscriptionUserInfo(sbConfig, subscriptionId)
  if (!userInfo) return

  const graceDays = getGraceDays((invoice.attempt_count as number) || 1)
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

// ── Subscription deleted handler ───────────────────────────────────────────

async function pauseExcessVehicles(
  sbConfig: SupabaseRestConfig,
  patch: PatchFn,
  userId: string,
): Promise<number> {
  try {
    const dealerData = await supabaseRestGet<{ id: string }>(
      sbConfig,
      'dealers',
      `user_id=eq.${userId}`,
      'id',
    )
    const dealerId = dealerData[0]?.id
    if (!dealerId) return 0

    const publishedData = await supabaseRestGet<{ id: string }>(
      sbConfig,
      'vehicles',
      `dealer_id=eq.${dealerId}&status=eq.published&order=created_at.asc`,
      'id',
    )
    const freeLimit = PLAN_LIMITS['free'] ?? 3
    if (publishedData.length <= freeLimit) return 0

    const toPause = publishedData.slice(freeLimit)
    const ids = toPause.map((v) => v.id).join(',')
    await patch('vehicles', `id=in.(${ids})`, { status: 'paused' })
    return toPause.length
  } catch {
    return 0
  }
}

async function handleSubscriptionDeleted(
  sbConfig: SupabaseRestConfig,
  patch: PatchFn,
  subscription: Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any,
): Promise<number> {
  const subscriptionId = subscription.id as string
  if (!subscriptionId) return 0

  const cancelledUserInfo = await getSubscriptionUserInfo(sbConfig, subscriptionId)

  await patch('subscriptions', `stripe_subscription_id=eq.${subscriptionId}`, {
    status: 'canceled',
    plan: 'free',
  })

  let vehiclesPaused = 0
  if (cancelledUserInfo) {
    vehiclesPaused = await pauseExcessVehicles(sbConfig, patch, cancelledUserInfo.userId)

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

  return vehiclesPaused
}

// ── Idempotency check ──────────────────────────────────────────────────────

interface IdempotencyRule {
  table: string
  filterFn: (obj: Record<string, unknown>) => string
  columns: string
}

const IDEMPOTENCY_RULES: Record<string, IdempotencyRule> = {
  'checkout.session.completed': {
    table: 'payments',
    filterFn: (o) => `stripe_checkout_session_id=eq.${o.id as string}&status=eq.succeeded`,
    columns: 'id',
  },
  'invoice.payment_succeeded': {
    table: 'payments',
    filterFn: (o) => `metadata->>event_invoice_id=eq.${o.id as string}`,
    columns: 'id',
  },
  'invoice.payment_failed': {
    table: 'payments',
    filterFn: (o) => `metadata->>event_invoice_id=eq.${o.id as string}&status=eq.failed`,
    columns: 'id',
  },
  'customer.subscription.deleted': {
    table: 'subscriptions',
    filterFn: (o) => `stripe_subscription_id=eq.${o.id as string}&status=eq.canceled`,
    columns: 'id',
  },
}

async function checkIdempotency(
  sbConfig: SupabaseRestConfig,
  eventType: string,
  obj: Record<string, unknown>,
): Promise<boolean> {
  const rule = IDEMPOTENCY_RULES[eventType]
  if (!rule) return false
  const existing = await supabaseRestGet<{ id: string }>(
    sbConfig,
    rule.table,
    rule.filterFn(obj),
    rule.columns,
  )
  return existing.length > 0
}

// ── Webhook verification ──────────────────────────────────────────────────

type StripeEvent = { type: string; data: { object: Record<string, unknown> } }

function verifyStripeEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stripe: any,
  rawBody: string,
  sig: string | undefined,
  webhookSecret: string | undefined,
): StripeEvent {
  if (!webhookSecret) {
    if (process.env.NODE_ENV === 'production')
      throw createError({ statusCode: 500, message: 'Webhook secret not configured' })
    console.warn(
      '[Stripe Webhook] No webhook secret configured — dev mode, processing without verification',
    )
    return JSON.parse(rawBody) as StripeEvent
  }

  if (!sig) throw createError({ statusCode: 400, message: 'Missing stripe-signature header' })

  try {
    return stripe.webhooks.constructEvent(rawBody, sig, webhookSecret) as unknown as StripeEvent
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    throw safeError(400, `Webhook signature verification failed: ${message}`)
  }
}

// ── Main handler ───────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  const rawBody = await readRawBody(event)
  if (!rawBody) throw createError({ statusCode: 400, message: 'Missing request body' })

  const config = useRuntimeConfig()
  const stripeKey = config.stripeSecretKey || process.env.STRIPE_SECRET_KEY
  if (!stripeKey) throw createError({ statusCode: 500, message: 'Service not configured' })

  const { default: Stripe } = await import('stripe')
  const stripe = new Stripe(stripeKey)

  const supabaseUrl = process.env.SUPABASE_URL || ''
  const supabaseKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!supabaseUrl || !supabaseKey)
    throw createError({ statusCode: 500, message: 'Service not configured' })

  const sbConfig: SupabaseRestConfig = { url: supabaseUrl, serviceRoleKey: supabaseKey }
  const sig = event.node.req.headers['stripe-signature'] as string
  const webhookSecret = config.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET
  const stripeEvent = verifyStripeEvent(stripe, rawBody, sig, webhookSecret)

  const obj = stripeEvent.data.object

  if (await checkIdempotency(sbConfig, stripeEvent.type, obj)) {
    return { received: true, idempotent: true, event: stripeEvent.type }
  }

  const patch: PatchFn = (table, filter, data) => supabaseRestPatch(sbConfig, table, filter, data)
  const insert: InsertFn = (table, data) => supabaseRestInsert(sbConfig, table, data)
  let vehiclesPaused = 0
  let vehiclesReactivated = 0

  const metadata = obj.metadata as Record<string, string> | undefined
  const userId = metadata?.user_id

  if (stripeEvent.type === 'checkout.session.completed' && userId && metadata?.type === 'credits') {
    await handleCreditPurchase(sbConfig, patch, insert, obj, metadata, userId)
  } else if (stripeEvent.type === 'checkout.session.completed' && userId && metadata?.plan) {
    vehiclesReactivated = await handleSubscriptionCheckout(
      sbConfig,
      patch,
      insert,
      obj,
      userId,
      metadata.plan,
    )
  } else if (stripeEvent.type === 'invoice.payment_succeeded') {
    await handleInvoiceSucceeded(sbConfig, patch, insert, obj)
  } else if (stripeEvent.type === 'invoice.payment_failed') {
    await handleInvoiceFailed(sbConfig, patch, insert, obj, config)
  } else if (stripeEvent.type === 'customer.subscription.deleted') {
    vehiclesPaused = await handleSubscriptionDeleted(sbConfig, patch, obj, config)
  }

  return { received: true, vehiclesPaused, vehiclesReactivated }
})
