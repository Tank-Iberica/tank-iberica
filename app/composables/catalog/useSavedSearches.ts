/**
 * useSavedSearches — DB-backed saved search presets (replaces localStorage useSavedFilters for auth users).
 *
 * Requires authentication. Without auth, `requiresAuth` is true and save/load won't work.
 * 1 free saved search per user; unlimited after unlocking via 1 credit.
 */
export interface SavedSearch {
  id: string
  name: string
  filters: Record<string, unknown>
  search_query: string | null
  location_level: string | null
  is_favorite: boolean
  last_used_at: string | null
  use_count: number
  created_at: string
  updated_at: string
}

/** Composable for DB-backed saved search presets with credit-gated unlocks. */
export function useSavedSearches() {
  const searches = useState<SavedSearch[]>('saved-searches', () => [])
  const loading = ref(false)
  const { isUnlocked, fetchStatus } = useFeatureUnlocks()

  const user = useSupabaseUser()
  const requiresAuth = computed(() => !user.value)

  const hasSearches = computed(() => searches.value.length > 0)
  const canSave = computed(() => {
    if (!user.value) return false
    if (isUnlocked('saved_searches')) return true
    return searches.value.length < 1
  })
  const isFeatureUnlocked = computed(() => isUnlocked('saved_searches'))

  async function load() {
    if (!user.value) return
    loading.value = true
    try {
      const { data } = await useFetch('/api/saved-searches')
      if (data.value?.searches) {
        searches.value = data.value.searches as SavedSearch[]
      }
    } finally {
      loading.value = false
    }
  }

  async function save(
    name: string,
    filters: VehicleFilters,
    searchQuery?: string,
    locationLevel?: LocationLevel | null,
  ): Promise<{ success: boolean; limitReached?: boolean }> {
    if (!user.value) return { success: false }

    try {
      const result = await $fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        body: {
          name,
          filters,
          searchQuery: searchQuery || undefined,
          locationLevel: locationLevel || undefined,
        },
      })

      if ('error' in result && result.error === 'limit_reached') {
        return { success: false, limitReached: true }
      }

      if ('search' in result && result.search) {
        searches.value = [result.search as SavedSearch, ...searches.value]
        return { success: true }
      }

      return { success: false }
    } catch {
      return { success: false }
    }
  }

  async function bumpUsage(id: string) {
    if (!user.value) return
    try {
      const result = await $fetch(`/api/saved-searches/${id}`, {
        method: 'PATCH',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        body: { bump_usage: true },
      })
      if (result.search) {
        const idx = searches.value.findIndex((s) => s.id === id)
        if (idx >= 0) searches.value[idx] = result.search as SavedSearch
      }
    } catch {
      // Non-critical — don't block UX
    }
  }

  async function toggleFavorite(id: string) {
    if (!user.value) return
    const search = searches.value.find((s) => s.id === id)
    if (!search) return

    const newVal = !search.is_favorite
    try {
      const result = await $fetch(`/api/saved-searches/${id}`, {
        method: 'PATCH',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        body: { is_favorite: newVal },
      })
      if (result.search) {
        const idx = searches.value.findIndex((s) => s.id === id)
        if (idx >= 0) searches.value[idx] = result.search as SavedSearch
        // Re-sort: favorites first
        searches.value.sort((a, b) => {
          if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1
          const aTime = a.last_used_at ? new Date(a.last_used_at).getTime() : 0
          const bTime = b.last_used_at ? new Date(b.last_used_at).getTime() : 0
          return bTime - aTime
        })
      }
    } catch {
      // Revert optimistic update on failure
    }
  }

  async function update(
    id: string,
    patch: {
      name?: string
      filters?: Record<string, unknown>
      search_query?: string | null
      location_level?: string | null
    },
  ) {
    if (!user.value) return
    try {
      const result = await $fetch(`/api/saved-searches/${id}`, {
        method: 'PATCH',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        body: patch,
      })
      if (result.search) {
        const idx = searches.value.findIndex((s) => s.id === id)
        if (idx >= 0) searches.value[idx] = result.search as SavedSearch
      }
    } catch {
      // Silent fail
    }
  }

  async function remove(id: string) {
    if (!user.value) return
    try {
      await $fetch(`/api/saved-searches/${id}`, {
        method: 'DELETE',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      })
      searches.value = searches.value.filter((s) => s.id !== id)
    } catch {
      // Silent fail
    }
  }

  // Auto-load on init if authenticated
  if (import.meta.client && user.value) {
    load()
    fetchStatus(['saved_searches'])
  }

  return {
    searches: readonly(searches),
    loading: readonly(loading),
    requiresAuth,
    hasSearches,
    canSave,
    isFeatureUnlocked,
    load,
    save,
    update,
    bumpUsage,
    toggleFavorite,
    remove,
  }
}
