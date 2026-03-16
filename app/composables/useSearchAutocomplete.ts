/**
 * Debounced full-text search autocomplete composable.
 *
 * Calls /api/search with a 300ms debounce and returns up to 5
 * vehicle suggestions as the user types.
 *
 * Usage:
 *   const { query, results, isLoading, isOpen, clear } = useSearchAutocomplete()
 *   // Bind `query` to an <input v-model>
 *   // Render `results` in a dropdown
 */

import { ref, watch, onUnmounted } from 'vue'

export interface AutocompleteResult {
  id: string
  slug: string
  brand: string
  model: string
  year: number | null
  price: number | null
  location_province: string | null
  location_country: string | null
}

interface SearchApiResponse {
  results: AutocompleteResult[]
  query: string
  total_estimate: number
  next_cursor: string | null
}

const DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2
const MAX_SUGGESTIONS = 5

export function useSearchAutocomplete() {
  const query = ref('')
  const results = ref<AutocompleteResult[]>([])
  const isLoading = ref(false)
  const isOpen = ref(false)
  const error = ref<string | null>(null)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  async function fetchSuggestions(q: string): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const data = await $fetch<SearchApiResponse>('/api/search', {
        query: { q, limit: String(MAX_SUGGESTIONS) },
      })
      results.value = data.results.slice(0, MAX_SUGGESTIONS)
      isOpen.value = !!results.value.length
    } catch {
      results.value = []
      isOpen.value = false
    } finally {
      isLoading.value = false
    }
  }

  watch(query, (newQuery) => {
    if (debounceTimer) clearTimeout(debounceTimer)

    const trimmed = newQuery.trim()
    if (trimmed.length < MIN_QUERY_LENGTH) {
      results.value = []
      isOpen.value = false
      isLoading.value = false
      return
    }

    // Show loading immediately on typing (better perceived performance)
    isLoading.value = true

    debounceTimer = setTimeout(() => {
      void fetchSuggestions(trimmed)
    }, DEBOUNCE_MS)
  })

  function clear(): void {
    if (debounceTimer) clearTimeout(debounceTimer)
    query.value = ''
    results.value = []
    isOpen.value = false
    isLoading.value = false
    error.value = null
  }

  function close(): void {
    isOpen.value = false
  }

  onUnmounted(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
  })

  return { query, results, isLoading, isOpen, error, clear, close }
}
