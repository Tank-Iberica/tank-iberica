import { describe, it, expect } from 'vitest'

/**
 * Tests for useSimilarVehicles composable — similar vehicle scoring.
 */

interface VehicleForSimilarity {
  id: string
  categoryId?: string
  subcategoryId?: string
  brand?: string
  model?: string
  price?: number
  year?: number
  km?: number
  province?: string
  country?: string
}

function scoreCategoryMatch(
  ref: Pick<VehicleForSimilarity, 'categoryId' | 'subcategoryId'>,
  candidate: Pick<VehicleForSimilarity, 'categoryId' | 'subcategoryId'>,
): number {
  if (ref.subcategoryId && candidate.subcategoryId && ref.subcategoryId === candidate.subcategoryId) return 25
  if (ref.categoryId && candidate.categoryId && ref.categoryId === candidate.categoryId) return 15
  return 0
}

function scoreBrandMatch(
  ref: Pick<VehicleForSimilarity, 'brand' | 'model'>,
  candidate: Pick<VehicleForSimilarity, 'brand' | 'model'>,
): number {
  const refBrand = (ref.brand ?? '').toLowerCase()
  const candBrand = (candidate.brand ?? '').toLowerCase()
  const refModel = (ref.model ?? '').toLowerCase()
  const candModel = (candidate.model ?? '').toLowerCase()
  if (refBrand && candBrand && refBrand === candBrand) {
    if (refModel && candModel && refModel === candModel) return 20
    return 12
  }
  return 0
}

function scorePriceProximity(refPrice: number | undefined, candidatePrice: number | undefined): number {
  if (!refPrice || !candidatePrice || refPrice <= 0) return 10
  const ratio = candidatePrice / refPrice
  if (ratio >= 0.8 && ratio <= 1.2) return 20
  if (ratio >= 0.6 && ratio <= 1.4) return 14
  if (ratio >= 0.4 && ratio <= 1.6) return 8
  if (ratio >= 0.2 && ratio <= 2.0) return 4
  return 0
}

function scoreYearProximity(refYear: number | undefined, candidateYear: number | undefined): number {
  if (!refYear || !candidateYear) return 5
  const diff = Math.abs(refYear - candidateYear)
  if (diff === 0) return 10
  if (diff <= 1) return 8
  if (diff <= 2) return 6
  if (diff <= 3) return 4
  if (diff <= 5) return 2
  return 0
}

function scoreKmProximity(refKm: number | undefined, candidateKm: number | undefined): number {
  if (refKm === undefined || candidateKm === undefined) return 5
  const diff = Math.abs(refKm - candidateKm)
  if (diff <= 10000) return 10
  if (diff <= 25000) return 8
  if (diff <= 50000) return 6
  if (diff <= 100000) return 4
  if (diff <= 200000) return 2
  return 0
}

function scoreGeoMatch(
  ref: Pick<VehicleForSimilarity, 'province' | 'country'>,
  candidate: Pick<VehicleForSimilarity, 'province' | 'country'>,
): number {
  if (ref.province && candidate.province && ref.province.toLowerCase() === candidate.province.toLowerCase()) return 15
  if (ref.country && candidate.country && ref.country.toLowerCase() === candidate.country.toLowerCase()) return 8
  return 0
}

function calculateSimilarity(reference: VehicleForSimilarity, candidate: VehicleForSimilarity) {
  const category = scoreCategoryMatch(reference, candidate)
  const brand = scoreBrandMatch(reference, candidate)
  const price = scorePriceProximity(reference.price, candidate.price)
  const year = scoreYearProximity(reference.year, candidate.year)
  const km = scoreKmProximity(reference.km, candidate.km)
  const geo = scoreGeoMatch(reference, candidate)
  return {
    vehicleId: candidate.id,
    score: Math.min(100, category + brand + price + year + km + geo),
    breakdown: { category, brand, price, year, km, geo },
  }
}

function rankSimilar(
  reference: VehicleForSimilarity,
  candidates: VehicleForSimilarity[],
  options?: { minScore?: number; limit?: number },
) {
  const minScore = options?.minScore ?? 30
  const limit = options?.limit ?? 10
  return candidates
    .filter((c) => c.id !== reference.id)
    .map((c) => calculateSimilarity(reference, c))
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

const REF_VEHICLE: VehicleForSimilarity = {
  id: 'ref-1',
  categoryId: 'cat-trucks',
  subcategoryId: 'sub-tractors',
  brand: 'Volvo',
  model: 'FH16',
  price: 50000,
  year: 2020,
  km: 150000,
  province: 'León',
  country: 'España',
}

// ─── scoreCategoryMatch ─────────────────────────────────────

describe('scoreCategoryMatch', () => {
  it('same subcategory = 25', () => {
    expect(scoreCategoryMatch(
      { categoryId: 'cat-1', subcategoryId: 'sub-1' },
      { categoryId: 'cat-1', subcategoryId: 'sub-1' },
    )).toBe(25)
  })

  it('same category different subcategory = 15', () => {
    expect(scoreCategoryMatch(
      { categoryId: 'cat-1', subcategoryId: 'sub-1' },
      { categoryId: 'cat-1', subcategoryId: 'sub-2' },
    )).toBe(15)
  })

  it('different category = 0', () => {
    expect(scoreCategoryMatch(
      { categoryId: 'cat-1' },
      { categoryId: 'cat-2' },
    )).toBe(0)
  })

  it('no category data = 0', () => {
    expect(scoreCategoryMatch({}, {})).toBe(0)
  })
})

// ─── scoreBrandMatch ────────────────────────────────────────

describe('scoreBrandMatch', () => {
  it('same brand + model = 20', () => {
    expect(scoreBrandMatch({ brand: 'Volvo', model: 'FH16' }, { brand: 'Volvo', model: 'FH16' })).toBe(20)
  })

  it('same brand different model = 12', () => {
    expect(scoreBrandMatch({ brand: 'Volvo', model: 'FH16' }, { brand: 'Volvo', model: 'FM' })).toBe(12)
  })

  it('different brand = 0', () => {
    expect(scoreBrandMatch({ brand: 'Volvo' }, { brand: 'Scania' })).toBe(0)
  })

  it('case insensitive', () => {
    expect(scoreBrandMatch({ brand: 'VOLVO', model: 'fh16' }, { brand: 'volvo', model: 'FH16' })).toBe(20)
  })

  it('empty brands = 0', () => {
    expect(scoreBrandMatch({}, {})).toBe(0)
  })
})

// ─── scorePriceProximity ────────────────────────────────────

describe('scorePriceProximity', () => {
  it('no data returns neutral 10', () => {
    expect(scorePriceProximity(undefined, 50000)).toBe(10)
    expect(scorePriceProximity(50000, undefined)).toBe(10)
  })

  it('same price = 20', () => {
    expect(scorePriceProximity(50000, 50000)).toBe(20)
  })

  it('within ±20% = 20', () => {
    expect(scorePriceProximity(50000, 55000)).toBe(20)
    expect(scorePriceProximity(50000, 42000)).toBe(20)
  })

  it('within ±40% = 14', () => {
    expect(scorePriceProximity(50000, 35000)).toBe(14)
  })

  it('within ±60% = 8', () => {
    expect(scorePriceProximity(50000, 22000)).toBe(8)
  })

  it('very different price = 0', () => {
    // 5000/50000 = 0.1 ratio, which is < 0.2 → score 0
    expect(scorePriceProximity(50000, 5000)).toBe(0)
  })

  it('extreme difference = 0', () => {
    expect(scorePriceProximity(50000, 1000)).toBe(0)
  })
})

// ─── scoreYearProximity ─────────────────────────────────────

describe('scoreYearProximity', () => {
  it('same year = 10', () => expect(scoreYearProximity(2020, 2020)).toBe(10))
  it('1 year diff = 8', () => expect(scoreYearProximity(2020, 2021)).toBe(8))
  it('2 year diff = 6', () => expect(scoreYearProximity(2020, 2022)).toBe(6))
  it('3 year diff = 4', () => expect(scoreYearProximity(2020, 2023)).toBe(4))
  it('5 year diff = 2', () => expect(scoreYearProximity(2020, 2025)).toBe(2))
  it('10 year diff = 0', () => expect(scoreYearProximity(2020, 2010)).toBe(0))
  it('no data = neutral 5', () => expect(scoreYearProximity(undefined, 2020)).toBe(5))
})

// ─── scoreKmProximity ───────────────────────────────────────

describe('scoreKmProximity', () => {
  it('same km = 10', () => expect(scoreKmProximity(150000, 150000)).toBe(10))
  it('10k diff = 10', () => expect(scoreKmProximity(150000, 160000)).toBe(10))
  it('25k diff = 8', () => expect(scoreKmProximity(150000, 175000)).toBe(8))
  it('50k diff = 6', () => expect(scoreKmProximity(150000, 200000)).toBe(6))
  it('100k diff = 4', () => expect(scoreKmProximity(150000, 250000)).toBe(4))
  it('200k diff = 2', () => expect(scoreKmProximity(150000, 350000)).toBe(2))
  it('300k+ diff = 0', () => expect(scoreKmProximity(150000, 500000)).toBe(0))
  it('no data = neutral 5', () => expect(scoreKmProximity(undefined, 150000)).toBe(5))
})

// ─── scoreGeoMatch ──────────────────────────────────────────

describe('scoreGeoMatch', () => {
  it('same province = 15', () => {
    expect(scoreGeoMatch({ province: 'León' }, { province: 'León' })).toBe(15)
  })

  it('same country different province = 8', () => {
    expect(scoreGeoMatch({ province: 'León', country: 'España' }, { province: 'Madrid', country: 'España' })).toBe(8)
  })

  it('different country = 0', () => {
    expect(scoreGeoMatch({ country: 'España' }, { country: 'France' })).toBe(0)
  })
})

// ─── calculateSimilarity ────────────────────────────────────

describe('calculateSimilarity', () => {
  it('identical vehicle scores 100', () => {
    const result = calculateSimilarity(REF_VEHICLE, { ...REF_VEHICLE, id: 'v-2' })
    expect(result.score).toBe(100)
  })

  it('completely different vehicle scores low', () => {
    const different: VehicleForSimilarity = {
      id: 'v-diff',
      categoryId: 'cat-boats',
      brand: 'Yamaha',
      price: 5000,
      year: 2005,
      km: 500000,
      province: 'Tokyo',
      country: 'Japan',
    }
    const result = calculateSimilarity(REF_VEHICLE, different)
    expect(result.score).toBeLessThan(20)
  })

  it('returns breakdown', () => {
    const result = calculateSimilarity(REF_VEHICLE, { ...REF_VEHICLE, id: 'v-2' })
    expect(result.breakdown.category).toBe(25)
    expect(result.breakdown.brand).toBe(20)
  })
})

// ─── rankSimilar ────────────────────────────────────────────

describe('rankSimilar', () => {
  const candidates: VehicleForSimilarity[] = [
    { id: 'v-high', categoryId: 'cat-trucks', subcategoryId: 'sub-tractors', brand: 'Volvo', model: 'FH16', price: 48000, year: 2020, km: 160000, province: 'León', country: 'España' },
    { id: 'v-med', categoryId: 'cat-trucks', brand: 'Scania', price: 52000, year: 2019, km: 180000, province: 'Madrid', country: 'España' },
    { id: 'v-low', categoryId: 'cat-boats', brand: 'Yamaha', price: 5000, year: 2005, km: 500000, province: 'Tokyo', country: 'Japan' },
  ]

  it('excludes reference vehicle from results', () => {
    const results = rankSimilar(REF_VEHICLE, [REF_VEHICLE, ...candidates])
    expect(results.find((r) => r.vehicleId === 'ref-1')).toBeUndefined()
  })

  it('sorts by score descending', () => {
    const results = rankSimilar(REF_VEHICLE, candidates, { minScore: 0 })
    expect(results.length).toBeGreaterThan(1)
    for (let i = 1; i < results.length; i++) {
      expect(results[i].score).toBeLessThanOrEqual(results[i - 1].score)
    }
  })

  it('filters by minScore', () => {
    const results = rankSimilar(REF_VEHICLE, candidates, { minScore: 50 })
    for (const r of results) {
      expect(r.score).toBeGreaterThanOrEqual(50)
    }
  })

  it('respects limit', () => {
    const results = rankSimilar(REF_VEHICLE, candidates, { minScore: 0, limit: 1 })
    expect(results).toHaveLength(1)
  })

  it('empty candidates returns empty', () => {
    expect(rankSimilar(REF_VEHICLE, [])).toEqual([])
  })
})
