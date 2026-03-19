/**
 * Database-backed rate limiting fallback.
 *
 * Uses Supabase `rate_limit_entries` table + `check_rate_limit()` RPC
 * for sliding window rate limiting that works across serverless instances.
 *
 * Use when in-memory rate limiting is insufficient (Cloudflare Workers,
 * multi-instance deployments, or when WAF is not available).
 *
 * N29 — Rate limiting fallback serverless (sliding window en Supabase)
 */
import type { H3Event } from 'h3'
import { createError } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { getUserIdFromJwt, getRateLimitKey } from './rateLimit'

export interface DbRateLimitConfig {
  /** Window size in seconds (default 3600 = 1 hour) */
  windowSeconds: number
  /** Max requests per window */
  maxRequests: number
}

/**
 * Check rate limit against the database.
 *
 * @returns true if allowed, throws 429 if rate limited
 */
export async function checkDbRateLimit(
  event: H3Event,
  action: string,
  config: DbRateLimitConfig = { windowSeconds: 3600, maxRequests: 10 },
): Promise<boolean> {
  const userId = getUserIdFromJwt(event)
  const ip = getRateLimitKey(event)
  const keyPrefix = userId ? `user:${userId}` : `ip:${ip}`
  const key = `db:${keyPrefix}:${action}`

  const supabase = serverSupabaseServiceRole(event)

  const { data, error } = await supabase.rpc('check_rate_limit' as never, {
    p_key: key,
    p_window_seconds: config.windowSeconds,
    p_max_requests: config.maxRequests,
  })

  if (error) {
    // If DB rate limiting fails, allow the request (fail-open)
    // The in-memory rate limiter should still catch abuse
    return true
  }

  if (data === false) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      data: {
        error: `Rate limit exceeded for action: ${action}`,
        action,
        retryAfter: config.windowSeconds,
        limit: config.maxRequests,
        window: `${config.windowSeconds}s`,
      },
    })
  }

  return true
}

/**
 * Cleanup old rate limit entries. Called by cron job.
 *
 * @returns Number of entries deleted
 */
export async function cleanupRateLimitEntries(
  event: H3Event,
  maxAgeSeconds = 7200,
): Promise<number> {
  const supabase = serverSupabaseServiceRole(event)

  const { data, error } = await supabase.rpc('cleanup_rate_limit_entries' as never, {
    p_max_age_seconds: maxAgeSeconds,
  })

  if (error) return 0
  return typeof data === 'number' ? data : 0
}
