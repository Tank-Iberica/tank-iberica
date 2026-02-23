/**
 * useMarketData — Composable for querying market intelligence materialized views.
 * Provides market data, price history, demand data, valuations, category stats, and trends.
 * Used by the public /datos page and dealer analytics features.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MarketDataRow {
  vertical: string
  action: string
  subcategory: string
  brand: string
  location_province: string
  location_country: string
  month: string
  listings: number
  avg_price: number
  median_price: number
  min_price: number
  max_price: number
  avg_days_to_sell: number | null
  sold_count: number
}

export interface PriceHistoryRow {
  vertical: string
  subcategory: string
  brand: string
  week: string
  avg_price: number
  median_price: number
  sample_size: number
}

export interface DemandDataRow {
  vertical: string
  category: string
  subcategory: string
  brand: string
  province: string
  month: string
  alert_count: number
}

export interface MarketFilters {
  subcategory?: string
  brand?: string
  province?: string
  months?: number // last N months, default 12
}

export interface PriceHistoryFilters {
  subcategory?: string
  brand?: string
  weeks?: number // last N weeks, default 52
}

export interface DemandFilters {
  subcategory?: string
  brand?: string
  province?: string
}

export interface ValuationParams {
  brand: string
  model?: string
  year?: number
  km?: number
  province?: string
  subcategory?: string
}

export interface ValuationResult {
  estimated_min: number
  estimated_median: number
  estimated_max: number
  market_trend: 'rising' | 'falling' | 'stable'
  trend_pct: number
  avg_days_to_sell: number | null
  sample_size: number
  confidence: 'low' | 'medium' | 'high'
}

export interface CategoryStat {
  subcategory: string
  avg_price: number
  listings: number
  trend_pct: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns 'YYYY-MM' for a date offset by N months from now. */
function getMonthCutoff(monthsAgo: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - monthsAgo)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/** Returns 'YYYY-Www' (ISO week) for a date offset by N weeks from now. */
function getWeekCutoff(weeksAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - weeksAgo * 7)
  const y = d.getFullYear()
  // Approximate ISO week number
  const jan1 = new Date(y, 0, 1)
  const dayOfYear = Math.floor((d.getTime() - jan1.getTime()) / 86400000) + 1
  const week = Math.ceil(dayOfYear / 7)
  return `${y}-W${String(week).padStart(2, '0')}`
}

/** Compute percent change; returns 0 when previous is 0. */
function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

/** Determine confidence level based on sample size. */
function getConfidence(sampleSize: number): 'low' | 'medium' | 'high' {
  if (sampleSize >= 20) return 'high'
  if (sampleSize >= 10) return 'medium'
  return 'low'
}

/** Determine trend direction from percentage change. */
function getTrendDirection(pct: number): 'rising' | 'falling' | 'stable' {
  if (pct > 2) return 'rising'
  if (pct < -2) return 'falling'
  return 'stable'
}

/** Compute the median from a sorted array of numbers. */
function computeMedian(sorted: number[]): number {
  if (sorted.length === 0) return 0
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

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
        .select('*')
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

      marketData.value = (data || []) as MarketDataRow[]
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
        .select('*')
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

      priceHistory.value = (data || []) as PriceHistoryRow[]
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
      let query = supabase.from('demand_data').select('*').order('month', { ascending: false })

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

      demandData.value = (data || []) as DemandDataRow[]
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
      // --- Fetch matching market data rows ---
      let marketQuery = supabase
        .from('market_data')
        .select('*')
        .eq('brand', params.brand)
        .order('month', { ascending: false })

      if (params.subcategory) {
        marketQuery = marketQuery.eq('subcategory', params.subcategory)
      }
      if (params.province) {
        marketQuery = marketQuery.eq('location_province', params.province)
      }

      const { data: mData, error: mErr } = await marketQuery

      if (mErr) throw mErr

      const rows = (mData || []) as MarketDataRow[]

      if (rows.length === 0) {
        error.value = 'No market data found for the given parameters'
        return null
      }

      // --- Compute base price statistics from all matching rows ---
      const prices = rows.map((r) => r.avg_price).filter((p) => p > 0)
      prices.sort((a, b) => a - b)

      const totalSample = rows.reduce((sum, r) => sum + r.listings, 0)
      const baseMin = prices.length > 0 ? prices[0] : 0
      const baseMedian = computeMedian(prices)
      const baseMax = prices.length > 0 ? prices[prices.length - 1] : 0

      // --- Compute avg_days_to_sell ---
      const daysValues = rows
        .map((r) => r.avg_days_to_sell)
        .filter((d): d is number => d !== null && d > 0)
      const avgDaysToSell =
        daysValues.length > 0
          ? Math.round(daysValues.reduce((sum, d) => sum + d, 0) / daysValues.length)
          : null

      // --- Compute trend from last 2 months ---
      const uniqueMonths = [...new Set(rows.map((r) => r.month))].sort().reverse()
      let trendPct = 0

      if (uniqueMonths.length >= 2) {
        const currentMonthRows = rows.filter((r) => r.month === uniqueMonths[0])
        const previousMonthRows = rows.filter((r) => r.month === uniqueMonths[1])

        const currentAvg =
          currentMonthRows.length > 0
            ? currentMonthRows.reduce((sum, r) => sum + r.avg_price, 0) / currentMonthRows.length
            : 0
        const previousAvg =
          previousMonthRows.length > 0
            ? previousMonthRows.reduce((sum, r) => sum + r.avg_price, 0) / previousMonthRows.length
            : 0

        trendPct = pctChange(currentAvg, previousAvg)
      }

      // --- Apply year depreciation adjustment ---
      // Each year older from current year = ~5% lower price
      let depreciationFactor = 1
      if (params.year) {
        const currentYear = new Date().getFullYear()
        const yearsOld = Math.max(0, currentYear - params.year)
        depreciationFactor = Math.max(0.1, 1 - yearsOld * 0.05)
      }

      const estimatedMin = Math.round(baseMin * depreciationFactor)
      const estimatedMedian = Math.round(baseMedian * depreciationFactor)
      const estimatedMax = Math.round(baseMax * depreciationFactor)

      return {
        estimated_min: estimatedMin,
        estimated_median: estimatedMedian,
        estimated_max: estimatedMax,
        market_trend: getTrendDirection(trendPct),
        trend_pct: trendPct,
        avg_days_to_sell: avgDaysToSell,
        sample_size: totalSample,
        confidence: getConfidence(totalSample),
      }
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
      // Fetch the last 2 months of market data to compute trends
      const cutoff = getMonthCutoff(2)

      const { data, error: err } = await supabase
        .from('market_data')
        .select('*')
        .gte('month', cutoff)
        .order('month', { ascending: false })

      if (err) throw err

      const rows = (data || []) as MarketDataRow[]

      if (rows.length === 0) return []

      // Determine latest and previous months from the data
      const uniqueMonths = [...new Set(rows.map((r) => r.month))].sort().reverse()
      const latestMonth = uniqueMonths[0]
      const previousMonth = uniqueMonths.length >= 2 ? uniqueMonths[1] : null

      // Aggregate by subcategory for the latest month
      const latestRows = rows.filter((r) => r.month === latestMonth)
      const previousRows = previousMonth ? rows.filter((r) => r.month === previousMonth) : []

      const subcategoryMap = new Map<
        string,
        { totalPrice: number; totalListings: number; count: number }
      >()

      for (const row of latestRows) {
        const existing = subcategoryMap.get(row.subcategory)
        if (existing) {
          existing.totalPrice += row.avg_price * row.listings
          existing.totalListings += row.listings
          existing.count++
        } else {
          subcategoryMap.set(row.subcategory, {
            totalPrice: row.avg_price * row.listings,
            totalListings: row.listings,
            count: 1,
          })
        }
      }

      // Aggregate previous month for trend calculation
      const prevSubcategoryMap = new Map<string, { totalPrice: number; totalListings: number }>()

      for (const row of previousRows) {
        const existing = prevSubcategoryMap.get(row.subcategory)
        if (existing) {
          existing.totalPrice += row.avg_price * row.listings
          existing.totalListings += row.listings
        } else {
          prevSubcategoryMap.set(row.subcategory, {
            totalPrice: row.avg_price * row.listings,
            totalListings: row.listings,
          })
        }
      }

      // Build result
      const stats: CategoryStat[] = []

      for (const [subcategory, data] of subcategoryMap.entries()) {
        const avgPrice =
          data.totalListings > 0 ? Math.round(data.totalPrice / data.totalListings) : 0

        let trendPct = 0
        const prev = prevSubcategoryMap.get(subcategory)
        if (prev && prev.totalListings > 0) {
          const prevAvgPrice = Math.round(prev.totalPrice / prev.totalListings)
          trendPct = pctChange(avgPrice, prevAvgPrice)
        }

        stats.push({
          subcategory,
          avg_price: avgPrice,
          listings: data.totalListings,
          trend_pct: trendPct,
        })
      }

      // Sort by listings descending
      stats.sort((a, b) => b.listings - a.listings)

      return stats
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

      if (brand) {
        query = query.eq('brand', brand)
      }

      const { data, error: err } = await query

      if (err) throw err

      const rows = (data || []) as Pick<MarketDataRow, 'month' | 'avg_price' | 'listings'>[]

      if (rows.length === 0) return 0

      const uniqueMonths = [...new Set(rows.map((r) => r.month))].sort().reverse()

      if (uniqueMonths.length < 2) return 0

      const currentRows = rows.filter((r) => r.month === uniqueMonths[0])
      const previousRows = rows.filter((r) => r.month === uniqueMonths[1])

      // Weighted average by listings count
      const currentTotal = currentRows.reduce((sum, r) => sum + r.avg_price * r.listings, 0)
      const currentListings = currentRows.reduce((sum, r) => sum + r.listings, 0)
      const previousTotal = previousRows.reduce((sum, r) => sum + r.avg_price * r.listings, 0)
      const previousListings = previousRows.reduce((sum, r) => sum + r.listings, 0)

      const currentAvg = currentListings > 0 ? currentTotal / currentListings : 0
      const previousAvg = previousListings > 0 ? previousTotal / previousListings : 0

      return pctChange(currentAvg, previousAvg)
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
