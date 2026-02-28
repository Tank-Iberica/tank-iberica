import { computed, inject, readonly } from 'vue'
import { useState } from '#imports'
import type { VehicleFilters } from './useVehicles'
import type { LocationLevel } from '~/utils/geoData'
import { getCountriesForLevel, getRegionsForLevel } from '~/utils/geoData'

export type VehicleAction = 'alquiler' | 'venta' | 'terceros'

export type SortOption =
  | 'recommended'
  | 'price_asc'
  | 'price_desc'
  | 'year_asc'
  | 'year_desc'
  | 'brand_az'
  | 'brand_za'
export type ViewMode = 'grid' | 'list'

export interface CatalogState {
  activeAction: VehicleAction | null
  activeActions: VehicleAction[]
  // Category: parent level (e.g., "Semirremolques", "Cabezas Tractoras")
  activeCategoryId: string | null
  activeCategorySlug: string | null
  // Subcategory: child level within category (e.g., "Cisternas", "Frigoríficos")
  activeSubcategoryId: string | null
  activeSubcategorySlug: string | null
  filters: VehicleFilters
  scrollPosition: number
  searchQuery: string
  sortBy: SortOption
  viewMode: ViewMode
  locationLevel: LocationLevel | null
}

const defaultState: CatalogState = {
  activeAction: null,
  activeActions: ['alquiler'],
  activeCategoryId: null,
  activeCategorySlug: null,
  activeSubcategoryId: null,
  activeSubcategorySlug: null,
  filters: {},
  scrollPosition: 0,
  searchQuery: '',
  sortBy: 'recommended',
  viewMode: 'grid',
  locationLevel: null,
}

export function useCatalogState() {
  const scope = inject<string>('catalogScope', 'global')
  const state = useState<CatalogState>(`catalog-${scope}`, () => ({ ...defaultState }))

  function setAction(action: VehicleAction | null) {
    state.value.activeAction = action
    state.value.activeCategoryId = null
    state.value.activeCategorySlug = null
    state.value.activeSubcategoryId = null
    state.value.activeSubcategorySlug = null
    state.value.filters = action ? { action } : {}
  }

  function setActions(actions: VehicleAction[]) {
    state.value.activeActions = actions
    state.value.activeAction = actions[0] || null
    state.value.activeCategoryId = null
    state.value.activeCategorySlug = null
    state.value.activeSubcategoryId = null
    state.value.activeSubcategorySlug = null
    state.value.filters = actions.length ? { actions } : {}
  }

  /**
   * Set the active category (parent level).
   * Clears any selected subcategory when category changes.
   */
  function setCategory(id: string | null, slug: string | null) {
    state.value.activeCategoryId = id
    state.value.activeCategorySlug = slug
    // Clear subcategory selection when category changes
    state.value.activeSubcategoryId = null
    state.value.activeSubcategorySlug = null
    // Update filters - category filters will be handled in useFilters
    const { subcategory_id: _sid, ...restFilters } = state.value.filters
    state.value.filters = {
      ...restFilters,
      category_id: id || undefined,
    }
  }

  /**
   * Set the active subcategory (child level within category).
   * Vehicles are filtered by subcategory_id.
   */
  function setSubcategory(id: string | null, slug: string | null) {
    state.value.activeSubcategoryId = id
    state.value.activeSubcategorySlug = slug
    state.value.filters = {
      ...state.value.filters,
      subcategory_id: id || undefined,
    }
  }

  function updateFilters(filters: Partial<VehicleFilters>) {
    state.value.filters = { ...state.value.filters, ...filters }
  }

  function setSearch(query: string) {
    state.value.searchQuery = query
    state.value.filters = { ...state.value.filters, search: query || undefined }
  }

  function setSort(sort: SortOption) {
    state.value.sortBy = sort
  }

  function setViewMode(mode: ViewMode) {
    state.value.viewMode = mode
  }

  function saveScrollPosition(position: number) {
    state.value.scrollPosition = position
  }

  function setLocationLevel(
    level: LocationLevel | null,
    userCountry: string | null,
    userProvince: string | null,
    userRegion: string | null,
  ) {
    state.value.locationLevel = level

    // Clear previous location filters
    const {
      location_countries: _lc,
      location_regions: _lr,
      location_province_eq: _lp,
      ...rest
    } = state.value.filters

    if (!level || level === 'mundo') {
      state.value.filters = rest
      return
    }

    // For provincia level: filter by province directly
    if (level === 'provincia' && userProvince) {
      state.value.filters = { ...rest, location_province_eq: userProvince }
      return
    }

    // For comunidad/limitrofes: filter by regions
    const regions = getRegionsForLevel(level, userRegion)
    if (regions) {
      state.value.filters = { ...rest, location_regions: regions }
      return
    }

    // For nacional/suroeste_europeo/union_europea/europa: filter by countries
    const countries = getCountriesForLevel(level, userCountry)
    if (countries) {
      state.value.filters = { ...rest, location_countries: countries }
      return
    }

    state.value.filters = rest
  }

  function resetCatalog() {
    state.value = { ...defaultState }
  }

  return {
    state: readonly(state),
    activeAction: computed(() => state.value.activeAction),
    activeActions: computed(() => state.value.activeActions),
    activeCategoryId: computed(() => state.value.activeCategoryId),
    activeCategorySlug: computed(() => state.value.activeCategorySlug),
    activeSubcategoryId: computed(() => state.value.activeSubcategoryId),
    activeSubcategorySlug: computed(() => state.value.activeSubcategorySlug),
    filters: computed(() => state.value.filters),
    scrollPosition: computed(() => state.value.scrollPosition),
    searchQuery: computed(() => state.value.searchQuery),
    sortBy: computed(() => state.value.sortBy),
    viewMode: computed(() => state.value.viewMode),
    locationLevel: computed(() => state.value.locationLevel),
    setAction,
    setActions,
    setCategory,
    setSubcategory,
    updateFilters,
    setSearch,
    setSort,
    setViewMode,
    setLocationLevel,
    saveScrollPosition,
    resetCatalog,
  }
}
