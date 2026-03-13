/**
 * usePriceRelativeToMarket — Calculates a vehicle's price deviation vs market average.
 *
 * Queries vehicles with the same brand+model+year (±2 years) to find the
 * market average. Returns the deviation percentage and whether enough data exists.
 *
 * Pure functions are exported for unit testing.
 */

export interface MarketComparison {
  marketAvg: number
  deviationPercent: number
  comparableCount: number
  hasData: boolean
}

/**
 * Calculate deviation percentage of `price` vs `marketAvg`.
 * Returns 0 when marketAvg is 0 to avoid division by zero.
 */
export function calcDeviation(price: number, marketAvg: number): number {
  if (marketAvg === 0 || price <= 0) return 0
  return ((price - marketAvg) / marketAvg) * 100
}

/**
 * Calculate arithmetic mean of an array of prices.
 * Returns 0 for empty arrays.
 */
export function calcMean(prices: number[]): number {
  if (prices.length === 0) return 0
  return prices.reduce((a, b) => a + b, 0) / prices.length
}

/**
 * Classify deviation into a price level.
 * Thresholds: < -10% = 'good', > +10% = 'high', else 'average'.
 */
export function classifyDeviation(deviation: number): 'good' | 'high' | 'average' {
  if (deviation < -10) return 'good'
  if (deviation > 10) return 'high'
  return 'average'
}

export function usePriceRelativeToMarket() {
  const supabase = useSupabaseClient()

  const comparison = ref<MarketComparison | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch comparable vehicles and calculate market comparison.
   * Requires at least 3 comparables to be considered meaningful.
   */
  async function fetchComparison(params: {
    brand: string
    model: string
    year: number
    price: number
    vertical?: string
  }): Promise<void> {
    loading.value = true
    error.value = null
    comparison.value = null

    try {
      let query = supabase
        .from('vehicles')
        .select('price')
        .eq('brand', params.brand)
        .ilike('model', params.model)
        .gte('year', params.year - 2)
        .lte('year', params.year + 2)
        .eq('status', 'published')
        .gt('price', 0)
        .limit(50)

      if (params.vertical) {
        query = query.eq('vertical', params.vertical)
      }

      const { data, error: fetchErr } = await query

      if (fetchErr) throw fetchErr

      const prices = (data ?? []).map((v: { price: number }) => v.price).filter((p) => p > 0)

      const hasData = prices.length >= 3
      const marketAvg = hasData ? Math.round(calcMean(prices)) : 0
      const deviationPercent = hasData
        ? Math.round(calcDeviation(params.price, marketAvg) * 10) / 10
        : 0

      comparison.value = {
        marketAvg,
        deviationPercent,
        comparableCount: prices.length,
        hasData,
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error fetching market comparison'
    } finally {
      loading.value = false
    }
  }

  return {
    comparison: readonly(comparison),
    loading: readonly(loading),
    error: readonly(error),
    fetchComparison,
    calcDeviation,
    calcMean,
    classifyDeviation,
  }
}
