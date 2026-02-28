/**
 * Public vehicle price valuation endpoint.
 *
 * Returns aggregated price statistics for vehicles matching the given criteria.
 * No authentication required — this is a public lead generation tool.
 *
 * GET /api/market/valuation?brand=Scania&model=R450&year=2018&category=camiones
 */
import { defineEventHandler, getQuery } from 'h3'
import { createClient } from '@supabase/supabase-js'

interface ValuationResult {
  brand: string
  model: string | null
  category: string | null
  year: number | null
  sampleSize: number
  priceStats: {
    avg: number
    min: number
    max: number
    p25: number
    p75: number
    median: number
  } | null
  confidence: 'high' | 'medium' | 'low'
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const brand = (query.brand as string)?.trim()
  const model = (query.model as string)?.trim() || null
  const year = query.year ? Number(query.year) : null
  const category = (query.category as string)?.trim() || null

  if (!brand) {
    return { error: 'brand is required' }
  }

  const config = useRuntimeConfig()
  const supabaseUrl = config.public?.supabaseUrl || process.env.SUPABASE_URL
  const supabaseKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return { error: 'Service unavailable' }
  }

  const supabase = createClient(supabaseUrl as string, supabaseKey as string)

  // Build query for similar vehicles
  let queryBuilder = supabase
    .from('vehicles')
    .select('price')
    .ilike('brand', brand)
    .not('price', 'is', null)
    .gt('price', 0)
    .in('status', ['published', 'sold'])

  if (model) {
    queryBuilder = queryBuilder.ilike('model', `%${model}%`)
  }

  if (year) {
    // Look within +/- 3 years
    queryBuilder = queryBuilder.gte('year', year - 3).lte('year', year + 3)
  }

  const { data, error: dbError } = await queryBuilder.limit(500)

  if (dbError) {
    return { error: 'Database error' }
  }

  const prices = ((data || []) as Array<{ price: number }>)
    .map((v) => v.price)
    .filter((p) => p > 0)
    .sort((a, b) => a - b)

  if (prices.length < 3) {
    const result: ValuationResult = {
      brand,
      model,
      category,
      year,
      sampleSize: prices.length,
      priceStats: null,
      confidence: 'low',
    }
    return result
  }

  // Calculate percentiles
  const percentile = (arr: number[], p: number): number => {
    const idx = (p / 100) * (arr.length - 1)
    const lower = Math.floor(idx)
    const upper = Math.ceil(idx)
    if (lower === upper) return arr[lower]!
    const weight = idx - lower
    return arr[lower]! * (1 - weight) + arr[upper]! * weight
  }

  const avg = Math.round(prices.reduce((s, v) => s + v, 0) / prices.length)
  const min = prices[0]!
  const max = prices[prices.length - 1]!
  const p25 = Math.round(percentile(prices, 25))
  const p75 = Math.round(percentile(prices, 75))
  const median = Math.round(percentile(prices, 50))

  let confidence: 'high' | 'medium' | 'low' = 'low'
  if (prices.length >= 20) confidence = 'high'
  else if (prices.length >= 8) confidence = 'medium'

  // Set SWR cache headers — data changes slowly
  event.node.res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200')

  const result: ValuationResult = {
    brand,
    model,
    category,
    year,
    sampleSize: prices.length,
    priceStats: { avg, min, max, p25, p75, median },
    confidence,
  }

  return result
})
