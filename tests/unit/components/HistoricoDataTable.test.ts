/**
 * Tests for app/components/admin/historico/HistoricoDataTable.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminHistorico', () => ({
  SALE_CATEGORIES: { venta: 'Venta directa', terceros: 'Terceros', exportacion: 'Exportación' } as Record<string, string>,
}))

vi.mock('~/composables/useLocalized', () => ({
  localizedName: () => 'Tractora',
}))

import HistoricoDataTable from '../../../app/components/admin/historico/HistoricoDataTable.vue'

describe('HistoricoDataTable', () => {
  const entries = [
    {
      id: 'h-1',
      brand: 'Volvo',
      model: 'FH 500',
      year: 2022,
      sale_date: '2026-02-15',
      sale_price: 85000,
      total_cost: 70000,
      benefit: 15000,
      benefit_percent: 21.4,
      sale_category: 'venta',
      buyer_name: 'Empresa A',
      vehicle_data: true,
      original_price: 95000,
      total_rental_income: 5000,
      types: null,
    },
    {
      id: 'h-2',
      brand: 'Scania',
      model: 'R 450',
      year: null,
      sale_date: null,
      sale_price: null,
      total_cost: null,
      benefit: -2000,
      benefit_percent: -5.0,
      sale_category: '',
      buyer_name: null,
      vehicle_data: null,
      original_price: null,
      total_rental_income: null,
      types: null,
    },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(HistoricoDataTable, {
      props: {
        entries,
        loading: false,
        showDocs: true,
        showTecnico: true,
        showAlquiler: true,
        locale: 'es',
        fmt: (v: number | null | undefined) => (v != null ? `${v} €` : '—'),
        fmtDate: (d: string) => d,
        getSortIcon: () => '↕',
        ...overrides,
      },
    })

  it('renders table container', () => {
    expect(factory().find('.table-container').exists()).toBe(true)
  })

  it('renders historico table', () => {
    expect(factory().find('.historico-table').exists()).toBe(true)
  })

  it('renders headers including optional columns', () => {
    // Base 9 + docs 1 + tecnico 2 + alquiler 1 + actions 1 = 14
    const headers = factory().findAll('th')
    expect(headers.length).toBeGreaterThanOrEqual(13)
  })

  it('renders entry rows', () => {
    expect(factory().findAll('tbody tr')).toHaveLength(2)
  })

  it('shows vehicle brand and model', () => {
    expect(factory().find('.vehiculo').text()).toContain('Volvo')
    expect(factory().find('.vehiculo').text()).toContain('FH 500')
  })

  it('shows sale category badge', () => {
    expect(factory().find('.cat-badge').text()).toBe('Venta directa')
  })

  it('shows formatted sale price', () => {
    expect(factory().text()).toContain('85000 €')
  })

  it('shows profit with positive class', () => {
    expect(factory().find('.profit-pos').exists()).toBe(true)
  })

  it('shows profit with negative class', () => {
    expect(factory().find('.profit-neg').exists()).toBe(true)
  })

  it('shows buyer name', () => {
    expect(factory().text()).toContain('Empresa A')
  })

  it('shows doc badge when vehicle_data exists', () => {
    expect(factory().find('.doc-badge').exists()).toBe(true)
  })

  it('shows 3 action buttons per row', () => {
    expect(factory().findAll('.btn-icon')).toHaveLength(6) // 3 per row
  })

  it('emits sort on sortable header click', async () => {
    const w = factory()
    await w.find('.sortable').trigger('click')
    expect(w.emitted('sort')).toBeTruthy()
  })

  it('emits open-detail on detail click', async () => {
    const w = factory()
    await w.findAll('.btn-icon')[0].trigger('click')
    expect(w.emitted('open-detail')).toBeTruthy()
  })

  it('emits open-restore on restore click', async () => {
    const w = factory()
    await w.find('.btn-icon.restore').trigger('click')
    expect(w.emitted('open-restore')).toBeTruthy()
  })

  it('emits open-delete on delete click', async () => {
    const w = factory()
    await w.find('.btn-icon.del').trigger('click')
    expect(w.emitted('open-delete')).toBeTruthy()
  })

  it('shows loading state', () => {
    const w = factory({ loading: true })
    expect(w.find('.loading').exists()).toBe(true)
    expect(w.find('.historico-table').exists()).toBe(false)
  })

  it('shows empty row when no entries', () => {
    const w = factory({ entries: [] })
    expect(w.find('.empty').exists()).toBe(true)
  })

  it('hides docs column when showDocs is false', () => {
    const w = factory({ showDocs: false })
    expect(w.find('.doc-badge').exists()).toBe(false)
  })
})
