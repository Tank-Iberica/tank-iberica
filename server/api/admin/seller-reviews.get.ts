/**
 * GET /api/admin/seller-reviews
 *
 * Admin endpoint to list/moderate seller reviews.
 * Query params: status (all|published|pending|rejected), page, limit, sellerId
 */
import { getQuery } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireRole } from '../../utils/rbac'
import { safeError } from '../../utils/safeError'

export default defineEventHandler(async (event) => {
  await requireRole(event, 'admin')

  const query = getQuery(event)
  const status = (query.status as string) || 'all'
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const sellerId = query.sellerId as string | undefined
  const from = (page - 1) * limit
  const to = from + limit - 1

  const supabase = serverSupabaseServiceRole(event)

  let builder = supabase
    .from('seller_reviews')
    .select('id, reviewer_id, seller_id, vehicle_id, rating, title, content, status, verified_purchase, created_at, updated_at', {
      count: 'exact',
    })

  if (status !== 'all') {
    builder = builder.eq('status', status)
  }
  if (sellerId) {
    builder = builder.eq('seller_id', sellerId)
  }

  const { data, error, count } = await builder
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw safeError(500, `Query failed: ${error.message}`)

  return {
    reviews: data ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  }
})
