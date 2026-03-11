/**
 * Stale Fallback Composable
 *
 * Wraps async data fetching with a stale-while-revalidate pattern.
 * If the fetch fails or times out, serves cached data with a "stale" flag.
 *
 * Usage:
 *   const { data, isStale, loading, refresh } = useStaleFallback('vehicles-list', fetchFn, { ttl: 60_000, timeout: 5000 })
 */

const CACHE_PREFIX = 'tracciona:stale:'

interface StaleFallbackOptions {
  /** Cache TTL in milliseconds (default: 5 minutes) */
  ttl?: number
  /** Fetch timeout in milliseconds (default: 8 seconds) */
  timeout?: number
}

function safeGet<T>(key: string): { data: T; timestamp: number } | null {
  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${key}`)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function safeSet<T>(key: string, data: T): void {
  try {
    sessionStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({ data, timestamp: Date.now() }))
  } catch {
    // Quota exceeded or unavailable — ignore
  }
}

export function useStaleFallback<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: StaleFallbackOptions = {},
) {
  const { ttl = 300_000, timeout = 8000 } = options

  const data = ref<T | null>(null) as Ref<T | null>
  const isStale = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchWithTimeout(): Promise<T> {
    return Promise.race([
      fetcher(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Fetch timeout')), timeout),
      ),
    ])
  }

  async function refresh(): Promise<void> {
    if (!import.meta.client) return

    loading.value = true
    error.value = null
    isStale.value = false

    try {
      const result = await fetchWithTimeout()
      data.value = result
      safeSet(key, result)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Fetch failed'

      // Try to serve stale data from cache
      const cached = safeGet<T>(key)
      if (cached) {
        const age = Date.now() - cached.timestamp
        data.value = cached.data
        isStale.value = true

        // If cache is too old (>5x TTL), clear it
        if (age > ttl * 5) {
          data.value = null
          isStale.value = false
        }
      }
    } finally {
      loading.value = false
    }
  }

  // Auto-refresh on mount
  if (import.meta.client) {
    onMounted(refresh)
  }

  return {
    data: readonly(data),
    isStale: readonly(isStale),
    loading: readonly(loading),
    error: readonly(error),
    refresh,
  }
}
