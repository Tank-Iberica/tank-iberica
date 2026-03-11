/**
 * Pure helper functions for useDatos composable.
 * No reactive state — all functions are deterministic and testable in isolation.
 */

import type { MarketRow, CategoryStat, ProvinceStat, PriceTrend } from './datosTypes'

export function groupByMonth(rows: MarketRow[]): Map<string, MarketRow[]> {
  const byMonth = new Map<string, MarketRow[]>()
  for (const r of rows) {
    const existing = byMonth.get(r.month)
    if (existing) existing.push(r)
    else byMonth.set(r.month, [r])
  }
  return byMonth
}

export function weightedAverage(rows: MarketRow[], field: 'avg_price' | 'median_price'): number {
  const totalListings = rows.reduce((sum, r) => sum + r.listing_count, 0)
  if (totalListings === 0) return 0
  return rows.reduce((sum, r) => sum + r[field] * r.listing_count, 0) / totalListings
}

export function computeTrend(
  currentAvg: number,
  prevRows: MarketRow[],
): { pct: number; direction: PriceTrend } {
  const prevAvg = weightedAverage(prevRows, 'avg_price')
  if (prevAvg <= 0) return { pct: 0, direction: 'stable' }
  const pct = ((currentAvg - prevAvg) / prevAvg) * 100
  let direction: PriceTrend = 'stable'
  if (pct > 1) direction = 'rising'
  else if (pct < -1) direction = 'falling'
  return { pct, direction }
}

export function computeSubcategoryStat(subcategory: string, rows: MarketRow[]): CategoryStat | null {
  const byMonth = groupByMonth(rows)
  const months = Array.from(byMonth.keys()).sort((a, b) => b.localeCompare(a))
  if (!months.length) return null

  const latestRows = byMonth.get(months[0]!) ?? []
  const totalListings = latestRows.reduce((sum, r) => sum + r.listing_count, 0)
  const avgPrice = weightedAverage(latestRows, 'avg_price')
  const daysRows = latestRows.filter((r) => r.avg_days_to_sell !== null)
  const daysToSell =
    daysRows.length > 0
      ? daysRows.reduce((sum, r) => sum + (r.avg_days_to_sell ?? 0), 0) / daysRows.length
      : null

  const trend =
    months.length > 1
      ? computeTrend(avgPrice, byMonth.get(months[1]!) ?? [])
      : { pct: 0, direction: 'stable' as const }

  return {
    subcategory,
    label: latestRows[0]?.subcategory_label ?? subcategory,
    avgPrice: Math.round(avgPrice),
    medianPrice: Math.round(weightedAverage(latestRows, 'median_price')),
    listingCount: totalListings,
    soldCount: latestRows.reduce((sum, r) => sum + r.sold_count, 0),
    avgDaysToSell: daysToSell === null ? null : Math.round(daysToSell),
    trendPct: Math.round(trend.pct * 10) / 10,
    trendDirection: trend.direction,
  }
}

export function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = keyFn(item)
    const existing = map.get(key)
    if (existing) existing.push(item)
    else map.set(key, [item])
  }
  return map
}

export function computeProvinceStatsFromRows(latestRows: MarketRow[]): ProvinceStat[] {
  const byProvince = new Map<string, { totalPrice: number; totalListings: number }>()
  for (const r of latestRows) {
    const province = r.province ?? ''
    const existing = byProvince.get(province)
    if (existing) {
      existing.totalPrice += r.avg_price * r.listing_count
      existing.totalListings += r.listing_count
    } else {
      byProvince.set(province, {
        totalPrice: r.avg_price * r.listing_count,
        totalListings: r.listing_count,
      })
    }
  }

  const result: ProvinceStat[] = []
  for (const [province, data] of byProvince) {
    result.push({
      province,
      avgPrice: data.totalListings > 0 ? Math.round(data.totalPrice / data.totalListings) : 0,
      listingCount: data.totalListings,
    })
  }
  return result.sort((a, b) => b.listingCount - a.listingCount)
}

export function getLatestMonth(rows: MarketRow[]): string | null {
  if (!rows.length) return null
  return [...new Set(rows.map((r) => r.month))].sort((a, b) => b.localeCompare(a))[0] ?? null
}
