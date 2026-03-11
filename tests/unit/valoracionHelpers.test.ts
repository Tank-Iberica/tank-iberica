import { describe, it, expect, vi } from 'vitest'
import {
  priceBarPosition,
  confidenceColor,
  computeTrendFromHistory,
  computeConfidenceLevel,
  computeValuationPrices,
  computeAvgDaysToSell,
  saveValuationReport,
  fetchTrendData,
  trendIcon,
} from '../../app/composables/shared/valoracionHelpers'

describe('priceBarPosition', () => {
  it('returns 50 when min equals max', () => {
    expect(priceBarPosition(100, 100, 100)).toBe(50)
  })

  it('returns 0 for value at min', () => {
    expect(priceBarPosition(0, 0, 100)).toBe(0)
  })

  it('returns 100 for value at max', () => {
    expect(priceBarPosition(100, 0, 100)).toBe(100)
  })

  it('returns 50 for midpoint', () => {
    expect(priceBarPosition(50, 0, 100)).toBe(50)
  })

  it('clamps to 0-100', () => {
    expect(priceBarPosition(-10, 0, 100)).toBe(0)
    expect(priceBarPosition(200, 0, 100)).toBe(100)
  })
})

describe('confidenceColor', () => {
  it('returns success for high', () => {
    expect(confidenceColor('high')).toBe('var(--color-success)')
  })

  it('returns warning for medium', () => {
    expect(confidenceColor('medium')).toBe('var(--color-warning)')
  })

  it('returns error for low/unknown', () => {
    expect(confidenceColor('low')).toBe('var(--color-error)')
    expect(confidenceColor('unknown')).toBe('var(--color-error)')
  })
})

describe('computeTrendFromHistory', () => {
  it('returns stable for less than 2 rows', () => {
    expect(computeTrendFromHistory([])).toEqual({ trend: 'stable', trendPct: 0 })
    expect(computeTrendFromHistory([{ avg_price: 100 }])).toEqual({ trend: 'stable', trendPct: 0 })
  })

  it('returns stable when previous is 0', () => {
    const rows = [{ avg_price: 100 }, { avg_price: 0 }]
    expect(computeTrendFromHistory(rows)).toEqual({ trend: 'stable', trendPct: 0 })
  })

  it('detects rising trend', () => {
    const rows = [{ avg_price: 120 }, { avg_price: 100 }]
    const result = computeTrendFromHistory(rows)
    expect(result.trend).toBe('rising')
    expect(result.trendPct).toBe(20)
  })

  it('detects falling trend', () => {
    const rows = [{ avg_price: 80 }, { avg_price: 100 }]
    const result = computeTrendFromHistory(rows)
    expect(result.trend).toBe('falling')
    expect(result.trendPct).toBe(-20)
  })

  it('detects stable for small change', () => {
    const rows = [{ avg_price: 101 }, { avg_price: 100 }]
    const result = computeTrendFromHistory(rows)
    expect(result.trend).toBe('stable')
  })
})

describe('computeConfidenceLevel', () => {
  it('returns high for >= 20', () => {
    expect(computeConfidenceLevel(20)).toBe('high')
  })

  it('returns medium for 10-19', () => {
    expect(computeConfidenceLevel(10)).toBe('medium')
    expect(computeConfidenceLevel(15)).toBe('medium')
  })

  it('returns low for < 10', () => {
    expect(computeConfidenceLevel(5)).toBe('low')
    expect(computeConfidenceLevel(0)).toBe('low')
  })
})

describe('computeValuationPrices', () => {
  it('returns null for empty array', () => {
    expect(computeValuationPrices([], null)).toBeNull()
  })

  it('computes prices for single value', () => {
    const result = computeValuationPrices([10000], null)!
    expect(result.min).toBeLessThanOrEqual(result.median)
    expect(result.median).toBeLessThanOrEqual(result.max)
  })

  it('computes prices with spread', () => {
    const result = computeValuationPrices([8000, 10000, 12000], null)!
    expect(result.min).toBeLessThan(result.max)
    expect(result.median).toBe(10000) // middle value, no depreciation for current year
  })

  it('applies age factor for old vehicles', () => {
    const current = computeValuationPrices([10000], null)!
    const old = computeValuationPrices([10000], 2010)!
    expect(old.median).toBeLessThan(current.median)
  })

  it('uses current year when vehicleYear is null', () => {
    const result = computeValuationPrices([10000], null)!
    // age factor is 1.0 for current year, so median ≈ 10000
    expect(result.median).toBe(10000)
  })
})

describe('computeAvgDaysToSell', () => {
  it('returns 45 for empty rows', () => {
    expect(computeAvgDaysToSell([])).toBe(45)
  })

  it('uses 45 as fallback for NaN values', () => {
    const rows = [{ avg_days_listed: null }, { avg_days_listed: 'bad' }]
    expect(computeAvgDaysToSell(rows)).toBe(45)
  })

  it('averages valid values', () => {
    const rows = [{ avg_days_listed: 20 }, { avg_days_listed: 40 }]
    expect(computeAvgDaysToSell(rows)).toBe(30)
  })
})

describe('saveValuationReport', () => {
  it('inserts report to supabase', async () => {
    const insertFn = vi.fn().mockResolvedValue({ error: null })
    const supabase = { from: vi.fn().mockReturnValue({ insert: insertFn }) } as any
    const form = { email: 'a@b.com', brand: 'CAT', model: 'M1', year: 2020, km: 1000, province: 'Madrid', subcategory: 'tractors' }
    const result = { min: 8000, median: 10000, max: 12000, trend: 'stable', trendPct: 0, daysToSell: 30, sampleSize: 10, confidence: 'high' }
    await saveValuationReport(supabase, form as any, result as any, 'user-1')
    expect(supabase.from).toHaveBeenCalledWith('valuation_reports')
    expect(insertFn).toHaveBeenCalled()
  })

  it('does not throw on error', async () => {
    const supabase = { from: vi.fn().mockReturnValue({ insert: vi.fn().mockRejectedValue(new Error('fail')) }) } as any
    await expect(saveValuationReport(supabase, {} as any, {} as any, null)).resolves.toBeUndefined()
  })
})

describe('fetchTrendData', () => {
  it('returns trend from supabase data', async () => {
    const data = [{ avg_price: 120 }, { avg_price: 100 }]
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data }),
            }),
          }),
        }),
      }),
    } as any
    const result = await fetchTrendData(supabase, 'CAT')
    expect(result.trend).toBe('rising')
  })

  it('returns stable on error', async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockRejectedValue(new Error('fail')),
            }),
          }),
        }),
      }),
    } as any
    const result = await fetchTrendData(supabase, 'CAT')
    expect(result).toEqual({ trend: 'stable', trendPct: 0 })
  })

  it('lowercases brand in query', async () => {
    const eqFn = vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data: [] }),
      }),
    })
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: eqFn }),
      }),
    } as any
    await fetchTrendData(supabase, 'CATERPILLAR')
    expect(eqFn).toHaveBeenCalledWith('brand', 'caterpillar')
  })
})

describe('trendIcon', () => {
  it('returns up-right arrow for rising', () => {
    expect(trendIcon('rising')).toBe('\u2197')
  })

  it('returns down-right arrow for falling', () => {
    expect(trendIcon('falling')).toBe('\u2198')
  })

  it('returns right arrow for stable/unknown', () => {
    expect(trendIcon('stable')).toBe('\u2192')
    expect(trendIcon('other')).toBe('\u2192')
  })
})
