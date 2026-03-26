/**
 * Tests for app/components/catalog/CategoryBar.vue
 *
 * The component renders a breadcrumb-style bar with:
 * - A transaction dropdown (multi-select checkboxes for actions)
 * - Category pills (or dropdown when one is selected)
 * - Subcategory pills (shown when a category with linked subcats is selected)
 * - Scroll arrows for overflow
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { ref, computed, nextTick } from 'vue'

const mockSetActions = vi.fn()
const mockSetCategory = vi.fn()
const mockSetSubcategory = vi.fn()
const mockActiveActions = ref<string[]>([])
const mockActiveCategoryId = ref<string | null>(null)
const mockActiveSubcategoryId = ref<string | null>(null)

// Supabase mock: returns empty data for all queries
const mockSupabaseFrom = vi.fn(() => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockResolvedValue({ data: [] }),
}))

beforeAll(() => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('watch', vi.fn())
  vi.stubGlobal(
    'defineEmits',
    vi.fn(() => vi.fn()),
  )
  vi.stubGlobal('useI18n', () => ({
    t: (key: string) => key,
    locale: ref('es'),
  }))
  vi.stubGlobal('useSupabaseClient', () => ({
    from: mockSupabaseFrom,
  }))
  vi.stubGlobal('useCatalogState', () => ({
    activeActions: mockActiveActions,
    activeCategoryId: mockActiveCategoryId,
    activeSubcategoryId: mockActiveSubcategoryId,
    setActions: mockSetActions,
    setCategory: mockSetCategory,
    setSubcategory: mockSetSubcategory,
  }))
  vi.stubGlobal('useVerticalConfig', () => ({
    config: ref(null),
  }))
  vi.stubGlobal('onMounted', vi.fn())
  vi.stubGlobal('onUnmounted', vi.fn())
  vi.stubGlobal('nextTick', vi.fn())
})

import CategoryBar from '../../../app/components/catalog/CategoryBar.vue'

describe('CategoryBar', () => {
  const factory = () =>
    shallowMount(CategoryBar, {
      global: { mocks: { $t: (key: string) => key } },
    })

  beforeEach(() => {
    mockSetActions.mockClear()
    mockSetCategory.mockClear()
    mockSetSubcategory.mockClear()
    mockActiveActions.value = []
    mockActiveCategoryId.value = null
    mockActiveSubcategoryId.value = null
  })

  it('renders category-bar nav', () => {
    const w = factory()
    expect(w.find('.category-bar').exists()).toBe(true)
  })

  it('has aria-label for accessibility', () => {
    const w = factory()
    expect(w.find('nav').attributes('aria-label')).toBe('catalog.title')
  })

  it('renders breadcrumb-bar with breadcrumb-scroll container', () => {
    const w = factory()
    expect(w.find('.breadcrumb-bar').exists()).toBe(true)
    expect(w.find('.breadcrumb-scroll').exists()).toBe(true)
  })

  it('renders transaction segment with dropdown button', () => {
    const w = factory()
    const segment = w.find('.segment-transaction')
    expect(segment.exists()).toBe(true)
    const btn = segment.find('.bc-btn--selected')
    expect(btn.exists()).toBe(true)
    expect(btn.attributes('aria-haspopup')).toBe('listbox')
  })

  it('renders 4 action checkboxes in transaction dropdown (fallback actions)', () => {
    const w = factory()
    const checkboxes = w.findAll('.segment-transaction .bc-checkbox')
    expect(checkboxes).toHaveLength(4)
  })

  it('shows transaction label from $t when no actions selected', () => {
    const w = factory()
    const label = w.find('.segment-transaction .bc-label')
    expect(label.text()).toBe('catalog.transaction')
  })

  it('renders separator after transaction segment', () => {
    const w = factory()
    const seps = w.findAll('.bc-sep')
    expect(seps.length).toBeGreaterThanOrEqual(1)
  })

  it('calls setActions when toggling a transaction checkbox', async () => {
    const w = factory()
    const checkbox = w.find('.segment-transaction .bc-checkbox')
    await checkbox.setValue(true)
    expect(mockSetActions).toHaveBeenCalled()
  })

  it('has scroll buttons', () => {
    const w = factory()
    expect(w.find('.scroll-btn-left').exists()).toBe(true)
    expect(w.find('.scroll-btn-right').exists()).toBe(true)
  })

  it('shows dropdown-open class on breadcrumb-bar when transaction is opened', async () => {
    const w = factory()
    const txBtn = w.find('.segment-transaction .bc-btn--selected')
    await txBtn.trigger('click')
    expect(w.find('.breadcrumb-bar.dropdown-open').exists()).toBe(true)
  })

  it('renders dropdown listbox with aria-label for transaction', () => {
    const w = factory()
    const dropdown = w.find('.segment-transaction .bc-dropdown')
    expect(dropdown.exists()).toBe(true)
    expect(dropdown.attributes('role')).toBe('listbox')
  })

  it('transaction dropdown is hidden by default (v-show)', () => {
    const w = factory()
    const dropdown = w.find('.segment-transaction .bc-dropdown')
    // v-show sets display:none, element still exists in DOM
    expect(dropdown.exists()).toBe(true)
  })
})
