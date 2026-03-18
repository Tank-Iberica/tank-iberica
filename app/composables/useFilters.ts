import { computed } from 'vue'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useSupabaseClient, useState } from '#imports'
import type { VehicleAttrs } from './shared/filtersTypes'
import {
  extractFilterValues,
  computeSliderRanges,
  needsDynamicValues,
  getFilterOptions,
  computeVisibleFilters,
} from './shared/filtersHelpers'
export type {
  AttributeDefinition,
  ActiveFilters,
  SliderRange,
  FiltersState,
} from './shared/filtersTypes'

// ── Default state ─────────────────────────────────────────────────────────────

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

// ── Supabase queries ──────────────────────────────────────────────────────────

async function querySubcategoryFilters(
  supabase: SupabaseClient,
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
    .select(
      'id, subcategory_id, name, type, label_es, label_en, unit, options, is_extra, is_hidden, status, sort_order',
    )
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
  supabase: SupabaseClient,
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
  supabase: SupabaseClient,
  filterIds: string[],
): Promise<AttributeDefinition[]> {
  if (filterIds.length === 0) return []

  const { data: filterData, error: filterErr } = await supabase
    .from('attributes')
    .select(
      'id, subcategory_id, name, type, label_es, label_en, unit, options, is_extra, is_hidden, status, sort_order',
    )
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
  supabase: SupabaseClient,
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

// ── Composable ────────────────────────────────────────────────────────────────

/** Composable for filters. */
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
        .select(
          'id, subcategory_id, name, type, label_es, label_en, unit, options, is_extra, is_hidden, status, sort_order',
        )
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
