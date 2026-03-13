/**
 * Vehicle scoring composable — ranks vehicles for search and catalog display.
 *
 * Calculates a relevance score (0-100) for each vehicle based on:
 * - Listing completeness (photos, description, attributes)
 * - Freshness (recently listed rank higher)
 * - Engagement (views, favorites, leads)
 * - Price competitiveness (vs. similar vehicles)
 * - Dealer trust (health score, verified status)
 *
 * Used for catalog sorting ("best match") and featured vehicle selection.
 */

export interface VehicleScoringInput {
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
  dealerHealthScore: number // 0-100
  isFeatured: boolean
}

export interface VehicleScore {
  total: number
  completeness: number
  freshness: number
  engagement: number
  dealerTrust: number
  boost: number
}

/**
 * Score listing completeness (0-30).
 */
export function scoreCompleteness(input: Pick<VehicleScoringInput,
  'photoCount' | 'descriptionLength' | 'hasPrice' | 'hasBrand' | 'hasModel' | 'hasYear' | 'hasKm'
>): number {
  let score = 0

  // Photos: 0-10
  if (input.photoCount >= 6) score += 10
  else if (input.photoCount >= 3) score += 6
  else if (input.photoCount >= 1) score += 3

  // Description: 0-8
  if (input.descriptionLength >= 200) score += 8
  else if (input.descriptionLength >= 100) score += 5
  else if (input.descriptionLength >= 50) score += 2

  // Core attributes: 0-8 (2 each)
  if (input.hasPrice) score += 2
  if (input.hasBrand) score += 2
  if (input.hasModel) score += 2
  if (input.hasYear) score += 1
  if (input.hasKm) score += 1

  // Price is critical: extra 4 points
  if (input.hasPrice) score += 4

  return Math.min(30, score)
}

/**
 * Score freshness based on days since creation (0-25).
 * Newer listings rank higher with exponential decay.
 */
export function scoreFreshness(createdDaysAgo: number): number {
  if (createdDaysAgo <= 1) return 25
  if (createdDaysAgo <= 3) return 22
  if (createdDaysAgo <= 7) return 18
  if (createdDaysAgo <= 14) return 14
  if (createdDaysAgo <= 30) return 10
  if (createdDaysAgo <= 60) return 6
  if (createdDaysAgo <= 90) return 3
  return 1
}

/**
 * Score engagement based on user interactions (0-25).
 * Uses logarithmic scaling to avoid dominance by high-traffic vehicles.
 */
export function scoreEngagement(input: Pick<VehicleScoringInput,
  'viewCount' | 'favoriteCount' | 'leadCount'
>): number {
  // Views: 0-10 (log scale)
  const viewScore = Math.min(10, Math.round(Math.log2(input.viewCount + 1) * 1.5))

  // Favorites: 0-8 (weighted more heavily)
  const favScore = Math.min(8, input.favoriteCount * 2)

  // Leads: 0-7 (highest signal)
  const leadScore = Math.min(7, input.leadCount * 3)

  return Math.min(25, viewScore + favScore + leadScore)
}

/**
 * Score dealer trustworthiness (0-15).
 */
export function scoreDealerTrust(input: Pick<VehicleScoringInput,
  'dealerVerified' | 'dealerHealthScore'
>): number {
  let score = 0

  // Verified dealer: 5 points
  if (input.dealerVerified) score += 5

  // Health score contribution: 0-10 (scaled from 0-100)
  score += Math.round(input.dealerHealthScore / 10)

  return Math.min(15, score)
}

/**
 * Calculate boost for featured/promoted vehicles (0-5).
 */
export function scoreBoost(input: Pick<VehicleScoringInput, 'isFeatured'>): number {
  return input.isFeatured ? 5 : 0
}

/**
 * Calculate total vehicle score (0-100).
 */
export function calculateVehicleScore(input: VehicleScoringInput): VehicleScore {
  const completeness = scoreCompleteness(input)
  const freshness = scoreFreshness(input.createdDaysAgo)
  const engagement = scoreEngagement(input)
  const dealerTrust = scoreDealerTrust(input)
  const boost = scoreBoost(input)

  return {
    total: Math.min(100, completeness + freshness + engagement + dealerTrust + boost),
    completeness,
    freshness,
    engagement,
    dealerTrust,
    boost,
  }
}

/**
 * Sort vehicles by score descending.
 */
export function sortByScore<T extends { score: number }>(vehicles: T[]): T[] {
  return [...vehicles].sort((a, b) => b.score - a.score)
}
