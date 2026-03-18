/**
 * localStorage cache wrapper with TTL for data that changes infrequently.
 *
 * Suitable for: categories, subcategorias, vertical config, attribute lists.
 * NOT suitable for: user-specific data, frequently changing data.
 *
 * Usage:
 *   const { get, set, invalidate } = useLocalStorageCache<Category[]>('categories', 300)
 *   const cached = get()  // null if expired or missing
 *   set(data)             // stores with current timestamp
 *   invalidate()          // clears the cache key
 */

export interface CacheEntry<T> {
  data: T
  timestamp: number
}

/** Caches data in localStorage with TTL expiration. */
export function useLocalStorageCache<T>(key: string, ttlSeconds = 300) {
  const storageKey = `tracciona_cache_${key}`

  function get(): T | null {
    if (!import.meta.client) return null
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return null
      const entry: CacheEntry<T> = JSON.parse(raw)
      const ageSeconds = (Date.now() - entry.timestamp) / 1000
      if (ageSeconds > ttlSeconds) {
        localStorage.removeItem(storageKey)
        return null
      }
      return entry.data
    } catch {
      return null
    }
  }

  function set(data: T): void {
    if (!import.meta.client) return
    try {
      const entry: CacheEntry<T> = { data, timestamp: Date.now() }
      localStorage.setItem(storageKey, JSON.stringify(entry))
    } catch {
      // Quota exceeded — fail silently, cache miss on next load
    }
  }

  function invalidate(): void {
    if (!import.meta.client) return
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // ignore
    }
  }

  return { get, set, invalidate }
}

/** Clear all tracciona cache entries (e.g. after logout or major config change) */
export function clearAllTraccionaCache(): void {
  if (!import.meta.client) return
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith('tracciona_cache_')) keysToRemove.push(k)
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))
  } catch {
    // ignore
  }
}
