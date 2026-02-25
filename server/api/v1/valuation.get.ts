import { createClient, type SupabaseClient } from '@supabase/supabase-js'

interface MarketDataRow {
  avg_price: number | null
  brand: string
  subcategory: string | null
  location_province: string | null
  avg_days_to_sell: number | null
  created_at: string | null
}

interface ValuationResponse {
  estimated_price: { min: number; median: number; max: number }
  market_trend: 'rising' | 'falling' | 'stable'
  trend_pct: number
  avg_days_to_sell: number | null
  sample_size: number
  confidence: 'high' | 'medium' | 'low'
  data_date: string
}

interface DataSubscription {
  id: string
  api_key: string
  active: boolean
  rate_limit_daily: number
}

function computeMedian(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1]! + sorted[mid]!) / 2)
  }
  return Math.round(sorted[mid]!)
}

async function logUsage(
  supabase: SupabaseClient,
  apiKey: string,
  params: Record<string, unknown>,
  responseTimeMs: number,
  statusCode: number,
): Promise<void> {
  await supabase.from('api_usage').insert({
    api_key: apiKey,
    endpoint: '/api/v1/valuation',
    params,
    response_time_ms: responseTimeMs,
    status_code: statusCode,
  })
}

export default defineEventHandler(async (event): Promise<ValuationResponse> => {
  const query = getQuery(event)
  const authHeader = getHeader(event, 'authorization')

  const startTime = Date.now()

  // Extract API key
  const apiKey = authHeader?.replace('Bearer ', '')
  if (!apiKey) {
    throw createError({ statusCode: 401, message: 'API key required' })
  }

  // Supabase service client (server-side, uses service role key)
  const config = useRuntimeConfig()
  const supabase = createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceRoleKey as string,
  )

  // Validate API key
  const { data: sub } = await supabase
    .from('data_subscriptions')
    .select('*')
    .eq('api_key', apiKey)
    .eq('active', true)
    .single<DataSubscription>()

  if (!sub) {
    await logUsage(supabase, apiKey, query as Record<string, unknown>, Date.now() - startTime, 401)
    throw createError({ statusCode: 401, message: 'Invalid or inactive API key' })
  }

  // Check rate limit
  const today = new Date().toISOString().split('T')[0]
  const { count } = await supabase
    .from('api_usage')
    .select('*', { count: 'exact', head: true })
    .eq('api_key', apiKey)
    .gte('created_at', today + 'T00:00:00Z')

  if ((count ?? 0) >= sub.rate_limit_daily) {
    await logUsage(supabase, apiKey, query as Record<string, unknown>, Date.now() - startTime, 429)
    throw createError({ statusCode: 429, message: 'Daily rate limit exceeded' })
  }

  // Validate required params
  const brand = (query.brand as string | undefined)?.toLowerCase()
  if (!brand) {
    await logUsage(supabase, apiKey, query as Record<string, unknown>, Date.now() - startTime, 400)
    throw createError({ statusCode: 400, message: 'brand parameter is required' })
  }

  // Query market_data
  let marketQuery = supabase
    .from('market_data')
    .select('*')
    .eq('vertical', 'tracciona')
    .ilike('brand', brand)

  if (query.subcategory) {
    marketQuery = marketQuery.eq('subcategory', query.subcategory as string)
  }
  if (query.province) {
    marketQuery = marketQuery.ilike('location_province', query.province as string)
  }

  const { data: rows, error: marketError } = await marketQuery

  if (marketError) {
    await logUsage(supabase, apiKey, query as Record<string, unknown>, Date.now() - startTime, 500)
    throw createError({ statusCode: 500, message: 'Error querying market data' })
  }

  const typedRows = (rows ?? []) as MarketDataRow[]

  // Filter rows that have a valid avg_price
  const validRows = typedRows.filter(
    (r): r is MarketDataRow & { avg_price: number } => r.avg_price !== null && r.avg_price > 0,
  )

  if (validRows.length === 0) {
    await logUsage(supabase, apiKey, query as Record<string, unknown>, Date.now() - startTime, 404)
    throw createError({ statusCode: 404, message: 'Insufficient data' })
  }

  // Collect prices
  const prices = validRows.map((r) => r.avg_price)
  const sortedPrices = [...prices].sort((a, b) => a - b)

  // Compute base min/median/max
  let minPrice = Math.min(...prices) * 0.9
  let maxPrice = Math.max(...prices) * 1.1
  let medianPrice = computeMedian(sortedPrices)

  // Year depreciation: if year provided, factor = max(0.5, 1 - (currentYear - year) * 0.05)
  if (query.year) {
    const vehicleYear = Number(query.year)
    if (!Number.isNaN(vehicleYear) && vehicleYear > 0) {
      const currentYear = new Date().getFullYear()
      const factor = Math.max(0.5, 1 - (currentYear - vehicleYear) * 0.05)
      minPrice = Math.round(minPrice * factor)
      maxPrice = Math.round(maxPrice * factor)
      medianPrice = Math.round(medianPrice * factor)
    }
  } else {
    minPrice = Math.round(minPrice)
    maxPrice = Math.round(maxPrice)
    medianPrice = Math.round(medianPrice)
  }

  // Trend: compare avg of last 2 months vs previous 2 months
  const now = new Date()
  const twoMonthsAgo = new Date(now)
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
  const fourMonthsAgo = new Date(now)
  fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4)

  const recentRows = validRows.filter((r) => {
    if (!r.created_at) return false
    const d = new Date(r.created_at)
    return d >= twoMonthsAgo && d <= now
  })
  const olderRows = validRows.filter((r) => {
    if (!r.created_at) return false
    const d = new Date(r.created_at)
    return d >= fourMonthsAgo && d < twoMonthsAgo
  })

  let marketTrend: 'rising' | 'falling' | 'stable' = 'stable'
  let trendPct = 0

  if (recentRows.length > 0 && olderRows.length > 0) {
    const recentAvg = recentRows.reduce((sum, r) => sum + r.avg_price, 0) / recentRows.length
    const olderAvg = olderRows.reduce((sum, r) => sum + r.avg_price, 0) / olderRows.length

    if (olderAvg > 0) {
      trendPct = Number((((recentAvg - olderAvg) / olderAvg) * 100).toFixed(1))
      if (trendPct > 1) {
        marketTrend = 'rising'
      } else if (trendPct < -1) {
        marketTrend = 'falling'
      }
    }
  }

  // Confidence based on sample size
  const sampleSize = validRows.length
  let confidence: 'high' | 'medium' | 'low'
  if (sampleSize >= 20) {
    confidence = 'high'
  } else if (sampleSize >= 10) {
    confidence = 'medium'
  } else {
    confidence = 'low'
  }

  // Average days to sell
  const rowsWithDays = validRows.filter(
    (r): r is typeof r & { avg_days_to_sell: number } =>
      r.avg_days_to_sell !== null && r.avg_days_to_sell > 0,
  )
  const avgDaysToSell =
    rowsWithDays.length > 0
      ? Math.round(
          rowsWithDays.reduce((sum, r) => sum + r.avg_days_to_sell, 0) / rowsWithDays.length,
        )
      : null

  // Log successful usage
  await logUsage(supabase, apiKey, query as Record<string, unknown>, Date.now() - startTime, 200)

  return {
    estimated_price: { min: minPrice, median: medianPrice, max: maxPrice },
    market_trend: marketTrend,
    trend_pct: trendPct,
    avg_days_to_sell: avgDaysToSell,
    sample_size: sampleSize,
    confidence,
    data_date: now.toISOString().split('T')[0] ?? '',
  }
})
