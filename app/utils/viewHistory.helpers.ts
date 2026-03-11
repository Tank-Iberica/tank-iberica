/**
 * Pure functions for view history analysis and recommendation scoring.
 * Extracted for testability.
 */

export interface ViewEntry {
  vehicleId: string
  brand: string
  category: string
  subcategory?: string
  priceRange: 'low' | 'mid' | 'high' | 'premium'
  yearRange: 'old' | 'mid' | 'recent' | 'new'
  viewedAt: string
}

export interface UserPreferences {
  topBrands: Array<{ brand: string; count: number }>
  topCategories: Array<{ category: string; count: number }>
  pricePreference: 'low' | 'mid' | 'high' | 'premium' | null
  yearPreference: 'old' | 'mid' | 'recent' | 'new' | null
}

/**
 * Classify a price into a range bucket.
 */
export function classifyPrice(price: number): ViewEntry['priceRange'] {
  if (price < 15000) return 'low'
  if (price < 50000) return 'mid'
  if (price < 120000) return 'high'
  return 'premium'
}

/**
 * Classify a vehicle year into a range bucket.
 */
export function classifyYear(year: number): ViewEntry['yearRange'] {
  const currentYear = new Date().getFullYear()
  const age = currentYear - year
  if (age > 10) return 'old'
  if (age > 5) return 'mid'
  if (age > 2) return 'recent'
  return 'new'
}

/**
 * Extract user preferences from view history.
 * Analyzes frequency of brands, categories, price ranges, and year ranges.
 */
export function extractPreferences(history: ViewEntry[]): UserPreferences {
  if (history.length === 0) {
    return { topBrands: [], topCategories: [], pricePreference: null, yearPreference: null }
  }

  // Count brands
  const brandCounts = new Map<string, number>()
  for (const entry of history) {
    brandCounts.set(entry.brand, (brandCounts.get(entry.brand) ?? 0) + 1)
  }
  const topBrands = Array.from(brandCounts.entries())
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Count categories
  const catCounts = new Map<string, number>()
  for (const entry of history) {
    catCounts.set(entry.category, (catCounts.get(entry.category) ?? 0) + 1)
  }
  const topCategories = Array.from(catCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Price preference (mode)
  const priceCounts = new Map<string, number>()
  for (const entry of history) {
    priceCounts.set(entry.priceRange, (priceCounts.get(entry.priceRange) ?? 0) + 1)
  }
  const pricePreference =
    priceCounts.size > 0
      ? (Array.from(priceCounts.entries()).sort(
          (a, b) => b[1] - a[1],
        )[0][0] as ViewEntry['priceRange'])
      : null

  // Year preference (mode)
  const yearCounts = new Map<string, number>()
  for (const entry of history) {
    yearCounts.set(entry.yearRange, (yearCounts.get(entry.yearRange) ?? 0) + 1)
  }
  const yearPreference =
    yearCounts.size > 0
      ? (Array.from(yearCounts.entries()).sort(
          (a, b) => b[1] - a[1],
        )[0][0] as ViewEntry['yearRange'])
      : null

  return { topBrands, topCategories, pricePreference, yearPreference }
}

/**
 * Score a vehicle against user preferences.
 * Returns 0-100 relevance score.
 */
export function scoreVehicle(
  vehicle: { brand: string; category: string; price: number; year: number },
  prefs: UserPreferences,
): number {
  if (prefs.topBrands.length === 0) return 0

  let score = 0
  const maxScore = 100

  // Brand match: up to 35 points
  const brandMatch = prefs.topBrands.find((b) => b.brand === vehicle.brand)
  if (brandMatch) {
    const brandRank = prefs.topBrands.indexOf(brandMatch)
    score += 35 - brandRank * 7 // 35, 28, 21, 14, 7
  }

  // Category match: up to 30 points
  const catMatch = prefs.topCategories.find((c) => c.category === vehicle.category)
  if (catMatch) {
    const catRank = prefs.topCategories.indexOf(catMatch)
    score += 30 - catRank * 6 // 30, 24, 18, 12, 6
  }

  // Price range match: up to 20 points
  if (prefs.pricePreference && classifyPrice(vehicle.price) === prefs.pricePreference) {
    score += 20
  }

  // Year range match: up to 15 points
  if (prefs.yearPreference && classifyYear(vehicle.year) === prefs.yearPreference) {
    score += 15
  }

  return Math.min(score, maxScore)
}

/**
 * Deduplicate view history, keeping the most recent view per vehicle.
 */
export function deduplicateHistory(history: ViewEntry[]): ViewEntry[] {
  const seen = new Map<string, ViewEntry>()
  for (const entry of history) {
    const existing = seen.get(entry.vehicleId)
    if (!existing || entry.viewedAt > existing.viewedAt) {
      seen.set(entry.vehicleId, entry)
    }
  }
  return Array.from(seen.values()).sort((a, b) => b.viewedAt.localeCompare(a.viewedAt))
}
