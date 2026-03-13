/**
 * PATCH /api/social/reschedule
 *
 * Reschedules a social post (drag & drop in the editorial calendar).
 * Updates `scheduled_at` for a post in draft/pending/approved/scheduled status.
 * Cannot reschedule already-posted or failed posts.
 *
 * Body: { postId: string, scheduledAt: string | null }
 * Auth: Admin only
 */
import { defineEventHandler } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { safeError } from '../../utils/safeError'
import { validateBody } from '../../utils/validateBody'
import { logger } from '../../utils/logger'
import { z } from 'zod'

const RescheduleSchema = z.object({
  postId: z.string().uuid('postId must be a valid UUID'),
  scheduledAt: z.string().datetime({ message: 'scheduledAt must be a valid ISO datetime' }).nullable(),
})

const RESCHEDULABLE_STATUSES = ['draft', 'pending', 'approved', 'scheduled']

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw safeError(401, 'Unauthorized')

  const { postId, scheduledAt } = await validateBody(event, RescheduleSchema)
  const supabase = serverSupabaseServiceRole(event)

  // Fetch post to verify it exists and is reschedulable
  const { data: post, error: fetchErr } = await supabase
    .from('social_posts')
    .select('id, status, platform')
    .eq('id', postId)
    .single()

  if (fetchErr || !post) throw safeError(404, 'Post not found')

  const { status } = post as { status: string; platform: string }

  if (!RESCHEDULABLE_STATUSES.includes(status)) {
    throw safeError(409, `Cannot reschedule a post with status '${status}'. Only draft, pending, approved, or scheduled posts can be rescheduled.`)
  }

  // Update scheduled_at; also mark as 'scheduled' if it was draft/pending/approved and a date is set
  const newStatus = scheduledAt && status === 'draft' ? 'scheduled' : status

  const { data: updated, error: updateErr } = await supabase
    .from('social_posts')
    .update({
      scheduled_at: scheduledAt,
      status: newStatus,
    })
    .eq('id', postId)
    .select('id, platform, status, scheduled_at')
    .single()

  if (updateErr) {
    logger.error({ postId, error: updateErr }, 'Failed to reschedule post')
    throw safeError(500, 'Failed to reschedule post')
  }

  logger.info({ postId, scheduledAt, newStatus }, 'Post rescheduled')

  return {
    ok: true,
    post: updated,
  }
})
