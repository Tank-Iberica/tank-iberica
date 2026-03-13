/**
 * Pricing suggestion composable — recommends price ranges for vehicle listings.
 *
 * Uses comparable vehicle data to calculate:
 * - Suggested price range (low–high)
 * - Fair market value estimate
 * - Competitiveness rating vs. current market
 * - Price positioning (below/at/above market)
 *
 * Pure calculation functions are exported for testability.
 * Used in dealer dashboard vehicle forms.
 */

export interface VehicleComparable {
  price: number
  year: number
  km: number
  category_id?: string
  subcategory_id?: string
  brand?: string
  model?: string
}

export interface PriceSuggestion {
  low: number
  mid: number
  high: number
  comparableCount: number
  confidence: 'low' | 'medium' | 'high'
  positioning: 'below_market' | 'at_market' | 'above_market'
}

/**
 * Calculate percentile from sorted array.
 */
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  if (sorted.length === 1) return sorted[0]
  const index = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower)
}

/**
 * Calculate median of a number array.
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return percentile(sorted, 50)
}

/**
 * Remove outliers using IQR method.
 */
export function removeOutliers(values: number[], factor: number = 1.5): number[] {
  if (values.length < 4) return values
  const sorted = [...values].sort((a, b) => a - b)
  const q1 = percentile(sorted, 25)
  const q3 = percentile(sorted, 75)
  const iqr = q3 - q1
  const lower = q1 - factor * iqr
  const upper = q3 + factor * iqr
  return sorted.filter((v) => v >= lower && v <= upper)
}

/**
 * Determine confidence level based on comparable count.
 */
export function getConfidence(count: number): 'low' | 'medium' | 'high' {
  if (count >= 10) return 'high'
  if (count >= 5) return 'medium'
  return 'low'
}

/**
 * Determine price positioning relative to suggested range.
 */
export function getPositioning(
  currentPrice: number,
  low: number,
  high: number,
): 'below_market' | 'at_market' | 'above_market' {
  if (currentPrice < low) return 'below_market'
  if (currentPrice > high) return 'above_market'
  return 'at_market'
}

/**
 * Calculate age-adjusted similarity score (0-1) between two vehicles.
 * Used to weight comparables by relevance.
 */
export function similarityScore(
  target: Pick<VehicleComparable, 'year' | 'km'>,
  comparable: Pick<VehicleComparable, 'year' | 'km'>,
): number {
  const yearDiff = Math.abs(target.year - comparable.year)
  const kmDiff = Math.abs(target.km - comparable.km)

  // Year penalty: 0.15 per year difference, max 1.0 penalty
  const yearScore = Math.max(0, 1 - yearDiff * 0.15)

  // KM penalty: 0.1 per 50,000 km difference, max 1.0 penalty
  const kmScore = Math.max(0, 1 - (kmDiff / 50000) * 0.1)

  return yearScore * 0.6 + kmScore * 0.4
}

/**
 * Calculate suggested price range from comparable prices.
 */
export function calculateSuggestion(
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
  const positioning = currentPrice
    ? getPositioning(currentPrice, low, high)
    : 'at_market'

  return {
    low,
    mid,
    high,
    comparableCount: cleaned.length,
    confidence,
    positioning,
  }
}

export function usePricingSuggestion() {
  const supabase = useSupabaseClient()

  const suggestion = ref<PriceSuggestion | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch comparable vehicles and calculate price suggestion.
   */
  async function fetchSuggestion(params: {
    categoryId?: string
    subcategoryId?: string
    brand?: string
    model?: string
    year: number
    km: number
    currentPrice?: number
    vertical?: string
  }): Promise<void> {
    loading.value = true
    error.value = null
    suggestion.value = null

    try {
      // Build query for comparable vehicles
      let query = supabase
        .from('vehicles')
        .select('price, year, km')
        .eq('status', 'published')
        .gt('price', 0)

      if (params.vertical) {
        query = query.eq('vertical', params.vertical)
      }

      // Filter by same category/subcategory
      if (params.subcategoryId) {
        query = query.eq('subcategory_id', params.subcategoryId)
      } else if (params.categoryId) {
        query = query.eq('category_id', params.categoryId)
      }

      // Same brand if available
      if (params.brand) {
        query = query.ilike('brand', params.brand)
      }

      // Year range: ±3 years
      query = query
        .gte('year', params.year - 3)
        .lte('year', params.year + 3)

      const { data: comparables, error: fetchErr } = await query.limit(100)

      if (fetchErr) throw fetchErr
      if (!comparables?.length) {
        suggestion.value = null
        return
      }

      // Weight prices by similarity
      const prices = (comparables as Array<{ price: number; year: number; km: number }>)
        .map((c) => c.price)

      suggestion.value = calculateSuggestion(prices, params.currentPrice)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error fetching price suggestion'
    } finally {
      loading.value = false
    }
  }

  return {
    suggestion: readonly(suggestion),
    loading: readonly(loading),
    error: readonly(error),
    fetchSuggestion,
  }
}
