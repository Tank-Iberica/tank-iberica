/**
 * Pure helper functions for useValoracion composable.
 * No reactive state — all functions are deterministic and testable in isolation.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { PriceTrend, ValoracionFormData, ValoracionResultData } from './valoracionTypes'

export function priceBarPosition(value: number, min: number, max: number): number {
  if (max === min) return 50
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
}

export function confidenceColor(confidence: string): string {
  switch (confidence) {
    case 'high':
      return 'var(--color-success)'
    case 'medium':
      return 'var(--color-warning)'
    default:
      return 'var(--color-error)'
  }
}

export function computeTrendFromHistory(historyRows: Array<Record<string, unknown>>): {
  trend: PriceTrend
  trendPct: number
} {
  if (historyRows.length < 2) return { trend: 'stable', trendPct: 0 }
  const recent = Number(historyRows[0]!.avg_price) || 0
  const previous = Number(historyRows[1]!.avg_price) || 0
  if (previous <= 0) return { trend: 'stable', trendPct: 0 }
  const trendPct = Math.round(((recent - previous) / previous) * 100)
  let trend: PriceTrend = 'stable'
  if (trendPct > 2) trend = 'rising'
  else if (trendPct < -2) trend = 'falling'
  return { trend, trendPct }
}

export function computeConfidenceLevel(sampleSize: number): 'high' | 'medium' | 'low' {
  if (sampleSize >= 20) return 'high'
  if (sampleSize >= 10) return 'medium'
  return 'low'
}

/** Compute price estimates from market data rows with year depreciation. */
export function computeValuationPrices(
  prices: number[],
  vehicleYear: number | null,
): { min: number; max: number; median: number } | null {
  if (prices.length === 0) return null
  const sorted = [...prices].sort((a, b) => a - b)
  const rawMin = Math.min(...prices) * 0.9
  const rawMax = Math.max(...prices) * 1.1
  const rawMedian = sorted[Math.floor(sorted.length / 2)] ?? sorted[0]!
  const currentYear = new Date().getFullYear()
  const year = vehicleYear || currentYear
  const ageFactor = Math.max(0.5, 1 - (currentYear - year) * 0.05)
  return {
    min: Math.round(rawMin * ageFactor),
    max: Math.round(rawMax * ageFactor),
    median: Math.round((rawMedian ?? 0) * ageFactor),
  }
}

/** Compute average days to sell from market data rows. */
export function computeAvgDaysToSell(rows: Array<Record<string, unknown>>): number {
  if (rows.length === 0) return 45
  return Math.round(
    rows.reduce((sum, r) => sum + (Number(r.avg_days_listed) || 45), 0) / rows.length,
  )
}

/** Fire-and-forget save valuation report to DB. */
export async function saveValuationReport(
  supabase: SupabaseClient,
  form: ValoracionFormData,
  result: ValoracionResultData,
  userId: string | null,
): Promise<void> {
  try {
    await supabase.from('valuation_reports' as never).insert({
      user_id: userId,
      email: form.email || null,
      brand: form.brand,
      model: form.model,
      year: form.year,
      km: form.km,
      province: form.province,
      subcategory: form.subcategory,
      estimated_min: result.min,
      estimated_median: result.median,
      estimated_max: result.max,
      market_trend: result.trend,
      trend_pct: result.trendPct,
      avg_days_to_sell: result.daysToSell,
      sample_size: result.sampleSize,
      confidence: result.confidence,
      report_type: 'basic',
    } as never)
  } catch {
    // valuation_reports may not exist yet
  }
}

/** Fetch trend data from price_history. */
export async function fetchTrendData(
  supabase: SupabaseClient,
  brand: string,
): Promise<{ trend: PriceTrend; trendPct: number }> {
  try {
    const { data } = await supabase
      .from('price_history' as never)
      .select('month, avg_price, sample_count')
      .eq('brand', brand.toLowerCase())
      .order('month', { ascending: false })
      .limit(2)
    return computeTrendFromHistory((data || []) as Array<Record<string, unknown>>)
  } catch {
    return { trend: 'stable', trendPct: 0 }
  }
}

export function trendIcon(trend: string): string {
  switch (trend) {
    case 'rising':
      return '\u2197'
    case 'falling':
      return '\u2198'
    default:
      return '\u2192'
  }
}
