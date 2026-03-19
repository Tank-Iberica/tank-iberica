/**
 * Per-user per-action rate limiting.
 *
 * Composite key: `user_id + action` with action-specific limits.
 * Prevents authenticated users from abusing specific actions.
 *
 * #259 — Rate limiting por usuario autenticado
 */
import type { H3Event } from 'h3'
import { createError } from 'h3'
import { checkRateLimit, getRetryAfterSeconds, getUserIdFromJwt } from './rateLimit'
import type { RateLimitConfig } from './rateLimit'

// ── Action-specific rate limits ──────────────────────────────────────────────

export const ACTION_LIMITS: Record<string, RateLimitConfig> = {
  publish: { windowMs: 60 * 60 * 1000, max: 10 }, // 10/hour
  message: { windowMs: 60 * 60 * 1000, max: 30 }, // 30/hour
  unlock: { windowMs: 60 * 60 * 1000, max: 5 }, // 5/hour
  lead: { windowMs: 60 * 60 * 1000, max: 20 }, // 20/hour
  export: { windowMs: 60 * 60 * 1000, max: 3 }, // 3/hour
  reserve: { windowMs: 60 * 60 * 1000, max: 10 }, // 10/hour
  bid: { windowMs: 60 * 60 * 1000, max: 20 }, // 20/hour
  report: { windowMs: 60 * 60 * 1000, max: 5 }, // 5/hour
  delete: { windowMs: 60 * 60 * 1000, max: 3 }, // 3/hour
}

// Anonymous users get stricter limits (50% of authenticated)
const ANON_MULTIPLIER = 0.5

/**
 * Check per-user per-action rate limit.
 *
 * @param event - H3 event
 * @param action - Action name (must be a key of ACTION_LIMITS)
 * @throws 429 if rate limit exceeded
 * @returns The user ID if authenticated, null if anonymous
 */
export function checkActionRateLimit(event: H3Event, action: string): string | null {
  const config = ACTION_LIMITS[action]
  if (!config) {
    // Unknown action — use a conservative default
    return getUserIdFromJwt(event)
  }

  const userId = getUserIdFromJwt(event)
  const keyPrefix = userId ? `user:${userId}` : `anon:${event.context?.clientAddress || 'unknown'}`
  const key = `action:${keyPrefix}:${action}`

  // Anonymous users get stricter limits
  const effectiveConfig: RateLimitConfig = userId
    ? config
    : { windowMs: config.windowMs, max: Math.max(1, Math.floor(config.max * ANON_MULTIPLIER)) }

  const allowed = checkRateLimit(key, effectiveConfig)

  if (!allowed) {
    const retryAfter = getRetryAfterSeconds(key, effectiveConfig)
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      data: {
        error: `Rate limit exceeded for action: ${action}`,
        action,
        retryAfter,
        limit: effectiveConfig.max,
        window: `${effectiveConfig.windowMs / 1000}s`,
      },
    })
  }

  return userId
}

/**
 * Get all configured action limits (for admin/debugging).
 */
export function getActionLimits(): Record<string, { max: number; windowMs: number }> {
  return { ...ACTION_LIMITS }
}
