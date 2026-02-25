/**
 * Billing Service
 * Shared logic for Stripe checkout, webhook, and subscription management.
 *
 * Centralizes Supabase REST helpers and subscription lookup logic
 * used across checkout.post.ts, webhook.post.ts, and portal.post.ts.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SubscriptionUserInfo {
  userId: string
  email: string
  name: string
  plan: string
}

export interface SupabaseRestConfig {
  url: string
  serviceRoleKey: string
}

/* ------------------------------------------------------------------ */
/*  Supabase REST helpers                                              */
/* ------------------------------------------------------------------ */

export async function supabaseRestPatch(
  config: SupabaseRestConfig,
  table: string,
  filter: string,
  data: Record<string, unknown>,
): Promise<void> {
  await fetch(`${config.url}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(data),
  })
}

export async function supabaseRestInsert(
  config: SupabaseRestConfig,
  table: string,
  data: Record<string, unknown>,
): Promise<void> {
  await fetch(`${config.url}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(data),
  })
}

export async function supabaseRestGet<T>(
  config: SupabaseRestConfig,
  table: string,
  filter: string,
  select: string = '*',
): Promise<T[]> {
  const res = await fetch(`${config.url}/rest/v1/${table}?${filter}&select=${select}`, {
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
    },
  })
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

/* ------------------------------------------------------------------ */
/*  Subscription user lookup                                           */
/* ------------------------------------------------------------------ */

export async function getSubscriptionUserInfo(
  config: SupabaseRestConfig,
  stripeSubId: string,
): Promise<SubscriptionUserInfo | null> {
  const subData = await supabaseRestGet<{ user_id: string; plan: string }>(
    config,
    'subscriptions',
    `stripe_subscription_id=eq.${stripeSubId}`,
    'user_id,plan',
  )

  const userId = subData[0]?.user_id
  const plan = subData[0]?.plan || 'basic'
  if (!userId) return null

  const userData = await supabaseRestGet<{
    email: string
    raw_user_meta_data: { display_name?: string; full_name?: string } | null
  }>(config, 'users', `id=eq.${userId}`, 'email,raw_user_meta_data')

  const email = userData[0]?.email
  if (!email) return null

  const meta = userData[0]?.raw_user_meta_data
  const name = meta?.display_name || meta?.full_name || email.split('@')[0] || ''
  return { userId, email, name, plan }
}

/* ------------------------------------------------------------------ */
/*  Dunning email helper                                               */
/* ------------------------------------------------------------------ */

export async function sendDunningEmail(
  baseUrl: string,
  internalSecret: string | undefined,
  templateKey: string,
  to: string,
  userId: string,
  variables: Record<string, string>,
): Promise<void> {
  if (!internalSecret) return

  await fetch(`${baseUrl}/api/email/send`, {
    method: 'POST',
    headers: {
      'x-internal-secret': internalSecret,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ templateKey, to, userId, variables }),
  }).catch(() => {
    // Best-effort: dunning email should not block webhook processing
  })
}

/* ------------------------------------------------------------------ */
/*  Invoice creation helper                                            */
/* ------------------------------------------------------------------ */

export async function createAutoInvoice(
  config: SupabaseRestConfig,
  params: {
    userId: string
    stripeInvoiceId: string | null
    amountCents: number
    serviceType?: string
  },
): Promise<void> {
  // Find dealer_id from users table
  const dealerData = await supabaseRestGet<{ id: string }>(
    config,
    'dealers',
    `user_id=eq.${params.userId}`,
    'id',
  )
  const dealerId = dealerData[0]?.id || null

  await supabaseRestInsert(config, 'invoices', {
    user_id: params.userId,
    dealer_id: dealerId,
    stripe_invoice_id: params.stripeInvoiceId,
    service_type: params.serviceType || 'subscription',
    amount_cents: params.amountCents,
    tax_cents: Math.round((params.amountCents * 21) / 121),
    currency: 'eur',
    status: 'paid',
  })
}
