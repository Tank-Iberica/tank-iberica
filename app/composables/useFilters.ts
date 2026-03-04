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
  return min === Infinity ? null : { min, max }
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

async function querySubcategoryFilters(
  supabase: ReturnType<typeof useSupabaseClient>,
  subcategoryId: string,
): Promise<AttributeDefinition[]> {
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

async function queryCategoryFilterIds(
  supabase: ReturnType<typeof useSupabaseClient>,
  categoryId: string,
): Promise<string[]> {
  const { data: catData, error: catErr } = await supabase
    .from('categories')
    .select('applicable_filters')
    .eq('id', categoryId)
    .single()

  if (catErr) throw catErr
  const row = catData as { applicable_filters: string[] | null } | null
  return row?.applicable_filters || []
}

async function queryFilterDefinitions(
  supabase: ReturnType<typeof useSupabaseClient>,
  filterIds: string[],
): Promise<AttributeDefinition[]> {
  if (filterIds.length === 0) return []

  const { data: filterData, error: filterErr } = await supabase
    .from('attributes')
    .select('*')
    .in('id', filterIds)
    .eq('status', 'published')
    .eq('is_hidden', false)
    .order('sort_order', { ascending: true })

  if (filterErr) throw filterErr
  return ((filterData as AttributeDefinition[]) || []).map((f) => ({
    ...f,
    source: 'category' as const,
  }))
}

async function queryVehicleAttributes(
  supabase: ReturnType<typeof useSupabaseClient>,
  categoryId?: string,
): Promise<VehicleAttrs[]> {
  let query = supabase
    .from('vehicles')
    .select('attributes_json')
    .eq('status', 'published')
    .eq('vertical', getVerticalSlug())
  if (categoryId) query = query.eq('category_id', categoryId)

  const { data, error: vehicleErr } = await query
  if (vehicleErr) throw vehicleErr
  return (data as VehicleAttrs[]) || []
}

function needsDynamicValues(f: AttributeDefinition): boolean {
  return (
    (f.type === 'desplegable' || f.type === 'desplegable_tick') &&
    (f.options?.choices_source === 'auto' || f.options?.choices_source === 'both')
  )
}

function getFilterOptions(
  filter: AttributeDefinition,
  vehicleFilterValues: Record<string, string[]>,
): string[] {
  const source = (filter.options?.choices_source as string) || 'manual'
  const manual = (filter.options?.choices as string[]) || []
  if (source === 'manual') return manual
  const auto = vehicleFilterValues[filter.name] || []
  if (source === 'auto') return auto
  return [...new Set([...manual, ...auto])].sort((a, b) => a.localeCompare(b))
}

function computeVisibleFilters(
  definitions: AttributeDefinition[],
  activeFilters: ActiveFilters,
): AttributeDefinition[] {
  const activeTicks = new Set<string>()
  for (const def of definitions) {
    if (def.type === 'tick' && activeFilters[def.name]) activeTicks.add(def.name)
  }
  return definitions.filter((def) => {
    if (isFilterHiddenByTick(def.name, definitions, activeTicks)) return false
    if (def.is_extra) return isExtraFilterVisible(def.name, definitions, activeTicks)
    return true
  })
}

export function useFilters() {
  const supabase = useSupabaseClient()
  const state = useState<FiltersState>('filters', () => ({ ...defaultState }))

  async function loadVehicleFilterValues(filterDefs: AttributeDefinition[], categoryId?: string) {
    const needsValues = filterDefs.filter(needsDynamicValues)
    const needsRange = filterDefs.filter((f) => f.type === 'slider')
    if (!needsValues.length && !needsRange.length) return

    const vehicles = await queryVehicleAttributes(supabase, categoryId)
    Object.assign(state.value.vehicleFilterValues, extractFilterValues(vehicles, needsValues))
    Object.assign(state.value.sliderRanges, computeSliderRanges(vehicles, needsRange))
  }

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
      state.value.subcategoryFilters = ((data as AttributeDefinition[]) || []).map((f) => ({
        ...f,
        source: 'subcategory' as const,
      }))
      state.value.categoryFilters = []
      state.value.definitions = state.value.subcategoryFilters
      await loadVehicleFilterValues(state.value.definitions, subcategoryId)
    } catch (err: unknown) {
      state.value.error = err instanceof Error ? err.message : 'Error fetching filters'
      state.value.definitions = []
      state.value.subcategoryFilters = []
    } finally {
      state.value.loading = false
    }
  }

  async function fetchByCategoryAndSubcategory(
    categoryId: string | null,
    subcategoryId: string | null,
  ) {
    state.value.loading = true
    state.value.error = null
    try {
      const catFilterIds = categoryId ? await queryCategoryFilterIds(supabase, categoryId) : []
      const catFilters = await queryFilterDefinitions(supabase, catFilterIds)
      const subcatFilters = subcategoryId
        ? await querySubcategoryFilters(supabase, subcategoryId)
        : []

      state.value.categoryFilters = catFilters
      state.value.subcategoryFilters = subcatFilters

      const catIds = new Set(catFilters.map((f) => f.id))
      state.value.definitions = [...catFilters, ...subcatFilters.filter((f) => !catIds.has(f.id))]
      await loadVehicleFilterValues(state.value.definitions, categoryId || undefined)
    } catch (err: unknown) {
      state.value.error = err instanceof Error ? err.message : 'Error fetching filters'
      state.value.definitions = []
      state.value.categoryFilters = []
      state.value.subcategoryFilters = []
    } finally {
      state.value.loading = false
    }
  }

  return {
    definitions: computed(() => state.value.definitions),
    categoryFilters: computed(() => state.value.categoryFilters),
    subcategoryFilters: computed(() => state.value.subcategoryFilters),
    visibleFilters: computed(() =>
      computeVisibleFilters(state.value.definitions, state.value.activeFilters),
    ),
    activeFilters: computed(() => state.value.activeFilters),
    loading: computed(() => state.value.loading),
    error: computed(() => state.value.error),
    vehicleFilterValues: computed(() => state.value.vehicleFilterValues),
    sliderRanges: computed(() => state.value.sliderRanges),
    fetchBySubcategory,
    fetchByCategoryAndSubcategory,
    getFilterOptions: (filter: AttributeDefinition) =>
      getFilterOptions(filter, state.value.vehicleFilterValues),
    getSliderRange: (filter: AttributeDefinition): SliderRange =>
      state.value.sliderRanges[filter.name] || { min: 0, max: 100 },
    setFilter: (name: string, value: unknown) => {
      state.value.activeFilters = { ...state.value.activeFilters, [name]: value }
    },
    clearFilter: (name: string) => {
      const { [name]: _, ...rest } = state.value.activeFilters
      state.value.activeFilters = rest
    },
    clearAll: () => {
      state.value.activeFilters = {}
    },
    reset: () => {
      state.value.definitions = []
      state.value.categoryFilters = []
      state.value.subcategoryFilters = []
      state.value.activeFilters = {}
      state.value.error = null
    },
  }
}
