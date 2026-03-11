/**
 * Tests for app/components/catalog/FilterBarRangePopover.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import FilterBarRangePopover from '../../../app/components/catalog/FilterBarRangePopover.vue'

describe('FilterBarRangePopover', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(FilterBarRangePopover, {
      props: {
        open: true,
        title: 'Precio',
        min: 0,
        max: 100000,
        step: 1000,
        modelMin: 5000,
        modelMax: 80000,
        ...overrides,
      },
      global: {
        stubs: { Teleport: true },
      },
    })

  it('renders popover when open', () => {
    expect(factory().find('.range-dropdown-mobile').exists()).toBe(true)
  })

  it('hides popover when closed', () => {
    expect(factory({ open: false }).find('.range-dropdown-mobile').exists()).toBe(false)
  })

  it('shows title', () => {
    expect(factory().find('.range-dropdown-mobile-header').text()).toContain('Precio')
  })

  it('renders display values', () => {
    const values = factory().findAll('.range-dropdown-values span')
    expect(values).toHaveLength(2)
  })

  it('renders range slider stub', () => {
    // UiRangeSlider is stubbed by shallowMount
    expect(factory().find('.range-dropdown-mobile-content').exists()).toBe(true)
  })

  it('renders close button', () => {
    expect(factory().find('.range-dropdown-close').exists()).toBe(true)
  })
})
