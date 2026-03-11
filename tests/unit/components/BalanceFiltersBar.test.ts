/**
 * Tests for app/components/admin/balance/FiltersBar.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/useLocalized', () => ({
  localizedName: (item: { name_es?: string }, _locale: string) => item.name_es || 'Unknown',
}))

import FiltersBar from '../../../app/components/admin/balance/FiltersBar.vue'

const baseFilters = {
  year: null as number | null,
  search: '',
  tipo: null,
  razon: null,
  estado: null,
  subcategory_id: null,
  type_id: null,
}

const reasonOptions: [string, string][] = [
  ['venta', 'Venta'],
  ['alquiler', 'Alquiler'],
  ['servicio', 'Servicio'],
]

const statusOptions: [string, string][] = [
  ['pagado', 'Pagado'],
  ['pendiente', 'Pendiente'],
]

describe('BalanceFiltersBar', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(FiltersBar, {
      props: {
        filters: { ...baseFilters },
        availableYears: [2024, 2025, 2026],
        reasonOptions: [...reasonOptions],
        statusOptions: [...statusOptions],
        subcategories: [
          { id: 'sub1', name_es: 'Camiones' },
          { id: 'sub2', name_es: 'Furgonetas' },
        ],
        types: [
          { id: 'type1', name_es: 'Cisterna' },
        ],
        locale: 'es',
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders filters bar', () => {
    expect(factory().find('.filters-bar').exists()).toBe(true)
  })

  it('shows 6 select elements', () => {
    expect(factory().findAll('select')).toHaveLength(6)
  })

  it('shows year options', () => {
    const yearSelect = factory().findAll('select')[0]
    const options = yearSelect.findAll('option')
    // "All years" + 3 years
    expect(options).toHaveLength(4)
    expect(options[1].text()).toBe('2024')
  })

  it('shows reason options', () => {
    const reasonSelect = factory().findAll('select')[2]
    const options = reasonSelect.findAll('option')
    // "All reasons" + 3 reasons
    expect(options).toHaveLength(4)
    expect(options[1].text()).toBe('Venta')
  })

  it('shows status options', () => {
    const statusSelect = factory().findAll('select')[3]
    const options = statusSelect.findAll('option')
    // "All statuses" + 2 statuses
    expect(options).toHaveLength(3)
  })

  it('shows subcategory options', () => {
    const subcatSelect = factory().findAll('select')[4]
    const options = subcatSelect.findAll('option')
    // "All subcats" + 2 subcategories
    expect(options).toHaveLength(3)
    expect(options[1].text()).toBe('Camiones')
  })

  it('shows type options', () => {
    const typeSelect = factory().findAll('select')[5]
    const options = typeSelect.findAll('option')
    // "All types" + 1 type
    expect(options).toHaveLength(2)
    expect(options[1].text()).toBe('Cisterna')
  })

  it('shows search input', () => {
    expect(factory().find('.search-input').exists()).toBe(true)
  })

  it('shows clear button', () => {
    const btn = factory().find('.btn')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toBe('admin.balance.clear')
  })

  it('emits clear on clear click', async () => {
    const w = factory()
    await w.find('.btn').trigger('click')
    expect(w.emitted('clear')).toBeTruthy()
  })

  it('emits update:filters on search input', async () => {
    const w = factory()
    const input = w.find('.search-input')
    const el = input.element as HTMLInputElement
    Object.defineProperty(el, 'value', { value: 'test', writable: true })
    await input.trigger('input')
    expect(w.emitted('update:filters')).toBeTruthy()
    const emitted = w.emitted('update:filters')![0][0] as Record<string, unknown>
    expect(emitted.search).toBe('test')
  })
})
