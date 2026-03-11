import { defineEventHandler, getHeader, getQuery, setHeader } from 'h3'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { safeError } from '../../utils/safeError'
import { setApiVersionHeaders } from '../../utils/apiVersion'

type PriceTrend = 'rising' | 'falling' | 'stable'

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
  market_trend: PriceTrend
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

export function computeMedian(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1]! + sorted[mid]!) / 2)
  }
  return Math.round(sorted[mid]!)
}

export async function logUsage(
  supabase: SupabaseClient,
  apiKey: string | undefined,
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

interface PriceEstimate {
  min: number
  median: number
  max: number
}

export function computePriceEstimate(prices: number[], yearParam: string | undefined): PriceEstimate {
  const sortedPrices = [...prices].sort((a, b) => a - b)
  let minPrice = Math.min(...prices) * 0.9
  let maxPrice = Math.max(...prices) * 1.1
  let medianPrice = computeMedian(sortedPrices)

  if (yearParam) {
    const vehicleYear = Number(yearParam)
    if (!Number.isNaN(vehicleYear) && vehicleYear > 0) {
      const currentYear = new Date().getFullYear()
      const factor = Math.max(0.5, 1 - (currentYear - vehicleYear) * 0.05)
      minPrice = Math.round(minPrice * factor)
      maxPrice = Math.round(maxPrice * factor)
      medianPrice = Math.round(medianPrice * factor)
      return { min: minPrice, median: medianPrice, max: maxPrice }
    }
  }

  return {
    min: Math.round(minPrice),
    median: Math.round(medianPrice),
    max: Math.round(maxPrice),
  }
}

export function computeTrend(validRows: (MarketDataRow & { avg_price: number })[]): {
  marketTrend: PriceTrend
  trendPct: number
} {
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

  if (recentRows.length === 0 || olderRows.length === 0) {
    return { marketTrend: 'stable', trendPct: 0 }
  }

  const recentAvg = recentRows.reduce((sum, r) => sum + r.avg_price, 0) / recentRows.length
  const olderAvg = olderRows.reduce((sum, r) => sum + r.avg_price, 0) / olderRows.length

  if (olderAvg <= 0) return { marketTrend: 'stable', trendPct: 0 }

  const trendPct = Number((((recentAvg - olderAvg) / olderAvg) * 100).toFixed(1))
  let marketTrend: PriceTrend = 'stable'
  if (trendPct > 1) marketTrend = 'rising'
  else if (trendPct < -1) marketTrend = 'falling'
  return { marketTrend, trendPct }
}

export function computeConfidence(sampleSize: number): 'high' | 'medium' | 'low' {
  if (sampleSize >= 20) return 'high'
  if (sampleSize >= 10) return 'medium'
  return 'low'
}

export default defineEventHandler(async (event): Promise<ValuationResponse> => {
  // POSPUESTO — Activar cuando haya ≥500 transacciones históricas
  // Ver FLUJOS-OPERATIVOS §15 para criterios de activación
  const VALUATION_API_ENABLED = process.env.VALUATION_API_ENABLED === 'true'
  if (!VALUATION_API_ENABLED) {
    throw safeError(503, 'Valuation API coming soon. Insufficient market data for reliable estimates.')
  }

  const query = getQuery(event)
  const authHeader = getHeader(event, 'authorization')

  const startTime = Date.now()

  // Extract API key
  const apiKey = authHeader?.replace('Bearer ', '')
  if (!apiKey) {
    throw safeError(401, 'API key required')
  }

  // Supabase service client (server-side, uses service role key)
  const config = useRuntimeConfig()
  const supabase = createClient(process.env.SUPABASE_URL || '', config.supabaseServiceRoleKey)

  // Validate API key
  const { data: sub } = await supabase
    .from('data_subscriptions')
    .select('*')
    .eq('api_key', apiKey)
    .eq('active', true)
    .single<DataSubscription>()

  if (!sub) {
    await logUsage(supabase, apiKey, query as Record<string, unknown>, Date.now() - startTime, 401)
    throw safeError(401, 'Invalid or inactive API key')
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
    throw safeError(429, 'Daily rate limit exceeded')
  }

  // Validate required params
  const brand = (query.brand as string | undefined)?.toLowerCase()
  if (!brand) {
    await logUsage(supabase, apiKey, query as Record<string, unknown>, Date.now() - startTime, 400)
    throw safeError(400, 'brand parameter is required')
  }

  // Query market_data
  let marketQuery = supabase
    .from('market_data')
    .select('*')
    .eq('vertical', 'tracciona')
    .ilike('brand', brand)

  if (query.subcategory) {
    marketQuery = marketQuery.eq('subcategory', String(query.subcategory as string))
  }
  if (query.province) {
    marketQuery = marketQuery.ilike('location_province', String(query.province as string))
  }

  const { data: rows, error: marketError } = await marketQuery

  if (marketError) {
    await logUsage(supabase, apiKey, query as Record<string, unknown>, Date.now() - startTime, 500)
    throw safeError(500, 'Error querying market data')
  }

  const typedRows = (rows ?? []) as MarketDataRow[]

  // Filter rows that have a valid avg_price
  const validRows = typedRows.filter(
    (r): r is MarketDataRow & { avg_price: number } => r.avg_price !== null && r.avg_price > 0,
  )

  if (validRows.length === 0) {
    await logUsage(supabase, apiKey, query as Record<string, unknown>, Date.now() - startTime, 404)
    throw safeError(404, 'Insufficient data')
  }

  // Compute price estimate, trend, and confidence
  const prices = validRows.map((r) => r.avg_price)
  const estimated_price = computePriceEstimate(prices, query.year as string | undefined)
  const { marketTrend, trendPct } = computeTrend(validRows)
  const sampleSize = validRows.length
  const confidence = computeConfidence(sampleSize)
  const now = new Date()

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

  setHeader(event, 'Cache-Control', 'private, max-age=300')
  setApiVersionHeaders(event, 'v1')

  return {
    estimated_price,
    market_trend: marketTrend,
    trend_pct: trendPct,
    avg_days_to_sell: avgDaysToSell,
    sample_size: sampleSize,
    confidence,
    data_date: now.toISOString().split('T')[0]!,
  }
})
