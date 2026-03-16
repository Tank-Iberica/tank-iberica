/**
 * GET /api/market-report/latest
 *
 * Returns metadata about the most recently generated market report.
 * Used by MarketReportGate.vue to show live stats in the email-gate card.
 *
 * Public endpoint — no auth required.
 * Cached 1 hour (data changes at most quarterly).
 */
import { defineEventHandler, getQuery, setHeader } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { safeError } from '../../utils/safeError'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const locale = typeof query.locale === 'string' && query.locale === 'en' ? 'en' : 'es'

  setHeader(event, 'Cache-Control', 'public, max-age=3600, stale-while-revalidate=1800')

  const supabase = serverSupabaseServiceRole(event) as SupabaseClient

  try {
    const { data, error } = await supabase
      .from('market_reports')
      .select('quarter, generated_at, report_data')
      .eq('locale', locale)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      // No report generated yet — return empty state
      return { available: false, quarter: null, generatedAt: null, reportData: {} }
    }

    const report = data as {
      quarter: string
      generated_at: string
      report_data: Record<string, unknown>
    }

    return {
      available: true,
      quarter: report.quarter,
      generatedAt: report.generated_at,
      reportData: report.report_data ?? {},
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching report metadata'
    throw safeError(500, msg)
  }
})
