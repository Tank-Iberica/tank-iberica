import { describe, it, expect } from 'vitest'
import {
  classifyPrice,
  classifyYear,
  extractPreferences,
  scoreVehicle,
  deduplicateHistory,
} from '../../../app/utils/viewHistory.helpers'
import type { ViewEntry } from '../../../app/utils/viewHistory.helpers'

describe('viewHistory.helpers — classifyPrice', () => {
  it('classifies low price', () => {
    expect(classifyPrice(5000)).toBe('low')
    expect(classifyPrice(14999)).toBe('low')
  })

  it('classifies mid price', () => {
    expect(classifyPrice(15000)).toBe('mid')
    expect(classifyPrice(49999)).toBe('mid')
  })

  it('classifies high price', () => {
    expect(classifyPrice(50000)).toBe('high')
    expect(classifyPrice(119999)).toBe('high')
  })

  it('classifies premium price', () => {
    expect(classifyPrice(120000)).toBe('premium')
    expect(classifyPrice(500000)).toBe('premium')
  })
})

describe('viewHistory.helpers — classifyYear', () => {
  const currentYear = new Date().getFullYear()

  it('classifies old vehicles (>10 years)', () => {
    expect(classifyYear(currentYear - 15)).toBe('old')
  })

  it('classifies mid-age vehicles (6-10 years)', () => {
    expect(classifyYear(currentYear - 7)).toBe('mid')
  })

  it('classifies recent vehicles (3-5 years)', () => {
    expect(classifyYear(currentYear - 4)).toBe('recent')
  })

  it('classifies new vehicles (0-2 years)', () => {
    expect(classifyYear(currentYear - 1)).toBe('new')
    expect(classifyYear(currentYear)).toBe('new')
  })
})

describe('viewHistory.helpers — extractPreferences', () => {
  const makeEntry = (
    brand: string,
    category: string,
    priceRange: ViewEntry['priceRange'] = 'mid',
    yearRange: ViewEntry['yearRange'] = 'recent',
  ): ViewEntry => ({
    vehicleId: `v-${Math.random()}`,
    brand,
    category,
    priceRange,
    yearRange,
    viewedAt: new Date().toISOString(),
  })

  it('returns empty for no history', () => {
    const prefs = extractPreferences([])
    expect(prefs.topBrands).toEqual([])
    expect(prefs.pricePreference).toBeNull()
  })

  it('identifies top brands by frequency', () => {
    const history = [
      makeEntry('Volvo', 'tractoras'),
      makeEntry('Volvo', 'tractoras'),
      makeEntry('Volvo', 'tractoras'),
      makeEntry('Mercedes', 'camiones'),
      makeEntry('DAF', 'camiones'),
    ]
    const prefs = extractPreferences(history)
    expect(prefs.topBrands[0].brand).toBe('Volvo')
    expect(prefs.topBrands[0].count).toBe(3)
  })

  it('identifies top categories', () => {
    const history = [
      makeEntry('Volvo', 'tractoras'),
      makeEntry('Mercedes', 'tractoras'),
      makeEntry('DAF', 'camiones'),
    ]
    const prefs = extractPreferences(history)
    expect(prefs.topCategories[0].category).toBe('tractoras')
  })

  it('identifies price preference', () => {
    const history = [
      makeEntry('Volvo', 'tractoras', 'high'),
      makeEntry('Mercedes', 'tractoras', 'high'),
      makeEntry('DAF', 'camiones', 'mid'),
    ]
    const prefs = extractPreferences(history)
    expect(prefs.pricePreference).toBe('high')
  })

  it('identifies year preference', () => {
    const history = [
      makeEntry('Volvo', 'tractoras', 'mid', 'recent'),
      makeEntry('Mercedes', 'tractoras', 'mid', 'recent'),
      makeEntry('DAF', 'camiones', 'mid', 'new'),
    ]
    const prefs = extractPreferences(history)
    expect(prefs.yearPreference).toBe('recent')
  })

  it('limits topBrands to 5', () => {
    const history = [
      makeEntry('A', 'cat'),
      makeEntry('B', 'cat'),
      makeEntry('C', 'cat'),
      makeEntry('D', 'cat'),
      makeEntry('E', 'cat'),
      makeEntry('F', 'cat'),
      makeEntry('G', 'cat'),
    ]
    const prefs = extractPreferences(history)
    expect(prefs.topBrands).toHaveLength(5)
  })
})

describe('viewHistory.helpers — scoreVehicle', () => {
  const makeEntry = (brand: string, category: string): ViewEntry => ({
    vehicleId: `v-${Math.random()}`,
    brand,
    category,
    priceRange: 'mid',
    yearRange: 'recent',
    viewedAt: new Date().toISOString(),
  })

  it('returns 0 for no preferences', () => {
    const prefs = extractPreferences([])
    const score = scoreVehicle(
      { brand: 'Volvo', category: 'tractoras', price: 50000, year: 2022 },
      prefs,
    )
    expect(score).toBe(0)
  })

  it('scores higher for matching brand', () => {
    const history = [
      makeEntry('Volvo', 'tractoras'),
      makeEntry('Volvo', 'tractoras'),
      makeEntry('Mercedes', 'camiones'),
    ]
    const prefs = extractPreferences(history)

    const volvoScore = scoreVehicle(
      { brand: 'Volvo', category: 'otros', price: 100, year: 2000 },
      prefs,
    )
    const dafScore = scoreVehicle(
      { brand: 'DAF', category: 'otros', price: 100, year: 2000 },
      prefs,
    )
    expect(volvoScore).toBeGreaterThan(dafScore)
  })

  it('scores higher for matching category', () => {
    const history = [makeEntry('Volvo', 'tractoras'), makeEntry('Mercedes', 'tractoras')]
    const prefs = extractPreferences(history)

    const tractScore = scoreVehicle(
      { brand: 'DAF', category: 'tractoras', price: 100, year: 2000 },
      prefs,
    )
    const camScore = scoreVehicle(
      { brand: 'DAF', category: 'camiones', price: 100, year: 2000 },
      prefs,
    )
    expect(tractScore).toBeGreaterThan(camScore)
  })

  it('caps score at 100', () => {
    const history = Array.from({ length: 20 }, () => makeEntry('Volvo', 'tractoras'))
    const prefs = extractPreferences(history)

    const score = scoreVehicle(
      { brand: 'Volvo', category: 'tractoras', price: 30000, year: 2023 },
      prefs,
    )
    expect(score).toBeLessThanOrEqual(100)
  })
})

describe('viewHistory.helpers — deduplicateHistory', () => {
  it('keeps most recent view per vehicle', () => {
    const history: ViewEntry[] = [
      {
        vehicleId: 'v-1',
        brand: 'Volvo',
        category: 'tractoras',
        priceRange: 'mid',
        yearRange: 'recent',
        viewedAt: '2026-01-01T10:00:00Z',
      },
      {
        vehicleId: 'v-1',
        brand: 'Volvo',
        category: 'tractoras',
        priceRange: 'mid',
        yearRange: 'recent',
        viewedAt: '2026-01-02T10:00:00Z',
      },
      {
        vehicleId: 'v-2',
        brand: 'Mercedes',
        category: 'camiones',
        priceRange: 'high',
        yearRange: 'new',
        viewedAt: '2026-01-01T12:00:00Z',
      },
    ]
    const deduped = deduplicateHistory(history)
    expect(deduped).toHaveLength(2)

    const v1 = deduped.find((e) => e.vehicleId === 'v-1')
    expect(v1?.viewedAt).toBe('2026-01-02T10:00:00Z')
  })

  it('sorts by most recent first', () => {
    const history: ViewEntry[] = [
      {
        vehicleId: 'v-1',
        brand: 'A',
        category: 'a',
        priceRange: 'low',
        yearRange: 'old',
        viewedAt: '2026-01-01T00:00:00Z',
      },
      {
        vehicleId: 'v-2',
        brand: 'B',
        category: 'b',
        priceRange: 'mid',
        yearRange: 'mid',
        viewedAt: '2026-01-03T00:00:00Z',
      },
      {
        vehicleId: 'v-3',
        brand: 'C',
        category: 'c',
        priceRange: 'high',
        yearRange: 'new',
        viewedAt: '2026-01-02T00:00:00Z',
      },
    ]
    const deduped = deduplicateHistory(history)
    expect(deduped[0].vehicleId).toBe('v-2')
    expect(deduped[1].vehicleId).toBe('v-3')
    expect(deduped[2].vehicleId).toBe('v-1')
  })

  it('handles empty array', () => {
    expect(deduplicateHistory([])).toEqual([])
  })
})
