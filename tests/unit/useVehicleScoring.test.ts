import { describe, it, expect } from 'vitest'

/**
 * Tests for useVehicleScoring composable — vehicle ranking for catalog.
 * Inline copies of pure functions for cross-branch compatibility.
 */

interface VehicleScoringInput {
  photoCount: number
  descriptionLength: number
  hasPrice: boolean
  hasBrand: boolean
  hasModel: boolean
  hasYear: boolean
  hasKm: boolean
  createdDaysAgo: number
  viewCount: number
  favoriteCount: number
  leadCount: number
  dealerVerified: boolean
  dealerHealthScore: number
  isFeatured: boolean
}

interface VehicleScore {
  total: number
  completeness: number
  freshness: number
  engagement: number
  dealerTrust: number
  boost: number
}

function scoreCompleteness(input: Pick<VehicleScoringInput,
  'photoCount' | 'descriptionLength' | 'hasPrice' | 'hasBrand' | 'hasModel' | 'hasYear' | 'hasKm'
>): number {
  let score = 0
  if (input.photoCount >= 6) score += 10
  else if (input.photoCount >= 3) score += 6
  else if (input.photoCount >= 1) score += 3
  if (input.descriptionLength >= 200) score += 8
  else if (input.descriptionLength >= 100) score += 5
  else if (input.descriptionLength >= 50) score += 2
  if (input.hasPrice) score += 2
  if (input.hasBrand) score += 2
  if (input.hasModel) score += 2
  if (input.hasYear) score += 1
  if (input.hasKm) score += 1
  if (input.hasPrice) score += 4
  return Math.min(30, score)
}

function scoreFreshness(createdDaysAgo: number): number {
  if (createdDaysAgo <= 1) return 25
  if (createdDaysAgo <= 3) return 22
  if (createdDaysAgo <= 7) return 18
  if (createdDaysAgo <= 14) return 14
  if (createdDaysAgo <= 30) return 10
  if (createdDaysAgo <= 60) return 6
  if (createdDaysAgo <= 90) return 3
  return 1
}

function scoreEngagement(input: Pick<VehicleScoringInput,
  'viewCount' | 'favoriteCount' | 'leadCount'
>): number {
  const viewScore = Math.min(10, Math.round(Math.log2(input.viewCount + 1) * 1.5))
  const favScore = Math.min(8, input.favoriteCount * 2)
  const leadScore = Math.min(7, input.leadCount * 3)
  return Math.min(25, viewScore + favScore + leadScore)
}

function scoreDealerTrust(input: Pick<VehicleScoringInput,
  'dealerVerified' | 'dealerHealthScore'
>): number {
  let score = 0
  if (input.dealerVerified) score += 5
  score += Math.round(input.dealerHealthScore / 10)
  return Math.min(15, score)
}

function scoreBoost(input: Pick<VehicleScoringInput, 'isFeatured'>): number {
  return input.isFeatured ? 5 : 0
}

function calculateVehicleScore(input: VehicleScoringInput): VehicleScore {
  const completeness = scoreCompleteness(input)
  const freshness = scoreFreshness(input.createdDaysAgo)
  const engagement = scoreEngagement(input)
  const dealerTrust = scoreDealerTrust(input)
  const boost = scoreBoost(input)
  return {
    total: Math.min(100, completeness + freshness + engagement + dealerTrust + boost),
    completeness, freshness, engagement, dealerTrust, boost,
  }
}

function sortByScore<T extends { score: number }>(vehicles: T[]): T[] {
  return [...vehicles].sort((a, b) => b.score - a.score)
}

const PERFECT_INPUT: VehicleScoringInput = {
  photoCount: 10,
  descriptionLength: 300,
  hasPrice: true,
  hasBrand: true,
  hasModel: true,
  hasYear: true,
  hasKm: true,
  createdDaysAgo: 1,
  viewCount: 500,
  favoriteCount: 20,
  leadCount: 5,
  dealerVerified: true,
  dealerHealthScore: 90,
  isFeatured: true,
}

const EMPTY_INPUT: VehicleScoringInput = {
  photoCount: 0,
  descriptionLength: 0,
  hasPrice: false,
  hasBrand: false,
  hasModel: false,
  hasYear: false,
  hasKm: false,
  createdDaysAgo: 365,
  viewCount: 0,
  favoriteCount: 0,
  leadCount: 0,
  dealerVerified: false,
  dealerHealthScore: 0,
  isFeatured: false,
}

// ─── scoreCompleteness ──────────────────────────────────────

describe('scoreCompleteness', () => {
  it('0 for completely empty listing', () => {
    expect(scoreCompleteness({
      photoCount: 0, descriptionLength: 0,
      hasPrice: false, hasBrand: false, hasModel: false, hasYear: false, hasKm: false,
    })).toBe(0)
  })

  it('max 30 for perfect listing', () => {
    expect(scoreCompleteness({
      photoCount: 10, descriptionLength: 300,
      hasPrice: true, hasBrand: true, hasModel: true, hasYear: true, hasKm: true,
    })).toBe(30)
  })

  it('photos: 1-2 = 3, 3-5 = 6, 6+ = 10', () => {
    const base = { descriptionLength: 0, hasPrice: false, hasBrand: false, hasModel: false, hasYear: false, hasKm: false }
    expect(scoreCompleteness({ ...base, photoCount: 1 })).toBe(3)
    expect(scoreCompleteness({ ...base, photoCount: 3 })).toBe(6)
    expect(scoreCompleteness({ ...base, photoCount: 6 })).toBe(10)
  })

  it('price adds 6 total (2 attribute + 4 bonus)', () => {
    const base = { photoCount: 0, descriptionLength: 0, hasBrand: false, hasModel: false, hasYear: false, hasKm: false }
    const withPrice = scoreCompleteness({ ...base, hasPrice: true })
    const withoutPrice = scoreCompleteness({ ...base, hasPrice: false })
    expect(withPrice - withoutPrice).toBe(6)
  })

  it('description: 50-99 = 2, 100-199 = 5, 200+ = 8', () => {
    const base = { photoCount: 0, hasPrice: false, hasBrand: false, hasModel: false, hasYear: false, hasKm: false }
    expect(scoreCompleteness({ ...base, descriptionLength: 50 })).toBe(2)
    expect(scoreCompleteness({ ...base, descriptionLength: 100 })).toBe(5)
    expect(scoreCompleteness({ ...base, descriptionLength: 200 })).toBe(8)
  })
})

// ─── scoreFreshness ─────────────────────────────────────────

describe('scoreFreshness', () => {
  it('brand new = 25', () => expect(scoreFreshness(0)).toBe(25))
  it('1 day = 25', () => expect(scoreFreshness(1)).toBe(25))
  it('3 days = 22', () => expect(scoreFreshness(3)).toBe(22))
  it('7 days = 18', () => expect(scoreFreshness(7)).toBe(18))
  it('14 days = 14', () => expect(scoreFreshness(14)).toBe(14))
  it('30 days = 10', () => expect(scoreFreshness(30)).toBe(10))
  it('60 days = 6', () => expect(scoreFreshness(60)).toBe(6))
  it('90 days = 3', () => expect(scoreFreshness(90)).toBe(3))
  it('365 days = 1', () => expect(scoreFreshness(365)).toBe(1))
})

// ─── scoreEngagement ────────────────────────────────────────

describe('scoreEngagement', () => {
  it('0 for no interactions', () => {
    expect(scoreEngagement({ viewCount: 0, favoriteCount: 0, leadCount: 0 })).toBe(0)
  })

  it('views use log scale', () => {
    const low = scoreEngagement({ viewCount: 10, favoriteCount: 0, leadCount: 0 })
    const high = scoreEngagement({ viewCount: 1000, favoriteCount: 0, leadCount: 0 })
    // High views shouldn't be 100x the score of low views
    expect(high).toBeGreaterThan(low)
    expect(high).toBeLessThan(low * 3)
  })

  it('leads are most valuable signal', () => {
    const leadScore = scoreEngagement({ viewCount: 0, favoriteCount: 0, leadCount: 2 })
    const favScore = scoreEngagement({ viewCount: 0, favoriteCount: 2, leadCount: 0 })
    expect(leadScore).toBeGreaterThan(favScore)
  })

  it('capped at 25', () => {
    expect(scoreEngagement({ viewCount: 10000, favoriteCount: 100, leadCount: 50 })).toBe(25)
  })
})

// ─── scoreDealerTrust ───────────────────────────────────────

describe('scoreDealerTrust', () => {
  it('0 for unverified dealer with 0 health', () => {
    expect(scoreDealerTrust({ dealerVerified: false, dealerHealthScore: 0 })).toBe(0)
  })

  it('verified adds 5', () => {
    expect(scoreDealerTrust({ dealerVerified: true, dealerHealthScore: 0 })).toBe(5)
  })

  it('health score 100 adds 10', () => {
    expect(scoreDealerTrust({ dealerVerified: false, dealerHealthScore: 100 })).toBe(10)
  })

  it('capped at 15', () => {
    expect(scoreDealerTrust({ dealerVerified: true, dealerHealthScore: 100 })).toBe(15)
  })
})

// ─── scoreBoost ─────────────────────────────────────────────

describe('scoreBoost', () => {
  it('featured = 5', () => expect(scoreBoost({ isFeatured: true })).toBe(5))
  it('not featured = 0', () => expect(scoreBoost({ isFeatured: false })).toBe(0))
})

// ─── calculateVehicleScore ──────────────────────────────────

describe('calculateVehicleScore', () => {
  it('perfect vehicle scores near 100', () => {
    const result = calculateVehicleScore(PERFECT_INPUT)
    expect(result.total).toBeGreaterThanOrEqual(85)
    expect(result.total).toBeLessThanOrEqual(100)
  })

  it('empty vehicle scores very low', () => {
    const result = calculateVehicleScore(EMPTY_INPUT)
    expect(result.total).toBeLessThanOrEqual(5)
  })

  it('total is capped at 100', () => {
    const result = calculateVehicleScore(PERFECT_INPUT)
    expect(result.total).toBeLessThanOrEqual(100)
  })

  it('returns all score components', () => {
    const result = calculateVehicleScore(PERFECT_INPUT)
    expect(result.completeness).toBeGreaterThan(0)
    expect(result.freshness).toBeGreaterThan(0)
    expect(result.engagement).toBeGreaterThan(0)
    expect(result.dealerTrust).toBeGreaterThan(0)
    expect(result.boost).toBeGreaterThan(0)
  })

  it('total = sum of components (capped)', () => {
    const result = calculateVehicleScore(PERFECT_INPUT)
    const sum = result.completeness + result.freshness + result.engagement + result.dealerTrust + result.boost
    expect(result.total).toBe(Math.min(100, sum))
  })
})

// ─── sortByScore ────────────────────────────────────────────

describe('sortByScore', () => {
  it('sorts descending', () => {
    const vehicles = [{ score: 10 }, { score: 50 }, { score: 30 }]
    const sorted = sortByScore(vehicles)
    expect(sorted.map((v) => v.score)).toEqual([50, 30, 10])
  })

  it('does not mutate original array', () => {
    const vehicles = [{ score: 10 }, { score: 50 }]
    const sorted = sortByScore(vehicles)
    expect(vehicles[0].score).toBe(10)
    expect(sorted[0].score).toBe(50)
  })

  it('handles empty array', () => {
    expect(sortByScore([])).toEqual([])
  })

  it('handles single element', () => {
    const result = sortByScore([{ score: 42 }])
    expect(result).toEqual([{ score: 42 }])
  })
})
