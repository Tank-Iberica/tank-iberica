/**
 * Cron: Post-Sale Buyer Outreach (F6)
 *
 * Sends a post-sale services email to buyers who contacted a dealer
 * via a lead, when that vehicle has been marked as sold.
 *
 * Logic:
 *   1. Find vehicles sold in the last 25 hours
 *   2. For each sold vehicle, find pending leads with user_email
 *      that have not yet received the post-sale outreach email
 *   3. Send a services cross-sell email (transport, transfer, insurance, contract)
 *   4. Mark the lead with post_sale_outreach_sent_at
 *
 * POST /api/cron/post-sale-outreach
 * Header: x-cron-secret: <CRON_SECRET>
 * Schedule: daily 09:00 UTC
 */
import { defineEventHandler, readBody } from 'h3'
import { Resend } from 'resend'
import { serverSupabaseServiceRole } from '#supabase/server'
import { verifyCronSecret } from '../../utils/verifyCronSecret'
import { processBatch } from '../../utils/batchProcessor'
import { getSiteUrl, getSiteName, getSiteEmail } from '../../utils/siteConfig'
import { logger } from '../../utils/logger'

interface CronBody {
  secret?: string
}

interface LeadRow {
  id: string
  user_email: string | null
  user_name: string | null
  vehicle_id: string
}

interface SoldVehicleRow {
  id: string
  title_es: string | null
  slug: string | null
}

// ── Email builder ─────────────────────────────────────────────────────────────

function buildPostSaleHtml(
  buyerName: string | null,
  vehicleTitle: string,
  vehicleUrl: string,
  postventaUrl: string,
  siteUrl: string,
  siteName: string,
  isEs: boolean,
): string {
  const primary = '#23424A'
  const greeting = buyerName
    ? isEs
      ? `Hola ${buyerName},`
      : `Hello ${buyerName},`
    : isEs
      ? 'Hola,'
      : 'Hello,'

  return `<!DOCTYPE html>
<html lang="${isEs ? 'es' : 'en'}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${siteName}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Inter',Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f4f4f5;">
    <tr><td align="center" style="padding:24px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
        <tr><td style="background:${primary};padding:24px;text-align:center;">
          <p style="margin:0;color:#a0b4b8;font-size:12px;text-transform:uppercase;letter-spacing:1px;">
            ${isEs ? 'Servicios post-venta' : 'Post-sale services'}
          </p>
          <h1 style="margin:8px 0 0;color:#fff;font-size:20px;font-weight:700;">
            ${isEs ? '¡Enhorabuena por tu compra!' : 'Congratulations on your purchase!'}
          </h1>
        </td></tr>
        <tr><td style="padding:28px 24px;font-size:15px;line-height:1.6;color:#374151;">
          <p style="margin:0 0 16px;">${greeting}</p>
          <p style="margin:0 0 16px;">
            ${
              isEs
                ? `Parece que has adquirido <strong>${vehicleTitle}</strong>. ¡Esperamos que sea una gran incorporación a tu flota!`
                : `It looks like you have acquired <strong>${vehicleTitle}</strong>. We hope it's a great addition to your fleet!`
            }
          </p>
          <p style="margin:0 0 16px;">
            ${
              isEs
                ? `Para facilitarte los trámites, en ${getSiteName()} ofrecemos servicios que pueden ayudarte:`
                : `To make the process easier, ${getSiteName()} offers services that can help you:`
            }
          </p>
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:16px;">
            <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
              <strong>🚛 ${isEs ? 'Transporte' : 'Transport'}</strong><br>
              <span style="font-size:13px;color:#6b7280;">
                ${isEs ? 'Recogida y entrega del vehículo en toda España y Europa.' : 'Vehicle collection and delivery across Spain and Europe.'}
              </span>
            </td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
              <strong>📄 ${isEs ? 'Transferencia' : 'Transfer'}</strong><br>
              <span style="font-size:13px;color:#6b7280;">
                ${isEs ? 'Gestionamos el cambio de titularidad de principio a fin.' : 'We handle the change of ownership from start to finish.'}
              </span>
            </td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
              <strong>🛡️ ${isEs ? 'Seguro' : 'Insurance'}</strong><br>
              <span style="font-size:13px;color:#6b7280;">
                ${isEs ? 'Seguro de vehículo industrial adaptado a tus necesidades.' : 'Commercial vehicle insurance tailored to your needs.'}
              </span>
            </td></tr>
            <tr><td style="padding:8px 0;">
              <strong>📋 ${isEs ? 'Contrato' : 'Contract'}</strong><br>
              <span style="font-size:13px;color:#6b7280;">
                ${isEs ? 'Generamos el contrato de compraventa de forma inmediata.' : 'We generate the purchase contract immediately.'}
              </span>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 24px 28px;text-align:center;">
          <a href="${postventaUrl}" style="display:inline-block;background:${primary};color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:600;margin-bottom:12px;">
            ${isEs ? 'Ver servicios post-venta' : 'View post-sale services'}
          </a>
          <p style="margin:8px 0 0;font-size:13px;color:#9ca3af;">
            <a href="${vehicleUrl}" style="color:#9ca3af;text-decoration:underline;">
              ${isEs ? 'Ver anuncio del vehículo' : 'View vehicle listing'}
            </a>
          </p>
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = serverSupabaseServiceRole(event) as any
  const config = useRuntimeConfig()
  const resendApiKey = config.resendApiKey || process.env.RESEND_API_KEY || ''
  const resend = resendApiKey ? new Resend(resendApiKey) : null
  const siteUrl = getSiteUrl()
  const siteName = getSiteName()

  if (!resend) {
    logger.warn('[post-sale-outreach] RESEND_API_KEY not set — skipping')
    return { sent: 0, skipped: 0, reason: 'no_resend_key' }
  }

  const now = new Date()
  // Look back 25h to provide a small safety buffer over the 24h schedule
  const cutoff = new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString()

  // ── 1. Find recently sold vehicles ────────────────────────────────────────
  const { data: soldVehicles, error: vehicleError } = await supabase
    .from('vehicles')
    .select('id, title_es, slug')
    .eq('status', 'sold')
    .gte('sold_at', cutoff)
    .limit(100)

  if (vehicleError) {
    logger.error('[post-sale-outreach] Failed to fetch sold vehicles', {
      error: vehicleError.message,
    })
    return { sent: 0, error: 'database_error' }
  }

  if (!soldVehicles || soldVehicles.length === 0) {
    return { sent: 0, skipped: 0 }
  }

  const vehicleMap = new Map<string, SoldVehicleRow>()
  for (const v of soldVehicles as SoldVehicleRow[]) {
    vehicleMap.set(v.id, v)
  }

  // ── 2. Find leads for those vehicles ──────────────────────────────────────
  const vehicleIds = (soldVehicles as SoldVehicleRow[]).map((v) => v.id)

  const { data: leads, error: leadError } = await supabase
    .from('leads')
    .select('id, user_email, user_name, vehicle_id')
    .in('vehicle_id', vehicleIds)
    .not('user_email', 'is', null)
    .is('post_sale_outreach_sent_at', null)
    .limit(200)

  if (leadError) {
    logger.error('[post-sale-outreach] Failed to fetch leads', { error: leadError.message })
    return { sent: 0, error: 'database_error' }
  }

  if (!leads || leads.length === 0) {
    return { sent: 0, skipped: 0 }
  }

  // ── 3. Send post-sale emails ───────────────────────────────────────────────
  let sent = 0
  let skipped = 0

  const batchResult = await processBatch({
    items: leads as LeadRow[],
    batchSize: 50,
    delayBetweenBatchesMs: 5000,
    processor: async (lead: LeadRow) => {
      if (!lead.user_email) {
        skipped++
        return
      }

      const vehicle = vehicleMap.get(lead.vehicle_id)
      if (!vehicle) {
        skipped++
        return
      }

      const vehicleTitle = vehicle.title_es ?? 'Tu vehículo'
      const vehicleUrl = `${siteUrl}/vehiculo/${vehicle.slug}`
      const postventaUrl = `${siteUrl}/servicios-postventa?v=${vehicle.slug}`

      try {
        await resend.emails.send({
          from: `${siteName} <${getSiteEmail()}>`,
          to: lead.user_email,
          subject: `${vehicleTitle} — Servicios post-venta`,
          html: buildPostSaleHtml(
            lead.user_name,
            vehicleTitle,
            vehicleUrl,
            postventaUrl,
            siteUrl,
            siteName,
            true, // default to Spanish; TODO: detect lead locale
          ),
        })

        await supabase
          .from('leads')
          .update({ post_sale_outreach_sent_at: now.toISOString() })
          .eq('id', lead.id)

        sent++
      } catch (err) {
        logger.warn('[post-sale-outreach] Email failed', {
          leadId: lead.id,
          error: String(err),
        })
        skipped++
      }
    },
  })

  logger.info('[post-sale-outreach] Complete', {
    sent,
    skipped,
    vehicles: soldVehicles.length,
    leads: leads.length,
    batchResult: { processed: batchResult.processed, errors: batchResult.errors },
  })

  return { sent, skipped, vehicles: soldVehicles.length, leads: leads.length }
})
