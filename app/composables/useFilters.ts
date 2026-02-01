export interface FilterDefinition {
  id: string
  subcategory_id: string | null
  name: string
  type: 'caja' | 'desplegable' | 'desplegable_tick' | 'tick' | 'slider' | 'calc'
  label_es: string | null
  label_en: string | null
  unit: string | null
  options: Record<string, unknown>
  is_extra: boolean
  is_hidden: boolean
  status: string
  sort_order: number
}

export interface ActiveFilters {
  [filterName: string]: unknown
}

export function useFilters() {
  const supabase = useSupabaseClient()

  const definitions = ref<FilterDefinition[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const activeFilters = ref<ActiveFilters>({})

  async function fetchBySubcategory(subcategoryId: string) {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('filter_definitions')
        .select('*')
        .eq('subcategory_id', subcategoryId)
        .eq('status', 'published')
        .eq('is_hidden', false)
        .order('sort_order', { ascending: true })

      if (err) throw err

      definitions.value = (data as FilterDefinition[]) || []
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching filters'
      definitions.value = []
    }
    finally {
      loading.value = false
    }
  }

  const visibleFilters = computed(() => {
    const activeTicks = new Set<string>()

    for (const def of definitions.value) {
      if (def.type === 'tick' && activeFilters.value[def.name]) {
        activeTicks.add(def.name)
      }
    }

    return definitions.value.filter((def) => {
      // Check if any active tick hides this filter
      for (const tickDef of definitions.value) {
        if (tickDef.type !== 'tick' || !activeTicks.has(tickDef.name)) continue
        const hides = (tickDef.options?.hides as string[]) || []
        if (hides.includes(def.name)) return false
      }

      // If this filter is an extra, only show if its parent tick is active
      if (def.is_extra) {
        for (const tickDef of definitions.value) {
          if (tickDef.type !== 'tick') continue
          const extras = (tickDef.options?.extra_filters as string[]) || []
          if (extras.includes(def.name)) {
            return activeTicks.has(tickDef.name)
          }
        }
        return false
      }

      return true
    })
  })

  function setFilter(name: string, value: unknown) {
    activeFilters.value = { ...activeFilters.value, [name]: value }
  }

  function clearFilter(name: string) {
    const { [name]: _, ...rest } = activeFilters.value
    activeFilters.value = rest
  }

  function clearAll() {
    activeFilters.value = {}
  }

  function reset() {
    definitions.value = []
    activeFilters.value = {}
    error.value = null
  }

  return {
    definitions: readonly(definitions),
    visibleFilters,
    activeFilters: readonly(activeFilters),
    loading: readonly(loading),
    error: readonly(error),
    fetchBySubcategory,
    setFilter,
    clearFilter,
    clearAll,
    reset,
  }
}
