/**
 * Tests for app/components/catalog/ControlsBar.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { ref, computed, Ref } from 'vue'

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
}

beforeAll(() => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('onMounted', (fn: Function) => fn())
  vi.stubGlobal('onUnmounted', vi.fn())
  vi.stubGlobal('nextTick', () => Promise.resolve())
  vi.stubGlobal('toRaw', (v: unknown) => v)
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

  it('renders three category action buttons', () => {
    const w = factory()
    const btns = w.findAll('.category-btn')
    expect(btns).toHaveLength(3)
  })

  it('toggles action button active state on click', async () => {
    const w = factory()
    const btns = w.findAll('.category-btn')
    await btns[0].trigger('click') // alquiler
    expect(w.emitted('categoryChange')).toBeTruthy()
  })

  it('calls setActions and emits categoryChange on category click', async () => {
    const w = factory()
    const btns = w.findAll('.category-btn')
    await btns[0].trigger('click')
    expect(mockSetActions).toHaveBeenCalled()
    expect(w.emitted('categoryChange')).toBeTruthy()
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

  it('renders view switcher with grid and list buttons', () => {
    const w = factory()
    const viewBtns = w.findAll('.view-btn')
    expect(viewBtns).toHaveLength(2)
  })

  it('sets grid view active by default', () => {
    const w = factory()
    const viewBtns = w.findAll('.view-btn')
    expect(viewBtns[0].classes()).toContain('active')
    expect(viewBtns[1].classes()).not.toContain('active')
  })

  it('emits viewChange on list button click', async () => {
    const w = factory()
    const viewBtns = w.findAll('.view-btn')
    await viewBtns[1].trigger('click')
    expect(mockSetViewMode).toHaveBeenCalledWith('list')
    expect(w.emitted('viewChange')).toEqual([['list']])
  })

  it('emits viewChange on grid button click', async () => {
    catalogState.viewMode.value = 'list' as 'grid' | 'list'
    const w = factory()
    const viewBtns = w.findAll('.view-btn')
    await viewBtns[0].trigger('click')
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
    expect(w.find('.save-search-btn').exists()).toBe(true)
  })

  it('emits saveSearchAuth when unauthenticated user clicks save', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const w = factory()
    await w.find('.save-search-btn').trigger('click')
    expect(w.emitted('saveSearchAuth')).toHaveLength(1)
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
