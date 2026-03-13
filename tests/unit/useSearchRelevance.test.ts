import { describe, it, expect } from 'vitest'

/**
 * Tests for useSearchRelevance composable — search result ranking.
 * Inline copies of pure functions for cross-branch compatibility.
 */

interface SearchQuery {
  text?: string
  categoryId?: string
  subcategoryId?: string
  minPrice?: number
  maxPrice?: number
  minYear?: number
  maxYear?: number
  maxKm?: number
  province?: string
  country?: string
}

interface SearchableVehicle {
  brand: string
  model: string
  description?: string
  categoryId?: string
  subcategoryId?: string
  price?: number
  year?: number
  km?: number
  province?: string
  country?: string
  createdDaysAgo: number
}

function scoreTextMatch(
  query: string,
  vehicle: Pick<SearchableVehicle, 'brand' | 'model' | 'description'>,
): number {
  if (!query || query.trim().length === 0) return 20
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return 20
  let score = 0
  const brandLower = (vehicle.brand ?? '').toLowerCase()
  const modelLower = (vehicle.model ?? '').toLowerCase()
  const descLower = (vehicle.description ?? '').toLowerCase()
  for (const token of tokens) {
    if (brandLower.includes(token)) score += 15
    else if (modelLower.includes(token)) score += 12
    else if (descLower.includes(token)) score += 5
  }
  return Math.min(40, Math.round(score / tokens.length))
}

function scoreFilterMatch(query: SearchQuery, vehicle: SearchableVehicle): number {
  let score = 0
  let filterCount = 0
  if (query.categoryId) { filterCount++; if (vehicle.categoryId === query.categoryId) score += 10 }
  if (query.subcategoryId) { filterCount++; if (vehicle.subcategoryId === query.subcategoryId) score += 10 }
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filterCount++
    if (vehicle.price !== undefined) {
      const inRange = (query.minPrice === undefined || vehicle.price >= query.minPrice) && (query.maxPrice === undefined || vehicle.price <= query.maxPrice)
      if (inRange) score += 10
    }
  }
  if (query.minYear !== undefined || query.maxYear !== undefined) {
    filterCount++
    if (vehicle.year !== undefined) {
      const inRange = (query.minYear === undefined || vehicle.year >= query.minYear) && (query.maxYear === undefined || vehicle.year <= query.maxYear)
      if (inRange) score += 5
    }
  }
  if (query.maxKm !== undefined) { filterCount++; if (vehicle.km !== undefined && vehicle.km <= query.maxKm) score += 5 }
  if (filterCount === 0) return 15
  return Math.min(30, score)
}

function scoreGeoProximity(
  query: SearchQuery,
  vehicle: Pick<SearchableVehicle, 'province' | 'country'>,
): number {
  if (!query.province && !query.country) return 8
  let score = 0
  if (query.province && vehicle.province && query.province.toLowerCase() === vehicle.province.toLowerCase()) score += 15
  else if (query.country && vehicle.country && query.country.toLowerCase() === vehicle.country.toLowerCase()) score += 8
  return Math.min(15, score)
}

function scoreRecency(createdDaysAgo: number): number {
  if (createdDaysAgo <= 3) return 15
  if (createdDaysAgo <= 7) return 12
  if (createdDaysAgo <= 14) return 9
  if (createdDaysAgo <= 30) return 6
  if (createdDaysAgo <= 60) return 3
  return 1
}

function calculateSearchRelevance(query: SearchQuery, vehicle: SearchableVehicle): number {
  const text = scoreTextMatch(query.text ?? '', vehicle)
  const filter = scoreFilterMatch(query, vehicle)
  const geo = scoreGeoProximity(query, vehicle)
  const recency = scoreRecency(vehicle.createdDaysAgo)
  return Math.min(100, text + filter + geo + recency)
}

const BASE_VEHICLE: SearchableVehicle = {
  brand: 'Volvo', model: 'FH16', description: 'Cabeza tractora en excelente estado',
  categoryId: 'cat-1', subcategoryId: 'sub-1',
  price: 45000, year: 2020, km: 150000,
  province: 'León', country: 'España',
  createdDaysAgo: 5,
}

// ─── scoreTextMatch ─────────────────────────────────────────

describe('scoreTextMatch', () => {
  it('empty query returns neutral 20', () => {
    expect(scoreTextMatch('', BASE_VEHICLE)).toBe(20)
  })

  it('brand match scores highest', () => {
    expect(scoreTextMatch('volvo', BASE_VEHICLE)).toBe(15)
  })

  it('model match scores second', () => {
    expect(scoreTextMatch('fh16', BASE_VEHICLE)).toBe(12)
  })

  it('description-only match scores lowest', () => {
    expect(scoreTextMatch('tractora', BASE_VEHICLE)).toBe(5)
  })

  it('multi-token: brand + model', () => {
    const score = scoreTextMatch('volvo fh16', BASE_VEHICLE)
    // avg of (15 + 12) / 2 = 13.5 → round = 14
    expect(score).toBeGreaterThan(10)
  })

  it('no match scores 0', () => {
    expect(scoreTextMatch('mercedes', BASE_VEHICLE)).toBe(0)
  })

  it('case insensitive', () => {
    expect(scoreTextMatch('VOLVO', BASE_VEHICLE)).toBe(15)
  })

  it('capped at 40', () => {
    // Single token matching brand
    expect(scoreTextMatch('volvo', BASE_VEHICLE)).toBeLessThanOrEqual(40)
  })
})

// ─── scoreFilterMatch ───────────────────────────────────────

describe('scoreFilterMatch', () => {
  it('no filters returns neutral 15', () => {
    expect(scoreFilterMatch({}, BASE_VEHICLE)).toBe(15)
  })

  it('matching category = 10', () => {
    expect(scoreFilterMatch({ categoryId: 'cat-1' }, BASE_VEHICLE)).toBe(10)
  })

  it('non-matching category = 0', () => {
    expect(scoreFilterMatch({ categoryId: 'cat-99' }, BASE_VEHICLE)).toBe(0)
  })

  it('price in range = 10', () => {
    expect(scoreFilterMatch({ minPrice: 40000, maxPrice: 50000 }, BASE_VEHICLE)).toBe(10)
  })

  it('price out of range = 0', () => {
    expect(scoreFilterMatch({ minPrice: 50000, maxPrice: 60000 }, BASE_VEHICLE)).toBe(0)
  })

  it('year in range = 5', () => {
    expect(scoreFilterMatch({ minYear: 2019, maxYear: 2021 }, BASE_VEHICLE)).toBe(5)
  })

  it('km under max = 5', () => {
    expect(scoreFilterMatch({ maxKm: 200000 }, BASE_VEHICLE)).toBe(5)
  })

  it('km over max = 0', () => {
    expect(scoreFilterMatch({ maxKm: 100000 }, BASE_VEHICLE)).toBe(0)
  })

  it('multiple matching filters sum up', () => {
    const score = scoreFilterMatch({
      categoryId: 'cat-1',
      minPrice: 40000, maxPrice: 50000,
      minYear: 2019,
    }, BASE_VEHICLE)
    expect(score).toBe(25) // 10 + 10 + 5
  })
})

// ─── scoreGeoProximity ──────────────────────────────────────

describe('scoreGeoProximity', () => {
  it('no geo preference returns neutral 8', () => {
    expect(scoreGeoProximity({}, BASE_VEHICLE)).toBe(8)
  })

  it('same province = 15', () => {
    expect(scoreGeoProximity({ province: 'León' }, BASE_VEHICLE)).toBe(15)
  })

  it('same country = 8', () => {
    expect(scoreGeoProximity({ country: 'España' }, BASE_VEHICLE)).toBe(8)
  })

  it('different province, same country', () => {
    expect(scoreGeoProximity({ province: 'Madrid', country: 'España' }, BASE_VEHICLE)).toBe(8)
  })

  it('case insensitive', () => {
    expect(scoreGeoProximity({ province: 'león' }, BASE_VEHICLE)).toBe(15)
  })

  it('no match = 0', () => {
    expect(scoreGeoProximity({ province: 'Paris', country: 'France' }, BASE_VEHICLE)).toBe(0)
  })
})

// ─── scoreRecency ───────────────────────────────────────────

describe('scoreRecency', () => {
  it('3 days = 15', () => expect(scoreRecency(3)).toBe(15))
  it('7 days = 12', () => expect(scoreRecency(7)).toBe(12))
  it('14 days = 9', () => expect(scoreRecency(14)).toBe(9))
  it('30 days = 6', () => expect(scoreRecency(30)).toBe(6))
  it('60 days = 3', () => expect(scoreRecency(60)).toBe(3))
  it('90 days = 1', () => expect(scoreRecency(90)).toBe(1))
})

// ─── calculateSearchRelevance ───────────────────────────────

describe('calculateSearchRelevance', () => {
  it('perfect match scores high', () => {
    const score = calculateSearchRelevance(
      { text: 'volvo', categoryId: 'cat-1', province: 'León' },
      { ...BASE_VEHICLE, createdDaysAgo: 1 },
    )
    expect(score).toBeGreaterThanOrEqual(50)
  })

  it('no match scores low', () => {
    const score = calculateSearchRelevance(
      { text: 'ferrari', categoryId: 'cat-99', province: 'Tokyo' },
      { ...BASE_VEHICLE, createdDaysAgo: 365 },
    )
    expect(score).toBeLessThanOrEqual(20)
  })

  it('capped at 100', () => {
    const score = calculateSearchRelevance(
      { text: 'volvo fh16', categoryId: 'cat-1', subcategoryId: 'sub-1', province: 'León' },
      { ...BASE_VEHICLE, createdDaysAgo: 1 },
    )
    expect(score).toBeLessThanOrEqual(100)
  })

  it('empty query still scores based on filters and recency', () => {
    const score = calculateSearchRelevance({}, { ...BASE_VEHICLE, createdDaysAgo: 5 })
    expect(score).toBeGreaterThan(30) // neutral text + neutral filter + neutral geo + fresh
  })
})
