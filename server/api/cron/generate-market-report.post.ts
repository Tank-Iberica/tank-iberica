/**
 * POST /api/cron/generate-market-report
 *
 * Quarterly cron: generates the market report HTML and uploads it to
 * Supabase Storage bucket "reports" as `reports/{quarter}-{locale}.html`.
 * Records metadata in the `market_reports` table.
 *
 * Runs: first day of each quarter at 06:00 UTC
 * (1-jan, 1-apr, 1-jul, 1-oct — see .github/workflows/cron-scheduler.yml)
 *
 * Protected by CRON_SECRET (x-cron-secret header).
 */
import { defineEventHandler, readBody } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import { serverSupabaseServiceRole } from '#supabase/server'
import { verifyCronSecret } from '../../utils/verifyCronSecret'
import { logger } from '../../utils/logger'
import { safeError } from '../../utils/safeError'
import { generateMarketReport } from '../../services/marketReport'

// ── Constants ─────────────────────────────────────────────────────────────────

const BUCKET = 'reports'
const LOCALES = ['es', 'en'] as const

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getCurrentQuarter(date: Date = new Date()): string {
  const q = Math.ceil((date.getMonth() + 1) / 3)
  return `Q${q}-${date.getFullYear()}`
}

export function buildStoragePath(quarter: string, locale: string): string {
  return `${quarter}-${locale}.html`
}

/**
 * Ensure the "reports" storage bucket exists (creates it if missing).
 * Private bucket — access only via signed URLs.
 */
export async function ensureBucketExists(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: false,
    allowedMimeTypes: ['text/html'],
  })
  // Ignore "already exists" error (PostgrestError code 23505 or storage error)
  if (error && !error.message.includes('already exists') && !error.message.includes('duplicate')) {
    throw new Error(`Failed to create storage bucket: ${error.message}`)
  }
}

export interface GenerateResult {
  quarter: string
  localesProcessed: string[]
  errors: string[]
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  await verifyCronSecret(event)

  const body = await readBody(event).catch(() => ({}))
  const quarter = typeof body?.quarter === 'string' ? body.quarter : getCurrentQuarter()
  const forceRegen = !!body?.force

  const supabase = serverSupabaseServiceRole(event)

  try {
    const result = await generateQuarterlyReport(supabase, quarter, forceRegen)
    return { ok: true, ...result }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('generate-market-report failed', { err: String(err) })
    throw safeError(500, msg)
  }
})

// ── Core logic (exported for testing) ────────────────────────────────────────

export async function generateQuarterlyReport(
  supabase: SupabaseClient,
  quarter: string,
  forceRegen = false,
): Promise<GenerateResult> {
  await ensureBucketExists(supabase)

  const localesProcessed: string[] = []
  const errors: string[] = []

  for (const locale of LOCALES) {
    const storagePath = buildStoragePath(quarter, locale)

    // Check if already generated (skip unless forced)
    if (!forceRegen) {
      const { data: existing } = await supabase
        .from('market_reports')
        .select('id')
        .eq('quarter', quarter)
        .eq('locale', locale)
        .single()

      if (existing) {
        logger.info('Market report already exists — skipping', { quarter, locale })
        localesProcessed.push(locale)
        continue
      }
    }

    try {
      // Generate HTML report
      const { html } = await generateMarketReport(supabase, { isPublic: true, locale })

      // Upload to Supabase Storage
      const htmlBytes = new TextEncoder().encode(html)
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, htmlBytes, {
          contentType: 'text/html; charset=utf-8',
          upsert: true,
          cacheControl: '86400', // 24h cache on CDN
        })

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`)
      }

      // Extract key metrics from generated report for metadata
      const reportData = await extractReportMetadata(supabase)

      // Upsert record in market_reports
      const { error: upsertError } = await supabase.from('market_reports').upsert(
        {
          quarter,
          locale,
          storage_path: storagePath,
          report_data: reportData,
          generated_at: new Date().toISOString(),
        },
        { onConflict: 'quarter,locale' },
      )

      if (upsertError) {
        throw new Error(`DB upsert failed: ${upsertError.message}`)
      }

      logger.info('Market report generated and stored', { quarter, locale, storagePath })
      localesProcessed.push(locale)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'unknown error'
      errors.push(`${locale}: ${msg}`)
      logger.error('Failed to generate market report for locale', {
        quarter,
        locale,
        err: String(err),
      })
    }
  }

  return { quarter, localesProcessed, errors }
}

async function extractReportMetadata(supabase: SupabaseClient): Promise<Record<string, unknown>> {
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const { data } = await supabase
    .from('market_data')
    .select('listings, avg_price, subcategory')
    .gte('month', threeMonthsAgo.toISOString())
    .limit(5000)

  if (!data || data.length === 0) return {}

  const rows = data as Array<{ listings: number; avg_price: number; subcategory: string }>
  const totalListings = rows.reduce((s, r) => s + (r.listings || 0), 0)
  const prices = rows.filter((r) => r.avg_price > 0).map((r) => r.avg_price)
  const avgPrice = prices.length ? Math.round(prices.reduce((s, v) => s + v, 0) / prices.length) : 0

  // Find top subcategory by listings
  const subcatMap = new Map<string, number>()
  for (const r of rows) {
    subcatMap.set(r.subcategory, (subcatMap.get(r.subcategory) ?? 0) + (r.listings || 0))
  }
  const topSubcategory = Array.from(subcatMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''

  return { totalListings, avgPrice, topSubcategory }
}
