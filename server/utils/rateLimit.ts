import type { H3Event } from 'h3'
import { getRequestIP, getHeader } from 'h3'

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

// --- Auto-ban: block IPs generating excessive 4xx errors ---
interface BanEntry {
  /** When the ban expires (epoch ms) */
  expiresAt: number
}
interface ErrorCountEntry {
  timestamps: number[]
}
const banStore = new Map<string, BanEntry>()
const errorCountStore = new Map<string, ErrorCountEntry>()

const AUTO_BAN_WINDOW_MS = 5 * 60 * 1000 // 5 minutes
const AUTO_BAN_THRESHOLD = 100 // >100 4xx responses in window
const AUTO_BAN_DURATION_MS = 30 * 60 * 1000 // 30 minute ban

/**
 * Check if an IP is currently banned.
 * Returns the ban expiry timestamp if banned, or 0 if not banned.
 */
export function isIpBanned(ip: string): number {
  const ban = banStore.get(ip)
  if (!ban) return 0
  if (Date.now() >= ban.expiresAt) {
    banStore.delete(ip)
    return 0
  }
  return ban.expiresAt
}

/**
 * Record a 4xx error for an IP. If threshold is exceeded, auto-ban.
 * Returns true if the IP was just banned.
 */
export function record4xxError(ip: string): boolean {
  if (!ip || ip === 'unknown') return false

  const now = Date.now()
  let entry = errorCountStore.get(ip)
  if (!entry) {
    entry = { timestamps: [] }
    errorCountStore.set(ip, entry)
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((ts) => now - ts < AUTO_BAN_WINDOW_MS)
  entry.timestamps.push(now)

  if (entry.timestamps.length > AUTO_BAN_THRESHOLD) {
    banStore.set(ip, { expiresAt: now + AUTO_BAN_DURATION_MS })
    errorCountStore.delete(ip)
    return true
  }
  return false
}

/** Get the current ban store size (for monitoring/testing). */
export function getBanStoreSize(): number {
  return banStore.size
}

/** Clear all ban and error count entries (for testing). */
export function clearBanStore(): void {
  banStore.clear()
  errorCountStore.clear()
}

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

    // Clean expired bans
    for (const [ip, ban] of banStore.entries()) {
      if (now >= ban.expiresAt) banStore.delete(ip)
    }
    // Clean stale error count entries
    for (const [ip, entry] of errorCountStore.entries()) {
      entry.timestamps = entry.timestamps.filter((ts) => now - ts < AUTO_BAN_WINDOW_MS)
      if (entry.timestamps.length === 0) errorCountStore.delete(ip)
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
  const expiresAt = oldestInWindow! + config.windowMs
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

/**
 * Extract the authenticated user ID from the Supabase JWT in the Authorization header.
 * Decodes the JWT payload without verification (already validated by Supabase middleware).
 * Returns null if no valid Bearer token is present.
 */
export function getUserIdFromJwt(event: H3Event): string | null {
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice(7)
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    // Base64url decode the payload (second segment)
    const payload = JSON.parse(Buffer.from(parts[1]!, 'base64url').toString('utf-8'))
    return typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}

/**
 * Build a composite rate limit key using authenticated user ID when available,
 * falling back to IP. Prevents shared-NAT bypass: one user can't exhaust quota
 * for others on the same IP.
 */
export function getUserOrIpRateLimitKey(event: H3Event): string {
  const userId = getUserIdFromJwt(event)
  if (userId) return `user:${userId}`
  const ip = getRequestIP(event, { xForwardedFor: true })
  return `ip:${ip || 'unknown'}`
}

/**
 * Build a fingerprint-based rate limit key from the client's User-Agent and
 * Accept-Language headers. Provides a secondary rate limit dimension that
 * catches bots rotating IPs while keeping the same browser fingerprint.
 *
 * Uses DJB2 hash (non-cryptographic) — sufficient for rate limiting purposes.
 */
export function getFingerprintKey(event: H3Event): string {
  const ua = getHeader(event, 'user-agent') || ''
  const lang = getHeader(event, 'accept-language') || ''
  const raw = `${ua}|${lang}`
  let hash = 5381
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash) ^ raw.codePointAt(i)!
    hash = hash >>> 0 // keep as unsigned 32-bit
  }
  return `fp:${hash.toString(16)}`
}
