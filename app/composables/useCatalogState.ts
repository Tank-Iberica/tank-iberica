import { computed, readonly } from 'vue'
import { useState } from '#imports'
import type { VehicleFilters } from './useVehicles'

export type VehicleCategory = 'alquiler' | 'venta' | 'terceros'

export interface CatalogState {
  activeCategory: VehicleCategory | null
  activeCategories: VehicleCategory[]
  activeSubcategoryId: string | null
  activeSubcategorySlug: string | null
  filters: VehicleFilters
  scrollPosition: number
  searchQuery: string
}

const defaultState: CatalogState = {
  activeCategory: null,
  activeCategories: ['alquiler'],
  activeSubcategoryId: null,
  activeSubcategorySlug: null,
  filters: {},
  scrollPosition: 0,
  searchQuery: '',
}

export function useCatalogState() {
  const state = useState<CatalogState>('catalog', () => ({ ...defaultState }))

  function setCategory(category: VehicleCategory | null) {
    state.value.activeCategory = category
    state.value.activeSubcategoryId = null
    state.value.activeSubcategorySlug = null
    state.value.filters = category ? { category } : {}
  }

  function setCategories(categories: VehicleCategory[]) {
    state.value.activeCategories = categories
    state.value.activeCategory = categories[0] || null
    state.value.activeSubcategoryId = null
    state.value.activeSubcategorySlug = null
    state.value.filters = categories.length ? { category: categories[0] } : {}
  }

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

  function saveScrollPosition(position: number) {
    state.value.scrollPosition = position
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
    filters: computed(() => state.value.filters),
    scrollPosition: computed(() => state.value.scrollPosition),
    searchQuery: computed(() => state.value.searchQuery),
    setCategory,
    setCategories,
    setSubcategory,
    updateFilters,
    setSearch,
    saveScrollPosition,
    resetCatalog,
  }
}
