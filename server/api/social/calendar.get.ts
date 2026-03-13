/**
 * GET /api/social/calendar
 *
 * Returns social posts in a date range for the editorial calendar.
 * Supports all statuses (draft, pending, approved, scheduled, posted, failed).
 *
 * Query params:
 *   from  — ISO date string (start of range, inclusive), defaults to start of current week
 *   to    — ISO date string (end of range, inclusive), defaults to 4 weeks from `from`
 *   platform — filter by platform (optional)
 *
 * Auth: Admin only
 */
import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { safeError } from '../../utils/safeError'
import { logger } from '../../utils/logger'

export interface CalendarPost {
  id: string
  platform: string
  status: string
  scheduled_at: string | null
  posted_at: string | null
  content: Record<string, string>
  image_url: string | null
  external_post_id: string | null
  vehicle_id: string | null
  vehicle?: {
    id: string
    brand: string
    model: string
    year: number | null
    slug: string
  } | null
  impressions: number
  clicks: number
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw safeError(401, 'Unauthorized')

  const query = getQuery(event)

  // Default range: current week → 4 weeks ahead
  const now = new Date()
  const dayOfWeek = now.getDay()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - dayOfWeek)
  startOfWeek.setHours(0, 0, 0, 0)

  const defaultFrom = startOfWeek.toISOString()
  const defaultTo = new Date(startOfWeek.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString()

  const from = (query.from as string | undefined) || defaultFrom
  const to = (query.to as string | undefined) || defaultTo
  const platform = query.platform as string | undefined

  // Validate dates
  const fromDate = new Date(from)
  const toDate = new Date(to)
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw safeError(400, 'Invalid date range: from and to must be valid ISO date strings')
  }

  if (toDate.getTime() - fromDate.getTime() > 366 * 24 * 60 * 60 * 1000) {
    throw safeError(400, 'Date range too large: maximum 366 days')
  }

  const supabase = serverSupabaseServiceRole(event)

  let queryBuilder = supabase
    .from('social_posts')
    .select(
      `id, platform, status, scheduled_at, posted_at, content, image_url,
       external_post_id, vehicle_id, impressions, clicks,
       vehicles:vehicle_id (id, brand, model, year, slug)`,
    )
    .or(`scheduled_at.gte.${from},posted_at.gte.${from}`)
    .or(`scheduled_at.lte.${to},posted_at.lte.${to}`)
    .order('scheduled_at', { ascending: true, nullsFirst: false })
    .order('posted_at', { ascending: true, nullsFirst: false })
    .limit(500)

  if (platform) {
    queryBuilder = queryBuilder.eq('platform', platform)
  }

  const { data, error } = await queryBuilder

  if (error) {
    logger.error({ error }, 'Failed to fetch calendar posts')
    throw safeError(500, 'Failed to fetch calendar data')
  }

  const posts = (data ?? []) as CalendarPost[]

  return {
    ok: true,
    from,
    to,
    posts,
    total: posts.length,
  }
})
