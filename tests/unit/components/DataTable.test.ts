/**
 * Tests for app/components/admin/balance/DataTable.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminBalance', () => ({
  BALANCE_REASONS: { venta: 'Venta', compra: 'Compra', servicio: 'Servicio' } as Record<string, string>,
  BALANCE_STATUS_LABELS: { pagado: 'Pagado', pendiente: 'Pendiente' } as Record<string, string>,
}))

vi.mock('~/composables/admin/useAdminBalanceUI', () => ({
  fmt: (v: number) => `${v} €`,
  fmtDate: (d: string) => d,
  fmtPercent: (v: number | null) => (v !== null ? `${v}%` : '-'),
}))

vi.mock('~/composables/useLocalized', () => ({
  localizedName: () => 'Tipo test',
}))

import DataTable from '../../../app/components/admin/balance/DataTable.vue'

describe('DataTable (balance)', () => {
  const entries = [
    {
      id: 'e-1',
      tipo: 'ingreso',
      fecha: '2026-03-01',
      razon: 'venta',
      detalle: 'Venta Volvo FH',
      importe: 85000,
      coste_asociado: 70000,
      estado: 'pagado',
      factura_url: 'https://example.com/factura.pdf',
      vehicles: { brand: 'Volvo', model: 'FH', year: 2022 },
      types: null,
    },
    {
      id: 'e-2',
      tipo: 'gasto',
      fecha: '2026-02-20',
      razon: 'compra',
      detalle: '',
      importe: 50000,
      coste_asociado: null,
      estado: 'pendiente',
      factura_url: null,
      vehicles: null,
      types: null,
    },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DataTable, {
      props: {
        loading: false,
        sortedEntries: entries,
        locale: 'es',
        getSortIcon: (col: string) => `↕`,
        calculateProfit: (importe: number, coste: number | null) =>
          coste !== null ? ((importe - coste) / coste) * 100 : null,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders table container', () => {
    expect(factory().find('.table-container').exists()).toBe(true)
  })

  it('renders balance table', () => {
    expect(factory().find('.balance-table').exists()).toBe(true)
  })

  it('renders 11 headers', () => {
    expect(factory().findAll('th')).toHaveLength(11)
  })

  it('renders rows', () => {
    // 2 data rows (entries > 0, no empty row)
    expect(factory().findAll('tbody tr')).toHaveLength(2)
  })

  it('shows tipo badge', () => {
    const badge = factory().find('.tipo-badge')
    expect(badge.classes()).toContain('ingreso')
  })

  it('shows date', () => {
    expect(factory().text()).toContain('2026-03-01')
  })

  it('shows reason label', () => {
    expect(factory().text()).toContain('Venta')
  })

  it('shows detalle or dash', () => {
    expect(factory().text()).toContain('Venta Volvo FH')
  })

  it('shows vehicle badge when present', () => {
    expect(factory().find('.vehiculo-badge').text()).toContain('Volvo')
  })

  it('shows formatted amount', () => {
    expect(factory().text()).toContain('85000 €')
  })

  it('shows profit percentage for ingreso with coste', () => {
    expect(factory().text()).toContain('%')
  })

  it('shows factura link when present', () => {
    const link = factory().find('.factura-link')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('https://example.com/factura.pdf')
  })

  it('shows estado badge', () => {
    expect(factory().find('.estado-badge').classes()).toContain('pagado')
  })

  it('shows edit and delete buttons per row', () => {
    expect(factory().findAll('.btn-icon')).toHaveLength(4) // 2 per row
  })

  it('emits edit on edit click', async () => {
    const w = factory()
    await w.findAll('.btn-icon')[0].trigger('click')
    expect(w.emitted('edit')).toBeTruthy()
  })

  it('emits delete on delete click', async () => {
    const w = factory()
    await w.find('.btn-icon.del').trigger('click')
    expect(w.emitted('delete')).toBeTruthy()
  })

  it('emits toggleSort on sortable header click', async () => {
    const w = factory()
    await w.find('.sortable').trigger('click')
    expect(w.emitted('toggleSort')).toBeTruthy()
  })

  it('shows loading state', () => {
    const w = factory({ loading: true })
    expect(w.find('.loading').exists()).toBe(true)
    expect(w.find('.balance-table').exists()).toBe(false)
  })

  it('shows empty row when no entries', () => {
    const w = factory({ sortedEntries: [] })
    expect(w.find('.empty').exists()).toBe(true)
  })
})
