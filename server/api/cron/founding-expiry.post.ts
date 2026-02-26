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

// ── Handler ──────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  // ── 1. Verify cron secret ─────────────────────────────────────────────────
  const body = await readBody<CronBody>(event).catch(() => ({}) as CronBody)
  verifyCronSecret(event, body?.secret)

  const config = useRuntimeConfig()
  const supabaseUrl = config.public?.supabaseUrl || process.env.SUPABASE_URL
  const supabaseKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY
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

      // ── Fetch dealer for this subscription (via user_id) ─────────────────
      const dealerRes = await fetchWithRetry(
        `${supabaseUrl}/rest/v1/dealers?user_id=eq.${subscription.user_id}&select=id,company_name,email,locale,badge&limit=1`,
        { headers },
      )

      if (!dealerRes.ok) return

      const dealers = (await dealerRes.json()) as DealerRow[]
      const dealer = dealers[0]
      if (!dealer) return

      const recipientEmail = dealer.email
      if (!recipientEmail) return

      const locale = dealer.locale ?? 'es'
      const dealerName =
        typeof dealer.company_name === 'object' && dealer.company_name !== null
          ? (dealer.company_name[locale] ??
            dealer.company_name['es'] ??
            Object.values(dealer.company_name).find(Boolean) ??
            'Dealer')
          : String(dealer.company_name ?? 'Dealer')

      const expiresAtFormatted = expiresAt.toLocaleDateString(locale === 'en' ? 'en-GB' : 'es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })

      // ── a. 30-day reminder ─────────────────────────────────────────────────
      if (!isExpired && daysUntilExpiry <= 30) {
        // Check if we already sent the 30d reminder (avoid duplicate sends)
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
        const emailCheckRes = await fetchWithRetry(
          `${supabaseUrl}/rest/v1/email_logs?recipient_email=eq.${encodeURIComponent(recipientEmail)}&template_key=eq.founding_expiring_30d&created_at=gt.${thirtyDaysAgo}&select=id&limit=1`,
          { headers },
        )

        let alreadySent30d = false
        if (emailCheckRes.ok) {
          const logs = (await emailCheckRes.json()) as EmailLogRow[]
          alreadySent30d = Array.isArray(logs) && logs.length > 0
        }

        if (!alreadySent30d && daysUntilExpiry > 7) {
          // Only send 30d notice when not yet in 7d window (avoid double-sending)
          await $fetch('/api/email/send', {
            method: 'POST',
            headers: _internalSecret ? { 'x-internal-secret': _internalSecret } : {},
            body: {
              templateKey: 'founding_expiring_30d',
              to: recipientEmail,
              locale,
              variables: {
                dealerName,
                expiresAt: expiresAtFormatted,
                upgradeUrl,
              },
            },
          }).catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : String(err)
            console.error(`[founding-expiry] 30d email failed for dealer ${dealer.id}: ${msg}`)
          })

          notified30d++
        }
      }

      // ── b. 7-day reminder ──────────────────────────────────────────────────
      if (!isExpired && daysUntilExpiry <= 7) {
        // Check if we already sent the 7d reminder
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        const emailCheckRes = await fetchWithRetry(
          `${supabaseUrl}/rest/v1/email_logs?recipient_email=eq.${encodeURIComponent(recipientEmail)}&template_key=eq.founding_expiring_7d&created_at=gt.${sevenDaysAgo}&select=id&limit=1`,
          { headers },
        )

        let alreadySent7d = false
        if (emailCheckRes.ok) {
          const logs = (await emailCheckRes.json()) as EmailLogRow[]
          alreadySent7d = Array.isArray(logs) && logs.length > 0
        }

        if (!alreadySent7d) {
          await $fetch('/api/email/send', {
            method: 'POST',
            headers: _internalSecret ? { 'x-internal-secret': _internalSecret } : {},
            body: {
              templateKey: 'founding_expiring_7d',
              to: recipientEmail,
              locale,
              variables: {
                dealerName,
                expiresAt: expiresAtFormatted,
                upgradeUrl,
                daysLeft: String(Math.ceil(daysUntilExpiry)),
              },
            },
          }).catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : String(err)
            console.error(`[founding-expiry] 7d email failed for dealer ${dealer.id}: ${msg}`)
          })

          notified7d++
        }
      }

      // ── c. Expiry: downgrade to free ───────────────────────────────────────
      if (isExpired) {
        // Update subscription: plan = 'free', status = 'expired'
        const subUpdateRes = await fetchWithRetry(
          `${supabaseUrl}/rest/v1/subscriptions?id=eq.${subscription.id}`,
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              plan: 'free',
              status: 'expired',
              updated_at: now.toISOString(),
            }),
          },
        )

        if (!subUpdateRes.ok) {
          console.error(
            `[founding-expiry] Failed to downgrade subscription ${subscription.id}: ${subUpdateRes.status}`,
          )
          return
        }

        // Set founding_badge_permanent = true on the dealer
        // The dealer keeps the 'founding' badge permanently even after downgrade.
        // We store it in the badge column and mark it via a dedicated boolean column.
        // Since founding_badge_permanent column may not exist yet, we use badge = 'founding'
        // as the permanent signal and update subscription_type on the dealers table.
        const dealerUpdateRes = await fetchWithRetry(
          `${supabaseUrl}/rest/v1/dealers?id=eq.${dealer.id}`,
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              badge: 'founding', // Badge is permanent — never cleared
              subscription_type: 'free', // Downgrade dealer subscription_type
              updated_at: now.toISOString(),
            }),
          },
        )

        if (!dealerUpdateRes.ok) {
          console.error(
            `[founding-expiry] Failed to update dealer ${dealer.id} after expiry: ${dealerUpdateRes.status}`,
          )
        }

        // Send expiry notification email
        await $fetch('/api/email/send', {
          method: 'POST',
          headers: _internalSecret ? { 'x-internal-secret': _internalSecret } : {},
          body: {
            templateKey: 'founding_expired',
            to: recipientEmail,
            locale,
            variables: {
              dealerName,
              upgradeUrl,
            },
          },
        }).catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err)
          console.error(`[founding-expiry] Expiry email failed for dealer ${dealer.id}: ${msg}`)
        })

        expired++

        // ── Pause vehicles exceeding free plan limit (max 3 published) ───────
        // Fetch all dealer's vehicles ordered by created_at ASC
        const vehiclesRes = await fetchWithRetry(
          `${supabaseUrl}/rest/v1/vehicles?dealer_id=eq.${dealer.id}&status=eq.published&select=id,status,created_at&order=created_at.asc&limit=500`,
          { headers },
        )

        if (!vehiclesRes.ok) {
          console.error(
            `[founding-expiry] Failed to fetch vehicles for dealer ${dealer.id}: ${vehiclesRes.status}`,
          )
          return
        }

        const publishedVehicles = (await vehiclesRes.json()) as VehicleRow[]

        if (!Array.isArray(publishedVehicles) || publishedVehicles.length <= 3) {
          // At or below free plan limit — nothing to pause
          return
        }

        // Keep first 3 (oldest) as published, pause the rest
        const vehiclesToPause = publishedVehicles.slice(3)

        for (const vehicle of vehiclesToPause) {
          const pauseRes = await fetchWithRetry(
            `${supabaseUrl}/rest/v1/vehicles?id=eq.${vehicle.id}`,
            {
              method: 'PATCH',
              headers,
              body: JSON.stringify({
                status: 'paused',
                updated_at: now.toISOString(),
              }),
            },
          )

          if (pauseRes.ok) {
            vehiclesPaused++
          } else {
            console.error(
              `[founding-expiry] Failed to pause vehicle ${vehicle.id}: ${pauseRes.status}`,
            )
          }
        }
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
