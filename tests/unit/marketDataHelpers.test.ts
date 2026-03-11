import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('~/composables/shared/dateHelpers', () => ({
  pctChange: (cur: number, prev: number) => {
    if (prev === 0) return cur > 0 ? 100 : 0
    return Math.round(((cur - prev) / prev) * 100)
  },
}))

import {
  getMonthCutoff,
  getWeekCutoff,
  getConfidence,
  getTrendDirection,
  computeMedian,
  depreciationFactor,
  avgDaysToSell,
  computeRowsTrend,
  aggregateBySubcategory,
  computeValuation,
  buildCategoryStats,
  computeWeightedTrend,
} from '../../app/composables/shared/marketDataHelpers'

interface TestRow {
  subcategory: string
  month: string
  avg_price: number
  listings: number
  avg_days_to_sell: number | null
}

function makeRow(overrides: Partial<TestRow> = {}): TestRow {
  return {
    subcategory: 'tractors',
    month: '2026-01',
    avg_price: 10000,
    listings: 10,
    avg_days_to_sell: 30,
    ...overrides,
  }
}

describe('getMonthCutoff', () => {
  it('returns current month for 0', () => {
    const result = getMonthCutoff(0)
    expect(result).toMatch(/^\d{4}-\d{2}$/)
  })

  it('returns a past month for positive input', () => {
    const result = getMonthCutoff(12)
    expect(result).toMatch(/^\d{4}-\d{2}$/)
  })
})

describe('getWeekCutoff', () => {
  it('returns current week for 0', () => {
    const result = getWeekCutoff(0)
    expect(result).toMatch(/^\d{4}-W\d{2}$/)
  })

  it('returns past week for positive input', () => {
    const result = getWeekCutoff(4)
    expect(result).toMatch(/^\d{4}-W\d{2}$/)
  })
})

describe('getConfidence', () => {
  it('returns high for >= 20', () => {
    expect(getConfidence(20)).toBe('high')
    expect(getConfidence(100)).toBe('high')
  })

  it('returns medium for 10-19', () => {
    expect(getConfidence(10)).toBe('medium')
    expect(getConfidence(19)).toBe('medium')
  })

  it('returns low for < 10', () => {
    expect(getConfidence(0)).toBe('low')
    expect(getConfidence(9)).toBe('low')
  })
})

describe('getTrendDirection', () => {
  it('returns rising for > 2', () => {
    expect(getTrendDirection(3)).toBe('rising')
  })

  it('returns falling for < -2', () => {
    expect(getTrendDirection(-3)).toBe('falling')
  })

  it('returns stable for -2 to 2', () => {
    expect(getTrendDirection(0)).toBe('stable')
    expect(getTrendDirection(2)).toBe('stable')
    expect(getTrendDirection(-2)).toBe('stable')
  })
})

describe('computeMedian', () => {
  it('returns 0 for empty array', () => {
    expect(computeMedian([])).toBe(0)
  })

  it('returns middle value for odd length', () => {
    expect(computeMedian([1, 3, 5])).toBe(3)
  })

  it('returns average of two middle values for even length', () => {
    expect(computeMedian([1, 3, 5, 7])).toBe(4)
  })

  it('returns single value for length 1', () => {
    expect(computeMedian([42])).toBe(42)
  })
})

describe('depreciationFactor', () => {
  it('returns 1 for undefined year', () => {
    expect(depreciationFactor(undefined)).toBe(1)
  })

  it('returns 1 for current year', () => {
    const currentYear = new Date().getFullYear()
    expect(depreciationFactor(currentYear)).toBe(1)
  })

  it('returns 0.95 for 1 year old', () => {
    expect(depreciationFactor(new Date().getFullYear() - 1)).toBe(0.95)
  })

  it('floors at 0.1 for very old vehicles', () => {
    expect(depreciationFactor(1900)).toBe(0.1)
  })
})

describe('avgDaysToSell', () => {
  it('returns null for empty rows', () => {
    expect(avgDaysToSell([])).toBeNull()
  })

  it('filters null and zero values', () => {
    const rows = [
      makeRow({ avg_days_to_sell: null }),
      makeRow({ avg_days_to_sell: 0 }),
      makeRow({ avg_days_to_sell: 30 }),
    ] as any[]
    expect(avgDaysToSell(rows)).toBe(30)
  })

  it('averages positive values', () => {
    const rows = [
      makeRow({ avg_days_to_sell: 20 }),
      makeRow({ avg_days_to_sell: 40 }),
    ] as any[]
    expect(avgDaysToSell(rows)).toBe(30)
  })
})

describe('computeRowsTrend', () => {
  it('returns 0 for single month', () => {
    expect(computeRowsTrend([makeRow()] as any[])).toBe(0)
  })

  it('returns 0 for empty rows', () => {
    expect(computeRowsTrend([])).toBe(0)
  })

  it('computes trend between two months', () => {
    const rows = [
      makeRow({ month: '2026-02', avg_price: 11000 }),
      makeRow({ month: '2026-01', avg_price: 10000 }),
    ] as any[]
    expect(computeRowsTrend(rows)).toBe(10) // 10% increase
  })
})

describe('aggregateBySubcategory', () => {
  it('returns empty map for empty rows', () => {
    expect(aggregateBySubcategory([]).size).toBe(0)
  })

  it('aggregates by subcategory', () => {
    const rows = [
      makeRow({ subcategory: 'a', avg_price: 10000, listings: 5 }),
      makeRow({ subcategory: 'a', avg_price: 20000, listings: 5 }),
      makeRow({ subcategory: 'b', avg_price: 15000, listings: 3 }),
    ] as any[]
    const map = aggregateBySubcategory(rows)
    expect(map.size).toBe(2)
    const a = map.get('a')!
    expect(a.totalListings).toBe(10)
    expect(a.count).toBe(2)
  })
})

describe('computeValuation', () => {
  it('handles empty rows', () => {
    const result = computeValuation([])
    expect(result.sample_size).toBe(0)
    expect(result.confidence).toBe('low')
  })

  it('computes valuation from rows', () => {
    const rows = [
      makeRow({ avg_price: 10000, listings: 10 }),
      makeRow({ avg_price: 20000, listings: 10 }),
      makeRow({ avg_price: 15000, listings: 10 }),
    ] as any[]
    const result = computeValuation(rows)
    expect(result.estimated_min).toBeLessThanOrEqual(result.estimated_median)
    expect(result.estimated_median).toBeLessThanOrEqual(result.estimated_max)
    expect(result.sample_size).toBe(30)
  })

  it('applies depreciation for old year', () => {
    const rows = [makeRow({ avg_price: 10000, listings: 5 })] as any[]
    const currentYear = computeValuation(rows)
    const oldYear = computeValuation(rows, 2010)
    expect(oldYear.estimated_median).toBeLessThan(currentYear.estimated_median)
  })
})

describe('buildCategoryStats', () => {
  it('returns empty for empty rows', () => {
    expect(buildCategoryStats([])).toEqual([])
  })

  it('builds stats from single month', () => {
    const rows = [
      makeRow({ subcategory: 'tractors', month: '2026-01', avg_price: 10000, listings: 5 }),
    ] as any[]
    const stats = buildCategoryStats(rows)
    expect(stats.length).toBe(1)
    expect(stats[0].subcategory).toBe('tractors')
    expect(stats[0].avg_price).toBe(10000)
    expect(stats[0].trend_pct).toBe(0)
  })

  it('computes trend from two months', () => {
    const rows = [
      makeRow({ subcategory: 'tractors', month: '2026-02', avg_price: 11000, listings: 10 }),
      makeRow({ subcategory: 'tractors', month: '2026-01', avg_price: 10000, listings: 10 }),
    ] as any[]
    const stats = buildCategoryStats(rows)
    expect(stats[0].trend_pct).toBe(10)
  })

  it('sorts by listing count descending', () => {
    const rows = [
      makeRow({ subcategory: 'a', month: '2026-01', listings: 5 }),
      makeRow({ subcategory: 'b', month: '2026-01', listings: 20 }),
    ] as any[]
    const stats = buildCategoryStats(rows)
    expect(stats[0].subcategory).toBe('b')
  })
})

describe('computeWeightedTrend', () => {
  it('returns 0 for empty rows', () => {
    expect(computeWeightedTrend([])).toBe(0)
  })

  it('returns 0 for single month', () => {
    expect(computeWeightedTrend([makeRow()])).toBe(0)
  })

  it('computes weighted trend between months', () => {
    const rows = [
      { month: '2026-02', avg_price: 11000, listings: 10 },
      { month: '2026-01', avg_price: 10000, listings: 10 },
    ]
    expect(computeWeightedTrend(rows)).toBe(10) // 10% increase
  })

  it('weights by listings', () => {
    const rows = [
      { month: '2026-02', avg_price: 10000, listings: 100 },
      { month: '2026-02', avg_price: 20000, listings: 100 },
      { month: '2026-01', avg_price: 15000, listings: 200 },
    ]
    // Current weighted avg: (10000*100 + 20000*100) / 200 = 15000
    // Previous weighted avg: 15000
    // pctChange(15000, 15000) = 0
    expect(computeWeightedTrend(rows)).toBe(0)
  })
})
