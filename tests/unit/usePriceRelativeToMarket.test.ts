/**
 * Tests for pure functions in usePriceRelativeToMarket composable.
 */
import { describe, it, expect } from 'vitest'
import {
  calcDeviation,
  calcMean,
  classifyDeviation,
} from '../../app/composables/usePriceRelativeToMarket'

describe('calcDeviation', () => {
  it('returns positive when price > marketAvg', () => {
    expect(calcDeviation(11000, 10000)).toBeCloseTo(10)
  })

  it('returns negative when price < marketAvg', () => {
    expect(calcDeviation(9000, 10000)).toBeCloseTo(-10)
  })

  it('returns 0 when price equals marketAvg', () => {
    expect(calcDeviation(10000, 10000)).toBe(0)
  })

  it('returns 0 when marketAvg is 0 (no division by zero)', () => {
    expect(calcDeviation(10000, 0)).toBe(0)
  })

  it('returns 0 when price is 0', () => {
    expect(calcDeviation(0, 10000)).toBe(0)
  })

  it('calculates 25% above correctly', () => {
    expect(calcDeviation(12500, 10000)).toBeCloseTo(25)
  })

  it('calculates 50% below correctly', () => {
    expect(calcDeviation(5000, 10000)).toBeCloseTo(-50)
  })
})

describe('calcMean', () => {
  it('returns average of equal values', () => {
    expect(calcMean([10, 10, 10])).toBe(10)
  })

  it('returns average of varied values', () => {
    expect(calcMean([4, 6, 8, 10, 12])).toBe(8)
  })

  it('returns 0 for empty array', () => {
    expect(calcMean([])).toBe(0)
  })

  it('returns single value for single-element array', () => {
    expect(calcMean([42])).toBe(42)
  })

  it('handles large numbers', () => {
    expect(calcMean([50000, 60000, 70000])).toBeCloseTo(60000)
  })
})

describe('classifyDeviation', () => {
  it('classifies highly negative deviation as good', () => {
    expect(classifyDeviation(-15)).toBe('good')
  })

  it('classifies exactly -10 as good (boundary)', () => {
    expect(classifyDeviation(-10)).toBe('average')
  })

  it('classifies slightly below -10 as good', () => {
    expect(classifyDeviation(-11)).toBe('good')
  })

  it('classifies zero as average', () => {
    expect(classifyDeviation(0)).toBe('average')
  })

  it('classifies 5% above as average', () => {
    expect(classifyDeviation(5)).toBe('average')
  })

  it('classifies exactly 10% as average (boundary)', () => {
    expect(classifyDeviation(10)).toBe('average')
  })

  it('classifies 11% above as high', () => {
    expect(classifyDeviation(11)).toBe('high')
  })

  it('classifies 50% above as high', () => {
    expect(classifyDeviation(50)).toBe('high')
  })
})
