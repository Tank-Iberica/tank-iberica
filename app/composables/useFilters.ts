import { computed } from 'vue'
import { useSupabaseClient, useState } from '#imports'

export interface AttributeDefinition {
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
  // Extended: track source for UI
  source?: 'category' | 'subcategory'
}

export interface ActiveFilters {
  [filterName: string]: unknown
}

interface SliderRange {
  min: number
  max: number
}

interface FiltersState {
  definitions: AttributeDefinition[]
  categoryFilters: AttributeDefinition[]
  subcategoryFilters: AttributeDefinition[]
  loading: boolean
  error: string | null
  activeFilters: ActiveFilters
  vehicleFilterValues: Record<string, string[]>
  sliderRanges: Record<string, SliderRange>
}

const defaultState: FiltersState = {
  definitions: [],
  categoryFilters: [],
  subcategoryFilters: [],
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
   * Fetch filters by subcategory ID only (backward compatible)
   */
  async function fetchBySubcategory(subcategoryId: string) {
    state.value.loading = true
    state.value.error = null

    try {
      const { data, error: err } = await supabase
        .from('attributes')
        .select('*')
        .eq('subcategory_id', subcategoryId)
        .eq('status', 'published')
        .eq('is_hidden', false)
        .order('sort_order', { ascending: true })

      if (err) throw err

      const filters = (data as AttributeDefinition[]) || []
      state.value.subcategoryFilters = filters.map((f) => ({
        ...f,
        source: 'subcategory' as const,
      }))
      state.value.categoryFilters = []
      state.value.definitions = state.value.subcategoryFilters
      await fetchVehicleFilterValues(state.value.definitions, subcategoryId)
    } catch (err: unknown) {
      state.value.error = err instanceof Error ? err.message : 'Error fetching filters'
      state.value.definitions = []
      state.value.subcategoryFilters = []
    } finally {
      state.value.loading = false
    }
  }

  /**
   * Fetch filters from both category and subcategory with deduplication.
   * If the same filter exists on both levels, it only shows once.
   */
  async function fetchByCategoryAndSubcategory(
    categoryId: string | null,
    subcategoryId: string | null,
  ) {
    state.value.loading = true
    state.value.error = null

    try {
      // Fetch category-level filters (from categories.applicable_filters)
      let catFilterIds: string[] = []
      if (categoryId) {
        const { data: catData, error: catErr } = await supabase
          .from('categories')
          .select('applicable_filters')
          .eq('id', categoryId)
          .single()

        if (catErr) throw catErr
        const row = catData as { applicable_filters: string[] | null } | null
        if (row?.applicable_filters) {
          catFilterIds = row.applicable_filters
        }
      }

      // Fetch filter definitions for category filters
      let catFilters: AttributeDefinition[] = []
      if (catFilterIds.length > 0) {
        const { data: filterData, error: filterErr } = await supabase
          .from('attributes')
          .select('*')
          .in('id', catFilterIds)
          .eq('status', 'published')
          .eq('is_hidden', false)
          .order('sort_order', { ascending: true })

        if (filterErr) throw filterErr
        catFilters = ((filterData as AttributeDefinition[]) || []).map((f) => ({
          ...f,
          source: 'category' as const,
        }))
      }

      // Fetch subcategory-level filters (from subcategories.applicable_filters)
      let subcatFiltersList: AttributeDefinition[] = []
      if (subcategoryId) {
        const { data: subcatData, error: subcatErr } = await supabase
          .from('subcategories')
          .select('applicable_filters')
          .eq('id', subcategoryId)
          .single()

        if (subcatErr) throw subcatErr
        const subcatRow = subcatData as { applicable_filters: string[] | null } | null
        const subcatFilterIds = subcatRow?.applicable_filters || []

        if (subcatFilterIds.length > 0) {
          const { data: subcatFilterData, error: subcatFilterErr } = await supabase
            .from('attributes')
            .select('*')
            .in('id', subcatFilterIds)
            .eq('status', 'published')
            .eq('is_hidden', false)
            .order('sort_order', { ascending: true })

          if (subcatFilterErr) throw subcatFilterErr
          subcatFiltersList = ((subcatFilterData as AttributeDefinition[]) || []).map((f) => ({
            ...f,
            source: 'subcategory' as const,
          }))
        }
      }

      state.value.categoryFilters = catFilters
      state.value.subcategoryFilters = subcatFiltersList

      // Deduplicate: if same filter ID exists in both, keep only the category one
      const catIds = new Set(catFilters.map((f) => f.id))
      const dedupedSubcatFilters = subcatFiltersList.filter((f) => !catIds.has(f.id))

      state.value.definitions = [...catFilters, ...dedupedSubcatFilters]
      await fetchVehicleFilterValues(state.value.definitions, categoryId || undefined)
    } catch (err: unknown) {
      state.value.error = err instanceof Error ? err.message : 'Error fetching filters'
      state.value.definitions = []
      state.value.categoryFilters = []
      state.value.subcategoryFilters = []
    } finally {
      state.value.loading = false
    }
  }

  /**
   * Fetch unique filter values from published vehicles for dynamic options (desplegable)
   * and compute slider ranges. Called after filter definitions are loaded.
   * Optionally filtered by categoryId to avoid fetching all vehicles.
   */
  async function fetchVehicleFilterValues(filterDefs: AttributeDefinition[], categoryId?: string) {
    const needsValues = filterDefs.filter(
      (f) =>
        (f.type === 'desplegable' || f.type === 'desplegable_tick') &&
        ((f.options as Record<string, unknown>)?.choices_source === 'auto' ||
          (f.options as Record<string, unknown>)?.choices_source === 'both'),
    )
    const needsRange = filterDefs.filter((f) => f.type === 'slider')

    if (!needsValues.length && !needsRange.length) return

    // Fetch published vehicles' attributes_json, filtered by category and vertical
    let query = supabase
      .from('vehicles')
      .select('attributes_json')
      .eq('status', 'published')
      .eq('vertical', getVerticalSlug())
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }
    const { data, error: vehicleErr } = await query

    if (vehicleErr) throw vehicleErr
    if (!data) return

    const vehicles = data as { attributes_json: Record<string, unknown> | null }[]

    // Extract unique values for desplegable filters
    for (const filter of needsValues) {
      const valuesSet = new Set<string>()
      for (const v of vehicles) {
        if (!v.attributes_json) continue
        const val = v.attributes_json[filter.id] ?? v.attributes_json[filter.name]
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
        if (!v.attributes_json) continue
        const val = v.attributes_json[filter.id] ?? v.attributes_json[filter.name]
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
  function getFilterOptions(filter: AttributeDefinition): string[] {
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
  function getSliderRange(filter: AttributeDefinition): SliderRange {
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
    state.value.categoryFilters = []
    state.value.subcategoryFilters = []
    state.value.activeFilters = {}
    state.value.error = null
  }

  return {
    definitions: computed(() => state.value.definitions),
    categoryFilters: computed(() => state.value.categoryFilters),
    subcategoryFilters: computed(() => state.value.subcategoryFilters),
    visibleFilters,
    activeFilters: computed(() => state.value.activeFilters),
    loading: computed(() => state.value.loading),
    error: computed(() => state.value.error),
    vehicleFilterValues: computed(() => state.value.vehicleFilterValues),
    sliderRanges: computed(() => state.value.sliderRanges),
    fetchBySubcategory,
    fetchByCategoryAndSubcategory,
    getFilterOptions,
    getSliderRange,
    setFilter,
    clearFilter,
    clearAll,
    reset,
  }
}
