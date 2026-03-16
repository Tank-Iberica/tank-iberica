/**
 * Client-side query deduplication.
 *
 * Prevents duplicate in-flight requests for the same key.
 * If a fetch is already in progress for a key, subsequent calls wait for the same promise.
 * Results are cached for a configurable TTL.
 *
 * Usage:
 *   const { dedupedFetch } = useQueryDedup()
 *
 *   // Multiple components calling this simultaneously → only 1 network request
 *   const data = await dedupedFetch('categories', async () => {
 *     const { data } = await supabase.from('categories').select('id, name')
 *     return data ?? []
 *   })
 */

interface CacheEntry<T> {
  data: T
  fetchedAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()
const inflight = new Map<string, Promise<unknown>>()

const DEFAULT_TTL = 60_000 // 1 minute

/**
 * Fetch data with deduplication.
 * If a request for the same key is already in-flight, returns the same promise.
 * If cached data exists and is within TTL, returns cached.
 */
async function dedupedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL,
): Promise<T> {
  // Check cache
  const cached = cache.get(key) as CacheEntry<T> | undefined
  if (cached && Date.now() - cached.fetchedAt < ttl) {
    return cached.data
  }

  // Check in-flight
  const existing = inflight.get(key) as Promise<T> | undefined
  if (existing) {
    return existing
  }

  // Start new fetch
  const promise = fetcher()
    .then((data) => {
      cache.set(key, { data, fetchedAt: Date.now() })
      inflight.delete(key)
      return data
    })
    .catch((err) => {
      inflight.delete(key)
      throw err
    })

  inflight.set(key, promise)
  return promise
}

/** Invalidate a specific cache key */
function invalidate(key: string): void {
  cache.delete(key)
}

/** Invalidate all cache entries matching a prefix */
function invalidatePrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key)
    }
  }
}

/** Clear all cached data */
function clearAll(): void {
  cache.clear()
}

export function useQueryDedup() {
  return {
    dedupedFetch,
    invalidate,
    invalidatePrefix,
    clearAll,
  }
}
