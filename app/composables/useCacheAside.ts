/**
 * Cache-Aside Pattern for Client-Side Data
 *
 * P1 § Cache Layer: sessionStorage + reactive refs
 * - Auto-invalidate on data mutation
 * - Survives page navigation
 * - Fast local access
 */

export function useCacheAside<T>(
  key: string,
  ttl: number = 300 // 5 min default
) {
  const data = ref<T | null>(null)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const cached = ref(false)

  /**
   * Fetch and cache data
   */
  async function fetch(fetcher: () => Promise<T>) {
    // Check sessionStorage first
    const stored = sessionStorage.getItem(key)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.expiresAt > Date.now()) {
          data.value = parsed.value
          cached.value = true
          return
        }
      } catch (e) {
        // Ignore parse errors, proceed to fetch
      }
    }

    // Cache miss: fetch
    isLoading.value = true
    error.value = null

    try {
      const result = await fetcher()
      data.value = result

      // Store in sessionStorage
      sessionStorage.setItem(
        key,
        JSON.stringify({
          value: result,
          expiresAt: Date.now() + ttl * 1000,
          createdAt: Date.now(),
        })
      )

      cached.value = false
    } catch (e) {
      error.value = e as Error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Invalidate cache
   */
  function invalidate() {
    sessionStorage.removeItem(key)
    cached.value = false
  }

  return {
    data,
    isLoading,
    error,
    cached,
    fetch,
    invalidate,
  }
}

/**
 * Specific cache for categories
 */
export function useCacheCategories(vertical: string) {
  const key = `categories:${vertical}`
  const { data: categories, ...rest } = useCacheAside<any[]>(key, 3600) // 1h

  const fetch = async () => {
    const res = await $fetch(`/api/categories?vertical=${vertical}`)
    return res
  }

  return {
    categories,
    ...rest,
    fetch: () => fetch(),
  }
}

/**
 * Specific cache for vertical config
 */
export function useCacheVerticalConfig(vertical: string) {
  const key = `vertical:${vertical}`
  const { data: config, ...rest } = useCacheAside<any>(key, 300) // 5min

  const fetch = async () => {
    const res = await $fetch(`/api/vertical/${vertical}`)
    return res
  }

  return {
    config,
    ...rest,
    fetch: () => fetch(),
  }
}

/**
 * Specific cache for vehicle counts
 */
export function useCacheVehicleCounts(vertical: string, category?: string) {
  const key = `counts:${vertical}${category ? `:${category}` : ''}`
  const { data: counts, ...rest } = useCacheAside<Record<string, number>>(
    key,
    60 // 1min
  )

  const fetch = async () => {
    const params = new URLSearchParams({ vertical })
    if (category) params.append('category', category)
    const res = await $fetch(`/api/counts?${params}`)
    return res
  }

  return {
    counts,
    ...rest,
    fetch: () => fetch(),
  }
}
