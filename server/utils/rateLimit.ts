import type { H3Event } from 'h3'
import { getRequestIP } from 'h3'

export interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number
  /** Maximum number of requests allowed within the window */
  max: number
}

interface RateLimitEntry {
  timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()

// Cleanup interval: every 5 minutes, remove entries with no recent activity
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
let cleanupTimer: ReturnType<typeof setInterval> | null = null

function startCleanup() {
  if (cleanupTimer) return

  cleanupTimer = setInterval(() => {
    const now = Date.now()
    const maxWindow = 10 * 60 * 1000 // 10 minutes: remove anything older than this

    for (const [key, entry] of store.entries()) {
      // Remove timestamps older than maxWindow
      entry.timestamps = entry.timestamps.filter((ts) => now - ts < maxWindow)

      // Remove empty entries
      if (entry.timestamps.length === 0) {
        store.delete(key)
      }
    }
  }, CLEANUP_INTERVAL_MS)

  // Allow Node.js to exit without waiting for this timer
  if (cleanupTimer && typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref()
  }
}

/**
 * Check if a request should be allowed based on rate limiting.
 * Returns `true` if the request is allowed, `false` if rate limited.
 */
export function checkRateLimit(key: string, config: RateLimitConfig): boolean {
  startCleanup()

  const now = Date.now()
  let entry = store.get(key)

  if (!entry) {
    entry = { timestamps: [] }
    store.set(key, entry)
  }

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((ts) => now - ts < config.windowMs)

  if (entry.timestamps.length >= config.max) {
    return false
  }

  entry.timestamps.push(now)
  return true
}

/**
 * Get the number of seconds until the oldest request in the window expires.
 * Useful for setting the Retry-After header.
 */
export function getRetryAfterSeconds(key: string, config: RateLimitConfig): number {
  const entry = store.get(key)
  if (!entry || entry.timestamps.length === 0) return 0

  const now = Date.now()
  const oldestInWindow = entry.timestamps[0]
  const expiresAt = oldestInWindow + config.windowMs
  const secondsRemaining = Math.ceil((expiresAt - now) / 1000)

  return Math.max(1, secondsRemaining)
}

/**
 * Extract a rate limit key from an H3 event based on the client's IP address.
 */
export function getRateLimitKey(event: H3Event): string {
  const ip = getRequestIP(event, { xForwardedFor: true })
  return ip || 'unknown'
}
