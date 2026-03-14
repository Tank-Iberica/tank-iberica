/**
 * POST /api/cron/dealer-onboarding
 *
 * Daily cron that sends a 5-step onboarding email sequence to new dealers.
 * Steps are scheduled at day offsets: 0, 1, 3, 7, 14 after dealer creation.
 * Each dealer/step combination is sent at most once (tracked in dealer_onboarding_emails).
 *
 * Schedule: daily 10:00 UTC
 * Protected by CRON_SECRET (x-cron-secret header).
 */
import { defineEventHandler, readBody } from 'h3'
import { Resend } from 'resend'
import type { SupabaseClient } from '@supabase/supabase-js'
import { serverSupabaseServiceRole } from '#supabase/server'
import { verifyCronSecret } from '../../utils/verifyCronSecret'
import { processBatch } from '../../utils/batchProcessor'
import { logger } from '../../utils/logger'
import { getSiteUrl, getSiteName } from '../../utils/siteConfig'

// ── Types ───────────────────────────────────────────────────────────────────

interface CronBody {
  secret?: string
}

interface DealerRow {
  id: string
  user_id: string | null
  company_name: Record<string, string> | string
  email: string | null
  created_at: string | null
  locale: string | null
}

interface SentStepsRow {
  step: number
}

// ── Onboarding schedule ──────────────────────────────────────────────────────

export interface OnboardingStep {
  step: number
  dayOffset: number
  subjectEs: string
  subjectEn: string
}

export const ONBOARDING_SCHEDULE: OnboardingStep[] = [
  {
    step: 0,
    dayOffset: 0,
    subjectEs: 'Bienvenido a Tracciona — tus primeros pasos',
    subjectEn: 'Welcome to Tracciona — your first steps',
  },
  {
    step: 1,
    dayOffset: 1,
    subjectEs: 'Completa tu perfil y destaca entre la competencia',
    subjectEn: 'Complete your profile and stand out from the competition',
  },
  {
    step: 2,
    dayOffset: 3,
    subjectEs: 'Descubre todas las herramientas de tu panel',
    subjectEn: 'Discover all the tools in your dashboard',
  },
  {
    step: 3,
    dayOffset: 7,
    subjectEs: 'Tu primera semana en Tracciona — resumen',
    subjectEn: 'Your first week on Tracciona — recap',
  },
  {
    step: 4,
    dayOffset: 14,
    subjectEs: 'Maximiza tu presencia — consejos de los mejores dealers',
    subjectEn: 'Maximize your presence — tips from top dealers',
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolve JSONB localized field to plain string.
 */
export function resolveName(field: Record<string, string> | string | null, locale: string): string {
  if (!field) return 'Dealer'
  if (typeof field === 'string') return field
  return field[locale] ?? field.es ?? Object.values(field).find(Boolean) ?? 'Dealer'
}

/**
 * Return the steps due today for a dealer given days since creation.
 * Steps already sent are excluded by the caller.
 */
export function getDueSteps(daysSinceCreation: number): number[] {
  return ONBOARDING_SCHEDULE.filter((s) => s.dayOffset <= daysSinceCreation).map((s) => s.step)
}

/**
 * Build the HTML body for an onboarding step email.
 */
export function buildOnboardingHtml(
  step: number,
  dealerName: string,
  siteUrl: string,
  locale: string,
): string {
  const primary = '#23424A'
  const isEs = locale !== 'en'

  const dashboardUrl = `${siteUrl}/dashboard`
  const vehiclesUrl = `${siteUrl}/dashboard/vehiculos/nuevo`
  const profileUrl = `${siteUrl}/dashboard/portal`
  const toolsUrl = `${siteUrl}/dashboard/herramientas`
  const statsUrl = `${siteUrl}/dashboard/estadisticas`
  const catalogUrl = `${siteUrl}/catalogo`

  const contents: Record<
    number,
    { heading: string; body: string; ctaLabel: string; ctaUrl: string }
  > = {
    0: {
      heading: isEs ? `Bienvenido, ${dealerName}` : `Welcome, ${dealerName}`,
      body: isEs
        ? `<p>Tu cuenta de anunciante está activa en Tracciona. Para empezar a recibir consultas, publica tu primer vehículo.</p>
<ul style="text-align:left;padding-left:20px;color:#374151;">
  <li>Añade fotos de calidad (mínimo 4)</li>
  <li>Rellena precio, kilometraje y descripción</li>
  <li>Activa el contacto vía WhatsApp si tienes número</li>
</ul>
<p>El primer anuncio suele tardar menos de 10 minutos.</p>`
        : `<p>Your dealer account is active on Tracciona. To start receiving enquiries, publish your first vehicle.</p>
<ul style="text-align:left;padding-left:20px;color:#374151;">
  <li>Add quality photos (minimum 4)</li>
  <li>Fill in price, mileage and description</li>
  <li>Enable WhatsApp contact if you have a number</li>
</ul>
<p>The first listing usually takes less than 10 minutes.</p>`,
      ctaLabel: isEs ? 'Publicar mi primer vehículo' : 'Publish my first vehicle',
      ctaUrl: vehiclesUrl,
    },
    1: {
      heading: isEs ? 'Completa tu perfil, ${dealerName}' : 'Complete your profile, ${dealerName}',
      body: isEs
        ? `<p>Los anunciantes con perfil completo reciben <strong>3× más consultas</strong>. Añade:</p>
<ul style="text-align:left;padding-left:20px;color:#374151;">
  <li><strong>Logo</strong> de tu empresa</li>
  <li><strong>Descripción</strong> de tu negocio (2-3 líneas)</li>
  <li><strong>Teléfono</strong> y <strong>dirección</strong></li>
  <li><strong>Página web</strong> y redes sociales</li>
</ul>
<p>Tarda menos de 5 minutos y mejora tu posicionamiento en las búsquedas.</p>`
        : `<p>Dealers with a complete profile receive <strong>3× more enquiries</strong>. Add:</p>
<ul style="text-align:left;padding-left:20px;color:#374151;">
  <li><strong>Company logo</strong></li>
  <li><strong>Business description</strong> (2-3 lines)</li>
  <li><strong>Phone</strong> and <strong>address</strong></li>
  <li><strong>Website</strong> and social media</li>
</ul>
<p>Takes less than 5 minutes and improves your search ranking.</p>`,
      ctaLabel: isEs ? 'Completar mi perfil' : 'Complete my profile',
      ctaUrl: profileUrl,
    },
    2: {
      heading: isEs
        ? `Tus herramientas de negocio, ${dealerName}`
        : `Your business tools, ${dealerName}`,
      body: isEs
        ? `<p>Tu panel incluye herramientas profesionales gratuitas:</p>
<ul style="text-align:left;padding-left:20px;color:#374151;">
  <li><strong>CRM</strong> — gestiona clientes y seguimientos</li>
  <li><strong>Estadísticas</strong> — visitas, consultas y favoritos por vehículo</li>
  <li><strong>Generador de contratos</strong> — compraventa y arrendamiento</li>
  <li><strong>Calculadora de finanzas</strong> — cuotas y rentabilidad</li>
  <li><strong>Exportar catálogo</strong> — PDF descargable de tu stock</li>
</ul>`
        : `<p>Your dashboard includes free professional tools:</p>
<ul style="text-align:left;padding-left:20px;color:#374151;">
  <li><strong>CRM</strong> — manage clients and follow-ups</li>
  <li><strong>Statistics</strong> — views, enquiries and favourites per vehicle</li>
  <li><strong>Contract generator</strong> — sale and lease agreements</li>
  <li><strong>Finance calculator</strong> — instalments and profitability</li>
  <li><strong>Export catalogue</strong> — downloadable PDF of your stock</li>
</ul>`,
      ctaLabel: isEs ? 'Explorar herramientas' : 'Explore tools',
      ctaUrl: toolsUrl,
    },
    3: {
      heading: isEs
        ? `Tu primera semana — ¿cómo va todo, ${dealerName}?`
        : `Your first week — how is everything going, ${dealerName}?`,
      body: isEs
        ? `<p>Ya llevas una semana en Tracciona. Algunos consejos para mejorar resultados:</p>
<ul style="text-align:left;padding-left:20px;color:#374151;">
  <li>Responde las consultas en menos de <strong>2 horas</strong> (mejora tu tasa de respuesta)</li>
  <li>Actualiza los precios regularmente — los anuncios con precio actualizado tienen más visibilidad</li>
  <li>Añade más fotos si aún tienes pocas</li>
  <li>Revisa tus estadísticas para saber qué vehículos generan más interés</li>
</ul>
<p>Puedes ver todas tus métricas en el panel de estadísticas.</p>`
        : `<p>You have been on Tracciona for a week now. Some tips to improve results:</p>
<ul style="text-align:left;padding-left:20px;color:#374151;">
  <li>Reply to enquiries within <strong>2 hours</strong> (improves your response rate)</li>
  <li>Update prices regularly — listings with updated prices get more visibility</li>
  <li>Add more photos if you still have few</li>
  <li>Check your statistics to see which vehicles generate the most interest</li>
</ul>
<p>You can see all your metrics in the statistics panel.</p>`,
      ctaLabel: isEs ? 'Ver mis estadísticas' : 'View my statistics',
      ctaUrl: statsUrl,
    },
    4: {
      heading: isEs
        ? `Dos semanas en Tracciona — maximiza tu visibilidad, ${dealerName}`
        : `Two weeks on Tracciona — maximise your visibility, ${dealerName}`,
      body: isEs
        ? `<p>Los dealers con mejor rendimiento en Tracciona siguen estas prácticas:</p>
<ul style="text-align:left;padding-left:20px;color:#374151;">
  <li><strong>Stock actualizado</strong> — eliminan los vendidos y añaden novedades rápido</li>
  <li><strong>Fotos profesionales</strong> — 8-12 fotos por vehículo, buena iluminación</li>
  <li><strong>Descripciones detalladas</strong> — historial, estado, revisiones incluidas</li>
  <li><strong>Precios competitivos</strong> — comparan con el mercado antes de publicar</li>
</ul>
<p>¿Tienes dudas o necesitas ayuda? Responde este email o escríbenos directamente.</p>`
        : `<p>The best-performing dealers on Tracciona follow these practices:</p>
<ul style="text-align:left;padding-left:20px;color:#374151;">
  <li><strong>Up-to-date stock</strong> — remove sold vehicles and add new ones quickly</li>
  <li><strong>Professional photos</strong> — 8-12 photos per vehicle, good lighting</li>
  <li><strong>Detailed descriptions</strong> — history, condition, included services</li>
  <li><strong>Competitive prices</strong> — compare with the market before publishing</li>
</ul>
<p>Questions or need help? Reply to this email or contact us directly.</p>`,
      ctaLabel: isEs ? 'Ver el catálogo completo' : 'Browse the full catalogue',
      ctaUrl: catalogUrl,
    },
  }

  const content = contents[step] ?? contents[0]!
  if (!content) return ''
  // Fix template literal in step 1 heading (dealerName is not a template variable here)
  const heading = content.heading.replace('${dealerName}', dealerName)

  return `<!DOCTYPE html>
<html lang="${isEs ? 'es' : 'en'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Inter',Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f4f4f5;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600"
          style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background:${primary};padding:24px;text-align:center;">
              <p style="margin:0;color:#a0b4b8;font-size:12px;text-transform:uppercase;letter-spacing:1px;">
                ${isEs ? 'Panel de anunciante' : 'Dealer dashboard'}
              </p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:20px;font-weight:700;line-height:1.3;">
                ${heading}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 24px;color:#374151;font-size:15px;line-height:1.6;">
              ${content.body}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 24px 28px;text-align:center;">
              <a href="${content.ctaUrl}"
                style="display:inline-block;background:${primary};color:#ffffff;text-decoration:none;
                  padding:12px 28px;border-radius:6px;font-size:14px;font-weight:600;">
                ${content.ctaLabel}
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;
              text-align:center;font-size:12px;color:#9ca3af;">
              <p style="margin:0 0 4px;">
                ${isEs ? 'Recibes este email porque eres anunciante en' : 'You receive this email because you are a dealer on'}
                <a href="${siteUrl}" style="color:#9ca3af;text-decoration:underline;">Tracciona</a>.
              </p>
              <p style="margin:0;">
                <a href="${dashboardUrl}" style="color:#9ca3af;text-decoration:underline;">
                  ${isEs ? 'Acceder al panel' : 'Go to dashboard'}
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

// ── Query helpers ────────────────────────────────────────────────────────────

/**
 * Fetch active dealers created within the last 14 days (with onboarding pending).
 */
export async function getPendingDealers(supabase: SupabaseClient): Promise<DealerRow[]> {
  const cutoff = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await (supabase as any)
    .from('dealers')
    .select('id, user_id, company_name, email, created_at, locale')
    .eq('status', 'active')
    .gte('created_at', cutoff)

  if (error) {
    logger.error(`[dealer-onboarding] Failed to fetch dealers: ${error.message}`)
    return []
  }

  return (data ?? []) as unknown as DealerRow[]
}

/**
 * Fetch already-sent steps for a dealer.
 */
export async function getSentSteps(supabase: SupabaseClient, dealerId: string): Promise<number[]> {
  const { data } = await (supabase as any)
    .from('dealer_onboarding_emails')
    .select('step')
    .eq('dealer_id', dealerId)

  return ((data ?? []) as unknown as SentStepsRow[]).map((r) => r.step)
}

/**
 * Mark a step as sent.
 */
export async function markStepSent(
  supabase: SupabaseClient,
  dealerId: string,
  step: number,
): Promise<void> {
  await (supabase as any)
    .from('dealer_onboarding_emails')
    .upsert({ dealer_id: dealerId, step, sent_at: new Date().toISOString() })
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  const body = await readBody<CronBody>(event).catch(() => ({}) as CronBody)
  verifyCronSecret(event, body?.secret)

  const supabase = serverSupabaseServiceRole(event) as any
  const siteUrl = getSiteUrl()
  const runtimeConfig = useRuntimeConfig()
  const resendApiKey = runtimeConfig.resendApiKey || process.env.RESEND_API_KEY

  let sent = 0
  let skipped = 0
  let errors = 0
  const now = Date.now()

  // ── 1. Fetch dealers with active onboarding window ───────────────────────
  const dealers = await getPendingDealers(supabase)

  if (dealers.length === 0) {
    logger.info('[dealer-onboarding] No active dealers in onboarding window')
    return { sent: 0, skipped: 0, errors: 0, reason: 'no_dealers' }
  }

  // ── 2. Process each dealer ───────────────────────────────────────────────
  const batchResult = await processBatch({
    items: dealers,
    batchSize: 50,
    processor: async (dealer: DealerRow) => {
      // Compute days since registration
      const createdAt = dealer.created_at ? new Date(dealer.created_at).getTime() : now
      const daysSince = Math.floor((now - createdAt) / (24 * 60 * 60 * 1000))

      // Steps that should have been sent by now
      const dueSteps = getDueSteps(daysSince)
      if (dueSteps.length === 0) {
        skipped++
        return
      }

      // Steps already sent
      const sentSteps = await getSentSteps(supabase, dealer.id)
      const pendingSteps = dueSteps.filter((s) => !sentSteps.includes(s))

      if (pendingSteps.length === 0) {
        skipped++
        return
      }

      // Resolve email address (dealer.email or linked user)
      let recipientEmail = dealer.email
      if (!recipientEmail && dealer.user_id) {
        const { data: userData } = await supabase
          .from('users')
          .select('email')
          .eq('id', dealer.user_id)
          .single()
        recipientEmail = (userData as { email?: string } | null)?.email ?? null
      }

      if (!recipientEmail) {
        logger.warn(`[dealer-onboarding] No email for dealer ${dealer.id}, skipping`)
        skipped++
        return
      }

      const locale = dealer.locale ?? 'es'
      const dealerName = resolveName(dealer.company_name as Record<string, string> | string, locale)

      // Send each pending step in sequence
      for (const step of pendingSteps) {
        const schedule = ONBOARDING_SCHEDULE.find((s) => s.step === step)
        if (!schedule) continue

        const subject = locale === 'en' ? schedule.subjectEn : schedule.subjectEs
        const html = buildOnboardingHtml(step, dealerName, siteUrl, locale)

        if (!resendApiKey) {
          logger.warn(
            `[dealer-onboarding] RESEND_API_KEY not set — mock send step ${step} to ${recipientEmail}`,
          )
          await markStepSent(supabase, dealer.id, step)
          skipped++
          continue
        }

        try {
          const resend = new Resend(resendApiKey)
          const result = await resend.emails.send({
            from: `${getSiteName()} <hola@${getSiteUrl().replace('https://', '').replace('http://', '')}>`,
            to: recipientEmail,
            subject,
            html,
          })

          if (result.error) {
            errors++
            logger.error(
              `[dealer-onboarding] Resend error step ${step} for ${recipientEmail}: ${result.error.message}`,
            )
          } else {
            await markStepSent(supabase, dealer.id, step)
            sent++
          }
        } catch (err: unknown) {
          errors++
          const msg = err instanceof Error ? err.message : 'Unknown error'
          logger.error(`[dealer-onboarding] Send failed step ${step} for ${recipientEmail}: ${msg}`)
        }
      }
    },
  })

  logger.info(
    `[dealer-onboarding] Complete — sent: ${sent}, skipped: ${skipped}, errors: ${errors}, dealers: ${dealers.length}`,
  )

  return {
    sent,
    skipped,
    errors,
    dealers: dealers.length,
    batchResult: { processed: batchResult.processed, errors: batchResult.errors },
  }
})
