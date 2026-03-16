/**
 * Search relevance scoring for vehicle catalog queries.
 *
 * Scores how well a vehicle matches a user's search intent:
 * - Text match quality (brand/model/description)
 * - Filter match (category, price range, year, km)
 * - Geo proximity (same province/country)
 * - Recency boost
 *
 * Used to rank search results beyond simple text matching.
 */

export interface SearchQuery {
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

export interface SearchableVehicle {
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

/**
 * Simple token-based text match score (0-40).
 * Scores brand/model match higher than description match.
 */
export function scoreTextMatch(
  query: string,
  vehicle: Pick<SearchableVehicle, 'brand' | 'model' | 'description'>,
): number {
  if (!query || query.trim().length === 0) return 20 // No text = neutral
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return 20

  let score = 0
  const brandLower = (vehicle.brand ?? '').toLowerCase()
  const modelLower = (vehicle.model ?? '').toLowerCase()
  const descLower = (vehicle.description ?? '').toLowerCase()

  for (const token of tokens) {
    // Brand match: 15 points (highest)
    if (brandLower.includes(token)) {
      score += 15
    }
    // Model match: 12 points
    else if (modelLower.includes(token)) {
      score += 12
    }
    // Description match: 5 points
    else if (descLower.includes(token)) {
      score += 5
    }
  }

  // Normalize by token count to keep scale consistent
  return Math.min(40, Math.round(score / tokens.length))
}

/**
 * Check if a value falls within a range (min/max both optional).
 */
function isInRange(value: number | undefined, min?: number, max?: number): boolean {
  if (value === undefined) return false
  if (min !== undefined && value < min) return false
  if (max !== undefined && value > max) return false
  return true
}

/**
 * Score how well a vehicle matches filter criteria (0-30).
 */
export function scoreFilterMatch(query: SearchQuery, vehicle: SearchableVehicle): number {
  let score = 0
  let filterCount = 0

  if (query.categoryId) {
    filterCount++
    if (vehicle.categoryId === query.categoryId) score += 10
  }

  if (query.subcategoryId) {
    filterCount++
    if (vehicle.subcategoryId === query.subcategoryId) score += 10
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filterCount++
    if (isInRange(vehicle.price, query.minPrice, query.maxPrice)) score += 10
  }

  if (query.minYear !== undefined || query.maxYear !== undefined) {
    filterCount++
    if (isInRange(vehicle.year, query.minYear, query.maxYear)) score += 5
  }

  if (query.maxKm !== undefined) {
    filterCount++
    if (vehicle.km !== undefined && vehicle.km <= query.maxKm) score += 5
  }

  if (filterCount === 0) return 15
  return Math.min(30, score)
}

/**
 * Score geographic proximity (0-15).
 */
export function scoreGeoProximity(
  query: SearchQuery,
  vehicle: Pick<SearchableVehicle, 'province' | 'country'>,
): number {
  if (!query.province && !query.country) return 8 // No geo preference = neutral

  let score = 0

  // Same province: 15 points
  if (
    query.province &&
    vehicle.province &&
    query.province.toLowerCase() === vehicle.province.toLowerCase()
  ) {
    score += 15
  }
  // Same country: 8 points
  else if (
    query.country &&
    vehicle.country &&
    query.country.toLowerCase() === vehicle.country.toLowerCase()
  ) {
    score += 8
  }

  return Math.min(15, score)
}

/**
 * Score recency (0-15).
 */
export function scoreRecency(createdDaysAgo: number): number {
  if (createdDaysAgo <= 3) return 15
  if (createdDaysAgo <= 7) return 12
  if (createdDaysAgo <= 14) return 9
  if (createdDaysAgo <= 30) return 6
  if (createdDaysAgo <= 60) return 3
  return 1
}

/**
 * Calculate total search relevance score (0-100).
 */
export function calculateSearchRelevance(query: SearchQuery, vehicle: SearchableVehicle): number {
  const text = scoreTextMatch(query.text ?? '', vehicle)
  const filter = scoreFilterMatch(query, vehicle)
  const geo = scoreGeoProximity(query, vehicle)
  const recency = scoreRecency(vehicle.createdDaysAgo)

  return Math.min(100, text + filter + geo + recency)
}
