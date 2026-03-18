/**
 * Read-through in-memory cache for frequently accessed data.
 *
 * Pattern: get(key) → cache hit? return cached : fetch → store → return
 * Default TTL: 5 minutes. Supports manual invalidation.
 *
 * Use cases: vertical_config, subscription_tiers, feature flags.
 *
 * Roadmap: N68 — Read-through cache datos frecuentes
 */

export interface ReadThroughCacheOptions {
  /** Cache TTL in milliseconds. Default: 5 minutes */
  ttlMs?: number
  /** Maximum entries in cache. Default: 100 */
  maxEntries?: number
}

interface CacheEntry<T> {
  data: T
  cachedAt: number
  hits: number
}

export interface CacheStats {
  entries: number
  hits: number
  misses: number
  evictions: number
}

export interface ReadThroughCache<T> {
  get: (key: string, fetcher: () => Promise<T>) => Promise<T>
  invalidate: (key: string) => boolean
  invalidateAll: () => void
  has: (key: string) => boolean
  stats: () => CacheStats
  size: () => number
}

const DEFAULT_TTL_MS = 5 * 60 * 1000 // 5 minutes
const DEFAULT_MAX_ENTRIES = 100

/**
 * Create a read-through cache instance.
 */
export function createReadThroughCache<T>(
  options: ReadThroughCacheOptions = {},
): ReadThroughCache<T> {
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS
  const maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES

  const store = new Map<string, CacheEntry<T>>()
  let totalHits = 0
  let totalMisses = 0
  let totalEvictions = 0

  function isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.cachedAt >= ttlMs
  }

  function evictOldest(): void {
    if (store.size === 0) return
    // Evict the oldest entry (first inserted)
    const firstKey = store.keys().next().value
    if (firstKey !== undefined) {
      store.delete(firstKey)
      totalEvictions++
    }
  }

  async function get(key: string, fetcher: () => Promise<T>): Promise<T> {
    const existing = store.get(key)

    if (existing && !isExpired(existing)) {
      existing.hits++
      totalHits++
      return existing.data
    }

    // Cache miss or expired — fetch fresh data
    totalMisses++
    const data = await fetcher()

    // Evict if at capacity
    if (store.size >= maxEntries && !store.has(key)) {
      evictOldest()
    }

    store.set(key, { data, cachedAt: Date.now(), hits: 0 })
    return data
  }

  function invalidate(key: string): boolean {
    return store.delete(key)
  }

  function invalidateAll(): void {
    store.clear()
  }

  function has(key: string): boolean {
    const entry = store.get(key)
    if (!entry) return false
    if (isExpired(entry)) {
      store.delete(key)
      return false
    }
    return true
  }

  function stats(): CacheStats {
    return {
      entries: store.size,
      hits: totalHits,
      misses: totalMisses,
      evictions: totalEvictions,
    }
  }

  function size(): number {
    return store.size
  }

  return { get, invalidate, invalidateAll, has, stats, size }
}
