/**
 * Cache Layer Utilities
 *
 * P1 § Cache-aside pattern: Redis/sessionStorage for:
 * - Categorías (TTL 1h)
 * - Vertical config (TTL 5min)
 * - Vehicle counts (TTL 1min)
 * - Feature flags (TTL 10min)
 */

export interface CacheEntry<T = unknown> {
  value: T
  expiresAt: number
  createdAt: number
}

/**
 * Server-side cache (memory for MVP, upgrade to Redis when distributing)
 */
const serverCache = new Map<string, CacheEntry>()

/**
 * Get from cache or fetch + cache
 *
 * @param key - Cache key
 * @param ttl - Time to live in seconds
 * @param fetch - Function to fetch data if not cached
 */
export async function cacheAside<T>(key: string, ttl: number, fetch: () => Promise<T>): Promise<T> {
  // Check memory cache
  const cached = serverCache.get(key)
  if (cached && (cached.expiresAt ?? 0) > Date.now()) {
    return cached.value as T
  }

  // Cache miss: fetch data
  const value = await fetch()

  // Store in cache
  serverCache.set(key, {
    value,
    expiresAt: Date.now() + ttl * 1000,
    createdAt: Date.now(),
  })

  return value
}

/**
 * Invalidate cache entry
 */
export function invalidateCache(key: string): void {
  serverCache.delete(key)
}

/**
 * Invalidate multiple cache entries by pattern
 */
export function invalidateCachePattern(pattern: string): void {
  const regex = new RegExp(pattern)
  for (const key of serverCache.keys()) {
    if (regex.test(key)) {
      serverCache.delete(key)
    }
  }
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  serverCache.clear()
}

/**
 * Get cache stats
 */
export function getCacheStats(): { entries: number; memory: number } {
  return {
    entries: serverCache.size,
    memory: JSON.stringify(Array.from(serverCache.keys())).length,
  }
}

/**
 * Cache keys (constants for consistency)
 */
export const CACHE_KEYS = {
  // Categorías (1h)
  CATEGORIES: 'cache:categories',
  SUBCATEGORIES: (vertical: string) => `cache:subcategories:${vertical}`,
  ATTRIBUTES: (vertical: string) => `cache:attributes:${vertical}`,

  // Vertical config (5min)
  VERTICAL_CONFIG: (vertical: string) => `cache:vertical:${vertical}`,
  VERTICAL_PRICING: (vertical: string) => `cache:pricing:${vertical}`,

  // Vehicle counts (1min)
  VEHICLE_COUNT: (vertical: string, category?: string) =>
    `cache:count:${vertical}${category ? `:${category}` : ''}`,

  // Feature flags (10min)
  FEATURE_FLAGS: 'cache:features',
  FEATURE_FLAG: (name: string) => `cache:feature:${name}`,

  // Market data (30min)
  MARKET_REPORT: (vertical: string) => `cache:market:${vertical}`,
  PRICE_TRENDS: (category: string) => `cache:trends:${category}`,

  // Search indexes (15min)
  SEARCH_INDEX: (q: string) => `cache:search:${q.toLowerCase()}`,
}

/**
 * Cache TTL constants
 */
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 1 day
}
