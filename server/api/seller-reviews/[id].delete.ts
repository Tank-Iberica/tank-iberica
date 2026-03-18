/**
 * DELETE /api/seller-reviews/:id
 *
 * Deletes a review. Only the reviewer or an admin can delete.
 * Updates dealer aggregate stats after deletion.
 */
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { verifyCsrf } from '../../utils/verifyCsrf'
import { safeError } from '../../utils/safeError'
import { getUserWithRoles } from '../../utils/rbac'

export default defineEventHandler(async (event) => {
  verifyCsrf(event)
  const user = await serverSupabaseUser(event)
  if (!user) throw safeError(401, 'Authentication required')

  const reviewId = getRouterParam(event, 'id')
  if (!reviewId) throw safeError(400, 'Missing review id')

  const supabase = serverSupabaseServiceRole(event)

  // Fetch review
  const { data: review, error: fetchError } = await supabase
    .from('seller_reviews')
    .select('id, reviewer_id, seller_id, rating')
    .eq('id', reviewId)
    .single()

  if (fetchError || !review) throw safeError(404, 'Review not found')

  // Only reviewer or admin can delete
  const isOwner = review.reviewer_id === user.id
  if (!isOwner) {
    const userRoles = await getUserWithRoles(event)
    const isAdmin = userRoles.roles.includes('admin') || userRoles.roles.includes('super_admin')
    if (!isAdmin) throw safeError(403, 'Not authorized to delete this review')
  }

  // Delete review
  const { error: deleteError } = await supabase
    .from('seller_reviews')
    .delete()
    .eq('id', reviewId)

  if (deleteError) throw safeError(500, `Delete failed: ${deleteError.message}`)

  // Update dealer aggregates
  const { data: dealer } = await supabase
    .from('dealers')
    .select('total_reviews, rating')
    .eq('user_id', review.seller_id)
    .single()

  if (dealer) {
    const prevTotal = dealer.total_reviews ?? 0
    const prevRating = dealer.rating ?? 0
    const newTotal = Math.max(0, prevTotal - 1)

    let newAvg = 0
    if (newTotal > 0 && prevTotal > 0) {
      newAvg = Math.round(((prevRating * prevTotal - review.rating) / newTotal) * 10) / 10
      newAvg = Math.max(0, Math.min(5, newAvg))
    }

    await supabase
      .from('dealers')
      .update({ total_reviews: newTotal, rating: newAvg })
      .eq('user_id', review.seller_id)
  }

  return { deleted: true }
})
