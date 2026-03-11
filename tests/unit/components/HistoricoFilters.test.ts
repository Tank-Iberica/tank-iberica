/**
 * Tests for app/components/dashboard/historico/HistoricoFilters.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import HistoricoFilters from '../../../app/components/dashboard/historico/HistoricoFilters.vue'

describe('HistoricoFilters', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(HistoricoFilters, {
      props: {
        filterYear: null,
        filterBrand: null,
        searchQuery: '',
        availableYears: [2024, 2025, 2026],
        availableBrands: ['Volvo', 'Scania'],
        ...overrides,
      },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders filters bar', () => {
    expect(factory().find('.filters-bar').exists()).toBe(true)
  })

  it('renders year select with options', () => {
    const options = factory().findAll('.filter-select')[0].findAll('option')
    expect(options).toHaveLength(4) // all + 3 years
  })

  it('renders brand select with options', () => {
    const options = factory().findAll('.filter-select')[1].findAll('option')
    expect(options).toHaveLength(3) // all + 2 brands
  })

  it('renders search input', () => {
    expect(factory().find('.search-input').exists()).toBe(true)
  })

  it('has clear button', () => {
    expect(factory().find('.btn').exists()).toBe(true)
  })

  it('emits clear on click', async () => {
    const w = factory()
    await w.find('.btn').trigger('click')
    expect(w.emitted('clear')).toBeTruthy()
  })

  it('emits update:filterYear on year change', async () => {
    const w = factory()
    const select = w.findAll('.filter-select')[0]
    Object.defineProperty(select.element, 'value', { value: '2025', writable: true })
    await select.trigger('change')
    expect(w.emitted('update:filterYear')).toBeTruthy()
    expect(w.emitted('update:filterYear')![0]).toEqual([2025])
  })

  it('emits null for empty year', async () => {
    const w = factory()
    const select = w.findAll('.filter-select')[0]
    Object.defineProperty(select.element, 'value', { value: '', writable: true })
    await select.trigger('change')
    expect(w.emitted('update:filterYear')![0]).toEqual([null])
  })
})
