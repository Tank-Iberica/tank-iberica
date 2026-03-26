/**
 * Tests for app/components/catalog/ControlsBar.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { ref, computed, readonly, watch, Ref } from 'vue'

vi.mock('~/composables/catalog/useSavedSearches', () => ({
  useSavedSearches: () => ({
    searches: readonly(ref([])),
    loading: readonly(ref(false)),
    requiresAuth: computed(() => false),
    hasSearches: computed(() => false),
    canSave: computed(() => true),
    isFeatureUnlocked: computed(() => false),
    load: vi.fn(),
    save: vi.fn().mockResolvedValue({ success: true }),
    update: vi.fn().mockResolvedValue({ success: true }),
    bumpUsage: vi.fn(),
    toggleFavorite: vi.fn(),
    remove: vi.fn(),
  }),
}))

const mockSetSearch = vi.fn()
const mockSetSort = vi.fn()
const mockSetViewMode = vi.fn()
const mockSetActions = vi.fn()
const mockToggleFav = vi.fn()

const catalogState = {
  searchQuery: ref(''),
  setSearch: mockSetSearch,
  sortBy: ref('recommended'),
  viewMode: ref('grid') as Ref<'grid' | 'list'>,
  setSort: mockSetSort,
  setViewMode: mockSetViewMode,
  setActions: mockSetActions,
  filters: ref({}),
  locationLevel: ref(''),
  activeActions: ref(['venta', 'lotes', 'alquiler', 'subasta']),
}

beforeAll(() => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('onMounted', (fn: Function) => fn())
  vi.stubGlobal('onUnmounted', vi.fn())
  vi.stubGlobal('nextTick', () => Promise.resolve())
  vi.stubGlobal('toRaw', (v: unknown) => v)
  vi.stubGlobal('inject', () => undefined)
  vi.stubGlobal('readonly', readonly)
  vi.stubGlobal('useState', (_key: string, init?: () => unknown) => ref(init ? init() : undefined))
  vi.stubGlobal('useFetch', () => ({ data: ref(null), pending: ref(false), error: ref(null) }))
  vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({}))
  vi.stubGlobal('useFeatureUnlocks', () => ({
    unlocks: readonly(ref({})),
    loading: readonly(ref(false)),
    fetchStatus: vi.fn(),
    unlock: vi.fn().mockResolvedValue({ success: false }),
    isUnlocked: () => false,
  }))
  vi.stubGlobal('watch', watch)
  vi.stubGlobal('useFilters', () => ({
    activeFilters: computed(() => ({})),
    definitions: computed(() => []),
    loading: computed(() => false),
    error: computed(() => null),
  }))
  vi.stubGlobal('usePerfilAlertas', () => ({
    canCreate: computed(() => false),
    alerts: ref([]),
    loading: ref(false),
    loadAlerts: vi.fn(),
  }))
  vi.stubGlobal('useCatalogState', () => catalogState)
  vi.stubGlobal('useFavorites', () => ({
    favoritesOnly: { value: false },
    toggleFilter: mockToggleFav,
  }))
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }))
  vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
})

import ControlsBar from '../../../app/components/catalog/ControlsBar.vue'

const factory = (props = {}) =>
  shallowMount(ControlsBar, {
    props: { vehicleCount: 10, favCount: 2, menuVisible: false, ...props },
    global: { mocks: { $t: (key: string) => key } },
  })

describe('ControlsBar', () => {
  it('renders catalog controls section', () => {
    const w = factory()
    expect(w.find('.catalog-controls').exists()).toBe(true)
  })

  it('renders menu toggle button', () => {
    const w = factory()
    expect(w.find('.menu-toggle-btn').exists()).toBe(true)
  })

  it('applies menu-visible class when menuVisible is true', () => {
    const w = factory({ menuVisible: true })
    expect(w.find('.menu-toggle-btn').classes()).toContain('menu-visible')
  })

  it('emits toggleMenu on menu button click', async () => {
    const w = factory()
    await w.find('.menu-toggle-btn').trigger('click')
    expect(w.emitted('toggleMenu')).toHaveLength(1)
  })

  // Category action buttons moved to CategoryBar.vue — tested there
  it('does not render category buttons (delegated to CategoryBar)', () => {
    const w = factory()
    expect(w.findAll('.category-btn')).toHaveLength(0)
  })

  it('renders favorites button', () => {
    const w = factory()
    expect(w.find('.favorites-btn').exists()).toBe(true)
  })

  it('emits openFavorites and calls toggleFilter on favorites click', async () => {
    const w = factory()
    await w.find('.favorites-btn').trigger('click')
    expect(mockToggleFav).toHaveBeenCalled()
    expect(w.emitted('openFavorites')).toHaveLength(1)
  })

  it('applies active class to favorites when favoritesOnly is true', () => {
    vi.stubGlobal('useFavorites', () => ({
      favoritesOnly: { value: true },
      toggleFilter: mockToggleFav,
    }))
    const w = factory()
    expect(w.find('.favorites-btn').classes()).toContain('active')
    // restore
    vi.stubGlobal('useFavorites', () => ({
      favoritesOnly: { value: false },
      toggleFilter: mockToggleFav,
    }))
  })

  it('renders view switcher with compact, grid and list buttons', () => {
    const w = factory()
    const viewBtns = w.findAll('.view-btn')
    expect(viewBtns).toHaveLength(3)
  })

  it('sets grid view active by default', () => {
    const w = factory()
    const viewBtns = w.findAll('.view-btn')
    // compact=0, grid=1, list=2
    expect(viewBtns[1].classes()).toContain('active')
  })

  it('emits viewChange on list button click', async () => {
    const w = factory()
    const viewBtns = w.findAll('.view-btn')
    await viewBtns[2].trigger('click')
    expect(mockSetViewMode).toHaveBeenCalledWith('list')
    expect(w.emitted('viewChange')).toEqual([['list']])
  })

  it('emits viewChange on grid button click', async () => {
    catalogState.viewMode.value = 'list' as 'grid' | 'list'
    const w = factory()
    const viewBtns = w.findAll('.view-btn')
    await viewBtns[1].trigger('click')
    expect(w.emitted('viewChange')).toEqual([['grid']])
    catalogState.viewMode.value = 'grid'
  })

  it('renders sort button', () => {
    const w = factory()
    expect(w.find('.sort-btn').exists()).toBe(true)
  })

  it('opens sort dropdown on sort button click', async () => {
    const w = factory()
    await w.find('.sort-btn').trigger('click')
    expect(w.find('.sort-dropdown').isVisible()).toBe(true)
  })

  it('selects sort option and emits sort event', async () => {
    const w = factory()
    await w.find('.sort-btn').trigger('click')
    const options = w.findAll('.sort-option')
    await options[1].trigger('click') // price_asc
    expect(mockSetSort).toHaveBeenCalledWith('price_asc')
    expect(w.emitted('sort')).toEqual([['price_asc']])
  })

  it('renders all 7 sort options', async () => {
    const w = factory()
    await w.find('.sort-btn').trigger('click')
    expect(w.findAll('.sort-option')).toHaveLength(7)
  })

  it('renders save search button', () => {
    const w = factory()
    expect(w.find('.action-btn--save').exists()).toBe(true)
  })

  it('toggles save menu on save button click', async () => {
    const w = factory()
    await w.find('.action-btn--save').trigger('click')
    expect(w.find('.save-preset-wrapper').exists()).toBe(true)
    vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
  })

  it('renders search input on desktop', () => {
    const w = factory()
    expect(w.find('.desktop-search .search-input').exists()).toBe(true)
  })

  it('renders clear button element in desktop search', () => {
    catalogState.searchQuery.value = ''
    const w = factory()
    expect(w.find('.search-clear-btn').exists()).toBe(true)
  })

  it('renders mobile search button', () => {
    const w = factory()
    expect(w.find('.search-btn-icon').exists()).toBe(true)
  })
})
