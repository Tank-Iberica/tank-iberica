/**
 * Cron: Catalog Freshness Check
 *
 * Three-step pipeline to keep the vehicle catalog fresh:
 *  Step 1 (F1): 30-day reminder email → dealer for vehicles not updated in 30+ days
 *  Step 2 (F2): 14-day auto-pause    → vehicles still stale after 2+ reminders + 14d silence
 *  Step 3 (F4): 90-day auto-expire   → vehicles published > 90 days without any update
 *
 * POST /api/cron/freshness-check
 * Header: x-cron-secret: <CRON_SECRET>
 * Schedule: weekly (e.g. Monday 08:00 UTC)
 */
import { defineEventHandler, readBody } from 'h3'
import { Resend } from 'resend'
import { safeError } from '../../utils/safeError'
import { verifyCronSecret } from '../../utils/verifyCronSecret'
import { processBatch } from '../../utils/batchProcessor'
import { fetchWithRetry } from '../../utils/fetchWithRetry'
import { getSiteUrl, getSiteName, getSiteEmail } from '../../utils/siteConfig'
import { logger } from '../../utils/logger'

interface CronBody {
  secret?: string
}

interface DealerRef {
  email: string | null
  locale: string | null
}

interface VehicleWithDealer extends Record<string, unknown> {
  id: string
  title_es: string | null
  dealer_id: string
  freshness_reminder_count: number
  dealer: DealerRef | null
}

// ── Email builders ────────────────────────────────────────────────────────────

function buildReminderHtml(
  vehicleTitle: string,
  vehicleUrl: string,
  siteUrl: string,
  siteName: string,
  isEs: boolean,
): string {
  const primary = '#23424A'
  return `<!DOCTYPE html>
<html lang="${isEs ? 'es' : 'en'}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${siteName}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Inter',Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f4f4f5;">
    <tr><td align="center" style="padding:24px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
        <tr><td style="background:${primary};padding:24px;text-align:center;">
          <span style="font-size:20px;font-weight:700;color:#fff;">${siteName}</span>
        </td></tr>
        <tr><td style="padding:28px 24px;font-size:15px;line-height:1.6;color:#374151;">
          <p style="margin:0 0 16px;">
            ${
              isEs
                ? `Tu anuncio <strong>${vehicleTitle}</strong> lleva más de 30 días sin actualizarse.`
                : `Your listing <strong>${vehicleTitle}</strong> has not been updated for over 30 days.`
            }
          </p>
          <p style="margin:0 0 16px;">
            ${
              isEs
                ? '¿El vehículo sigue disponible? Actualiza el anuncio para mantener su visibilidad en el catálogo.'
                : 'Is the vehicle still available? Update the listing to keep it visible in the catalogue.'
            }
          </p>
        </td></tr>
        <tr><td style="padding:0 24px 28px;text-align:center;">
          <a href="${vehicleUrl}" style="display:inline-block;background:${primary};color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:600;">
            ${isEs ? 'Actualizar anuncio' : 'Update listing'}
          </a>
        </td></tr>
        <tr><td style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#9ca3af;">
          <a href="${siteUrl}" style="color:#9ca3af;">${siteName}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function buildExpiryHtml(
  vehicleTitle: string,
  renewUrl: string,
  siteUrl: string,
  siteName: string,
  isEs: boolean,
): string {
  const primary = '#23424A'
  return `<!DOCTYPE html>
<html lang="${isEs ? 'es' : 'en'}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${siteName}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Inter',Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f4f4f5;">
    <tr><td align="center" style="padding:24px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
        <tr><td style="background:${primary};padding:24px;text-align:center;">
          <span style="font-size:20px;font-weight:700;color:#fff;">${siteName}</span>
        </td></tr>
        <tr><td style="padding:28px 24px;font-size:15px;line-height:1.6;color:#374151;">
          <p style="margin:0 0 16px;">
            ${
              isEs
                ? `Tu anuncio <strong>${vehicleTitle}</strong> ha sido archivado automáticamente por inactividad (90 días sin actualización).`
                : `Your listing <strong>${vehicleTitle}</strong> has been automatically archived due to inactivity (90 days without an update).`
            }
          </p>
          <p style="margin:0 0 16px;">
            ${
              isEs
                ? '¿El vehículo sigue disponible? Puedes renovar el anuncio, marcarlo como vendido o pasarlo a subasta desde tu panel.'
                : 'Is the vehicle still available? You can renew the listing, mark it as sold, or move it to auction from your dashboard.'
            }
          </p>
        </td></tr>
        <tr><td style="padding:0 24px 28px;text-align:center;">
          <a href="${renewUrl}" style="display:inline-block;background:${primary};color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:600;">
            ${isEs ? 'Gestionar anuncio' : 'Manage listing'}
          </a>
        </td></tr>
        <tr><td style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#9ca3af;">
          <a href="${siteUrl}" style="color:#9ca3af;">${siteName}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  const body = await readBody<CronBody>(event).catch(() => ({}) as CronBody)
  verifyCronSecret(event, body?.secret)

  const config = useRuntimeConfig()
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const supabaseKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!supabaseUrl || !supabaseKey) {
    throw safeError(500, 'Service not configured')
  }

  const resendApiKey = config.resendApiKey || process.env.RESEND_API_KEY || ''
  const resend = resendApiKey ? new Resend(resendApiKey) : null
  const siteUrl = getSiteUrl()
  const siteName = getSiteName()

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  }

  const now = new Date()
  let reminded = 0
  let paused = 0
  let expired = 0
  let emailsSent = 0

  // ============================================================
  // STEP 1 (F1): 30-day reminder
  // Find vehicles published >30 days ago without recent reminder
  // ============================================================
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const reminderSelect =
    'id,title_es,dealer_id,freshness_reminder_count,dealer:dealers(email,locale)'
  const reminderQuery = new URLSearchParams({
    select: reminderSelect,
    status: 'eq.published',
    updated_at: `lt.${thirtyDaysAgo}`,
    freshness_reminder_count: 'lt.3',
  }).toString()

  const reminderUrl = `${supabaseUrl}/rest/v1/vehicles?${reminderQuery}&or=(freshness_reminded_at.is.null,freshness_reminded_at.lt.${thirtyDaysAgo})&limit=200`

  const reminderRes = await fetchWithRetry(reminderUrl, { headers })
  const vehiclesToRemind = await reminderRes.json()

  if (Array.isArray(vehiclesToRemind)) {
    const result = await processBatch({
      items: vehiclesToRemind,
      batchSize: 50,
      processor: async (vehicle: Record<string, unknown>) => {
        const v = vehicle as VehicleWithDealer

        const updateRes = await fetchWithRetry(`${supabaseUrl}/rest/v1/vehicles?id=eq.${v.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            freshness_reminded_at: now.toISOString(),
            freshness_reminder_count: ((v.freshness_reminder_count as number) || 0) + 1,
          }),
        })
        if (!updateRes.ok) throw new Error('Update failed')

        // Send reminder email to dealer
        const dealerEmail = v.dealer?.email
        if (dealerEmail && resend) {
          try {
            const locale = v.dealer?.locale ?? 'es'
            const isEs = locale !== 'en'
            const vehicleTitle = v.title_es ?? 'Tu vehículo'
            const vehicleUrl = `${siteUrl}/dashboard/vehiculos/${v.id}`
            await resend.emails.send({
              from: `${siteName} <${getSiteEmail()}>`,
              to: dealerEmail,
              subject: isEs
                ? `¿Tu ${vehicleTitle} sigue disponible?`
                : `Is your ${vehicleTitle} still available?`,
              html: buildReminderHtml(vehicleTitle, vehicleUrl, siteUrl, siteName, isEs),
            })
            emailsSent++
          } catch (emailErr) {
            logger.warn('[freshness-check] Reminder email failed', {
              vehicleId: v.id,
              error: String(emailErr),
            })
          }
        }
      },
    })
    reminded = result.processed
  }

  // ============================================================
  // STEP 2 (F2): 14-day auto-pause
  // Vehicles reminded but no response (≥2 reminders, no update)
  // ============================================================
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()

  const pauseQuery = new URLSearchParams({
    select: 'id,updated_at,freshness_reminded_at',
    status: 'eq.published',
    freshness_reminded_at: `not.is.null`,
    freshness_reminder_count: 'gte.2',
  }).toString()

  const pauseCandidatesUrl = `${supabaseUrl}/rest/v1/vehicles?${pauseQuery}&freshness_reminded_at=lt.${fourteenDaysAgo}&limit=200`

  const pauseCandidatesRes = await fetchWithRetry(pauseCandidatesUrl, { headers })
  const pauseCandidates = await pauseCandidatesRes.json()

  if (Array.isArray(pauseCandidates)) {
    const toPause = pauseCandidates.filter(
      (v: { updated_at: string; freshness_reminded_at: string }) => {
        return new Date(v.updated_at) < new Date(v.freshness_reminded_at)
      },
    )

    const pauseResult = await processBatch({
      items: toPause,
      batchSize: 50,
      processor: async (vehicle: Record<string, unknown>) => {
        const updateRes = await fetchWithRetry(
          `${supabaseUrl}/rest/v1/vehicles?id=eq.${vehicle.id}`,
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ status: 'paused' }),
          },
        )
        if (!updateRes.ok) throw new Error('Update failed')
      },
    })
    paused = pauseResult.processed
  }

  // ============================================================
  // STEP 3 (F4): 90-day auto-expire
  // Vehicles published with no update in 90 days → status='expired'
  // ============================================================
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()

  const expireSelect = 'id,title_es,dealer:dealers(email,locale)'
  const expireUrl = `${supabaseUrl}/rest/v1/vehicles?status=eq.published&updated_at=lt.${ninetyDaysAgo}&select=${encodeURIComponent(expireSelect)}&limit=200`

  const expireCandidatesRes = await fetchWithRetry(expireUrl, { headers })
  const expireCandidates = await expireCandidatesRes.json()

  if (Array.isArray(expireCandidates)) {
    const expireResult = await processBatch({
      items: expireCandidates,
      batchSize: 50,
      processor: async (vehicle: Record<string, unknown>) => {
        const v = vehicle as VehicleWithDealer

        const updateRes = await fetchWithRetry(`${supabaseUrl}/rest/v1/vehicles?id=eq.${v.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status: 'expired' }),
        })
        if (!updateRes.ok) throw new Error('Update failed')

        // Notify dealer about expiry with options to renew/sell/auction
        const dealerEmail = v.dealer?.email
        if (dealerEmail && resend) {
          try {
            const locale = v.dealer?.locale ?? 'es'
            const isEs = locale !== 'en'
            const vehicleTitle = v.title_es ?? 'Tu vehículo'
            const renewUrl = `${siteUrl}/dashboard/vehiculos/${v.id}`
            await resend.emails.send({
              from: `${siteName} <${getSiteEmail()}>`,
              to: dealerEmail,
              subject: isEs
                ? `Anuncio archivado: ${vehicleTitle}`
                : `Listing archived: ${vehicleTitle}`,
              html: buildExpiryHtml(vehicleTitle, renewUrl, siteUrl, siteName, isEs),
            })
            emailsSent++
          } catch (emailErr) {
            logger.warn('[freshness-check] Expiry email failed', {
              vehicleId: v.id,
              error: String(emailErr),
            })
          }
        }
      },
    })
    expired = expireResult.processed
  }

  logger.info('[freshness-check] Complete', { reminded, paused, expired, emailsSent })

  return {
    reminded,
    paused,
    expired,
    emailsSent,
    timestamp: now.toISOString(),
  }
})
