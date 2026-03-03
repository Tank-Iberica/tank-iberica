/**
 * POST /api/cron/founding-expiry
 *
 * Cron job that manages the Founding Dealer expiration lifecycle (FLUJOS-OPERATIVOS §3).
 *
 * Steps:
 *   1. 30 days before expiry → send 'founding_expiring_30d' email (once)
 *   2.  7 days before expiry → send 'founding_expiring_7d' email (once)
 *   3. On/after expiry       → downgrade to free, set founding badge permanent, pause excess vehicles
 *
 * Protected by x-cron-secret header or body.secret field.
 */
import { createError, defineEventHandler, readBody } from 'h3'
import { verifyCronSecret } from '../../utils/verifyCronSecret'
import { processBatch } from '../../utils/batchProcessor'
import { fetchWithRetry } from '../../utils/fetchWithRetry'

// ── Types ────────────────────────────────────────────────────────────────────

interface CronBody {
  secret?: string
}

interface SubscriptionRow {
  id: string
  user_id: string
  plan: string
  status: string
  expires_at: string
  vertical: string
}

interface DealerRow {
  id: string
  company_name: Record<string, string> | string
  email: string | null
  locale: string | null
  badge: string | null
}

interface EmailLogRow {
  id: string
  template_key: string
  recipient_email: string
  created_at: string
}

interface VehicleRow {
  id: string
  status: string
  created_at: string
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function resolveDealerName(companyName: Record<string, string> | string, locale: string): string {
  if (typeof companyName !== 'object' || companyName === null)
    return String(companyName ?? 'Dealer')
  return (
    companyName[locale] ?? companyName['es'] ?? Object.values(companyName).find(Boolean) ?? 'Dealer'
  )
}

async function hasAlreadySentEmail(
  supabaseUrl: string,
  headers: Record<string, string>,
  email: string,
  templateKey: string,
  sinceDate: string,
): Promise<boolean> {
  const res = await fetchWithRetry(
    `${supabaseUrl}/rest/v1/email_logs?recipient_email=eq.${encodeURIComponent(email)}&template_key=eq.${templateKey}&created_at=gt.${sinceDate}&select=id&limit=1`,
    { headers },
  )
  if (!res.ok) return false
  const logs = (await res.json()) as EmailLogRow[]
  return Array.isArray(logs) && logs.length > 0
}

async function pauseExcessVehicles(
  supabaseUrl: string,
  headers: Record<string, string>,
  dealerId: string,
  now: Date,
): Promise<number> {
  const vehiclesRes = await fetchWithRetry(
    `${supabaseUrl}/rest/v1/vehicles?dealer_id=eq.${dealerId}&status=eq.published&select=id,status,created_at&order=created_at.asc&limit=500`,
    { headers },
  )

  if (!vehiclesRes.ok) {
    console.error(
      `[founding-expiry] Failed to fetch vehicles for dealer ${dealerId}: ${vehiclesRes.status}`,
    )
    return 0
  }

  const publishedVehicles = (await vehiclesRes.json()) as VehicleRow[]
  if (!Array.isArray(publishedVehicles) || publishedVehicles.length <= 3) return 0

  let paused = 0
  for (const vehicle of publishedVehicles.slice(3)) {
    const pauseRes = await fetchWithRetry(`${supabaseUrl}/rest/v1/vehicles?id=eq.${vehicle.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'paused', updated_at: now.toISOString() }),
    })
    if (pauseRes.ok) paused++
    else
      console.error(`[founding-expiry] Failed to pause vehicle ${vehicle.id}: ${pauseRes.status}`)
  }
  return paused
}

async function downgradeSubscription(
  supabaseUrl: string,
  headers: Record<string, string>,
  subscriptionId: string,
  dealerId: string,
  now: Date,
): Promise<boolean> {
  const subUpdateRes = await fetchWithRetry(
    `${supabaseUrl}/rest/v1/subscriptions?id=eq.${subscriptionId}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ plan: 'free', status: 'expired', updated_at: now.toISOString() }),
    },
  )

  if (!subUpdateRes.ok) {
    console.error(
      `[founding-expiry] Failed to downgrade subscription ${subscriptionId}: ${subUpdateRes.status}`,
    )
    return false
  }

  const dealerUpdateRes = await fetchWithRetry(`${supabaseUrl}/rest/v1/dealers?id=eq.${dealerId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      badge: 'founding',
      subscription_type: 'free',
      updated_at: now.toISOString(),
    }),
  })

  if (!dealerUpdateRes.ok) {
    console.error(
      `[founding-expiry] Failed to update dealer ${dealerId} after expiry: ${dealerUpdateRes.status}`,
    )
  }

  return true
}

// ── Email helpers ────────────────────────────────────────────────────────────

interface ReminderContext {
  supabaseUrl: string
  headers: Record<string, string>
  recipientEmail: string
  dealerId: string
  locale: string
  dealerName: string
  expiresAtFormatted: string
  upgradeUrl: string
  internalSecret: string | undefined
  now: Date
}

async function sendReminder30d(ctx: ReminderContext, daysUntilExpiry: number): Promise<boolean> {
  if (daysUntilExpiry <= 7) return false // In 7d window, skip 30d notice
  const thirtyDaysAgo = new Date(ctx.now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const alreadySent = await hasAlreadySentEmail(
    ctx.supabaseUrl,
    ctx.headers,
    ctx.recipientEmail,
    'founding_expiring_30d',
    thirtyDaysAgo,
  )
  if (alreadySent) return false

  await $fetch('/api/email/send', {
    method: 'POST',
    headers: ctx.internalSecret ? { 'x-internal-secret': ctx.internalSecret } : {},
    body: {
      templateKey: 'founding_expiring_30d',
      to: ctx.recipientEmail,
      locale: ctx.locale,
      variables: {
        dealerName: ctx.dealerName,
        expiresAt: ctx.expiresAtFormatted,
        upgradeUrl: ctx.upgradeUrl,
      },
    },
  }).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[founding-expiry] 30d email failed for dealer ${ctx.dealerId}: ${msg}`)
  })
  return true
}

async function sendReminder7d(ctx: ReminderContext, daysUntilExpiry: number): Promise<boolean> {
  const sevenDaysAgo = new Date(ctx.now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const alreadySent = await hasAlreadySentEmail(
    ctx.supabaseUrl,
    ctx.headers,
    ctx.recipientEmail,
    'founding_expiring_7d',
    sevenDaysAgo,
  )
  if (alreadySent) return false

  await $fetch('/api/email/send', {
    method: 'POST',
    headers: ctx.internalSecret ? { 'x-internal-secret': ctx.internalSecret } : {},
    body: {
      templateKey: 'founding_expiring_7d',
      to: ctx.recipientEmail,
      locale: ctx.locale,
      variables: {
        dealerName: ctx.dealerName,
        expiresAt: ctx.expiresAtFormatted,
        upgradeUrl: ctx.upgradeUrl,
        daysLeft: String(Math.ceil(daysUntilExpiry)),
      },
    },
  }).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[founding-expiry] 7d email failed for dealer ${ctx.dealerId}: ${msg}`)
  })
  return true
}

async function handleFoundingExpiry(ctx: ReminderContext, subscriptionId: string): Promise<number> {
  const downgraded = await downgradeSubscription(
    ctx.supabaseUrl,
    ctx.headers,
    subscriptionId,
    ctx.dealerId,
    ctx.now,
  )
  if (!downgraded) return 0

  await $fetch('/api/email/send', {
    method: 'POST',
    headers: ctx.internalSecret ? { 'x-internal-secret': ctx.internalSecret } : {},
    body: {
      templateKey: 'founding_expired',
      to: ctx.recipientEmail,
      locale: ctx.locale,
      variables: { dealerName: ctx.dealerName, upgradeUrl: ctx.upgradeUrl },
    },
  }).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[founding-expiry] Expiry email failed for dealer ${ctx.dealerId}: ${msg}`)
  })

  return await pauseExcessVehicles(ctx.supabaseUrl, ctx.headers, ctx.dealerId, ctx.now)
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  // ── 1. Verify cron secret ─────────────────────────────────────────────────
  const body = await readBody<CronBody>(event).catch(() => ({}) as CronBody)
  verifyCronSecret(event, body?.secret)

  const config = useRuntimeConfig()
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const supabaseKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const _internalSecret = config.cronSecret || process.env.CRON_SECRET

  if (!supabaseUrl || !supabaseKey) {
    throw createError({ statusCode: 500, message: 'Service not configured' })
  }

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  }

  const now = new Date()
  const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://tracciona.com'
  const upgradeUrl = `${siteUrl}/dashboard/suscripcion`

  let notified30d = 0
  let notified7d = 0
  let expired = 0
  let vehiclesPaused = 0

  // ── 2. Fetch all active founding subscriptions ────────────────────────────
  // Include subscriptions that expire in the future (for reminders) and those
  // that have already expired (expires_at <= now) for downgrade handling.
  const foundingRes = await fetchWithRetry(
    `${supabaseUrl}/rest/v1/subscriptions?plan=eq.founding&status=eq.active&select=id,user_id,plan,status,expires_at,vertical&limit=200`,
    { headers },
  )

  if (!foundingRes.ok) {
    throw createError({
      statusCode: 500,
      message: `Failed to fetch founding subscriptions: ${foundingRes.status}`,
    })
  }

  const foundingSubscriptions = (await foundingRes.json()) as SubscriptionRow[]

  if (!Array.isArray(foundingSubscriptions) || foundingSubscriptions.length === 0) {
    return {
      notified_30d: 0,
      notified_7d: 0,
      expired: 0,
      vehicles_paused: 0,
      timestamp: now.toISOString(),
    }
  }

  // ── 3. Process each founding subscription ─────────────────────────────────
  await processBatch({
    items: foundingSubscriptions,
    batchSize: 20,
    processor: async (subscription: SubscriptionRow) => {
      if (!subscription.expires_at) return

      const expiresAt = new Date(subscription.expires_at)
      const msUntilExpiry = expiresAt.getTime() - now.getTime()
      const daysUntilExpiry = msUntilExpiry / (1000 * 60 * 60 * 24)
      const isExpired = msUntilExpiry <= 0

      // Fetch dealer for this subscription (via user_id)
      const dealerRes = await fetchWithRetry(
        `${supabaseUrl}/rest/v1/dealers?user_id=eq.${subscription.user_id}&select=id,company_name,email,locale,badge&limit=1`,
        { headers },
      )
      if (!dealerRes.ok) return

      const dealers = (await dealerRes.json()) as DealerRow[]
      const dealer = dealers[0]
      if (!dealer?.email) return

      const locale = dealer.locale ?? 'es'
      const ctx: ReminderContext = {
        supabaseUrl,
        headers,
        recipientEmail: dealer.email,
        dealerId: dealer.id,
        locale,
        dealerName: resolveDealerName(dealer.company_name, locale),
        expiresAtFormatted: expiresAt.toLocaleDateString(locale === 'en' ? 'en-GB' : 'es-ES', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
        upgradeUrl,
        internalSecret: _internalSecret,
        now,
      }

      if (isExpired) {
        vehiclesPaused += await handleFoundingExpiry(ctx, subscription.id)
        expired++
      } else if (daysUntilExpiry <= 7) {
        if (await sendReminder7d(ctx, daysUntilExpiry)) notified7d++
        if (await sendReminder30d(ctx, daysUntilExpiry)) notified30d++
      } else if (daysUntilExpiry <= 30) {
        if (await sendReminder30d(ctx, daysUntilExpiry)) notified30d++
      }
    },
  })

  // ── 4. Return stats ────────────────────────────────────────────────────────
  return {
    notified_30d: notified30d,
    notified_7d: notified7d,
    expired,
    vehicles_paused: vehiclesPaused,
    timestamp: now.toISOString(),
  }
})
