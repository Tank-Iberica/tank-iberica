import { describe, it, expect, beforeEach, vi } from 'vitest'

import { useCatalogState } from '../../app/composables/useCatalogState'

// Mock 'vue' so the composable's `import { computed, inject, readonly } from 'vue'` works
vi.mock('vue', () => ({
  computed: (fn: () => unknown) => ({ value: fn() }),
  inject: (_key: unknown, defaultVal?: unknown) => defaultVal,
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

  // ─── setActions ──────────────────────────────────────────────────────────

  it('setActions sets activeActions and first action as activeAction', () => {
    const catalog = useCatalogState()
    catalog.setActions(['venta', 'alquiler'])

    const fresh = useCatalogState()
    expect(fresh.activeActions.value).toEqual(['venta', 'alquiler'])
    expect(fresh.activeAction.value).toBe('venta')
    expect(fresh.filters.value).toEqual({ actions: ['venta', 'alquiler'] })
  })

  it('setActions with empty array clears activeAction and filters', () => {
    const catalog = useCatalogState()
    catalog.setActions(['venta'])
    catalog.setActions([])

    const fresh = useCatalogState()
    expect(fresh.activeAction.value).toBeNull()
    expect(fresh.filters.value).toEqual({})
  })

  it('setActions preserves category and subcategory', () => {
    const catalog = useCatalogState()
    catalog.setCategory('cat-1', 'semirremolques')
    catalog.setSubcategory('sub-1', 'cisternas')
    catalog.setActions(['terceros'])

    const fresh = useCatalogState()
    // setActions no longer clears category/subcategory
    expect(fresh.activeCategoryId.value).toBe('cat-1')
    expect(fresh.activeCategorySlug.value).toBe('semirremolques')
    expect(fresh.activeSubcategoryId.value).toBe('sub-1')
    expect(fresh.activeSubcategorySlug.value).toBe('cisternas')
  })

  // ─── setSubcategory ──────────────────────────────────────────────────────

  it('setSubcategory(null, null) clears subcategory_id from filters', () => {
    const catalog = useCatalogState()
    catalog.setSubcategory('sub-1', 'cisternas')
    catalog.setSubcategory(null, null)

    const fresh = useCatalogState()
    expect(fresh.activeSubcategoryId.value).toBeNull()
    expect(fresh.activeSubcategorySlug.value).toBeNull()
    expect(fresh.filters.value.subcategory_id).toBeUndefined()
  })

  // ─── setCategory preserves other filters ─────────────────────────────────

  it('setCategory preserves existing action filter', () => {
    const catalog = useCatalogState()
    catalog.setAction('venta')
    catalog.setCategory('cat-1', 'semirremolques')

    const fresh = useCatalogState()
    expect(fresh.filters.value).toEqual({ action: 'venta', category_id: 'cat-1' })
  })

  it('setCategory removes subcategory_id from filters', () => {
    const catalog = useCatalogState()
    catalog.setSubcategory('sub-1', 'cisternas')
    catalog.setCategory('cat-1', 'semirremolques')

    const fresh = useCatalogState()
    // subcategory_id should be removed when category changes
    expect(fresh.filters.value).not.toHaveProperty('subcategory_id')
    expect(fresh.filters.value).toEqual({ category_id: 'cat-1' })
  })

  // ─── saveScrollPosition ──────────────────────────────────────────────────

  it('saveScrollPosition stores the position', () => {
    const catalog = useCatalogState()
    catalog.saveScrollPosition(450)

    const fresh = useCatalogState()
    expect(fresh.scrollPosition.value).toBe(450)
  })

  // ─── setLocationLevel ────────────────────────────────────────────────────

  it('setLocationLevel(null) clears location filters', () => {
    const catalog = useCatalogState()
    catalog.setLocationLevel(null, 'ES', null, null)

    const fresh = useCatalogState()
    expect(fresh.locationLevel.value).toBeNull()
    expect(fresh.filters.value).not.toHaveProperty('location_countries')
    expect(fresh.filters.value).not.toHaveProperty('location_regions')
    expect(fresh.filters.value).not.toHaveProperty('location_province_eq')
  })

  it('setLocationLevel("mundo") clears location filters', () => {
    const catalog = useCatalogState()
    catalog.setLocationLevel('mundo' as any, 'ES', null, null)

    const fresh = useCatalogState()
    expect(fresh.locationLevel.value).toBe('mundo')
    expect(fresh.filters.value).not.toHaveProperty('location_countries')
  })

  it('setLocationLevel("provincia") sets location_province_eq filter', () => {
    const catalog = useCatalogState()
    catalog.setLocationLevel('provincia' as any, 'ES', 'Madrid', 'Comunidad de Madrid')

    const fresh = useCatalogState()
    expect(fresh.locationLevel.value).toBe('provincia')
    expect(fresh.filters.value).toHaveProperty('location_province_eq', 'Madrid')
  })

  it('setLocationLevel("provincia") without province falls through', () => {
    const catalog = useCatalogState()
    catalog.setLocationLevel('provincia' as any, 'ES', null, null)

    const fresh = useCatalogState()
    expect(fresh.locationLevel.value).toBe('provincia')
    // No province → falls through to regions/countries
    expect(fresh.filters.value).not.toHaveProperty('location_province_eq')
  })

  // ─── locationLevel with regions mock ─────────────────────────────────────

  it('setLocationLevel clears previous location filters before setting new ones', () => {
    const catalog = useCatalogState()
    // First set a province filter
    catalog.setLocationLevel('provincia' as any, 'ES', 'Madrid', 'Comunidad de Madrid')
    // Now set mundo — should clear location_province_eq
    catalog.setLocationLevel('mundo' as any, 'ES', 'Madrid', 'Comunidad de Madrid')

    const fresh = useCatalogState()
    expect(fresh.filters.value).not.toHaveProperty('location_province_eq')
    expect(fresh.filters.value).not.toHaveProperty('location_countries')
    expect(fresh.filters.value).not.toHaveProperty('location_regions')
  })

  // ─── activeActions default ────────────────────────────────────────────────

  it('activeActions defaults to ["venta", "lotes", "alquiler", "subasta"]', () => {
    const { activeActions } = useCatalogState()
    expect(activeActions.value).toEqual(['venta', 'lotes', 'alquiler', 'subasta'])
  })

  // ─── resetCatalog restores activeActions default ──────────────────────────

  it('resetCatalog restores activeActions to default', () => {
    const catalog = useCatalogState()
    catalog.setActions(['venta', 'terceros'])
    catalog.resetCatalog()

    const fresh = useCatalogState()
    expect(fresh.activeActions.value).toEqual(['venta', 'lotes', 'alquiler', 'subasta'])
  })
})
