/**
 * PATCH /api/admin/seller-reviews
 *
 * Admin endpoint to moderate a review (change status).
 * Body: { reviewId, status: 'published' | 'pending' | 'rejected' }
 */
import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireRole } from '../../utils/rbac'
import { safeError } from '../../utils/safeError'
import { validateBody } from '../../utils/validateBody'

const moderateSchema = z.object({
  reviewId: z.string().uuid(),
  status: z.enum(['published', 'pending', 'rejected']),
})

export default defineEventHandler(async (event) => {
  await requireRole(event, 'admin')

  const { reviewId, status } = await validateBody(event, moderateSchema)

  const supabase = serverSupabaseServiceRole(event)

  const { data, error } = await supabase
    .from('seller_reviews')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', reviewId)
    .select('id, status')
    .single()

  if (error) throw safeError(500, `Update failed: ${error.message}`)
  if (!data) throw safeError(404, 'Review not found')

  return { updated: true, review: data }
})
