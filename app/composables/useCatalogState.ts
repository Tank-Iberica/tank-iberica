import { computed, readonly } from 'vue'
import { useState } from '#imports'
import type { VehicleFilters } from './useVehicles'
import type { LocationLevel } from '~/utils/geoData'
import { getCountriesForLevel, getRegionsForLevel } from '~/utils/geoData'

export type VehicleCategory = 'alquiler' | 'venta' | 'terceros'

export type SortOption = 'recommended' | 'price_asc' | 'price_desc' | 'year_asc' | 'year_desc' | 'brand_az' | 'brand_za'
export type ViewMode = 'grid' | 'list'

export interface CatalogState {
  activeCategory: VehicleCategory | null
  activeCategories: VehicleCategory[]
  // Subcategory: parent level (e.g., "Semirremolques", "Cabezas Tractoras")
  activeSubcategoryId: string | null
  activeSubcategorySlug: string | null
  // Type: child level within subcategory (e.g., "Cisternas", "Frigoríficos")
  activeTypeId: string | null
  activeTypeSlug: string | null
  filters: VehicleFilters
  scrollPosition: number
  searchQuery: string
  sortBy: SortOption
  viewMode: ViewMode
  locationLevel: LocationLevel | null
}

const defaultState: CatalogState = {
  activeCategory: null,
  activeCategories: ['alquiler'],
  activeSubcategoryId: null,
  activeSubcategorySlug: null,
  activeTypeId: null,
  activeTypeSlug: null,
  filters: {},
  scrollPosition: 0,
  searchQuery: '',
  sortBy: 'recommended',
  viewMode: 'grid',
  locationLevel: null,
}

export function useCatalogState() {
  const state = useState<CatalogState>('catalog', () => ({ ...defaultState }))

  function setCategory(category: VehicleCategory | null) {
    state.value.activeCategory = category
    state.value.activeSubcategoryId = null
    state.value.activeSubcategorySlug = null
    state.value.activeTypeId = null
    state.value.activeTypeSlug = null
    state.value.filters = category ? { category } : {}
  }

  function setCategories(categories: VehicleCategory[]) {
    state.value.activeCategories = categories
    state.value.activeCategory = categories[0] || null
    state.value.activeSubcategoryId = null
    state.value.activeSubcategorySlug = null
    state.value.activeTypeId = null
    state.value.activeTypeSlug = null
    state.value.filters = categories.length ? { categories } : {}
  }

  /**
   * Set the active subcategory (parent level).
   * Clears any selected type when subcategory changes.
   */
  function setSubcategory(id: string | null, slug: string | null) {
    state.value.activeSubcategoryId = id
    state.value.activeSubcategorySlug = slug
    // Clear type selection when subcategory changes
    state.value.activeTypeId = null
    state.value.activeTypeSlug = null
    // Update filters - subcategory filters will be handled in useFilters
    const { type_id: _tid, ...restFilters } = state.value.filters
    state.value.filters = {
      ...restFilters,
      subcategory_id: id || undefined,
    }
  }

  /**
   * Set the active type (child level within subcategory).
   * Vehicles are filtered by type_id.
   */
  function setType(id: string | null, slug: string | null) {
    state.value.activeTypeId = id
    state.value.activeTypeSlug = slug
    state.value.filters = {
      ...state.value.filters,
      type_id: id || undefined,
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
    const { location_countries: _lc, location_regions: _lr, location_province_eq: _lp, ...rest } = state.value.filters

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
    activeCategory: computed(() => state.value.activeCategory),
    activeCategories: computed(() => state.value.activeCategories),
    activeSubcategoryId: computed(() => state.value.activeSubcategoryId),
    activeSubcategorySlug: computed(() => state.value.activeSubcategorySlug),
    activeTypeId: computed(() => state.value.activeTypeId),
    activeTypeSlug: computed(() => state.value.activeTypeSlug),
    filters: computed(() => state.value.filters),
    scrollPosition: computed(() => state.value.scrollPosition),
    searchQuery: computed(() => state.value.searchQuery),
    sortBy: computed(() => state.value.sortBy),
    viewMode: computed(() => state.value.viewMode),
    locationLevel: computed(() => state.value.locationLevel),
    setCategory,
    setCategories,
    setSubcategory,
    setType,
    updateFilters,
    setSearch,
    setSort,
    setViewMode,
    setLocationLevel,
    saveScrollPosition,
    resetCatalog,
  }
}
