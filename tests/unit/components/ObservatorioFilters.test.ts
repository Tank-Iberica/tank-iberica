/**
 * Tests for app/components/dashboard/observatorio/ObservatorioFilters.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/dashboard/useDashboardObservatorio', () => ({
  STATUS_OPTIONS: ['watching', 'sold', 'expired'],
}))

import ObservatorioFilters from '../../../app/components/dashboard/observatorio/ObservatorioFilters.vue'

describe('ObservatorioFilters', () => {
  const defaults = {
    filterPlatform: '',
    filterStatus: '',
    searchQuery: '',
    selectablePlatforms: [
      { id: 'p1', name: 'Wallapop' },
      { id: 'p2', name: 'Milanuncios' },
    ],
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ObservatorioFilters, {
      props: { ...defaults, ...overrides },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders filters bar', () => {
    expect(factory().find('.filters-bar').exists()).toBe(true)
  })

  it('renders 2 selects', () => {
    expect(factory().findAll('.filter-select')).toHaveLength(2)
  })

  it('shows platform options', () => {
    const platformSelect = factory().findAll('.filter-select')[0]
    expect(platformSelect.findAll('option')).toHaveLength(3) // all + 2 platforms
  })

  it('shows status options', () => {
    const statusSelect = factory().findAll('.filter-select')[1]
    expect(statusSelect.findAll('option')).toHaveLength(4) // all + 3 statuses
  })

  it('renders search input', () => {
    expect(factory().find('.filter-search').exists()).toBe(true)
  })

  it('emits update:filterPlatform on platform change', async () => {
    const w = factory()
    await w.findAll('.filter-select')[0].setValue('p1')
    expect(w.emitted('update:filterPlatform')).toBeTruthy()
  })

  it('emits update:filterStatus on status change', async () => {
    const w = factory()
    await w.findAll('.filter-select')[1].setValue('sold')
    expect(w.emitted('update:filterStatus')).toBeTruthy()
  })

  it('emits update:searchQuery on search input', async () => {
    const w = factory()
    const input = w.find('.filter-search')
    Object.defineProperty(input.element, 'value', { value: 'volvo', writable: true })
    await input.trigger('input')
    expect(w.emitted('update:searchQuery')).toBeTruthy()
  })
})
