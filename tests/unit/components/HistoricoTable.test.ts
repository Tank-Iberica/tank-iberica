/**
 * Tests for app/components/dashboard/historico/HistoricoTable.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/dashboard/useDashboardHistorico', () => ({
  getProfit: (e: { sale_price: number; purchase_price: number }) =>
    (e.sale_price || 0) - (e.purchase_price || 0),
  getMarginPercent: () => 21,
  getTotalCost: (e: { purchase_price: number }) => e.purchase_price || 0,
}))

import HistoricoTable from '../../../app/components/dashboard/historico/HistoricoTable.vue'

describe('HistoricoTable', () => {
  const entries = [
    {
      id: 'v-1',
      brand: 'Volvo',
      model: 'FH 500',
      year: 2022,
      sale_date: '2026-02-15',
      sale_price: 85000,
      purchase_price: 70000,
    },
    {
      id: 'v-2',
      brand: 'Scania',
      model: 'R 450',
      year: null,
      sale_date: null,
      sale_price: 50000,
      purchase_price: 55000,
    },
  ]

  const NuxtLinkStub = { template: '<a :href="to"><slot /></a>', props: ['to'] }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(HistoricoTable, {
      props: {
        entries,
        loading: false,
        sortCol: 'sale_date' as const,
        sortAsc: false,
        fmt: (v: number | null | undefined) => (v != null ? `${v} €` : '—'),
        fmtDate: (d: string | null) => d || '—',
        getSortIcon: () => '↕',
        ...overrides,
      },
      global: {
        stubs: { NuxtLink: NuxtLinkStub },
      },
    })

  it('renders table container', () => {
    expect(factory().find('.table-container').exists()).toBe(true)
  })

  it('renders historico table', () => {
    expect(factory().find('.historico-table').exists()).toBe(true)
  })

  it('renders 8 headers', () => {
    expect(factory().findAll('th')).toHaveLength(8)
  })

  it('renders entry rows', () => {
    expect(factory().findAll('tbody tr')).toHaveLength(2)
  })

  it('shows vehicle brand and model', () => {
    expect(factory().find('.vehiculo-cell').text()).toContain('Volvo')
    expect(factory().find('.vehiculo-cell').text()).toContain('FH 500')
  })

  it('shows year', () => {
    expect(factory().text()).toContain('2022')
  })

  it('shows formatted sale price', () => {
    expect(factory().text()).toContain('85000 €')
  })

  it('shows margin percentage', () => {
    expect(factory().text()).toContain('21%')
  })

  it('shows 2 action buttons per row', () => {
    // viewDetail + restoreEntry = 2 × 2 rows = 4
    expect(factory().findAll('.btn-icon')).toHaveLength(4)
  })

  it('emits toggleSort on sortable header click', async () => {
    const w = factory()
    await w.find('.sortable').trigger('click')
    expect(w.emitted('toggleSort')).toBeTruthy()
  })

  it('emits viewDetail on detail click', async () => {
    const w = factory()
    await w.findAll('.btn-icon')[0].trigger('click')
    expect(w.emitted('viewDetail')).toBeTruthy()
  })

  it('emits restoreEntry on restore click', async () => {
    const w = factory()
    await w.find('.btn-icon.restore').trigger('click')
    expect(w.emitted('restoreEntry')).toBeTruthy()
  })

  it('shows loading state', () => {
    const w = factory({ loading: true })
    expect(w.find('.loading-state').exists()).toBe(true)
    expect(w.find('.historico-table').exists()).toBe(false)
  })

  it('shows empty state when no entries', () => {
    const w = factory({ entries: [] })
    expect(w.find('.empty-state').exists()).toBe(true)
  })
})
