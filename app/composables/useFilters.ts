import { computed } from 'vue'
import { useSupabaseClient, useState } from '#imports'

export interface FilterDefinition {
  id: string
  type_id: string | null
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
  // Extended: track source for UI
  source?: 'subcategory' | 'type'
}

export interface ActiveFilters {
  [filterName: string]: unknown
}

interface FiltersState {
  definitions: FilterDefinition[]
  subcategoryFilters: FilterDefinition[]
  typeFilters: FilterDefinition[]
  loading: boolean
  error: string | null
  activeFilters: ActiveFilters
}

const defaultState: FiltersState = {
  definitions: [],
  subcategoryFilters: [],
  typeFilters: [],
  loading: false,
  error: null,
  activeFilters: {},
}

export function useFilters() {
  const supabase = useSupabaseClient()

  // Use shared state across all components
  const state = useState<FiltersState>('filters', () => ({ ...defaultState }))

  /**
   * Fetch filters by type ID only (backward compatible)
   */
  async function fetchByType(typeId: string) {
    state.value.loading = true
    state.value.error = null

    try {
      const { data, error: err } = await supabase
        .from('filter_definitions')
        .select('*')
        .eq('type_id', typeId)
        .eq('status', 'published')
        .eq('is_hidden', false)
        .order('sort_order', { ascending: true })

      if (err) throw err

      const filters = (data as FilterDefinition[]) || []
      state.value.typeFilters = filters.map(f => ({ ...f, source: 'type' as const }))
      state.value.subcategoryFilters = []
      state.value.definitions = state.value.typeFilters
    }
    catch (err: unknown) {
      state.value.error = err instanceof Error ? err.message : 'Error fetching filters'
      state.value.definitions = []
      state.value.typeFilters = []
    }
    finally {
      state.value.loading = false
    }
  }

  /**
   * Fetch filters from both subcategory and type with deduplication.
   * If the same filter exists on both levels, it only shows once.
   */
  async function fetchBySubcategoryAndType(subcategoryId: string | null, typeId: string | null) {
    state.value.loading = true
    state.value.error = null

    try {
      // Fetch subcategory-level filters (from subcategories.applicable_filters)
      let subcatFilterIds: string[] = []
      if (subcategoryId) {
        const { data: subcatData } = await supabase
          .from('subcategories')
          .select('applicable_filters')
          .eq('id', subcategoryId)
          .single()

        if (subcatData?.applicable_filters) {
          subcatFilterIds = subcatData.applicable_filters as string[]
        }
      }

      // Fetch filter definitions for subcategory filters
      let subcatFilters: FilterDefinition[] = []
      if (subcatFilterIds.length > 0) {
        const { data: filterData } = await supabase
          .from('filter_definitions')
          .select('*')
          .in('id', subcatFilterIds)
          .eq('status', 'published')
          .eq('is_hidden', false)
          .order('sort_order', { ascending: true })

        subcatFilters = ((filterData as FilterDefinition[]) || []).map(f => ({
          ...f,
          source: 'subcategory' as const,
        }))
      }

      // Fetch type-level filters
      let typeFiltersList: FilterDefinition[] = []
      if (typeId) {
        const { data: typeFilterData } = await supabase
          .from('filter_definitions')
          .select('*')
          .eq('type_id', typeId)
          .eq('status', 'published')
          .eq('is_hidden', false)
          .order('sort_order', { ascending: true })

        typeFiltersList = ((typeFilterData as FilterDefinition[]) || []).map(f => ({
          ...f,
          source: 'type' as const,
        }))
      }

      state.value.subcategoryFilters = subcatFilters
      state.value.typeFilters = typeFiltersList

      // Deduplicate: if same filter ID exists in both, keep only the subcategory one
      const subcatIds = new Set(subcatFilters.map(f => f.id))
      const dedupedTypeFilters = typeFiltersList.filter(f => !subcatIds.has(f.id))

      state.value.definitions = [...subcatFilters, ...dedupedTypeFilters]
    }
    catch (err: unknown) {
      state.value.error = err instanceof Error ? err.message : 'Error fetching filters'
      state.value.definitions = []
      state.value.subcategoryFilters = []
      state.value.typeFilters = []
    }
    finally {
      state.value.loading = false
    }
  }

  const visibleFilters = computed(() => {
    const activeTicks = new Set<string>()

    for (const def of state.value.definitions) {
      if (def.type === 'tick' && state.value.activeFilters[def.name]) {
        activeTicks.add(def.name)
      }
    }

    return state.value.definitions.filter((def) => {
      // Check if any active tick hides this filter
      for (const tickDef of state.value.definitions) {
        if (tickDef.type !== 'tick' || !activeTicks.has(tickDef.name)) continue
        const hides = (tickDef.options?.hides as string[]) || []
        if (hides.includes(def.name)) return false
      }

      // If this filter is an extra, only show if its parent tick is active
      if (def.is_extra) {
        for (const tickDef of state.value.definitions) {
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
    state.value.activeFilters = { ...state.value.activeFilters, [name]: value }
  }

  function clearFilter(name: string) {
    const { [name]: _, ...rest } = state.value.activeFilters
    state.value.activeFilters = rest
  }

  function clearAll() {
    state.value.activeFilters = {}
  }

  function reset() {
    state.value.definitions = []
    state.value.subcategoryFilters = []
    state.value.typeFilters = []
    state.value.activeFilters = {}
    state.value.error = null
  }

  return {
    definitions: computed(() => state.value.definitions),
    subcategoryFilters: computed(() => state.value.subcategoryFilters),
    typeFilters: computed(() => state.value.typeFilters),
    visibleFilters,
    activeFilters: computed(() => state.value.activeFilters),
    loading: computed(() => state.value.loading),
    error: computed(() => state.value.error),
    fetchByType,
    fetchBySubcategoryAndType,
    setFilter,
    clearFilter,
    clearAll,
    reset,
  }
}
