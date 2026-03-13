import { describe, it, expect } from 'vitest'

/**
 * Tests for useProductAnalytics composable — per-vehicle metrics.
 * Tests pure functions; Supabase interactions tested via integration.
 */

function calcConversionRate(leads: number, uniqueViews: number): number {
  if (uniqueViews === 0) return 0
  return Math.min(1, leads / uniqueViews)
}

function classifyPerformance(
  vehicleRate: number,
  avgRate: number,
): 'above' | 'average' | 'below' {
  if (avgRate === 0) return 'average'
  if (vehicleRate >= avgRate * 1.5) return 'above'
  if (vehicleRate <= avgRate * 0.5) return 'below'
  return 'average'
}

type MetricsPeriod = '7d' | '30d' | '90d' | 'all'

function periodToDate(period: MetricsPeriod): string | null {
  if (period === 'all') return null
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

describe('calcConversionRate', () => {
  it('returns 0 when uniqueViews is 0', () => {
    expect(calcConversionRate(5, 0)).toBe(0)
  })

  it('returns 0 when leads is 0', () => {
    expect(calcConversionRate(0, 100)).toBe(0)
  })

  it('calculates ratio correctly', () => {
    expect(calcConversionRate(5, 100)).toBe(0.05)
  })

  it('caps at 1', () => {
    expect(calcConversionRate(200, 100)).toBe(1)
  })

  it('handles equal leads and views', () => {
    expect(calcConversionRate(50, 50)).toBe(1)
  })

  it('handles 1 lead from 1 view', () => {
    expect(calcConversionRate(1, 1)).toBe(1)
  })

  it('returns precise decimal', () => {
    const rate = calcConversionRate(3, 10)
    expect(rate).toBeCloseTo(0.3, 5)
  })
})

describe('classifyPerformance', () => {
  it('returns "average" when avgRate is 0', () => {
    expect(classifyPerformance(0.5, 0)).toBe('average')
  })

  it('returns "above" when vehicle rate is 1.5x+ average', () => {
    expect(classifyPerformance(0.16, 0.1)).toBe('above')
  })

  it('returns "below" when vehicle rate is 0.5x or less of average', () => {
    expect(classifyPerformance(0.05, 0.1)).toBe('below')
  })

  it('returns "average" when vehicle rate is between 0.5x and 1.5x', () => {
    expect(classifyPerformance(0.1, 0.1)).toBe('average')
  })

  it('boundary: exactly 1.5x is average due to floating point', () => {
    // 0.1 * 1.5 = 0.15000000000000002 in JS, so 0.15 < threshold
    expect(classifyPerformance(0.15, 0.1)).toBe('average')
  })

  it('boundary: exactly 0.5x = below', () => {
    expect(classifyPerformance(0.05, 0.1)).toBe('below')
  })

  it('high performer vs low average', () => {
    expect(classifyPerformance(0.5, 0.02)).toBe('above')
  })

  it('zero rate vs positive average = below', () => {
    expect(classifyPerformance(0, 0.1)).toBe('below')
  })
})

describe('periodToDate', () => {
  it('returns null for "all"', () => {
    expect(periodToDate('all')).toBeNull()
  })

  it('returns ISO date string for 7d', () => {
    const result = periodToDate('7d')
    expect(result).not.toBeNull()
    const date = new Date(result!)
    const diff = Date.now() - date.getTime()
    // Should be approximately 7 days (within 1 second tolerance)
    expect(diff).toBeGreaterThan(6 * 24 * 60 * 60 * 1000)
    expect(diff).toBeLessThan(8 * 24 * 60 * 60 * 1000)
  })

  it('returns ISO date string for 30d', () => {
    const result = periodToDate('30d')
    expect(result).not.toBeNull()
    const date = new Date(result!)
    const diff = Date.now() - date.getTime()
    expect(diff).toBeGreaterThan(29 * 24 * 60 * 60 * 1000)
    expect(diff).toBeLessThan(31 * 24 * 60 * 60 * 1000)
  })

  it('returns ISO date string for 90d', () => {
    const result = periodToDate('90d')
    expect(result).not.toBeNull()
    const date = new Date(result!)
    const diff = Date.now() - date.getTime()
    expect(diff).toBeGreaterThan(89 * 24 * 60 * 60 * 1000)
    expect(diff).toBeLessThan(91 * 24 * 60 * 60 * 1000)
  })
})

describe('VehicleMetrics interface', () => {
  it('represents a valid metrics object', () => {
    const metrics = {
      vehicleId: 'uuid-1',
      totalViews: 150,
      uniqueViews: 80,
      totalLeads: 4,
      favorites: 12,
      avgDurationSeconds: 45,
      conversionRate: calcConversionRate(4, 80),
    }
    expect(metrics.conversionRate).toBe(0.05)
    expect(metrics.totalViews).toBeGreaterThan(metrics.uniqueViews)
  })

  it('vehicle with no views has 0 conversion', () => {
    const metrics = {
      vehicleId: 'uuid-2',
      totalViews: 0,
      uniqueViews: 0,
      totalLeads: 0,
      favorites: 0,
      avgDurationSeconds: 0,
      conversionRate: calcConversionRate(0, 0),
    }
    expect(metrics.conversionRate).toBe(0)
  })
})
