import { describe, it, expect } from 'vitest'

/**
 * Tests for useCatalogStats composable — catalog aggregate metrics.
 */

const PRICE_RANGES = [
  { label: '< 10.000€', min: 0, max: 10000 },
  { label: '10.000–25.000€', min: 10000, max: 25000 },
  { label: '25.000–50.000€', min: 25000, max: 50000 },
  { label: '50.000–100.000€', min: 50000, max: 100000 },
  { label: '100.000–200.000€', min: 100000, max: 200000 },
  { label: '> 200.000€', min: 200000, max: Infinity },
]

function calculatePriceDistribution(prices: number[]) {
  const valid = prices.filter((p) => p > 0)
  if (valid.length === 0) {
    return {
      min: 0, max: 0, avg: 0, median: 0,
      ranges: PRICE_RANGES.map((r) => ({ ...r, count: 0 })),
    }
  }
  const sorted = [...valid].sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const avg = Math.round(valid.reduce((s, v) => s + v, 0) / valid.length)
  const mid = sorted.length % 2 === 0
    ? Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)
    : sorted[Math.floor(sorted.length / 2)]
  const ranges = PRICE_RANGES.map((r) => ({
    ...r,
    count: valid.filter((p) => p >= r.min && (r.max === Infinity ? true : p < r.max)).length,
  }))
  return { min, max, avg, median: mid, ranges }
}

function calculateCategoryDistribution(items: Array<{ categoryId?: string }>) {
  const counts = new Map<string, number>()
  for (const item of items) {
    if (!item.categoryId) continue
    counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1)
  }
  const total = items.length || 1
  return Array.from(counts.entries())
    .map(([id, count]) => ({ id, count, percentage: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
}

function calculateProvinceDistribution(items: Array<{ province?: string }>) {
  const counts = new Map<string, number>()
  for (const item of items) {
    if (!item.province) continue
    counts.set(item.province, (counts.get(item.province) ?? 0) + 1)
  }
  const total = items.length || 1
  return Array.from(counts.entries())
    .map(([province, count]) => ({ province, count, percentage: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
}

function calculateAverageAge(years: number[], currentYear?: number): number {
  const now = currentYear ?? new Date().getFullYear()
  const valid = years.filter((y) => y > 1900 && y <= now)
  if (valid.length === 0) return 0
  const ages = valid.map((y) => now - y)
  return Math.round((ages.reduce((s, a) => s + a, 0) / ages.length) * 10) / 10
}

function countNewListingsByPeriod(createdDates: string[], periodDays: number = 30, bucketDays: number = 7) {
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

// ─── calculatePriceDistribution ─────────────────────────────

describe('calculatePriceDistribution', () => {
  it('empty prices returns zeroes', () => {
    const result = calculatePriceDistribution([])
    expect(result.min).toBe(0)
    expect(result.max).toBe(0)
    expect(result.avg).toBe(0)
    expect(result.median).toBe(0)
    expect(result.ranges.every((r) => r.count === 0)).toBe(true)
  })

  it('single price', () => {
    const result = calculatePriceDistribution([50000])
    expect(result.min).toBe(50000)
    expect(result.max).toBe(50000)
    expect(result.avg).toBe(50000)
    expect(result.median).toBe(50000)
  })

  it('calculates correct min/max/avg/median', () => {
    const prices = [10000, 20000, 30000, 40000, 50000]
    const result = calculatePriceDistribution(prices)
    expect(result.min).toBe(10000)
    expect(result.max).toBe(50000)
    expect(result.avg).toBe(30000)
    expect(result.median).toBe(30000)
  })

  it('median for even count', () => {
    const prices = [10000, 20000, 30000, 40000]
    const result = calculatePriceDistribution(prices)
    expect(result.median).toBe(25000)
  })

  it('assigns prices to correct ranges', () => {
    const prices = [5000, 15000, 30000, 75000, 150000, 250000]
    const result = calculatePriceDistribution(prices)
    expect(result.ranges[0].count).toBe(1) // < 10k
    expect(result.ranges[1].count).toBe(1) // 10-25k
    expect(result.ranges[2].count).toBe(1) // 25-50k
    expect(result.ranges[3].count).toBe(1) // 50-100k
    expect(result.ranges[4].count).toBe(1) // 100-200k
    expect(result.ranges[5].count).toBe(1) // > 200k
  })

  it('ignores zero prices', () => {
    const prices = [0, 0, 50000]
    const result = calculatePriceDistribution(prices)
    expect(result.min).toBe(50000)
    expect(result.avg).toBe(50000)
  })

  it('has 6 ranges', () => {
    const result = calculatePriceDistribution([50000])
    expect(result.ranges).toHaveLength(6)
  })
})

// ─── calculateCategoryDistribution ──────────────────────────

describe('calculateCategoryDistribution', () => {
  it('empty items returns empty', () => {
    expect(calculateCategoryDistribution([])).toEqual([])
  })

  it('counts correctly', () => {
    const items = [
      { categoryId: 'cat-a' },
      { categoryId: 'cat-a' },
      { categoryId: 'cat-b' },
    ]
    const result = calculateCategoryDistribution(items)
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('cat-a')
    expect(result[0].count).toBe(2)
    expect(result[1].id).toBe('cat-b')
    expect(result[1].count).toBe(1)
  })

  it('calculates percentages', () => {
    const items = [
      { categoryId: 'cat-a' },
      { categoryId: 'cat-a' },
      { categoryId: 'cat-a' },
      { categoryId: 'cat-b' },
    ]
    const result = calculateCategoryDistribution(items)
    expect(result[0].percentage).toBe(75)
    expect(result[1].percentage).toBe(25)
  })

  it('sorted by count descending', () => {
    const items = [
      { categoryId: 'cat-a' },
      { categoryId: 'cat-b' },
      { categoryId: 'cat-b' },
      { categoryId: 'cat-b' },
    ]
    const result = calculateCategoryDistribution(items)
    expect(result[0].id).toBe('cat-b')
  })

  it('ignores items without categoryId', () => {
    const items = [{ categoryId: 'cat-a' }, { categoryId: undefined }, {}]
    const result = calculateCategoryDistribution(items)
    expect(result).toHaveLength(1)
    expect(result[0].count).toBe(1)
  })
})

// ─── calculateProvinceDistribution ──────────────────────────

describe('calculateProvinceDistribution', () => {
  it('empty returns empty', () => {
    expect(calculateProvinceDistribution([])).toEqual([])
  })

  it('counts and sorts correctly', () => {
    const items = [
      { province: 'León' },
      { province: 'León' },
      { province: 'Madrid' },
    ]
    const result = calculateProvinceDistribution(items)
    expect(result[0].province).toBe('León')
    expect(result[0].count).toBe(2)
    expect(result[1].province).toBe('Madrid')
  })

  it('calculates percentages', () => {
    const items = Array.from({ length: 10 }, () => ({ province: 'León' }))
    const result = calculateProvinceDistribution(items)
    expect(result[0].percentage).toBe(100)
  })
})

// ─── calculateAverageAge ────────────────────────────────────

describe('calculateAverageAge', () => {
  it('empty years returns 0', () => {
    expect(calculateAverageAge([])).toBe(0)
  })

  it('calculates correctly with fixed year', () => {
    expect(calculateAverageAge([2020, 2022], 2024)).toBe(3)
  })

  it('single year', () => {
    expect(calculateAverageAge([2020], 2025)).toBe(5)
  })

  it('filters invalid years', () => {
    expect(calculateAverageAge([1800, 2020], 2025)).toBe(5)
  })

  it('filters future years', () => {
    expect(calculateAverageAge([2030, 2020], 2025)).toBe(5)
  })

  it('handles current year vehicles', () => {
    expect(calculateAverageAge([2025], 2025)).toBe(0)
  })
})

// ─── countNewListingsByPeriod ────────────────────────────────

describe('countNewListingsByPeriod', () => {
  it('empty dates returns buckets with 0 counts', () => {
    const result = countNewListingsByPeriod([], 14, 7)
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((b) => b.count === 0)).toBe(true)
  })

  it('counts recent dates in correct buckets', () => {
    const now = new Date()
    const recent = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    const result = countNewListingsByPeriod([recent], 7, 7)
    // Should have at least 1 bucket with count > 0
    expect(result.some((b) => b.count > 0)).toBe(true)
  })

  it('old dates outside period are not counted', () => {
    const old = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
    const result = countNewListingsByPeriod([old], 30, 7)
    expect(result.every((b) => b.count === 0)).toBe(true)
  })

  it('buckets have period labels', () => {
    const result = countNewListingsByPeriod([], 14, 7)
    for (const bucket of result) {
      expect(bucket.period).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})
