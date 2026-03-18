/**
 * Request coalescing — Thundering herd protection for cache misses.
 *
 * When multiple simultaneous requests arrive for the same key while the cache
 * is cold, only ONE actual fetch is executed. All other requests wait for
 * that single result and receive the same data.
 *
 * Pattern: singleflight / request deduplication
 *
 * Usage:
 *   const data = await coalesce('vehicles:featured', 5000, () => fetchFeaturedVehicles())
 *
 * Roadmap: N83 — Request coalescing
 */

interface InflightRequest<T> {
  promise: Promise<T>
  expiresAt: number
}

const inflight = new Map<string, InflightRequest<unknown>>()

/**
 * Execute a function with request coalescing.
 * Concurrent calls with the same key will share one execution.
 *
 * @param key    - Unique cache/request key
 * @param ttlMs  - How long to cache the result (in ms)
 * @param fn     - The actual fetch function
 */
export async function coalesce<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const existing = inflight.get(key)
  if (existing && existing.expiresAt > Date.now()) {
    return existing.promise as Promise<T>
  }

  const promise = fn().finally(() => {
    // Remove from inflight after TTL expires
    setTimeout(() => {
      const current = inflight.get(key)
      if (current && current.promise === promise) {
        inflight.delete(key)
      }
    }, ttlMs)
  })

  inflight.set(key, {
    promise,
    expiresAt: Date.now() + ttlMs,
  })

  return promise
}

/**
 * Get the number of inflight requests (for monitoring).
 */
export function getInflightCount(): number {
  return inflight.size
}

/**
 * Clear all inflight requests (for testing).
 */
export function clearInflight(): void {
  inflight.clear()
}
