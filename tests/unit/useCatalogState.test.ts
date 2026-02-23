import { describe, it, expect, beforeEach, vi } from 'vitest'

import { useCatalogState } from '../../app/composables/useCatalogState'

// Mock 'vue' so the composable's `import { computed, readonly } from 'vue'` works
vi.mock('vue', () => ({
  computed: (fn: () => unknown) => ({ value: fn() }),
  readonly: (obj: unknown) => obj,
  ref: (val: unknown) => ({ value: val }),
}))

// Mock the geoData utility used by setLocationLevel
vi.mock('~/utils/geoData', () => ({
  getCountriesForLevel: () => null,
  getRegionsForLevel: () => null,
}))

describe('useCatalogState', () => {
  beforeEach(() => {
    // setup.ts clears stateStore in beforeEach, so each test starts fresh
  })

  it('should have initial state with null activeAction and empty filters', () => {
    const { activeAction, filters, viewMode, sortBy, searchQuery } = useCatalogState()

    expect(activeAction.value).toBeNull()
    expect(filters.value).toEqual({})
    expect(viewMode.value).toBe('grid')
    expect(sortBy.value).toBe('recommended')
    expect(searchQuery.value).toBe('')
  })

  it('setAction("venta") sets activeAction and clears category/subcategory', () => {
    const catalog = useCatalogState()

    // First set a category so we can verify it gets cleared
    catalog.setCategory('cat-1', 'semirremolques')
    catalog.setSubcategory('sub-1', 'cisternas')

    // Now set action
    catalog.setAction('venta')

    // Re-read computed values (they re-evaluate on access due to our mock)
    const freshCatalog = useCatalogState()
    expect(freshCatalog.activeAction.value).toBe('venta')
    expect(freshCatalog.activeCategoryId.value).toBeNull()
    expect(freshCatalog.activeCategorySlug.value).toBeNull()
    expect(freshCatalog.activeSubcategoryId.value).toBeNull()
    expect(freshCatalog.activeSubcategorySlug.value).toBeNull()
    expect(freshCatalog.filters.value).toEqual({ action: 'venta' })
  })

  it('setAction(null) resets action and filters', () => {
    const catalog = useCatalogState()
    catalog.setAction('alquiler')
    catalog.setAction(null)

    const fresh = useCatalogState()
    expect(fresh.activeAction.value).toBeNull()
    expect(fresh.filters.value).toEqual({})
  })

  it('setCategory(id, slug) sets both category fields and clears subcategory', () => {
    const catalog = useCatalogState()

    // Set a subcategory first
    catalog.setSubcategory('sub-1', 'cisternas')

    // Now set category
    catalog.setCategory('cat-1', 'semirremolques')

    const fresh = useCatalogState()
    expect(fresh.activeCategoryId.value).toBe('cat-1')
    expect(fresh.activeCategorySlug.value).toBe('semirremolques')
    expect(fresh.activeSubcategoryId.value).toBeNull()
    expect(fresh.activeSubcategorySlug.value).toBeNull()
    expect(fresh.filters.value).toEqual({ category_id: 'cat-1' })
  })

  it('setCategory(null, null) clears category and removes category_id from filters', () => {
    const catalog = useCatalogState()
    catalog.setCategory('cat-1', 'semirremolques')
    catalog.setCategory(null, null)

    const fresh = useCatalogState()
    expect(fresh.activeCategoryId.value).toBeNull()
    expect(fresh.activeCategorySlug.value).toBeNull()
    // category_id should be undefined (falsy id || undefined)
    expect(fresh.filters.value.category_id).toBeUndefined()
  })

  it('setSubcategory(id, slug) sets both subcategory fields', () => {
    const catalog = useCatalogState()
    catalog.setSubcategory('sub-1', 'cisternas')

    const fresh = useCatalogState()
    expect(fresh.activeSubcategoryId.value).toBe('sub-1')
    expect(fresh.activeSubcategorySlug.value).toBe('cisternas')
    expect(fresh.filters.value).toEqual({ subcategory_id: 'sub-1' })
  })

  it('setSearch("query") updates searchQuery and filters', () => {
    const catalog = useCatalogState()
    catalog.setSearch('volvo')

    const fresh = useCatalogState()
    expect(fresh.searchQuery.value).toBe('volvo')
    expect(fresh.filters.value).toEqual({ search: 'volvo' })
  })

  it('setSearch("") clears search from filters', () => {
    const catalog = useCatalogState()
    catalog.setSearch('volvo')
    catalog.setSearch('')

    const fresh = useCatalogState()
    expect(fresh.searchQuery.value).toBe('')
    // Empty string becomes undefined via `query || undefined`
    expect(fresh.filters.value.search).toBeUndefined()
  })

  it('setSort("price_asc") updates sortBy', () => {
    const catalog = useCatalogState()
    catalog.setSort('price_asc')

    const fresh = useCatalogState()
    expect(fresh.sortBy.value).toBe('price_asc')
  })

  it('setViewMode("list") updates viewMode', () => {
    const catalog = useCatalogState()
    catalog.setViewMode('list')

    const fresh = useCatalogState()
    expect(fresh.viewMode.value).toBe('list')
  })

  it('resetCatalog() restores default state', () => {
    const catalog = useCatalogState()

    // Mutate state in several ways
    catalog.setAction('venta')
    catalog.setCategory('cat-1', 'semirremolques')
    catalog.setSearch('volvo')
    catalog.setSort('price_desc')
    catalog.setViewMode('list')

    // Reset
    catalog.resetCatalog()

    const fresh = useCatalogState()
    expect(fresh.activeAction.value).toBeNull()
    expect(fresh.activeCategoryId.value).toBeNull()
    expect(fresh.activeCategorySlug.value).toBeNull()
    expect(fresh.activeSubcategoryId.value).toBeNull()
    expect(fresh.activeSubcategorySlug.value).toBeNull()
    expect(fresh.filters.value).toEqual({})
    expect(fresh.searchQuery.value).toBe('')
    expect(fresh.sortBy.value).toBe('recommended')
    expect(fresh.viewMode.value).toBe('grid')
  })

  it('updateFilters({ price_min: 5000 }) merges into existing filters', () => {
    const catalog = useCatalogState()

    // Set initial filter via action
    catalog.setAction('venta')
    // Now merge additional filters
    catalog.updateFilters({ price_min: 5000 })

    const fresh = useCatalogState()
    expect(fresh.filters.value).toEqual({ action: 'venta', price_min: 5000 })
  })

  it('updateFilters merges multiple times without losing previous values', () => {
    const catalog = useCatalogState()

    catalog.updateFilters({ price_min: 5000 })
    catalog.updateFilters({ price_max: 20000 })
    catalog.updateFilters({ brand: 'Volvo' })

    const fresh = useCatalogState()
    expect(fresh.filters.value).toEqual({
      price_min: 5000,
      price_max: 20000,
      brand: 'Volvo',
    })
  })
})
