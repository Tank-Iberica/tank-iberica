/**
 * Tests for app/components/catalog/CategoryBar.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { ref } from 'vue'

const mockSetActions = vi.fn()

beforeAll(() => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('useCatalogState', () => ({
    setActions: mockSetActions,
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

  beforeAll(() => {
    mockSetActions.mockClear()
  })

  it('renders categories-section nav', () => {
    const w = factory()
    expect(w.find('.categories-section').exists()).toBe(true)
  })

  it('has aria-label for accessibility', () => {
    const w = factory()
    expect(w.find('nav').attributes('aria-label')).toBe('catalog.title')
  })

  it('renders 3 category buttons', () => {
    const w = factory()
    expect(w.findAll('.category-btn')).toHaveLength(3)
  })

  it('shows translated labels', () => {
    const w = factory()
    const btns = w.findAll('.category-btn')
    expect(btns[0].text()).toBe('catalog.alquiler')
    expect(btns[1].text()).toBe('catalog.venta')
    expect(btns[2].text()).toBe('catalog.terceros')
  })

  it('no button is active by default', () => {
    const w = factory()
    const activeButtons = w.findAll('.category-btn.active')
    expect(activeButtons).toHaveLength(0)
  })

  it('emits change on category click', async () => {
    const w = factory()
    await w.findAll('.category-btn')[0].trigger('click')
    expect(w.emitted('change')).toBeTruthy()
  })

  it('toggles active class on click', async () => {
    const w = factory()
    const btn = w.findAll('.category-btn')[0]
    await btn.trigger('click')
    expect(btn.classes()).toContain('active')
  })

  it('removes active class on second click', async () => {
    const w = factory()
    const btn = w.findAll('.category-btn')[0]
    await btn.trigger('click')
    await btn.trigger('click')
    expect(btn.classes()).not.toContain('active')
  })

  it('supports multi-select', async () => {
    const w = factory()
    const btns = w.findAll('.category-btn')
    await btns[0].trigger('click')
    await btns[1].trigger('click')
    expect(btns[0].classes()).toContain('active')
    expect(btns[1].classes()).toContain('active')
  })

  it('calls setActions from useCatalogState', async () => {
    mockSetActions.mockClear()
    const w = factory()
    await w.findAll('.category-btn')[0].trigger('click')
    expect(mockSetActions).toHaveBeenCalled()
  })

  it('has scroll buttons', () => {
    const w = factory()
    expect(w.find('.scroll-btn-left').exists()).toBe(true)
    expect(w.find('.scroll-btn-right').exists()).toBe(true)
  })

  it('has scrollable categories container', () => {
    const w = factory()
    expect(w.find('.categories').exists()).toBe(true)
  })
})
