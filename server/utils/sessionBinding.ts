/**
 * Session binding: detect drastic fingerprint changes that may indicate session hijacking.
 *
 * Tracks the IP + User-Agent hash for each authenticated session.
 * If both IP AND UA change simultaneously (not just one), the session is flagged as suspicious.
 *
 * Note: IP-only changes are allowed (mobile networks, VPNs).
 * UA-only changes are allowed (browser updates).
 * Both changing at once is suspicious.
 */

interface SessionFingerprint {
  ip: string
  uaHash: number
  firstSeen: number
}

const sessionStore = new Map<string, SessionFingerprint>()

// DJB2 hash for User-Agent
function hashUA(ua: string): number {
  let hash = 5381
  for (let i = 0; i < ua.length; i++) {
    hash = ((hash << 5) + hash) ^ ua.charCodeAt(i)
    hash = hash >>> 0
  }
  return hash
}

/**
 * Check if a session fingerprint has changed suspiciously.
 * Returns 'ok' | 'suspicious' (both IP and UA changed).
 *
 * Side effect: stores/updates the fingerprint for the session.
 */
export function checkSessionBinding(
  sessionId: string,
  ip: string,
  userAgent: string,
): 'ok' | 'suspicious' {
  const uaHash = hashUA(userAgent)
  const existing = sessionStore.get(sessionId)

  if (!existing) {
    // First request for this session — store fingerprint
    sessionStore.set(sessionId, { ip, uaHash, firstSeen: Date.now() })
    return 'ok'
  }

  const ipChanged = existing.ip !== ip
  const uaChanged = existing.uaHash !== uaHash

  if (ipChanged && uaChanged) {
    // Both changed — suspicious
    return 'suspicious'
  }

  // Update stored fingerprint to latest (allows gradual changes)
  if (ipChanged) existing.ip = ip
  if (uaChanged) existing.uaHash = uaHash

  return 'ok'
}

/**
 * Remove a session from the binding store (on logout).
 */
export function removeSessionBinding(sessionId: string): void {
  sessionStore.delete(sessionId)
}

/**
 * Get the current binding store size (for monitoring/testing).
 */
export function getSessionBindingStoreSize(): number {
  return sessionStore.size
}

/**
 * Clear all session bindings (for testing).
 */
export function clearSessionBindingStore(): void {
  sessionStore.clear()
}

// Cleanup old entries every 10 minutes
const CLEANUP_INTERVAL = 10 * 60 * 1000
const MAX_AGE = 24 * 60 * 60 * 1000 // 24 hours

const cleanupTimer = setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of sessionStore.entries()) {
    if (now - entry.firstSeen > MAX_AGE) {
      sessionStore.delete(key)
    }
  }
}, CLEANUP_INTERVAL)

if (cleanupTimer && typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
  cleanupTimer.unref()
}
