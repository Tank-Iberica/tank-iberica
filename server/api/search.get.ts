/**
 * Server-side vehicle search with full-text search + trigram fuzzy matching.
 *
 * GET /api/search?q=volvo&category_id=xxx&price_min=1000&price_max=50000
 *                 &year_min=2015&year_max=2024&province=Madrid&country=ES
 *                 &cursor=<last-id>&limit=20
 *
 * Uses Postgres pg_trgm + tsvector for accent-insensitive ranked results.
 * Cursor pagination for stable, efficient paging.
 */
import { defineEventHandler, getQuery, setResponseHeader } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import { safeError } from '../utils/safeError'

interface SearchQuery {
  q?: string
  category_id?: string
  price_min?: string
  price_max?: string
  year_min?: string
  year_max?: string
  province?: string
  country?: string
  cursor?: string
  limit?: string
}

interface SearchResult {
  id: string
  slug: string
  brand: string
  model: string
  year: number | null
  price: number | null
  location: string | null
  location_province: string | null
  location_country: string | null
  category_id: string | null
  dealer_id: string | null
  created_at: string
  rank: number
}

export default defineEventHandler(async (event) => {
  const query = getQuery<SearchQuery>(event)

  const q = (query.q ?? '').trim()
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 50)

  // Validate UUID format for category_id and cursor
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  const categoryId =
    query.category_id && uuidRegex.test(query.category_id) ? query.category_id : null

  const cursor = query.cursor && uuidRegex.test(query.cursor) ? query.cursor : null

  const priceMin = query.price_min ? Number(query.price_min) : null
  const priceMax = query.price_max ? Number(query.price_max) : null
  const yearMin = query.year_min ? Number(query.year_min) : null
  const yearMax = query.year_max ? Number(query.year_max) : null
  const province = query.province?.trim() || null
  const country = query.country?.trim() || null

  // Validate numeric ranges
  if (priceMin !== null && Number.isNaN(priceMin)) {
    throw safeError(400, 'Invalid price_min')
  }
  if (priceMax !== null && Number.isNaN(priceMax)) {
    throw safeError(400, 'Invalid price_max')
  }

  const supabase = await serverSupabaseClient(event)

  const { data, error } = await supabase.rpc('search_vehicles', {
    search_query: q,
    filter_category_id: categoryId,
    filter_price_min: priceMin,
    filter_price_max: priceMax,
    filter_year_min: yearMin,
    filter_year_max: yearMax,
    filter_province: province,
    filter_country: country,
    cursor_id: cursor,
    cursor_rank: null,
    page_limit: limit,
  })

  if (error) {
    throw safeError(500, 'Search failed')
  }

  const results = (data ?? []) as Array<SearchResult & { total_estimate: number }>
  const totalEstimate = results.length ? results[0]!.total_estimate : 0
  const nextCursor = results.length === limit ? results.at(-1)!.id : null

  setResponseHeader(
    event,
    'Cache-Control',
    'public, max-age=60, s-maxage=120, stale-while-revalidate=60',
  )

  return {
    results: results.map(({ total_estimate: _te, ...r }) => r),
    next_cursor: nextCursor,
    total_estimate: totalEstimate,
    query: q,
  }
})
