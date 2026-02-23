/**
 * IMPORTANT: This in-memory rate limiter does NOT work in serverless/Workers environments
 * (Cloudflare Pages, Vercel, etc.) where each request may run in a different isolate.
 * For production, configure rate limiting rules in Cloudflare WAF Dashboard:
 *   Security → WAF → Rate limiting rules
 * Once WAF is configured, this middleware can be removed.
 */
import { defineEventHandler, getMethod, createError } from 'h3'
import { checkRateLimit, getRateLimitKey, getRetryAfterSeconds } from '../utils/rateLimit'
import type { RateLimitConfig } from '../utils/rateLimit'

interface RouteRateLimitRule {
  pattern: RegExp
  config: RateLimitConfig
  methods?: string[]
}

const RULES: RouteRateLimitRule[] = [
  // /api/email/send — max 10 requests per minute
  {
    pattern: /^\/api\/email\/send/,
    config: { windowMs: 60_000, max: 10 },
  },
  // /api/lead or any POST to lead-related routes — max 5 per minute
  {
    pattern: /^\/api\/lead/,
    config: { windowMs: 60_000, max: 5 },
    methods: ['POST', 'PUT', 'PATCH'],
  },
  // /api/stripe/* — max 20 per minute
  {
    pattern: /^\/api\/stripe/,
    config: { windowMs: 60_000, max: 20 },
  },
  // /api/account/delete — max 2 per minute
  {
    pattern: /^\/api\/account\/delete/,
    config: { windowMs: 60_000, max: 2 },
  },
]

// Default rate limit for all other POST/PUT/PATCH/DELETE on /api/*
const DEFAULT_POST_CONFIG: RateLimitConfig = { windowMs: 60_000, max: 30 }
// GET routes: very generous limit
const DEFAULT_GET_CONFIG: RateLimitConfig = { windowMs: 60_000, max: 200 }

export default defineEventHandler((event) => {
  const path = event.path || ''
  const method = getMethod(event).toUpperCase()

  // Only apply rate limiting to /api/* routes
  if (!path.startsWith('/api/')) return

  const ip = getRateLimitKey(event)

  // Check specific rules first
  for (const rule of RULES) {
    if (!rule.pattern.test(path)) continue

    // If rule has method restrictions, check them
    if (rule.methods && !rule.methods.includes(method)) continue

    const key = `${ip}:${rule.pattern.source}`
    const allowed = checkRateLimit(key, rule.config)

    if (!allowed) {
      const retryAfter = getRetryAfterSeconds(key, rule.config)
      throw createError({
        statusCode: 429,
        statusMessage: 'Too Many Requests',
        data: {
          error: 'Too many requests',
          retryAfter,
        },
      })
    }

    // Rule matched and request is allowed
    return
  }

  // Apply default limits for /api/* routes
  const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
  const config = isWrite ? DEFAULT_POST_CONFIG : DEFAULT_GET_CONFIG
  const key = `${ip}:api:${isWrite ? 'write' : 'read'}`
  const allowed = checkRateLimit(key, config)

  if (!allowed) {
    const retryAfter = getRetryAfterSeconds(key, config)
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      data: {
        error: 'Too many requests',
        retryAfter,
      },
    })
  }
})
