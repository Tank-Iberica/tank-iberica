/**
 * SSR-safe shared state using Nuxt's useState.
 *
 * Unlike plain ref(), useState() data is:
 * 1. Serialized server-side into the HTML payload
 * 2. Rehydrated client-side without re-fetching
 * 3. Shared across all component instances (singleton per key)
 *
 * Use this for data that:
 * - Is fetched during SSR (public data, no auth needed)
 * - Is used by multiple components on the same page
 * - Doesn't change frequently (categories, config, etc.)
 *
 * Usage:
 *   const categories = useHydratedState('categories', async () => {
 *     const { data } = await supabase.from('categories').select('id, name')
 *     return data ?? []
 *   })
 */

export interface HydratedStateOptions {
  /** Time-to-live in milliseconds. After this, data will be re-fetched. Default: 5 minutes. */
  ttl?: number
}

/**
 * Create a shared, SSR-dehydrated state with lazy initialization.
 * Data is fetched once on the server, sent to the client in the payload,
 * and only re-fetched when TTL expires or refresh() is called.
 */
export function useHydratedState<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: HydratedStateOptions = {},
) {
  const ttl = options.ttl ?? 5 * 60 * 1000

  // useState creates a shared reactive ref that survives SSR → client
  const data = useState<T | null>(`hydrated:${key}`, () => null)
  const fetchedAt = useState<number>(`hydrated:${key}:ts`, () => 0)
  const error = useState<string | null>(`hydrated:${key}:err`, () => null)
  const isLoading = ref(false)

  const isStale = computed(() => {
    if (!fetchedAt.value) return true
    return Date.now() - fetchedAt.value > ttl
  })

  async function refresh() {
    isLoading.value = true
    error.value = null
    try {
      data.value = await fetcher()
      fetchedAt.value = Date.now()
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch'
    } finally {
      isLoading.value = false
    }
  }

  // Auto-fetch if no data yet or stale
  async function ensureData() {
    if (data.value === null || isStale.value) {
      await refresh()
    }
  }

  return {
    data,
    error,
    isLoading,
    isStale,
    refresh,
    ensureData,
  }
}
