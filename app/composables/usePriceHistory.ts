/**
 * usePriceHistory — Composable for fetching and computing vehicle price history
 * and fair price estimates. Provides trend analysis, chart data, and category-based
 * fair price calculation with weighted averages.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PricePoint {
  price_cents: number
  previous_price_cents: number | null
  change_type: string
  created_at: string
}

export type PriceTrend = 'rising' | 'falling' | 'stable'

interface ChartDataPoint {
  date: string
  price: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HISTORY_LIMIT = 100
const FAIR_PRICE_SAMPLE_SIZE = 3
const VEHICLE_HISTORY_WEIGHT = 0.4
const CATEGORY_AVERAGE_WEIGHT = 0.6
const YEAR_RANGE = 3
const CHART_DAYS = 90

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function usePriceHistory(vehicleId: string) {
  const supabase = useSupabaseClient()

  const history = ref<PricePoint[]>([])
  const loading = ref(false)
  const fairPriceCents = ref<number | null>(null)
  const currentPrice = ref<number | null>(null)

  // ---- Computed properties ------------------------------------------------

  const priceTrend = computed<PriceTrend>(() => {
    if (history.value.length < 2) return 'stable'

    const recent = history.value.slice(0, 3)
    let rises = 0
    let falls = 0

    for (const point of recent) {
      if (point.previous_price_cents === null) continue
      if (point.price_cents > point.previous_price_cents) rises++
      else if (point.price_cents < point.previous_price_cents) falls++
    }

    if (rises > falls) return 'rising'
    if (falls > rises) return 'falling'
    return 'stable'
  })

  const highestPrice = computed<number | null>(() => {
    if (history.value.length === 0) return null
    return Math.max(...history.value.map((p) => p.price_cents))
  })

  const lowestPrice = computed<number | null>(() => {
    if (history.value.length === 0) return null
    return Math.min(...history.value.map((p) => p.price_cents))
  })

  const priceDropPercentage = computed<number>(() => {
    if (!highestPrice.value || !currentPrice.value) return 0
    if (highestPrice.value === 0) return 0

    const drop = ((highestPrice.value - currentPrice.value) / highestPrice.value) * 100
    return Math.max(0, Math.round(drop * 100) / 100)
  })

  const chartData = computed<ChartDataPoint[]>(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - CHART_DAYS)
    const cutoffISO = cutoff.toISOString()

    return history.value
      .filter((p) => p.created_at >= cutoffISO)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((p) => ({
        date: p.created_at.slice(0, 10),
        price: p.price_cents,
      }))
  })

  // ---- Methods ------------------------------------------------------------

  async function fetchHistory(): Promise<void> {
    loading.value = true

    try {
      const { data, error } = await supabase
        .from('price_history')
        .select('price_cents, previous_price_cents, change_type, created_at')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false })
        .limit(HISTORY_LIMIT)

      if (error) {
        throw new Error(`Failed to fetch price history: ${error.message}`)
      }

      history.value = (data ?? []) as unknown as PricePoint[]
      currentPrice.value = history.value.length > 0 ? history.value[0]!.price_cents : null
    } finally {
      loading.value = false
    }
  }

  async function calculateFairPrice(): Promise<void> {
    // Step 1: Vehicle history average (last N price points)
    const recentPrices = history.value.slice(0, FAIR_PRICE_SAMPLE_SIZE)
    const vehicleAvg =
      recentPrices.length > 0
        ? recentPrices.reduce((sum, p) => sum + p.price_cents, 0) / recentPrices.length
        : null

    // Step 2: Get vehicle details for category comparison
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('category_id, year')
      .eq('id', vehicleId)
      .single()

    if (vehicleError || !vehicle) {
      // Fall back to vehicle average only
      fairPriceCents.value = vehicleAvg !== null ? Math.round(vehicleAvg) : null
      return
    }

    const vehicleYear = vehicle.year as number | null
    const categoryId = vehicle.category_id as string | null

    // Step 3: Category average from similar vehicles
    let categoryAvg: number | null = null

    if (categoryId) {
      let query = supabase
        .from('vehicles')
        .select('price')
        .eq('category_id', categoryId)
        .eq('status', 'published')
        .eq('vertical', getVerticalSlug())
        .neq('id', vehicleId)
        .not('price', 'is', null)

      if (vehicleYear !== null) {
        query = query.gte('year', vehicleYear - YEAR_RANGE).lte('year', vehicleYear + YEAR_RANGE)
      }

      const { data: similarVehicles, error: catError } = await query

      if (!catError && similarVehicles && similarVehicles.length > 0) {
        const prices = similarVehicles
          .map((v) => v.price as number | null)
          .filter((p): p is number => p !== null)

        if (prices.length > 0) {
          // Convert euros to cents for comparison (vehicles.price is in euros)
          categoryAvg = (prices.reduce((sum, p) => sum + p, 0) / prices.length) * 100
        }
      }
    }

    // Step 4: Weighted fair price calculation
    if (vehicleAvg !== null && categoryAvg !== null) {
      fairPriceCents.value = Math.round(
        vehicleAvg * VEHICLE_HISTORY_WEIGHT + categoryAvg * CATEGORY_AVERAGE_WEIGHT,
      )
    } else if (vehicleAvg !== null) {
      fairPriceCents.value = Math.round(vehicleAvg)
    } else if (categoryAvg !== null) {
      fairPriceCents.value = Math.round(categoryAvg)
    } else {
      fairPriceCents.value = null
    }

    // Step 5: Fire-and-forget update on the vehicles table
    const trend = priceTrend.value
    supabase
      .from('vehicles')
      .update({
        fair_price_cents: fairPriceCents.value,
        price_trend: trend,
      })
      .eq('id', vehicleId)
      .then()
  }

  // ---- SSR-safe initialization --------------------------------------------

  if (import.meta.client) {
    onMounted(async () => {
      await fetchHistory()
      await calculateFairPrice()
    })
  }

  return {
    history,
    loading,
    fairPriceCents,
    priceTrend,
    priceDropPercentage,
    currentPrice,
    lowestPrice,
    highestPrice,
    fetchHistory,
    calculateFairPrice,
    chartData,
  }
}
