/**
 * Tests for app/components/catalog/FilterBarAdvancedPanel.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import FilterBarAdvancedPanel from '../../../app/components/catalog/FilterBarAdvancedPanel.vue'

describe('FilterBarAdvancedPanel', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(FilterBarAdvancedPanel, {
      props: {
        mobileOpen: false,
        desktopOpen: false,
        filters: [{ name: 'color', type: 'select', options: ['Rojo', 'Azul'] }],
        activeFilters: {},
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
        stubs: { Transition: true },
      },
    })

  it('hides mobile sheet when mobileOpen=false', () => {
    expect(factory().find('.filter-sheet').exists()).toBe(false)
  })

  it('shows mobile sheet when mobileOpen=true', () => {
    const w = factory({ mobileOpen: true })
    expect(w.find('.filter-sheet').exists()).toBe(true)
  })

  it('shows mobile sheet header', () => {
    const w = factory({ mobileOpen: true })
    expect(w.find('.filter-sheet-header h3').text()).toBe('catalog.advancedFilters')
  })

  it('shows backdrop when mobileOpen', () => {
    const w = factory({ mobileOpen: true })
    expect(w.find('.filter-backdrop').exists()).toBe(true)
  })

  it('emits update:mobile-open on close click', async () => {
    const w = factory({ mobileOpen: true })
    await w.find('.filter-close').trigger('click')
    expect(w.emitted('update:mobile-open')?.[0]).toEqual([false])
  })

  it('emits update:mobile-open on backdrop click', async () => {
    const w = factory({ mobileOpen: true })
    await w.find('.filter-backdrop').trigger('click')
    expect(w.emitted('update:mobile-open')?.[0]).toEqual([false])
  })

  it('hides desktop panel when desktopOpen=false', () => {
    expect(factory().find('.advanced-panel').exists()).toBe(false)
  })

  it('shows desktop panel when desktopOpen=true', () => {
    const w = factory({ desktopOpen: true })
    expect(w.find('.advanced-panel').exists()).toBe(true)
  })

  it('hides desktop panel when filters empty', () => {
    const w = factory({ desktopOpen: true, filters: [] })
    expect(w.find('.advanced-panel').exists()).toBe(false)
  })
})
