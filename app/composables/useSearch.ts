/**
 * Client-side composable for search engine integration (F6).
 *
 * Wraps the server /api/search endpoint with reactive state,
 * debounced queries, facets, and pagination.
 */

export interface UseSearchOptions {
  /** Debounce delay in ms (default 300) */
  debounceMs?: number
  /** Default results per page (default 20) */
  defaultLimit?: number
}

export interface SearchFilters {
  category_id?: string
  price_min?: number
  price_max?: number
  year_min?: number
  year_max?: number
  province?: string
  country?: string
}

interface ServerSearchResponse {
  results: Array<{
    id: string
    slug: string
    brand: string
    model: string
    year: number | null
    price: number | null
    location: string | null
    location_province: string | null
    location_country: string | null
    category_id: string | null
    dealer_id: string | null
    created_at: string
    rank: number
  }>
  next_cursor: string | null
  total_estimate: number
  query: string
}

export function useSearch(options: UseSearchOptions = {}) {
  const { debounceMs = 300, defaultLimit = 20 } = options

  const query = ref('')
  const filters = ref<SearchFilters>({})
  const results = ref<ServerSearchResponse['results']>([])
  const totalEstimate = ref(0)
  const nextCursor = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const hasMore = computed(() => nextCursor.value !== null)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * Execute a search against the server endpoint.
   */
  async function executeSearch(append = false) {
    loading.value = true
    error.value = null

    try {
      const params: Record<string, string> = {}
      if (query.value) params.q = query.value
      if (filters.value.category_id) params.category_id = filters.value.category_id
      if (filters.value.price_min !== undefined) params.price_min = String(filters.value.price_min)
      if (filters.value.price_max !== undefined) params.price_max = String(filters.value.price_max)
      if (filters.value.year_min !== undefined) params.year_min = String(filters.value.year_min)
      if (filters.value.year_max !== undefined) params.year_max = String(filters.value.year_max)
      if (filters.value.province) params.province = filters.value.province
      if (filters.value.country) params.country = filters.value.country
      if (append && nextCursor.value) params.cursor = nextCursor.value
      params.limit = String(defaultLimit)

      const qs = new URLSearchParams(params).toString()
      const response = await $fetch<ServerSearchResponse>(`/api/search?${qs}`)

      if (append) {
        results.value = [...results.value, ...response.results]
      } else {
        results.value = response.results
      }

      totalEstimate.value = response.total_estimate
      nextCursor.value = response.next_cursor
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Search failed'
      if (!append) {
        results.value = []
        totalEstimate.value = 0
        nextCursor.value = null
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Search with debounce (for typing in search box).
   */
  function debouncedSearch() {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => executeSearch(false), debounceMs)
  }

  /**
   * Set query and trigger debounced search.
   */
  function setQuery(q: string) {
    query.value = q
    debouncedSearch()
  }

  /**
   * Update filters and immediately search.
   */
  function setFilters(newFilters: Partial<SearchFilters>) {
    filters.value = { ...filters.value, ...newFilters }
    nextCursor.value = null
    executeSearch(false)
  }

  /**
   * Load more results (infinite scroll).
   */
  function loadMore() {
    if (hasMore.value && !loading.value) {
      executeSearch(true)
    }
  }

  /**
   * Reset search state.
   */
  function reset() {
    if (debounceTimer) clearTimeout(debounceTimer)
    query.value = ''
    filters.value = {}
    results.value = []
    totalEstimate.value = 0
    nextCursor.value = null
    loading.value = false
    error.value = null
  }

  return {
    query: readonly(query),
    filters: readonly(filters),
    results: readonly(results),
    totalEstimate: readonly(totalEstimate),
    hasMore,
    loading: readonly(loading),
    error,
    setQuery,
    setFilters,
    loadMore,
    executeSearch,
    reset,
  }
}
