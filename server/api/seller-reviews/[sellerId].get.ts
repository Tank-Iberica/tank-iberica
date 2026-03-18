/**
 * GET /api/seller-reviews/:sellerId
 *
 * Returns paginated reviews for a seller.
 * Public endpoint — only returns published reviews.
 * Query params: page (default 1), limit (default 10, max 50)
 */
import { getQuery } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { safeError } from '../../utils/safeError'

export default defineEventHandler(async (event) => {
  const sellerId = getRouterParam(event, 'sellerId')
  if (!sellerId) throw safeError(400, 'Missing sellerId')

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10))
  const from = (page - 1) * limit
  const to = from + limit - 1

  const supabase = serverSupabaseServiceRole(event)

  // Fetch reviews with count
  const { data, error, count } = await supabase
    .from('seller_reviews')
    .select('id, reviewer_id, rating, title, content, dimensions, nps_score, verified_purchase, created_at', {
      count: 'exact',
    })
    .eq('seller_id', sellerId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw safeError(500, `Query failed: ${error.message}`)

  // Calculate summary stats
  const totalCount = count ?? 0
  const reviews = data ?? []

  return {
    reviews,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: to + 1 < totalCount,
    },
  }
})
