/**
 * POST /api/cron/newsletter
 *
 * Weekly newsletter "El Industrial". Selects 5 featured vehicles and computes
 * 1 live market insight, then sends to all newsletter_subscriptions where
 * pref_newsletter = true via Resend with proper List-Unsubscribe headers.
 *
 * Schedule: every Tuesday 09:00 UTC (see .github/workflows/cron-scheduler.yml)
 * Protected by CRON_SECRET (x-cron-secret header).
 */
import { defineEventHandler, readBody } from 'h3'
import { Resend } from 'resend'
import type { SupabaseClient } from '@supabase/supabase-js'
import { serverSupabaseServiceRole } from '#supabase/server'
import { verifyCronSecret } from '../../utils/verifyCronSecret'
import { processBatch } from '../../utils/batchProcessor'
import { logger } from '../../utils/logger'
import { safeError } from '../../utils/safeError'
import { getSiteUrl } from '../../utils/siteConfig'

// ── Types ──────────────────────────────────────────────────────────────────────

interface NewsletterSubscriberRow {
  id: string
  email: string
}

interface VehicleImageRow {
  url: string
  thumbnail_url: string | null
  position: number | null
}

interface FeaturedVehicleRow {
  id: string
  slug: string
  brand: string
  model: string
  year: number | null
  price: number | null
  vehicle_images: VehicleImageRow[]
}

export interface MarketInsight {
  totalPublished: number
  avgPrice: number
  newThisWeek: number
  topCategory: string
}

interface CronBody {
  secret?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

export async function getFeaturedVehicles(supabase: SupabaseClient): Promise<FeaturedVehicleRow[]> {
  // Try featured/boosted vehicles first
  const { data: featured } = await supabase
    .from('vehicles')
    .select('id, slug, brand, model, year, price, vehicle_images(url, thumbnail_url, position)')
    .eq('status', 'published')
    .eq('featured', true)
    .order('sort_boost', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(5)

  if (featured && featured.length >= 5) {
    return featured as unknown as FeaturedVehicleRow[]
  }

  // Fallback: recent published vehicles (with featured first if any)
  const { data: recent } = await supabase
    .from('vehicles')
    .select('id, slug, brand, model, year, price, vehicle_images(url, thumbnail_url, position)')
    .eq('status', 'published')
    .order('featured', { ascending: false, nullsFirst: false })
    .order('sort_boost', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(5)

  return (recent ?? []) as unknown as FeaturedVehicleRow[]
}

export async function getMarketInsight(supabase: SupabaseClient): Promise<MarketInsight> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [publishedRes, newRes, categoriesRes] = await Promise.all([
    supabase.from('vehicles').select('price', { count: 'exact' }).eq('status', 'published'),
    supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('created_at', oneWeekAgo),
    supabase
      .from('vehicles')
      .select('category')
      .eq('status', 'published')
      .not('category', 'is', null),
  ])

  const prices = (publishedRes.data ?? [])
    .map((v: { price: number | null }) => v.price)
    .filter((p): p is number => p != null && p > 0)

  const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0

  // Count categories to find the most active
  const categoryCounts: Record<string, number> = {}
  for (const v of (categoriesRes.data ?? []) as Array<{ category: string | null }>) {
    if (v.category) categoryCounts[v.category] = (categoryCounts[v.category] ?? 0) + 1
  }
  const topCategory =
    Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'vehículos'

  return {
    totalPublished: publishedRes.count ?? 0,
    avgPrice,
    newThisWeek: newRes.count ?? 0,
    topCategory,
  }
}

export function getFirstImageUrl(images: VehicleImageRow[]): string | null {
  if (!images || images.length === 0) return null
  const sorted = [...images].sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
  return sorted[0]?.thumbnail_url ?? sorted[0]?.url ?? null
}

export function formatEur(amount: number): string {
  return amount.toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  })
}

function buildVehicleCard(vehicle: FeaturedVehicleRow, siteUrl: string): string {
  const url = `${siteUrl}/vehiculo/${vehicle.slug}`
  const title = `${vehicle.brand} ${vehicle.model}${vehicle.year ? ` (${vehicle.year})` : ''}`
  const price = vehicle.price ? formatEur(vehicle.price) : 'Consultar precio'
  const imgUrl = getFirstImageUrl(vehicle.vehicle_images)

  return `<tr>
  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        ${
          imgUrl
            ? `<td style="width: 90px; vertical-align: middle; padding-right: 14px;">
            <a href="${url}" style="text-decoration: none;">
              <img src="${imgUrl}" alt="${title}" width="90" height="68"
                style="border-radius: 6px; object-fit: cover; display: block; background: #f3f4f6; border: 0;" />
            </a>
          </td>`
            : ''
        }
        <td style="vertical-align: middle;">
          <a href="${url}" style="color: #23424A; font-weight: 600; font-size: 15px; text-decoration: none; line-height: 1.3;">
            ${title}
          </a>
          <p style="margin: 6px 0 0; color: #23424A; font-size: 16px; font-weight: 700;">${price}</p>
        </td>
        <td style="vertical-align: middle; text-align: right; padding-left: 12px; white-space: nowrap;">
          <a href="${url}"
            style="display: inline-block; padding: 7px 16px; background: #23424A; color: #ffffff;
              text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 500;">Ver</a>
        </td>
      </tr>
    </table>
  </td>
</tr>`
}

export function buildNewsletterHtml(
  vehicles: FeaturedVehicleRow[],
  insight: MarketInsight,
  siteUrl: string,
  unsubscribeUrl: string,
): string {
  const weekDate = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const vehicleCards = vehicles.map((v) => buildVehicleCard(v, siteUrl)).join('\n')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>El Industrial &mdash; ${getSiteName()}</title>
</head>
<body style="margin: 0; padding: 0; background: #f4f4f5;
  font-family: 'Inter', Arial, Helvetica, sans-serif; -webkit-text-size-adjust: 100%;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600"
          style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 8px;
            overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: #23424A; padding: 28px 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;
                letter-spacing: -0.5px;">El Industrial</h1>
              <p style="margin: 6px 0 0; color: #a0b4b8; font-size: 13px;">${weekDate}</p>
            </td>
          </tr>

          <!-- Market insight -->
          <tr>
            <td style="padding: 20px 24px; background: #f0f4f5; border-bottom: 1px solid #d1dde0;">
              <p style="margin: 0; color: #23424A; font-size: 14px; line-height: 1.6;">
                <strong>Pulso del mercado esta semana:</strong>
                ${insight.newThisWeek} veh&iacute;culos nuevos &middot;
                Precio medio: <strong>${formatEur(insight.avgPrice)}</strong> &middot;
                Categor&iacute;a m&aacute;s activa: <strong>${insight.topCategory}</strong>
                (${insight.totalPublished} en stock)
              </p>
            </td>
          </tr>

          <!-- Featured vehicles -->
          <tr>
            <td style="padding: 24px 24px 8px;">
              <h2 style="margin: 0 0 4px; color: #111827; font-size: 16px; font-weight: 700;">
                Destacados de la semana
              </h2>
              <p style="margin: 0 0 16px; color: #6b7280; font-size: 13px;">
                Selecci&oacute;n de los mejores anuncios
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                ${vehicleCards}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 20px 24px; text-align: center;">
              <a href="${siteUrl}/catalogo"
                style="display: inline-block; background: #23424A; color: #ffffff;
                  text-decoration: none; padding: 12px 28px; border-radius: 6px;
                  font-size: 14px; font-weight: 600;">
                Ver todo el cat&aacute;logo
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb;
              text-align: center; font-size: 12px; color: #9ca3af;">
              <p style="margin: 0 0 8px;">
                Recibes esta newsletter porque te suscribiste en ${getSiteName()}.
              </p>
              <p style="margin: 0;">
                <a href="${unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">
                  Cancelar suscripci&oacute;n
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Handler ────────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  const body = await readBody<CronBody>(event).catch(() => ({}) as CronBody)
  verifyCronSecret(event, body?.secret)

  const supabase = serverSupabaseServiceRole(event)
  const siteUrl = getSiteUrl()
  const runtimeConfig = useRuntimeConfig()
  const resendApiKey = runtimeConfig.resendApiKey || process.env.RESEND_API_KEY

  let sent = 0
  let skipped = 0
  let errors = 0

  // ── 1. Fetch featured vehicles + market insight ───────────────────────────
  const [vehicles, insight] = await Promise.all([
    getFeaturedVehicles(supabase),
    getMarketInsight(supabase),
  ])

  if (vehicles.length === 0) {
    logger.info('[newsletter] No published vehicles — skipping send')
    return { sent: 0, skipped: 0, errors: 0, reason: 'no_vehicles' }
  }

  // ── 2. Fetch newsletter subscribers ──────────────────────────────────────
  const { data: subscribersData, error: subsError } = await supabase
    .from('newsletter_subscriptions')
    .select('id, email')
    .eq('pref_newsletter', true)

  if (subsError) {
    throw safeError(500, `[newsletter] Failed to fetch subscribers: ${subsError.message}`)
  }

  const subscribers = (subscribersData ?? []) as unknown as NewsletterSubscriberRow[]

  if (subscribers.length === 0) {
    logger.info('[newsletter] No active newsletter subscribers — nothing to send')
    return { sent: 0, skipped: 0, errors: 0, reason: 'no_subscribers' }
  }

  // ── 3. Compute shared email subject ──────────────────────────────────────
  const weekLabel = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  const subject = `El Industrial — ${weekLabel}: ${insight.newThisWeek} novedades`

  // ── 4. Send to each subscriber in batches ─────────────────────────────────
  const batchResult = await processBatch({
    items: subscribers,
    batchSize: 50,
    delayBetweenBatchesMs: 5000,
    processor: async (subscriber: NewsletterSubscriberRow) => {
      const unsubscribeUrl = `${siteUrl}/api/email/unsubscribe?newsletter_id=${subscriber.id}`
      const html = buildNewsletterHtml(vehicles, insight, siteUrl, unsubscribeUrl)

      if (!resendApiKey) {
        logger.warn(`[newsletter] RESEND_API_KEY not set — mock send to ${subscriber.email}`)
        skipped++
        return
      }

      try {
        const resend = new Resend(resendApiKey)
        const result = await resend.emails.send({
          from: `El Industrial <newsletter@${getSiteUrl().replace('https://', '')}>`,
          to: subscriber.email,
          subject,
          html,
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        })
        if (result.error) {
          errors++
          logger.error(`[newsletter] Resend error for ${subscriber.email}: ${result.error.message}`)
        } else {
          sent++
        }
      } catch (err: unknown) {
        errors++
        const msg = err instanceof Error ? err.message : 'Unknown error'
        logger.error(`[newsletter] Send failed for ${subscriber.email}: ${msg}`)
      }
    },
  })

  logger.info(
    `[newsletter] Complete — sent: ${sent}, skipped: ${skipped}, errors: ${errors}, total: ${subscribers.length}`,
  )

  return {
    sent,
    skipped,
    errors,
    subscribers: subscribers.length,
    vehicles: vehicles.length,
    insight,
    batchResult: { processed: batchResult.processed, errors: batchResult.errors },
  }
})
