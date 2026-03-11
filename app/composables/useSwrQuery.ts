/**
 * Stale-While-Revalidate pattern for Supabase queries.
 *
 * Returns cached data immediately while fetching fresh data in the background.
 * Suitable for: catalog counts, market stats, dashboard KPIs, public data.
 * NOT suitable for: user-specific private data, frequently mutated data.
 *
 * Usage:
 *   const { data, loading, error, refresh } = useSwrQuery(
 *     'market-summary',
 *     () => supabase.from('vehicles').select('count').single(),
 *     { ttl: 60 }
 *   )
 */

export interface SwrOptions {
  /** Cache TTL in seconds. Default: 30 */
  ttl?: number
  /** Fetch immediately on mount. Default: true */
  immediate?: boolean
}

interface SwrCacheEntry<T> {
  data: T
  timestamp: number
}

function getCache<T>(key: string, ttl: number): T | null {
  if (!import.meta.client) return null
  try {
    const raw = sessionStorage.getItem(`tracciona_swr_${key}`)
    if (!raw) return null
    const entry: SwrCacheEntry<T> = JSON.parse(raw)
    if ((Date.now() - entry.timestamp) / 1000 > ttl) return null
    return entry.data
  } catch {
    return null
  }
}

function setCache<T>(key: string, data: T): void {
  if (!import.meta.client) return
  try {
    const entry: SwrCacheEntry<T> = { data, timestamp: Date.now() }
    sessionStorage.setItem(`tracciona_swr_${key}`, JSON.stringify(entry))
  } catch {
    // Quota exceeded — fail silently
  }
}

export function useSwrQuery<T>(
  key: string,
  fetcher: () => Promise<{ data: T | null; error: unknown }>,
  options: SwrOptions = {},
) {
  const { ttl = 30, immediate = true } = options

  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isStale = ref(false)

  async function revalidate(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const result = await fetcher()
      if (result.error) {
        const err = result.error as Error | { message?: string }
        error.value = (err as Error).message ?? 'Query failed'
      } else {
        data.value = result.data
        if (result.data !== null) {
          setCache(key, result.data)
          isStale.value = false
        }
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Query failed'
    } finally {
      loading.value = false
    }
  }

  async function fetch(): Promise<void> {
    const cached = getCache<T>(key, ttl)
    if (cached !== null) {
      // Serve stale immediately, revalidate in background
      data.value = cached
      isStale.value = true
      revalidate() // fire-and-forget background refresh
    } else {
      await revalidate()
    }
  }

  if (immediate) {
    onMounted(fetch)
  }

  return {
    data,
    loading,
    error,
    isStale,
    refresh: revalidate,
    fetch,
  }
}
