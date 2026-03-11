/**
 * Tests for app/components/admin/historico/HistoricoFiltersBar.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/useLocalized', () => ({
  localizedName: (item: { name_es: string }, _locale: string) => item.name_es,
}))

import HistoricoFiltersBar from '../../../app/components/admin/historico/HistoricoFiltersBar.vue'

describe('HistoricoFiltersBar', () => {
  const defaults = {
    filters: {
      year: null,
      sale_category: null,
      subcategory_id: null,
      type_id: null,
      brand: null,
      search: '',
    },
    availableYears: [2025, 2026],
    availableBrands: ['Volvo', 'Scania'],
    categoryOptions: [['trucks', 'Camiones'], ['trailers', 'Remolques']] as [string, string][],
    subcategories: [{ id: 'sub-1', name_es: 'Rígido' }],
    types: [{ id: 'type-1', name_es: 'Frigorifico' }],
    locale: 'es',
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(HistoricoFiltersBar, {
      props: { ...defaults, ...overrides },
    })

  it('renders filters bar', () => {
    expect(factory().find('.filters-bar').exists()).toBe(true)
  })

  it('renders 5 select elements', () => {
    expect(factory().findAll('select')).toHaveLength(5)
  })

  it('shows year options', () => {
    const yearSelect = factory().findAll('select')[0]
    const options = yearSelect.findAll('option')
    expect(options).toHaveLength(3) // "Todos" + 2 years
  })

  it('shows category options', () => {
    const catSelect = factory().findAll('select')[1]
    const options = catSelect.findAll('option')
    expect(options).toHaveLength(3) // "Todas" + 2 categories
  })

  it('shows subcategory options', () => {
    const subSelect = factory().findAll('select')[2]
    expect(subSelect.findAll('option')).toHaveLength(2)
  })

  it('shows type options', () => {
    const typeSelect = factory().findAll('select')[3]
    expect(typeSelect.findAll('option')).toHaveLength(2)
  })

  it('shows brand options', () => {
    const brandSelect = factory().findAll('select')[4]
    expect(brandSelect.findAll('option')).toHaveLength(3) // "Todas" + 2 brands
  })

  it('renders search input', () => {
    expect(factory().find('.search-input').exists()).toBe(true)
  })

  it('renders clear button', () => {
    const btn = factory().find('.btn-sm')
    expect(btn.text()).toBe('common.clear')
  })

  it('emits clear on button click', async () => {
    const w = factory()
    await w.find('.btn-sm').trigger('click')
    expect(w.emitted('clear')).toHaveLength(1)
  })
})
