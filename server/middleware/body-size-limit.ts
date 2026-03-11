/**
 * Request body size limit middleware.
 *
 * Rejects POST/PUT/PATCH requests that exceed the configured body size limit
 * by checking the Content-Length header before the body is read.
 *
 * Route-specific limits:
 *   - /api/images/process:      10 MB (image uploads)
 *   - /api/dealer/import-stock: 5 MB  (CSV import)
 *   - /api/stripe/webhook:      skip  (Stripe signature verification)
 *   - /api/cron/*:              skip  (internal cron jobs)
 *   - All other POST routes:    1 MB  (default)
 */
import { defineEventHandler, createError, getRequestHeader } from 'h3'

const KB = 1024
const MB = 1024 * KB

interface SizeRule {
  pattern: RegExp
  limit: number | null // null = skip check
}

const RULES: SizeRule[] = [
  { pattern: /^\/api\/images\/process/, limit: 10 * MB },
  { pattern: /^\/api\/dealer\/import-stock/, limit: 5 * MB },
  { pattern: /^\/api\/stripe\/webhook/, limit: null },
  { pattern: /^\/api\/cron\//, limit: null },
]

const DEFAULT_LIMIT = 1 * MB

export default defineEventHandler((event) => {
  const method = event.method.toUpperCase()
  if (!['POST', 'PUT', 'PATCH'].includes(method)) return

  const path = event.path || ''
  if (!path.startsWith('/api/')) return

  // Determine limit for this route
  let limit: number | null = DEFAULT_LIMIT
  for (const rule of RULES) {
    if (rule.pattern.test(path)) {
      limit = rule.limit
      break
    }
  }

  // null = skip check for this route
  if (limit === null) return

  const contentLength = getRequestHeader(event, 'content-length')
  if (!contentLength) return // No Content-Length header — let downstream handle

  const size = Number.parseInt(contentLength, 10)
  if (Number.isNaN(size)) return

  if (size > limit) {
    const limitMB = (limit / MB).toFixed(1)
    throw createError({
      statusCode: 413,
      statusMessage: 'Payload Too Large',
      data: { error: `Request body exceeds ${limitMB} MB limit` },
    })
  }
})
