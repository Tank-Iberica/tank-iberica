/**
 * Billing Service
 * Shared logic for Stripe checkout, webhook, and subscription management.
 *
 * Centralizes Supabase REST helpers and subscription lookup logic
 * used across checkout.post.ts, webhook.post.ts, and portal.post.ts.
 */

import { getVatRate, calculateTaxFromGross } from '../utils/vatRates'

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

export interface AutoInvoiceResult {
  id: string | null
  dealerId: string | null
  vatRate: number
  taxCountry: string
  pdfUrl: string | null
  quadernoConfigured: boolean
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
    description?: string
  },
): Promise<AutoInvoiceResult> {
  // Idempotency: skip if stripe_invoice_id already exists
  if (params.stripeInvoiceId) {
    const existing = await supabaseRestGet<{ id: string }>(
      config,
      'invoices',
      `stripe_invoice_id=eq.${params.stripeInvoiceId}`,
      'id',
    )
    if (existing.length) {
      return {
        id: existing[0]!.id,
        dealerId: null,
        vatRate: 0,
        taxCountry: '',
        pdfUrl: null,
        quadernoConfigured: false,
      }
    }
  }

  // Find dealer_id
  const dealerData = await supabaseRestGet<{ id: string }>(
    config,
    'dealers',
    `user_id=eq.${params.userId}`,
    'id',
  )
  const dealerId = dealerData[0]?.id || null

  // Dynamic VAT from dealer fiscal data
  let taxCountry = 'ES'
  if (dealerId) {
    const fiscalData = await supabaseRestGet<{ tax_country: string }>(
      config,
      'dealer_fiscal_data',
      `dealer_id=eq.${dealerId}`,
      'tax_country',
    )
    taxCountry = fiscalData[0]?.tax_country || 'ES'
  }
  const vatRate = getVatRate(taxCountry)
  const taxCents = calculateTaxFromGross(params.amountCents, vatRate)

  // Quaderno integration (optional)
  const quadernoApiKey = process.env.QUADERNO_API_KEY
  const quadernoApiUrl = process.env.QUADERNO_API_URL || 'https://quadernoapp.com/api'
  let pdfUrl: string | null = null
  const quadernoConfigured = !!quadernoApiKey

  if (quadernoApiKey) {
    try {
      const qRes = await fetch(`${quadernoApiUrl}/invoices`, {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${quadernoApiKey}:`).toString('base64'),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currency: 'EUR',
          items: [
            {
              description:
                params.description || `Tracciona ${params.serviceType || 'subscription'}`,
              quantity: 1,
              unit_price: (params.amountCents / 100).toFixed(2),
            },
          ],
          payment_method: 'credit_card',
          tag_list: [params.serviceType || 'subscription', 'tracciona'],
        }),
      })
      if (qRes.ok) {
        const qInvoice = await qRes.json()
        pdfUrl = qInvoice?.permalink || null
      }
    } catch {
      // Quaderno is optional — don't block invoice creation
    }
  }

  // Insert invoice with return=representation to get the ID
  const insertRes = await fetch(`${config.url}/rest/v1/invoices`, {
    method: 'POST',
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      user_id: params.userId,
      dealer_id: dealerId,
      stripe_invoice_id: params.stripeInvoiceId,
      service_type: params.serviceType || 'subscription',
      amount_cents: params.amountCents,
      tax_cents: taxCents,
      currency: 'eur',
      pdf_url: pdfUrl,
      status: 'paid',
    }),
  })
  const inserted = await insertRes.json()
  const invoiceId = inserted?.[0]?.id || null

  // Fire-and-forget: send email notification
  sendInvoiceNotification(
    config,
    params.userId,
    params.amountCents,
    params.serviceType || 'subscription',
  )

  return {
    id: invoiceId,
    dealerId,
    vatRate,
    taxCountry,
    pdfUrl,
    quadernoConfigured,
  }
}

/* ------------------------------------------------------------------ */
/*  Invoice email notification (fire-and-forget)                       */
/* ------------------------------------------------------------------ */

async function sendInvoiceNotification(
  config: SupabaseRestConfig,
  userId: string,
  amountCents: number,
  serviceType: string,
): Promise<void> {
  const baseUrl = process.env.NUXT_PUBLIC_SITE_URL || ''
  const internalSecret = process.env.CRON_SECRET
  if (!baseUrl || !internalSecret) return

  try {
    const userData = await supabaseRestGet<{
      email: string
      raw_user_meta_data: { display_name?: string; full_name?: string } | null
    }>(config, 'users', `id=eq.${userId}`, 'email,raw_user_meta_data')

    const email = userData[0]?.email
    if (!email) return

    const meta = userData[0]?.raw_user_meta_data
    const name = meta?.display_name || meta?.full_name || email.split('@')[0] || ''

    await fetch(`${baseUrl}/api/email/send`, {
      method: 'POST',
      headers: {
        'x-internal-secret': internalSecret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateKey: 'auto_invoice_created',
        to: email,
        userId,
        variables: {
          name,
          serviceType,
          amount: `${(amountCents / 100).toFixed(2)} EUR`,
        },
      }),
    })
  } catch {
    // Best-effort: notification should not block invoice processing
  }
}
