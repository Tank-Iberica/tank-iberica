/**
 * Client error ingestion endpoint.
 * Accepts error reports from the frontend error-handler plugin.
 * Rate-limited to 10 reports per IP per minute (in-memory).
 * Always returns 200 to avoid leaking information.
 */

interface ErrorReport {
  message: string
  stack: string
  url: string
  userAgent: string
  timestamp: string
  source?: string
  component?: string
  info?: string
}

// In-memory rate limiting store
// Maps IP -> array of timestamps (ms)
const rateLimitStore = new Map<string, number[]>()

const MAX_REPORTS_PER_MINUTE = 10
const WINDOW_MS = 60_000
const MAX_FIELD_LENGTH = 5000

// Clean up stale entries every 5 minutes to prevent memory leak
const CLEANUP_INTERVAL_MS = 300_000
let lastCleanup = Date.now()

function cleanupStaleEntries(): void {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now

  const cutoff = now - WINDOW_MS
  for (const [ip, timestamps] of rateLimitStore.entries()) {
    const valid = timestamps.filter((t) => t > cutoff)
    if (valid.length === 0) {
      rateLimitStore.delete(ip)
    } else {
      rateLimitStore.set(ip, valid)
    }
  }
}

function isRateLimited(ip: string): boolean {
  cleanupStaleEntries()

  const now = Date.now()
  const cutoff = now - WINDOW_MS
  const timestamps = rateLimitStore.get(ip) || []

  // Remove expired entries for this IP
  const valid = timestamps.filter((t) => t > cutoff)

  if (valid.length >= MAX_REPORTS_PER_MINUTE) {
    return true
  }

  valid.push(now)
  rateLimitStore.set(ip, valid)
  return false
}

function truncate(value: unknown, maxLength: number = MAX_FIELD_LENGTH): string {
  if (typeof value !== 'string') return ''
  return value.slice(0, maxLength)
}

export default defineEventHandler(async (event) => {
  // Always return 200 — don't leak information about rate limiting or errors
  try {
    // Get client IP from Cloudflare header or fallback
    const ip =
      getRequestHeader(event, 'cf-connecting-ip') ||
      getRequestHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown'

    if (isRateLimited(ip)) {
      // Silently drop rate-limited reports
      return { ok: true }
    }

    const body = await readBody<ErrorReport>(event)

    if (!body || typeof body !== 'object') {
      return { ok: true }
    }

    // Sanitize and truncate fields before logging
    const report = {
      message: truncate(body.message),
      stack: truncate(body.stack),
      url: truncate(body.url, 2000),
      userAgent: truncate(body.userAgent, 500),
      timestamp: truncate(body.timestamp, 50),
      source: truncate(body.source, 100),
      component: truncate(body.component, 200),
      info: truncate(body.info, 500),
      ip,
    }

    // In production, this goes to Cloudflare Pages logs (console.error)
    // In dev, it also helps with debugging
    console.error('[error-report]', JSON.stringify(report))
  } catch {
    // Swallow all errors — this endpoint must never fail visibly
  }

  return { ok: true }
})
