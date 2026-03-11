/**
 * useMarketData — Composable for querying market intelligence materialized views.
 * Provides market data, price history, demand data, valuations, category stats, and trends.
 * Used by the public /datos page and dealer analytics features.
 *
 * Pure calculation helpers → shared/marketDataHelpers.ts
 * Type definitions       → shared/marketDataTypes.ts
 */

// Re-export types for backwards compatibility
export type {
  MarketDataRow,
  PriceHistoryRow,
  DemandDataRow,
  MarketFilters,
  PriceHistoryFilters,
  DemandFilters,
  ValuationParams,
  ValuationResult,
  CategoryStat,
} from '~/composables/shared/marketDataTypes'

import type {
  MarketDataRow,
  PriceHistoryRow,
  DemandDataRow,
  MarketFilters,
  PriceHistoryFilters,
  DemandFilters,
  ValuationParams,
  ValuationResult,
  CategoryStat,
} from '~/composables/shared/marketDataTypes'

import {
  computeValuation,
  buildCategoryStats,
  computeWeightedTrend,
  getMonthCutoff,
  getWeekCutoff,
} from '~/composables/shared/marketDataHelpers'

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useMarketData() {
  const supabase = useSupabaseClient()

  // -- Reactive state -------------------------------------------------------

  const loading = ref(false)
  const error = ref<string>('')
  const marketData = ref<MarketDataRow[]>([])
  const priceHistory = ref<PriceHistoryRow[]>([])
  const demandData = ref<DemandDataRow[]>([])

  // -------------------------------------------------------------------------
  // 1. Fetch Market Data
  // -------------------------------------------------------------------------

  async function fetchMarketData(filters: MarketFilters): Promise<void> {
    loading.value = true
    error.value = ''

    try {
      const monthsBack = filters.months ?? 12
      const cutoff = getMonthCutoff(monthsBack)

      let query = supabase
        .from('market_data')
        .select('vertical, action, subcategory, brand, location_province, location_country, month, listings, avg_price, median_price, min_price, max_price, avg_days_to_sell, sold_count')
        .gte('month', cutoff)
        .order('month', { ascending: false })

      if (filters.subcategory) {
        query = query.eq('subcategory', filters.subcategory)
      }
      if (filters.brand) {
        query = query.eq('brand', filters.brand)
      }
      if (filters.province) {
        query = query.eq('location_province', filters.province)
      }

      const { data, error: err } = await query

      if (err) throw err

      marketData.value = (data || []) as unknown as MarketDataRow[]
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching market data'
      marketData.value = []
    } finally {
      loading.value = false
    }
  }

  // -------------------------------------------------------------------------
  // 2. Fetch Price History
  // -------------------------------------------------------------------------

  async function fetchPriceHistory(filters: PriceHistoryFilters): Promise<void> {
    loading.value = true
    error.value = ''

    try {
      const weeksBack = filters.weeks ?? 52
      const cutoff = getWeekCutoff(weeksBack)

      let query = supabase
        .from('price_history')
        .select('vertical, subcategory, brand, week, avg_price, median_price, sample_size')
        .gte('week', cutoff)
        .order('week', { ascending: true })

      if (filters.subcategory) {
        query = query.eq('subcategory', filters.subcategory)
      }
      if (filters.brand) {
        query = query.eq('brand', filters.brand)
      }

      const { data, error: err } = await query

      if (err) throw err

      priceHistory.value = (data || []) as unknown as PriceHistoryRow[]
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching price history'
      priceHistory.value = []
    } finally {
      loading.value = false
    }
  }

  // -------------------------------------------------------------------------
  // 3. Fetch Demand Data
  // -------------------------------------------------------------------------

  async function fetchDemandData(filters: DemandFilters): Promise<void> {
    loading.value = true
    error.value = ''

    try {
      let query = supabase.from('demand_data').select('vertical, category, subcategory, brand, province, month, alert_count').order('month', { ascending: false })

      if (filters.subcategory) {
        query = query.eq('subcategory', filters.subcategory)
      }
      if (filters.brand) {
        query = query.eq('brand', filters.brand)
      }
      if (filters.province) {
        query = query.eq('province', filters.province)
      }

      const { data, error: err } = await query

      if (err) throw err

      demandData.value = (data || []) as unknown as DemandDataRow[]
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching demand data'
      demandData.value = []
    } finally {
      loading.value = false
    }
  }

  // -------------------------------------------------------------------------
  // 4. Get Valuation
  // -------------------------------------------------------------------------

  async function getValuation(params: ValuationParams): Promise<ValuationResult | null> {
    loading.value = true
    error.value = ''

    try {
      let marketQuery = supabase
        .from('market_data')
        .select('vertical, action, subcategory, brand, location_province, location_country, month, listings, avg_price, median_price, min_price, max_price, avg_days_to_sell, sold_count')
        .eq('brand', params.brand)
        .order('month', { ascending: false })

      if (params.subcategory) marketQuery = marketQuery.eq('subcategory', params.subcategory)
      if (params.province) marketQuery = marketQuery.eq('location_province', params.province)

      const { data: mData, error: mErr } = await marketQuery
      if (mErr) throw mErr

      const rows = (mData || []) as unknown as MarketDataRow[]
      if (rows.length === 0) {
        error.value = 'No market data found for the given parameters'
        return null
      }
      return computeValuation(rows, params.year)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error computing valuation'
      return null
    } finally {
      loading.value = false
    }
  }

  // -------------------------------------------------------------------------
  // 5. Get Category Stats
  // -------------------------------------------------------------------------

  async function getCategoryStats(): Promise<CategoryStat[]> {
    loading.value = true
    error.value = ''

    try {
      const cutoff = getMonthCutoff(2)
      const { data, error: err } = await supabase
        .from('market_data')
        .select('vertical, action, subcategory, brand, location_province, location_country, month, listings, avg_price, median_price, min_price, max_price, avg_days_to_sell, sold_count')
        .gte('month', cutoff)
        .order('month', { ascending: false })

      if (err) throw err
      return buildCategoryStats((data || []) as unknown as MarketDataRow[])
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching category stats'
      return []
    } finally {
      loading.value = false
    }
  }

  // -------------------------------------------------------------------------
  // 6. Get Trend
  // -------------------------------------------------------------------------

  async function getTrend(subcategory: string, brand?: string): Promise<number> {
    loading.value = true
    error.value = ''

    try {
      const cutoff = getMonthCutoff(2)
      let query = supabase
        .from('market_data')
        .select('month, avg_price, listings')
        .eq('subcategory', subcategory)
        .gte('month', cutoff)
        .order('month', { ascending: false })

      if (brand) query = query.eq('brand', brand)

      const { data, error: err } = await query
      if (err) throw err

      return computeWeightedTrend(
        (data || []) as unknown as Pick<MarketDataRow, 'month' | 'avg_price' | 'listings'>[],
      )
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error computing trend'
      return 0
    } finally {
      loading.value = false
    }
  }

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),
    marketData: readonly(marketData),
    priceHistory: readonly(priceHistory),
    demandData: readonly(demandData),

    // Actions
    fetchMarketData,
    fetchPriceHistory,
    fetchDemandData,
    getValuation,
    getCategoryStats,
    getTrend,
  }
}
