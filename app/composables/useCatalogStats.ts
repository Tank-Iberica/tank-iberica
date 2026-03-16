/**
 * Catalog statistics composable — aggregate metrics for the vehicle catalog.
 *
 * Provides:
 * - Category distribution (count per category/subcategory)
 * - Price distribution (ranges, average, median)
 * - Age distribution (year ranges)
 * - Location distribution (by province)
 * - Time-series new listings count
 *
 * Used for admin dashboard overview and public landing pages.
 * Pure calculation functions exported for testability.
 */

export interface CatalogStatsInput {
  price?: number
  year?: number
  km?: number
  categoryId?: string
  subcategoryId?: string
  province?: string
  createdAt?: string
}

export interface PriceDistribution {
  min: number
  max: number
  avg: number
  median: number
  ranges: Array<{ label: string; min: number; max: number; count: number }>
}

export interface CategoryCount {
  id: string
  count: number
  percentage: number
}

export interface ProvinceCount {
  province: string
  count: number
  percentage: number
}

/**
 * Default price range buckets for industrial vehicles.
 */
export const PRICE_RANGES = [
  { label: '< 10.000€', min: 0, max: 10000 },
  { label: '10.000–25.000€', min: 10000, max: 25000 },
  { label: '25.000–50.000€', min: 25000, max: 50000 },
  { label: '50.000–100.000€', min: 50000, max: 100000 },
  { label: '100.000–200.000€', min: 100000, max: 200000 },
  { label: '> 200.000€', min: 200000, max: Infinity },
]

/**
 * Calculate price distribution from a list of prices.
 */
export function calculatePriceDistribution(prices: number[]): PriceDistribution {
  const valid = prices.filter((p) => p > 0)
  if (valid.length === 0) {
    return {
      min: 0,
      max: 0,
      avg: 0,
      median: 0,
      ranges: PRICE_RANGES.map((r) => ({ ...r, count: 0 })),
    }
  }

  const sorted = [...valid].sort((a, b) => a - b)
  const min = sorted[0]!
  const max = sorted.at(-1)!
  const avg = Math.round(valid.reduce((s, v) => s + v, 0) / valid.length)
  const mid =
    sorted.length % 2 === 0
      ? Math.round((sorted[sorted.length / 2 - 1]! + sorted[sorted.length / 2]!) / 2)
      : sorted[Math.floor(sorted.length / 2)]!

  const ranges = PRICE_RANGES.map((r) => ({
    ...r,
    count: valid.filter((p) => p >= r.min && (r.max === Infinity ? true : p < r.max)).length,
  }))

  return { min, max, avg, median: mid, ranges }
}

/**
 * Calculate category distribution from a list of items.
 */
export function calculateCategoryDistribution(
  items: Array<{ categoryId?: string }>,
): CategoryCount[] {
  const counts = new Map<string, number>()
  for (const item of items) {
    if (!item.categoryId) continue
    counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1)
  }

  const total = items.length || 1
  return Array.from(counts.entries())
    .map(([id, count]) => ({
      id,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Calculate province distribution from a list of items.
 */
export function calculateProvinceDistribution(
  items: Array<{ province?: string }>,
): ProvinceCount[] {
  const counts = new Map<string, number>()
  for (const item of items) {
    if (!item.province) continue
    counts.set(item.province, (counts.get(item.province) ?? 0) + 1)
  }

  const total = items.length || 1
  return Array.from(counts.entries())
    .map(([province, count]) => ({
      province,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Calculate average age in years from vehicle years.
 */
export function calculateAverageAge(years: number[], currentYear?: number): number {
  const now = currentYear ?? new Date().getFullYear()
  const valid = years.filter((y) => y > 1900 && y <= now)
  if (valid.length === 0) return 0
  const ages = valid.map((y) => now - y)
  return Math.round((ages.reduce((s, a) => s + a, 0) / ages.length) * 10) / 10
}

/**
 * Count new listings per period (last N days buckets).
 */
export function countNewListingsByPeriod(
  createdDates: string[],
  periodDays: number = 30,
  bucketDays: number = 7,
): Array<{ period: string; count: number }> {
  const now = Date.now()
  const cutoff = now - periodDays * 24 * 60 * 60 * 1000
  const buckets: Array<{ period: string; count: number }> = []

  for (let start = cutoff; start < now; start += bucketDays * 24 * 60 * 60 * 1000) {
    const end = Math.min(start + bucketDays * 24 * 60 * 60 * 1000, now)
    const label = new Date(start).toISOString().slice(0, 10)
    const count = createdDates.filter((d) => {
      const t = new Date(d).getTime()
      return t >= start && t < end
    }).length
    buckets.push({ period: label, count })
  }

  return buckets
}
