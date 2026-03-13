import { describe, it, expect } from 'vitest'

/**
 * Tests for usePricingSuggestion composable — price range calculation.
 * Inline copies of pure functions for cross-branch compatibility.
 */

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  if (sorted.length === 1) return sorted[0]
  const index = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower)
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return percentile(sorted, 50)
}

function removeOutliers(values: number[], factor: number = 1.5): number[] {
  if (values.length < 4) return values
  const sorted = [...values].sort((a, b) => a - b)
  const q1 = percentile(sorted, 25)
  const q3 = percentile(sorted, 75)
  const iqr = q3 - q1
  const lower = q1 - factor * iqr
  const upper = q3 + factor * iqr
  return sorted.filter((v) => v >= lower && v <= upper)
}

function getConfidence(count: number): 'low' | 'medium' | 'high' {
  if (count >= 10) return 'high'
  if (count >= 5) return 'medium'
  return 'low'
}

function getPositioning(
  currentPrice: number,
  low: number,
  high: number,
): 'below_market' | 'at_market' | 'above_market' {
  if (currentPrice < low) return 'below_market'
  if (currentPrice > high) return 'above_market'
  return 'at_market'
}

function similarityScore(
  target: { year: number; km: number },
  comparable: { year: number; km: number },
): number {
  const yearDiff = Math.abs(target.year - comparable.year)
  const kmDiff = Math.abs(target.km - comparable.km)
  const yearScore = Math.max(0, 1 - yearDiff * 0.15)
  const kmScore = Math.max(0, 1 - (kmDiff / 50000) * 0.1)
  return yearScore * 0.6 + kmScore * 0.4
}

interface PriceSuggestion {
  low: number
  mid: number
  high: number
  comparableCount: number
  confidence: 'low' | 'medium' | 'high'
  positioning: 'below_market' | 'at_market' | 'above_market'
}

function calculateSuggestion(
  comparablePrices: number[],
  currentPrice?: number,
): PriceSuggestion | null {
  if (comparablePrices.length === 0) return null
  const cleaned = removeOutliers(comparablePrices)
  if (cleaned.length === 0) return null
  const sorted = [...cleaned].sort((a, b) => a - b)
  const low = Math.round(percentile(sorted, 25))
  const mid = Math.round(percentile(sorted, 50))
  const high = Math.round(percentile(sorted, 75))
  const confidence = getConfidence(cleaned.length)
  const positioning = currentPrice ? getPositioning(currentPrice, low, high) : 'at_market'
  return { low, mid, high, comparableCount: cleaned.length, confidence, positioning }
}

// ─── percentile ─────────────────────────────────────────────

describe('percentile', () => {
  it('returns 0 for empty array', () => {
    expect(percentile([], 50)).toBe(0)
  })

  it('returns the only value for single element', () => {
    expect(percentile([42], 50)).toBe(42)
  })

  it('returns correct P50 (median) for odd array', () => {
    expect(percentile([10, 20, 30], 50)).toBe(20)
  })

  it('returns correct P50 (median) for even array', () => {
    expect(percentile([10, 20, 30, 40], 50)).toBe(25)
  })

  it('returns correct P25', () => {
    const sorted = [10, 20, 30, 40, 50]
    expect(percentile(sorted, 25)).toBe(20)
  })

  it('returns correct P75', () => {
    const sorted = [10, 20, 30, 40, 50]
    expect(percentile(sorted, 75)).toBe(40)
  })

  it('P0 returns first element', () => {
    expect(percentile([5, 10, 15], 0)).toBe(5)
  })

  it('P100 returns last element', () => {
    expect(percentile([5, 10, 15], 100)).toBe(15)
  })
})

// ─── median ─────────────────────────────────────────────────

describe('median', () => {
  it('returns 0 for empty array', () => {
    expect(median([])).toBe(0)
  })

  it('returns value for single element', () => {
    expect(median([100])).toBe(100)
  })

  it('returns middle value for odd count', () => {
    expect(median([30, 10, 20])).toBe(20)
  })

  it('returns average of two middle values for even count', () => {
    expect(median([40, 10, 30, 20])).toBe(25)
  })

  it('handles unsorted input', () => {
    expect(median([50, 10, 40, 20, 30])).toBe(30)
  })
})

// ─── removeOutliers ─────────────────────────────────────────

describe('removeOutliers', () => {
  it('returns same array if less than 4 elements', () => {
    expect(removeOutliers([1, 2, 3])).toEqual([1, 2, 3])
  })

  it('removes extreme outliers', () => {
    const data = [10, 12, 11, 13, 12, 11, 10, 100]
    const result = removeOutliers(data)
    expect(result).not.toContain(100)
  })

  it('keeps data within normal range', () => {
    const data = [45000, 47000, 46000, 48000, 44000]
    const result = removeOutliers(data)
    expect(result).toHaveLength(5)
  })

  it('handles uniform data', () => {
    const data = [50, 50, 50, 50]
    const result = removeOutliers(data)
    expect(result).toEqual([50, 50, 50, 50])
  })

  it('custom factor adjusts sensitivity', () => {
    const data = [10, 12, 11, 13, 12, 11, 10, 25]
    const strictResult = removeOutliers(data, 1.0)
    const looseResult = removeOutliers(data, 3.0)
    expect(looseResult.length).toBeGreaterThanOrEqual(strictResult.length)
  })
})

// ─── getConfidence ──────────────────────────────────────────

describe('getConfidence', () => {
  it('returns low for 0-4 comparables', () => {
    expect(getConfidence(0)).toBe('low')
    expect(getConfidence(4)).toBe('low')
  })

  it('returns medium for 5-9 comparables', () => {
    expect(getConfidence(5)).toBe('medium')
    expect(getConfidence(9)).toBe('medium')
  })

  it('returns high for 10+ comparables', () => {
    expect(getConfidence(10)).toBe('high')
    expect(getConfidence(50)).toBe('high')
  })
})

// ─── getPositioning ─────────────────────────────────────────

describe('getPositioning', () => {
  it('below_market when price < low', () => {
    expect(getPositioning(30000, 35000, 45000)).toBe('below_market')
  })

  it('at_market when price in range', () => {
    expect(getPositioning(40000, 35000, 45000)).toBe('at_market')
  })

  it('above_market when price > high', () => {
    expect(getPositioning(50000, 35000, 45000)).toBe('above_market')
  })

  it('at_market when price equals low boundary', () => {
    expect(getPositioning(35000, 35000, 45000)).toBe('at_market')
  })

  it('at_market when price equals high boundary', () => {
    expect(getPositioning(45000, 35000, 45000)).toBe('at_market')
  })
})

// ─── similarityScore ────────────────────────────────────────

describe('similarityScore', () => {
  it('identical vehicles score 1.0', () => {
    expect(similarityScore({ year: 2020, km: 50000 }, { year: 2020, km: 50000 })).toBe(1)
  })

  it('1 year difference reduces score', () => {
    const score = similarityScore({ year: 2020, km: 50000 }, { year: 2021, km: 50000 })
    expect(score).toBeLessThan(1)
    expect(score).toBeGreaterThan(0.8)
  })

  it('large year difference penalizes heavily', () => {
    const score = similarityScore({ year: 2020, km: 50000 }, { year: 2010, km: 50000 })
    expect(score).toBeLessThan(0.5)
  })

  it('large km difference penalizes', () => {
    const score = similarityScore({ year: 2020, km: 50000 }, { year: 2020, km: 200000 })
    expect(score).toBeLessThan(1)
    expect(score).toBeGreaterThan(0.5)
  })

  it('score is always between 0 and 1', () => {
    const score = similarityScore({ year: 2020, km: 0 }, { year: 2000, km: 500000 })
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(1)
  })

  it('score is symmetric', () => {
    const a = { year: 2020, km: 50000 }
    const b = { year: 2018, km: 80000 }
    expect(similarityScore(a, b)).toBe(similarityScore(b, a))
  })
})

// ─── calculateSuggestion ────────────────────────────────────

describe('calculateSuggestion', () => {
  it('returns null for empty prices', () => {
    expect(calculateSuggestion([])).toBeNull()
  })

  it('returns suggestion for single price', () => {
    const result = calculateSuggestion([50000])
    expect(result).not.toBeNull()
    expect(result!.mid).toBe(50000)
    expect(result!.confidence).toBe('low')
  })

  it('calculates correct range for multiple prices', () => {
    const prices = [40000, 42000, 45000, 48000, 50000]
    const result = calculateSuggestion(prices)
    expect(result).not.toBeNull()
    expect(result!.low).toBeLessThanOrEqual(result!.mid)
    expect(result!.mid).toBeLessThanOrEqual(result!.high)
    expect(result!.comparableCount).toBe(5)
  })

  it('has high confidence with 10+ comparables', () => {
    const prices = Array.from({ length: 15 }, (_, i) => 40000 + i * 1000)
    const result = calculateSuggestion(prices)
    expect(result!.confidence).toBe('high')
  })

  it('detects below_market positioning', () => {
    const prices = [40000, 42000, 45000, 48000, 50000]
    const result = calculateSuggestion(prices, 35000)
    expect(result!.positioning).toBe('below_market')
  })

  it('detects at_market positioning', () => {
    const prices = [40000, 42000, 45000, 48000, 50000]
    const result = calculateSuggestion(prices, 45000)
    expect(result!.positioning).toBe('at_market')
  })

  it('detects above_market positioning', () => {
    const prices = [40000, 42000, 45000, 48000, 50000]
    const result = calculateSuggestion(prices, 55000)
    expect(result!.positioning).toBe('above_market')
  })

  it('defaults to at_market when no current price', () => {
    const prices = [40000, 42000, 45000, 48000, 50000]
    const result = calculateSuggestion(prices)
    expect(result!.positioning).toBe('at_market')
  })

  it('removes outliers from calculation', () => {
    const prices = [40000, 42000, 45000, 48000, 50000, 200000]
    const result = calculateSuggestion(prices)
    expect(result).not.toBeNull()
    // The outlier 200000 should be removed, so high should be well under 200000
    expect(result!.high).toBeLessThan(100000)
  })
})
