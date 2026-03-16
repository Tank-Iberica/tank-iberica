/**
 * Similar vehicles scoring composable.
 *
 * Given a reference vehicle, scores other vehicles by similarity
 * based on: category, subcategory, brand, price proximity,
 * year proximity, km proximity, and geographic proximity.
 *
 * Used on vehicle detail pages ("You might also like") and
 * for dealer cross-selling suggestions.
 */

export interface VehicleForSimilarity {
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

export interface SimilarityResult {
  vehicleId: string
  score: number
  breakdown: SimilarityBreakdown
}

export interface SimilarityBreakdown {
  category: number
  brand: number
  price: number
  year: number
  km: number
  geo: number
}

/**
 * Score category match (0-25).
 * Same subcategory is better than same category.
 */
export function scoreCategoryMatch(
  ref: Pick<VehicleForSimilarity, 'categoryId' | 'subcategoryId'>,
  candidate: Pick<VehicleForSimilarity, 'categoryId' | 'subcategoryId'>,
): number {
  if (ref.subcategoryId && candidate.subcategoryId && ref.subcategoryId === candidate.subcategoryId)
    return 25
  if (ref.categoryId && candidate.categoryId && ref.categoryId === candidate.categoryId) return 15
  return 0
}

/**
 * Score brand/model match (0-20).
 */
export function scoreBrandMatch(
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

/**
 * Score price proximity (0-20).
 * Vehicles within ±20% of reference price score highest.
 */
export function scorePriceProximity(
  refPrice: number | undefined,
  candidatePrice: number | undefined,
): number {
  if (!refPrice || !candidatePrice || refPrice <= 0) return 10 // No data = neutral
  const ratio = candidatePrice / refPrice
  if (ratio >= 0.8 && ratio <= 1.2) return 20
  if (ratio >= 0.6 && ratio <= 1.4) return 14
  if (ratio >= 0.4 && ratio <= 1.6) return 8
  if (ratio >= 0.2 && ratio <= 2) return 4
  return 0
}

/**
 * Score year proximity (0-10).
 */
export function scoreYearProximity(
  refYear: number | undefined,
  candidateYear: number | undefined,
): number {
  if (!refYear || !candidateYear) return 5 // No data = neutral
  const diff = Math.abs(refYear - candidateYear)
  if (diff === 0) return 10
  if (diff <= 1) return 8
  if (diff <= 2) return 6
  if (diff <= 3) return 4
  if (diff <= 5) return 2
  return 0
}

/**
 * Score km proximity (0-10).
 */
export function scoreKmProximity(
  refKm: number | undefined,
  candidateKm: number | undefined,
): number {
  if (refKm === undefined || candidateKm === undefined) return 5 // No data = neutral
  const diff = Math.abs(refKm - candidateKm)
  if (diff <= 10000) return 10
  if (diff <= 25000) return 8
  if (diff <= 50000) return 6
  if (diff <= 100000) return 4
  if (diff <= 200000) return 2
  return 0
}

/**
 * Score geographic proximity (0-15).
 */
export function scoreGeoMatch(
  ref: Pick<VehicleForSimilarity, 'province' | 'country'>,
  candidate: Pick<VehicleForSimilarity, 'province' | 'country'>,
): number {
  if (
    ref.province &&
    candidate.province &&
    ref.province.toLowerCase() === candidate.province.toLowerCase()
  )
    return 15
  if (
    ref.country &&
    candidate.country &&
    ref.country.toLowerCase() === candidate.country.toLowerCase()
  )
    return 8
  return 0
}

/**
 * Calculate total similarity score (0-100) between two vehicles.
 */
export function calculateSimilarity(
  reference: VehicleForSimilarity,
  candidate: VehicleForSimilarity,
): SimilarityResult {
  const category = scoreCategoryMatch(reference, candidate)
  const brand = scoreBrandMatch(reference, candidate)
  const price = scorePriceProximity(reference.price, candidate.price)
  const year = scoreYearProximity(reference.year, candidate.year)
  const km = scoreKmProximity(reference.km, candidate.km)
  const geo = scoreGeoMatch(reference, candidate)

  const total = Math.min(100, category + brand + price + year + km + geo)

  return {
    vehicleId: candidate.id,
    score: total,
    breakdown: { category, brand, price, year, km, geo },
  }
}

/**
 * Rank candidates by similarity to reference, filtering out low scores.
 */
export function rankSimilar(
  reference: VehicleForSimilarity,
  candidates: VehicleForSimilarity[],
  options?: { minScore?: number; limit?: number },
): SimilarityResult[] {
  const minScore = options?.minScore ?? 30
  const limit = options?.limit ?? 10

  return candidates
    .filter((c) => c.id !== reference.id)
    .map((c) => calculateSimilarity(reference, c))
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
