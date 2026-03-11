/**
 * Tests for app/components/admin/vehiculos/AdminVehiclesFilters.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminVehiclesFilters from '../../../app/components/admin/vehiculos/AdminVehiclesFilters.vue'

describe('AdminVehiclesFilters', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminVehiclesFilters, {
      props: {
        status: null,
        category: null,
        search: '',
        ...overrides,
      },
    })

  it('renders filters bar', () => {
    expect(factory().find('.filters-bar').exists()).toBe(true)
  })

  it('renders 3 filter groups', () => {
    expect(factory().findAll('.filter-group')).toHaveLength(3)
  })

  it('renders status select with 6 options', () => {
    const selects = factory().findAll('.filter-select')
    expect(selects[0].findAll('option')).toHaveLength(6)
  })

  it('renders category select with 4 options', () => {
    const selects = factory().findAll('.filter-select')
    expect(selects[1].findAll('option')).toHaveLength(4)
  })

  it('renders search input', () => {
    expect(factory().find('.filter-input').exists()).toBe(true)
  })

  it('shows labels', () => {
    const labels = factory().findAll('.filter-label')
    expect(labels[0].text()).toBe('common.status')
    expect(labels[1].text()).toBe('common.category')
    expect(labels[2].text()).toBe('common.search')
  })
})
