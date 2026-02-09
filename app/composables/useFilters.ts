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

interface SliderRange {
  min: number
  max: number
}

interface FiltersState {
  definitions: FilterDefinition[]
  subcategoryFilters: FilterDefinition[]
  typeFilters: FilterDefinition[]
  loading: boolean
  error: string | null
  activeFilters: ActiveFilters
  vehicleFilterValues: Record<string, string[]>
  sliderRanges: Record<string, SliderRange>
}

const defaultState: FiltersState = {
  definitions: [],
  subcategoryFilters: [],
  typeFilters: [],
  loading: false,
  error: null,
  activeFilters: {},
  vehicleFilterValues: {},
  sliderRanges: {},
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
      await fetchVehicleFilterValues(state.value.definitions)
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

        const row = subcatData as { applicable_filters: string[] | null } | null
        if (row?.applicable_filters) {
          subcatFilterIds = row.applicable_filters
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

      // Fetch type-level filters (from types.applicable_filters)
      let typeFiltersList: FilterDefinition[] = []
      if (typeId) {
        const { data: typeData } = await supabase
          .from('types')
          .select('applicable_filters')
          .eq('id', typeId)
          .single()

        const typeRow = typeData as { applicable_filters: string[] | null } | null
        const typeFilterIds = typeRow?.applicable_filters || []

        if (typeFilterIds.length > 0) {
          const { data: typeFilterData } = await supabase
            .from('filter_definitions')
            .select('*')
            .in('id', typeFilterIds)
            .eq('status', 'published')
            .eq('is_hidden', false)
            .order('sort_order', { ascending: true })

          typeFiltersList = ((typeFilterData as FilterDefinition[]) || []).map(f => ({
            ...f,
            source: 'type' as const,
          }))
        }
      }

      state.value.subcategoryFilters = subcatFilters
      state.value.typeFilters = typeFiltersList

      // Deduplicate: if same filter ID exists in both, keep only the subcategory one
      const subcatIds = new Set(subcatFilters.map(f => f.id))
      const dedupedTypeFilters = typeFiltersList.filter(f => !subcatIds.has(f.id))

      state.value.definitions = [...subcatFilters, ...dedupedTypeFilters]
      await fetchVehicleFilterValues(state.value.definitions)
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

  /**
   * Fetch unique filter values from published vehicles for dynamic options (desplegable)
   * and compute slider ranges. Called after filter definitions are loaded.
   */
  async function fetchVehicleFilterValues(filterDefs: FilterDefinition[]) {
    const needsValues = filterDefs.filter(f =>
      (f.type === 'desplegable' || f.type === 'desplegable_tick') &&
      ((f.options as Record<string, unknown>)?.choices_source === 'auto' ||
       (f.options as Record<string, unknown>)?.choices_source === 'both'),
    )
    const needsRange = filterDefs.filter(f => f.type === 'slider')

    if (!needsValues.length && !needsRange.length) return

    // Fetch all published vehicles' filters_json
    const { data } = await supabase
      .from('vehicles')
      .select('filters_json')
      .eq('status', 'published')

    if (!data) return

    const vehicles = data as { filters_json: Record<string, unknown> | null }[]

    // Extract unique values for desplegable filters
    for (const filter of needsValues) {
      const valuesSet = new Set<string>()
      for (const v of vehicles) {
        if (!v.filters_json) continue
        const val = v.filters_json[filter.id] ?? v.filters_json[filter.name]
        if (val !== null && val !== undefined && val !== '') {
          valuesSet.add(String(val))
        }
      }
      state.value.vehicleFilterValues[filter.name] = Array.from(valuesSet).sort()
    }

    // Compute slider ranges
    for (const filter of needsRange) {
      let min = Infinity
      let max = -Infinity
      for (const v of vehicles) {
        if (!v.filters_json) continue
        const val = v.filters_json[filter.id] ?? v.filters_json[filter.name]
        const num = Number(val)
        if (!Number.isNaN(num) && val !== null && val !== undefined && val !== '') {
          if (num < min) min = num
          if (num > max) max = num
        }
      }
      if (min !== Infinity && max !== -Infinity) {
        state.value.sliderRanges[filter.name] = { min, max }
      }
    }
  }

  /**
   * Get merged options for a desplegable filter (manual choices + auto values)
   */
  function getFilterOptions(filter: FilterDefinition): string[] {
    const opts = filter.options as Record<string, unknown>
    const source = (opts?.choices_source as string) || 'manual'
    const manual = (opts?.choices as string[]) || []
    const auto = state.value.vehicleFilterValues[filter.name] || []

    if (source === 'manual') return manual
    if (source === 'auto') return auto
    // 'both': merge and deduplicate
    return [...new Set([...manual, ...auto])].sort()
  }

  /**
   * Get slider range for a filter
   */
  function getSliderRange(filter: FilterDefinition): SliderRange {
    return state.value.sliderRanges[filter.name] || { min: 0, max: 100 }
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
    vehicleFilterValues: computed(() => state.value.vehicleFilterValues),
    sliderRanges: computed(() => state.value.sliderRanges),
    fetchByType,
    fetchBySubcategoryAndType,
    getFilterOptions,
    getSliderRange,
    setFilter,
    clearFilter,
    clearAll,
    reset,
  }
}
