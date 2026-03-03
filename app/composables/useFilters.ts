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

type VehicleAttrs = { attributes_json: Record<string, unknown> | null }

function getAttrValue(v: VehicleAttrs, filter: AttributeDefinition): unknown {
  return v.attributes_json?.[filter.id] ?? v.attributes_json?.[filter.name]
}

function isValidAttrValue(val: unknown): boolean {
  return val !== null && val !== undefined && val !== ''
}

function extractFilterValues(
  vehicles: VehicleAttrs[],
  needsValues: AttributeDefinition[],
): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  for (const filter of needsValues) {
    const valuesSet = new Set<string>()
    for (const v of vehicles) {
      const val = getAttrValue(v, filter)
      if (isValidAttrValue(val)) valuesSet.add(String(val))
    }
    result[filter.name] = Array.from(valuesSet).sort((a, b) => a.localeCompare(b))
  }
  return result
}

function computeRangeForFilter(
  vehicles: VehicleAttrs[],
  filter: AttributeDefinition,
): SliderRange | null {
  let min = Infinity
  let max = -Infinity
  for (const v of vehicles) {
    const val = getAttrValue(v, filter)
    if (!isValidAttrValue(val)) continue
    const num = Number(val)
    if (Number.isNaN(num)) continue
    if (num < min) min = num
    if (num > max) max = num
  }
  return min !== Infinity ? { min, max } : null
}

function computeSliderRanges(
  vehicles: VehicleAttrs[],
  needsRange: AttributeDefinition[],
): Record<string, SliderRange> {
  const result: Record<string, SliderRange> = {}
  for (const filter of needsRange) {
    const range = computeRangeForFilter(vehicles, filter)
    if (range) result[filter.name] = range
  }
  return result
}

function isFilterHiddenByTick(
  filterName: string,
  definitions: AttributeDefinition[],
  activeTicks: Set<string>,
): boolean {
  for (const tickDef of definitions) {
    if (tickDef.type !== 'tick') continue
    if (!activeTicks.has(tickDef.name)) continue
    const hides = (tickDef.options?.hides as string[]) || []
    if (hides.includes(filterName)) return true
  }
  return false
}

function isExtraFilterVisible(
  filterName: string,
  definitions: AttributeDefinition[],
  activeTicks: Set<string>,
): boolean {
  for (const tickDef of definitions) {
    if (tickDef.type !== 'tick') continue
    const extras = (tickDef.options?.extra_filters as string[]) || []
    if (extras.includes(filterName)) return activeTicks.has(tickDef.name)
  }
  return false
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

  async function fetchSubcategoryFilters(subcategoryId: string): Promise<AttributeDefinition[]> {
    const { data: subcatData, error: subcatErr } = await supabase
      .from('subcategories')
      .select('applicable_filters')
      .eq('id', subcategoryId)
      .single()

    if (subcatErr) throw subcatErr
    const subcatRow = subcatData as { applicable_filters: string[] | null } | null
    const subcatFilterIds = subcatRow?.applicable_filters || []

    if (subcatFilterIds.length === 0) return []

    const { data: subcatFilterData, error: subcatFilterErr } = await supabase
      .from('attributes')
      .select('*')
      .in('id', subcatFilterIds)
      .eq('status', 'published')
      .eq('is_hidden', false)
      .order('sort_order', { ascending: true })

    if (subcatFilterErr) throw subcatFilterErr
    return ((subcatFilterData as AttributeDefinition[]) || []).map((f) => ({
      ...f,
      source: 'subcategory' as const,
    }))
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
      const subcatFiltersList = subcategoryId ? await fetchSubcategoryFilters(subcategoryId) : []

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
        (f.options?.choices_source === 'auto' || f.options?.choices_source === 'both'),
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

    const vehicles = data as VehicleAttrs[]

    Object.assign(state.value.vehicleFilterValues, extractFilterValues(vehicles, needsValues))
    Object.assign(state.value.sliderRanges, computeSliderRanges(vehicles, needsRange))
  }

  /**
   * Get merged options for a desplegable filter (manual choices + auto values)
   */
  function getFilterOptions(filter: AttributeDefinition): string[] {
    const opts = filter.options
    const source = (opts?.choices_source as string) || 'manual'
    const manual = (opts?.choices as string[]) || []
    const auto = state.value.vehicleFilterValues[filter.name] || []

    if (source === 'manual') return manual
    if (source === 'auto') return auto
    // 'both': merge and deduplicate
    return [...new Set([...manual, ...auto])].sort((a, b) => a.localeCompare(b))
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
      if (def.type === 'tick' && state.value.activeFilters[def.name]) activeTicks.add(def.name)
    }

    return state.value.definitions.filter((def) => {
      if (isFilterHiddenByTick(def.name, state.value.definitions, activeTicks)) return false
      if (def.is_extra) return isExtraFilterVisible(def.name, state.value.definitions, activeTicks)
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
