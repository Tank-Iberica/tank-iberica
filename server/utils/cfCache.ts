/**
 * Cloudflare Workers Cache API utility.
 *
 * Provides programmatic edge caching with custom cache keys.
 * Transparently falls back to calling fn() directly in environments
 * that don't have the CF Workers `caches` global (local dev, Node.js).
 *
 * Usage:
 *   const data = await cfCacheGet('market-report:es:2026Q1', 3600, () => generateReport())
 *
 * How it works:
 *   1. If no CF caches global → call fn() directly (dev fallback)
 *   2. Build a synthetic request URL from the cache key
 *   3. Check caches.default for a match
 *   4. On hit → return deserialized JSON (or raw text for HTML)
 *   5. On miss → call fn(), store response in cache (background), return data
 */

/** Cloudflare Workers Cache API types (not in standard lib) */
interface CFCacheStorage {
  default: {
    match(request: Request): Promise<Response | undefined>
    put(request: Request, response: Response): Promise<void>
  }
}

declare const caches: CFCacheStorage | undefined

/** Response format stored in CF cache */
interface CFCacheEntry<T> {
  data: T
  cachedAt: number
}

/**
 * Wrap a data-fetching function with CF edge caching.
 *
 * @param key       - Unique cache key (will be used as URL path segment)
 * @param ttlSecs   - Cache TTL in seconds
 * @param fn        - Async function that produces the data on cache miss
 * @returns         - The data, either from cache or freshly fetched
 */
export async function cfCacheGet<T>(
  key: string,
  ttlSecs: number,
  fn: () => Promise<T>,
): Promise<T> {
  // CF Workers caches API only available in CF Workers runtime
  if (typeof caches === 'undefined' || !caches || caches.default === undefined) {
    return fn()
  }

  const cache = caches.default
  // Synthetic URL — CF cache requires a full URL with scheme+host
  const cacheUrl = `https://cache.tracciona.internal/v1/${encodeURIComponent(key)}`
  const cacheRequest = new Request(cacheUrl)

  // 1. Check cache
  const cached = await cache.match(cacheRequest)
  if (cached) {
    try {
      const entry = (await cached.json()) as CFCacheEntry<T>
      return entry.data
    } catch {
      // Corrupted cache entry — fall through to fetch
    }
  }

  // 2. Cache miss — fetch fresh data
  const data = await fn()

  // 3. Store in cache (fire-and-forget — do not await)
  const entry: CFCacheEntry<T> = { data, cachedAt: Date.now() }
  const cacheResponse = new Response(JSON.stringify(entry), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': `public, s-maxage=${ttlSecs}, max-age=${ttlSecs}`,
    },
  })
  cache.put(cacheRequest, cacheResponse).catch(() => {
    // Cache write failure is non-fatal — data still returned
  })

  return data
}

/**
 * Build a normalized cache key from a base name + query params object.
 * Sorts params alphabetically for consistency regardless of request order.
 *
 * @example
 *   buildCacheKey('market-report', { locale: 'es', public: 'true' })
 *   // → 'market-report:locale=es:public=true'
 */
export function buildCacheKey(base: string, params: Record<string, string | undefined>): string {
  const sorted = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join(':')

  return sorted ? `${base}:${sorted}` : base
}
