/**
 * POST /api/market-report/download
 *
 * Lead magnet email gate for the quarterly market report.
 * Accepts an email address, saves the lead, and returns a signed
 * download URL from Supabase Storage (valid 24 hours).
 *
 * If no stored report exists, falls back to generating the HTML on-the-fly
 * and returning it directly as a downloadable response.
 *
 * Rate limit: 5 requests per IP per hour (prevents lead form abuse).
 */
import { defineEventHandler, readBody, setHeader, createError } from 'h3'
import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import { getRateLimitKey, checkRateLimit } from '../../utils/rateLimit'
import { logger } from '../../utils/logger'
import { safeError } from '../../utils/safeError'
import { generateMarketReport } from '../../services/marketReport'
import { getCurrentQuarter } from '../cron/generate-market-report.post'

// ── Schema ────────────────────────────────────────────────────────────────────

const DownloadSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }).max(320),
  locale: z.enum(['es', 'en']).default('es'),
})

// ── Rate limit config ─────────────────────────────────────────────────────────

const RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 5 } // 5/hour per IP
const BUCKET = 'reports'
const SIGNED_URL_EXPIRES_IN = 86_400 // 24 hours

// ── Handler ───────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  // Rate limit
  const ipKey = getRateLimitKey(event)
  if (!checkRateLimit(`market-report-dl:${ipKey}`, RATE_LIMIT)) {
    throw createError({ statusCode: 429, message: 'Demasiadas solicitudes. Inténtalo más tarde.' })
  }

  // Validate body
  const raw = await readBody(event).catch(() => null)
  const parsed = DownloadSchema.safeParse(raw)
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? 'Datos inválidos'
    throw safeError(400, msg)
  }
  const { email, locale } = parsed.data

  const supabase = serverSupabaseServiceRole(event)
  const quarter = getCurrentQuarter()

  try {
    // Save lead
    await supabase.from('market_report_leads').insert({
      email,
      quarter,
      locale,
      ip_hash: hashIp(ipKey),
    })

    // Look up stored report
    const { data: reportRecord } = await supabase
      .from('market_reports')
      .select('storage_path, report_data, quarter')
      .eq('locale', locale)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single()

    if (reportRecord?.storage_path) {
      // Return signed URL (24h)
      const { data: signedData, error: signErr } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(reportRecord.storage_path, SIGNED_URL_EXPIRES_IN, {
          download: `informe-mercado-${reportRecord.quarter}-${locale}.html`,
        })

      if (signErr || !signedData?.signedUrl) {
        // Fall through to on-the-fly generation
        logger.warn(
          { quarter, locale, signErr },
          'Signed URL creation failed — falling back to on-the-fly',
        )
      } else {
        return {
          ok: true,
          url: signedData.signedUrl,
          quarter: reportRecord.quarter,
          filename: `informe-mercado-${reportRecord.quarter}-${locale}.html`,
          type: 'url',
        }
      }
    }

    // Fallback: generate on-the-fly and return as inline HTML download
    const { html } = await generateMarketReport(supabase, { isPublic: true, locale })
    const filename = `informe-mercado-${quarter}-${locale}.html`

    setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
    setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
    setHeader(event, 'Cache-Control', 'private, no-store')

    return html
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    const msg = err instanceof Error ? err.message : 'Error al procesar la solicitud'
    logger.error({ err, email, quarter }, 'market-report/download failed')
    throw safeError(500, msg)
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function hashIp(ip: string): string {
  // Simple hash to avoid storing raw IPs (GDPR)
  let h = 5381
  for (let i = 0; i < ip.length; i++) {
    h = (h * 33) ^ ip.charCodeAt(i)
  }
  return (h >>> 0).toString(16)
}
