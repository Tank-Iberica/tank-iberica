/**
 * GET /api/infra/error-rate
 *
 * Calculates error rate for the last N hours from Sentry
 * Returns: { errorRate: number, totalEvents: number, errorCount: number, period: string }
 *
 * Requires: CRON_SECRET for auth (or Sentry token in env)
 *
 * P1 § Error Rate Monitoring
 */

import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Auth: Check CRON_SECRET
  const cronSecret = useRuntimeConfig().cronSecret
  const authHeader = getHeader(event, 'authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // For now: read from Sentry JS client error events (via Supabase)
  // In production: integrate with Sentry API or custom error logging

  const db = serverSupabaseServiceRole(event)
  const hoursBack = 24

  // Calculate time window
  const now = new Date()
  const startTime = new Date(now.getTime() - hoursBack * 60 * 60 * 1000)

  // Query error_events table (schema: id, user_id, endpoint, status_code, error_message, stack_trace, created_at, vertical)
  // If table doesn't exist, create a simplified count from API logs
  const { data: errorEvents = [], error: queryError } = await db
    .from('error_events')
    .select('id, status_code', { count: 'exact' })
    .gte('created_at', startTime.toISOString())
    .order('created_at', { ascending: false })

  if (queryError && queryError.code !== 'PGRST116') {
    // PGRST116 = table doesn't exist
    logger.error('Error querying error_events:', queryError as unknown as Record<string, unknown>)
  }

  // Count errors from error_events table
  const errorCount = errorEvents?.length ?? 0

  // Get total request count from analytics_events in the same window
  const { count: analyticsCount } = await db
    .from('analytics_events')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startTime.toISOString())

  const totalCount = Math.max(analyticsCount ?? 0, errorCount)

  // Calculate error rate
  const errorRate = totalCount > 0 ? (errorCount / totalCount) * 100 : 0

  // Return result
  const result = {
    errorRate: Number.parseFloat(errorRate.toFixed(2)),
    errorCount,
    totalEvents: totalCount,
    period: `${hoursBack}h`,
    threshold: 0.5, // 0.5% is threshold
    isAlertworthy: errorRate > 0.5,
    timestamp: new Date().toISOString(),
  }

  // If alertworthy, log it
  if (result.isAlertworthy) {
    logger.warn(`⚠️ Error rate ALERT: ${errorRate.toFixed(2)}% (threshold: 0.5%)`, {
      errorCount,
      totalEvents: totalCount,
      period: `${hoursBack}h`,
    })
  }

  return result
})
