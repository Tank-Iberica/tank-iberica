import { describe, it, expect } from 'vitest'
import {
  groupByMonth,
  weightedAverage,
  computeTrend,
  computeSubcategoryStat,
  groupBy,
  computeProvinceStatsFromRows,
  getLatestMonth,
} from '../../app/composables/shared/datosHelpers'
import type { MarketRow } from '../../app/composables/shared/datosTypes'

function makeRow(overrides: Partial<MarketRow> = {}): MarketRow {
  return {
    id: '1',
    vertical: 'vehicles',
    subcategory: 'tractors',
    subcategory_label: 'Tractores',
    brand: null,
    province: null,
    month: '2026-01',
    avg_price: 10000,
    median_price: 9500,
    listing_count: 10,
    sold_count: 5,
    avg_days_to_sell: 30,
    ...overrides,
  }
}

describe('groupByMonth', () => {
  it('returns empty map for empty array', () => {
    expect(groupByMonth([]).size).toBe(0)
  })

  it('groups rows by month', () => {
    const rows = [
      makeRow({ month: '2026-01' }),
      makeRow({ month: '2026-01' }),
      makeRow({ month: '2026-02' }),
    ]
    const map = groupByMonth(rows)
    expect(map.size).toBe(2)
    expect(map.get('2026-01')!.length).toBe(2)
    expect(map.get('2026-02')!.length).toBe(1)
  })
})

describe('weightedAverage', () => {
  it('returns 0 for zero total listings', () => {
    expect(weightedAverage([makeRow({ listing_count: 0 })], 'avg_price')).toBe(0)
  })

  it('calculates weighted average correctly', () => {
    const rows = [
      makeRow({ avg_price: 10000, listing_count: 10 }),
      makeRow({ avg_price: 20000, listing_count: 30 }),
    ]
    // (10000*10 + 20000*30) / 40 = 700000/40 = 17500
    expect(weightedAverage(rows, 'avg_price')).toBe(17500)
  })

  it('works with median_price field', () => {
    const rows = [makeRow({ median_price: 5000, listing_count: 1 })]
    expect(weightedAverage(rows, 'median_price')).toBe(5000)
  })
})

describe('computeTrend', () => {
  it('returns stable when previous avg is 0', () => {
    const result = computeTrend(100, [makeRow({ avg_price: 0, listing_count: 0 })])
    expect(result.direction).toBe('stable')
    expect(result.pct).toBe(0)
  })

  it('detects rising trend', () => {
    const result = computeTrend(11000, [makeRow({ avg_price: 10000, listing_count: 10 })])
    expect(result.direction).toBe('rising')
    expect(result.pct).toBeGreaterThan(1)
  })

  it('detects falling trend', () => {
    const result = computeTrend(9000, [makeRow({ avg_price: 10000, listing_count: 10 })])
    expect(result.direction).toBe('falling')
    expect(result.pct).toBeLessThan(-1)
  })

  it('detects stable when change is small', () => {
    const result = computeTrend(10050, [makeRow({ avg_price: 10000, listing_count: 10 })])
    expect(result.direction).toBe('stable')
  })
})

describe('computeSubcategoryStat', () => {
  it('returns null for empty rows', () => {
    expect(computeSubcategoryStat('tractors', [])).toBeNull()
  })

  it('computes stat for single month', () => {
    const rows = [makeRow({ month: '2026-01', avg_price: 10000, listing_count: 5, sold_count: 2 })]
    const stat = computeSubcategoryStat('tractors', rows)!
    expect(stat.subcategory).toBe('tractors')
    expect(stat.avgPrice).toBe(10000)
    expect(stat.listingCount).toBe(5)
    expect(stat.soldCount).toBe(2)
    expect(stat.trendPct).toBe(0)
    expect(stat.trendDirection).toBe('stable')
  })

  it('computes trend from two months', () => {
    const rows = [
      makeRow({ month: '2026-02', avg_price: 11000, listing_count: 10 }),
      makeRow({ month: '2026-01', avg_price: 10000, listing_count: 10 }),
    ]
    const stat = computeSubcategoryStat('tractors', rows)!
    expect(stat.trendPct).toBeGreaterThan(0)
    expect(stat.trendDirection).toBe('rising')
  })

  it('handles null avg_days_to_sell', () => {
    const rows = [makeRow({ avg_days_to_sell: null })]
    const stat = computeSubcategoryStat('tractors', rows)!
    expect(stat.avgDaysToSell).toBeNull()
  })

  it('uses subcategory_label from first row', () => {
    const rows = [makeRow({ subcategory_label: 'Custom Label' })]
    const stat = computeSubcategoryStat('tractors', rows)!
    expect(stat.label).toBe('Custom Label')
  })
})

describe('groupBy', () => {
  it('returns empty map for empty array', () => {
    expect(groupBy([], () => 'x').size).toBe(0)
  })

  it('groups items by key function', () => {
    const items = [
      { type: 'a', v: 1 },
      { type: 'b', v: 2 },
      { type: 'a', v: 3 },
    ]
    const map = groupBy(items, (i) => i.type)
    expect(map.get('a')!.length).toBe(2)
    expect(map.get('b')!.length).toBe(1)
  })
})

describe('computeProvinceStatsFromRows', () => {
  it('returns empty for empty input', () => {
    expect(computeProvinceStatsFromRows([])).toEqual([])
  })

  it('aggregates by province', () => {
    const rows = [
      makeRow({ province: 'Madrid', avg_price: 10000, listing_count: 5 }),
      makeRow({ province: 'Madrid', avg_price: 20000, listing_count: 5 }),
      makeRow({ province: 'Barcelona', avg_price: 15000, listing_count: 3 }),
    ]
    const result = computeProvinceStatsFromRows(rows)
    expect(result.length).toBe(2)
    // Madrid: (10000*5 + 20000*5) / 10 = 15000, listings = 10
    const madrid = result.find((r) => r.province === 'Madrid')!
    expect(madrid.avgPrice).toBe(15000)
    expect(madrid.listingCount).toBe(10)
  })

  it('sorts by listing count descending', () => {
    const rows = [
      makeRow({ province: 'A', listing_count: 2 }),
      makeRow({ province: 'B', listing_count: 10 }),
    ]
    const result = computeProvinceStatsFromRows(rows)
    expect(result[0].province).toBe('B')
  })

  it('handles null province', () => {
    const rows = [makeRow({ province: null, listing_count: 1 })]
    const result = computeProvinceStatsFromRows(rows)
    expect(result[0].province).toBe('')
  })
})

describe('getLatestMonth', () => {
  it('returns null for empty array', () => {
    expect(getLatestMonth([])).toBeNull()
  })

  it('returns the most recent month', () => {
    const rows = [
      makeRow({ month: '2025-12' }),
      makeRow({ month: '2026-02' }),
      makeRow({ month: '2026-01' }),
    ]
    expect(getLatestMonth(rows)).toBe('2026-02')
  })

  it('handles single row', () => {
    expect(getLatestMonth([makeRow({ month: '2026-03' })])).toBe('2026-03')
  })
})
