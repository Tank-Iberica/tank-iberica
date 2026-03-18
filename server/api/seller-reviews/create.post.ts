/**
 * POST /api/seller-reviews/create
 *
 * Creates a new seller review with server-side validation.
 * Requires authentication. One review per seller per user.
 * Updates dealer aggregate stats (total_reviews, rating).
 */
import { z } from 'zod'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { verifyCsrf } from '../../utils/verifyCsrf'
import { safeError } from '../../utils/safeError'
import { validateBody } from '../../utils/validateBody'

const dimensionsSchema = z.object({
  communication: z.number().int().min(1).max(5),
  accuracy: z.number().int().min(1).max(5),
  condition: z.number().int().min(1).max(5),
  logistics: z.number().int().min(1).max(5),
})

const reviewSchema = z.object({
  sellerId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  content: z.string().max(2000).optional(),
  vehicleId: z.string().uuid().optional(),
  dimensions: dimensionsSchema.optional(),
  npsScore: z.number().int().min(0).max(10).optional(),
})

export default defineEventHandler(async (event) => {
  verifyCsrf(event)
  const user = await serverSupabaseUser(event)
  if (!user) throw safeError(401, 'Authentication required')

  const { sellerId, rating, title, content, vehicleId, dimensions, npsScore } = await validateBody(event, reviewSchema)

  // Cannot review yourself
  if (user.id === sellerId) {
    throw safeError(400, 'Cannot review yourself')
  }

  const supabase = serverSupabaseServiceRole(event)

  // Check seller exists
  const { data: seller } = await supabase
    .from('dealers')
    .select('user_id, total_reviews, rating')
    .eq('user_id', sellerId)
    .single()

  if (!seller) throw safeError(404, 'Seller not found')

  // Check for existing review (unique constraint)
  const { data: existing } = await supabase
    .from('seller_reviews')
    .select('id')
    .eq('reviewer_id', user.id)
    .eq('seller_id', sellerId)
    .maybeSingle()

  if (existing) throw safeError(409, 'You have already reviewed this seller')

  // Optionally verify vehicle belongs to seller
  if (vehicleId) {
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', vehicleId)
      .eq('dealer_id', sellerId)
      .maybeSingle()

    if (!vehicle) throw safeError(400, 'Vehicle does not belong to this seller')
  }

  // Insert review
  const { data: review, error: insertError } = await supabase
    .from('seller_reviews')
    .insert({
      reviewer_id: user.id,
      seller_id: sellerId,
      rating,
      title: title || null,
      content: content || null,
      vehicle_id: vehicleId ?? null,
      dimensions: dimensions ?? null,
      nps_score: npsScore ?? null,
      verified_purchase: false,
      status: 'published',
    } as never)
    .select('id, created_at')
    .single()

  if (insertError) throw safeError(500, `Insert failed: ${insertError.message}`)

  // Update dealer aggregates
  const prevTotal = seller.total_reviews ?? 0
  const prevRating = seller.rating ?? 0
  const newTotal = prevTotal + 1
  const newAvg = Math.round(((prevRating * prevTotal + rating) / newTotal) * 10) / 10

  await supabase
    .from('dealers')
    .update({ total_reviews: newTotal, rating: newAvg })
    .eq('user_id', sellerId)

  return {
    id: review.id,
    createdAt: review.created_at,
    newDealerRating: newAvg,
    newTotalReviews: newTotal,
  }
})
