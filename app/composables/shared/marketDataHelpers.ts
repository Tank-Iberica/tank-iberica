/**
 * Pure helper functions for market data calculations.
 * No reactive state — all functions are deterministic and testable in isolation.
 */

import { pctChange } from '~/composables/shared/dateHelpers'
import type { MarketDataRow, ValuationResult, CategoryStat } from './marketDataTypes'

/** Returns 'YYYY-MM' for a date offset by N months from now. */
export function getMonthCutoff(monthsAgo: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - monthsAgo)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/** Returns 'YYYY-Www' (ISO week) for a date offset by N weeks from now. */
export function getWeekCutoff(weeksAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - weeksAgo * 7)
  const y = d.getFullYear()
  // Approximate ISO week number
  const jan1 = new Date(y, 0, 1)
  const dayOfYear = Math.floor((d.getTime() - jan1.getTime()) / 86400000) + 1
  const week = Math.ceil(dayOfYear / 7)
  return `${y}-W${String(week).padStart(2, '0')}`
}

/** Determine confidence level based on sample size. */
export function getConfidence(sampleSize: number): 'low' | 'medium' | 'high' {
  if (sampleSize >= 20) return 'high'
  if (sampleSize >= 10) return 'medium'
  return 'low'
}

/** Determine trend direction from percentage change. */
export function getTrendDirection(pct: number): 'rising' | 'falling' | 'stable' {
  if (pct > 2) return 'rising'
  if (pct < -2) return 'falling'
  return 'stable'
}

/** Compute the median from a sorted array of numbers. */
export function computeMedian(sorted: number[]): number {
  if (sorted.length === 0) return 0
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2
  }
  return sorted[mid]!
}

/** Depreciation factor for a given model year (~5% per year, floor 10%). */
export function depreciationFactor(year: number | undefined): number {
  if (!year) return 1
  const yearsOld = Math.max(0, new Date().getFullYear() - year)
  return Math.max(0.1, 1 - yearsOld * 0.05)
}

/** Average days-to-sell from rows, or null if no data. */
export function avgDaysToSell(rows: MarketDataRow[]): number | null {
  const vals = rows.map((r) => r.avg_days_to_sell).filter((d): d is number => d !== null && d > 0)
  return vals.length > 0 ? Math.round(vals.reduce((s, d) => s + d, 0) / vals.length) : null
}

/** Trend pct between the two most recent months in rows. */
export function computeRowsTrend(rows: MarketDataRow[]): number {
  const months = [...new Set(rows.map((r) => r.month))].sort((a, b) => a.localeCompare(b)).reverse()
  if (months.length < 2) return 0
  const cur = rows.filter((r) => r.month === months[0])
  const prev = rows.filter((r) => r.month === months[1])
  const curAvg = cur.length > 0 ? cur.reduce((s, r) => s + r.avg_price, 0) / cur.length : 0
  const prevAvg = prev.length > 0 ? prev.reduce((s, r) => s + r.avg_price, 0) / prev.length : 0
  return pctChange(curAvg, prevAvg)
}

type SubcatAggregate = { totalPrice: number; totalListings: number; count: number }

/** Aggregate rows into a per-subcategory map of price/listing totals. */
export function aggregateBySubcategory(rows: MarketDataRow[]): Map<string, SubcatAggregate> {
  const map = new Map<string, SubcatAggregate>()
  for (const row of rows) {
    const existing = map.get(row.subcategory)
    if (existing) {
      existing.totalPrice += row.avg_price * row.listings
      existing.totalListings += row.listings
      existing.count++
    } else {
      map.set(row.subcategory, {
        totalPrice: row.avg_price * row.listings,
        totalListings: row.listings,
        count: 1,
      })
    }
  }
  return map
}

/** Compute valuation result from market data rows. */
export function computeValuation(rows: MarketDataRow[], year?: number): ValuationResult {
  const prices = rows
    .map((r) => r.avg_price)
    .filter((p) => p > 0)
    .sort((a, b) => a - b)
  const totalSample = rows.reduce((sum, r) => sum + r.listings, 0)
  const factor = depreciationFactor(year)
  const trendPct = computeRowsTrend(rows)
  return {
    estimated_min: Math.round((prices[0] ?? 0) * factor),
    estimated_median: Math.round(computeMedian(prices) * factor),
    estimated_max: Math.round((prices.at(-1) ?? 0) * factor),
    market_trend: getTrendDirection(trendPct),
    trend_pct: trendPct,
    avg_days_to_sell: avgDaysToSell(rows),
    sample_size: totalSample,
    confidence: getConfidence(totalSample),
  }
}

/** Build category stats from market data rows. */
export function buildCategoryStats(rows: MarketDataRow[]): CategoryStat[] {
  if (rows.length === 0) return []
  const uniqueMonths = [...new Set(rows.map((r) => r.month))]
    .sort((a, b) => a.localeCompare(b))
    .reverse()
  const latestMonth = uniqueMonths[0]
  const previousMonth = uniqueMonths.length >= 2 ? uniqueMonths[1] : null

  const latestMap = aggregateBySubcategory(rows.filter((r) => r.month === latestMonth))
  const prevMap = aggregateBySubcategory(
    previousMonth ? rows.filter((r) => r.month === previousMonth) : [],
  )

  const stats: CategoryStat[] = []
  for (const [subcategory, data] of latestMap.entries()) {
    const avgPrice = data.totalListings > 0 ? Math.round(data.totalPrice / data.totalListings) : 0
    const prev = prevMap.get(subcategory)
    const prevAvgPrice =
      (prev?.totalListings ?? 0) > 0 ? Math.round(prev!.totalPrice / prev!.totalListings) : 0
    stats.push({
      subcategory,
      avg_price: avgPrice,
      listings: data.totalListings,
      trend_pct: prev ? pctChange(avgPrice, prevAvgPrice) : 0,
    })
  }
  stats.sort((a, b) => b.listings - a.listings)
  return stats
}

/** Compute weighted price trend from rows with month/price/listings. */
export function computeWeightedTrend(
  rows: Pick<MarketDataRow, 'month' | 'avg_price' | 'listings'>[],
): number {
  if (rows.length === 0) return 0
  const uniqueMonths = [...new Set(rows.map((r) => r.month))]
    .sort((a, b) => a.localeCompare(b))
    .reverse()
  if (uniqueMonths.length < 2) return 0

  const currentRows = rows.filter((r) => r.month === uniqueMonths[0])
  const previousRows = rows.filter((r) => r.month === uniqueMonths[1])

  const currentTotal = currentRows.reduce((sum, r) => sum + r.avg_price * r.listings, 0)
  const currentListings = currentRows.reduce((sum, r) => sum + r.listings, 0)
  const previousTotal = previousRows.reduce((sum, r) => sum + r.avg_price * r.listings, 0)
  const previousListings = previousRows.reduce((sum, r) => sum + r.listings, 0)

  const currentAvg = currentListings > 0 ? currentTotal / currentListings : 0
  const previousAvg = previousListings > 0 ? previousTotal / previousListings : 0

  return pctChange(currentAvg, previousAvg)
}
