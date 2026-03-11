/**
 * Tests for app/components/dashboard/historico/HistoricoDetailModal.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/dashboard/useDashboardHistorico', () => ({
  getProfit: (e: Record<string, number>) => (e.sale_price || 0) - (e.acquisition_cost || 0),
  getMarginPercent: () => '25.0',
  getTotalCost: (e: Record<string, number>) => (e.acquisition_cost || 0) + (e.total_maintenance || 0),
}))

import HistoricoDetailModal from '../../../app/components/dashboard/historico/HistoricoDetailModal.vue'

describe('HistoricoDetailModal', () => {
  const entry = {
    brand: 'Volvo',
    model: 'FH16',
    year: 2022,
    sale_date: '2026-01-15',
    buyer_name: 'Transportes MN',
    buyer_contact: '600123456',
    price: 85000,
    sale_price: 80000,
    acquisition_cost: 60000,
    total_maintenance: 5000,
    total_rental_income: 3000,
  }

  const fmt = (v: number | null | undefined) => (v != null ? `${v} €` : '--')
  const fmtDate = (d: string | null) => d || '--'

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(HistoricoDetailModal, {
      props: {
        show: true,
        entry,
        fmt,
        fmtDate,
        ...overrides,
      },
      global: { stubs: { Teleport: true } },
    })

  it('renders when show and entry are provided', () => {
    expect(factory().find('.modal-bg').exists()).toBe(true)
  })

  it('hides when show is false', () => {
    expect(factory({ show: false }).find('.modal-bg').exists()).toBe(false)
  })

  it('hides when entry is null', () => {
    expect(factory({ entry: null }).find('.modal-bg').exists()).toBe(false)
  })

  it('shows vehicle brand model year in header', () => {
    expect(factory().find('.modal-head').text()).toContain('Volvo')
    expect(factory().find('.modal-head').text()).toContain('FH16')
    expect(factory().find('.modal-head').text()).toContain('2022')
  })

  it('shows sale date', () => {
    expect(factory().text()).toContain('2026-01-15')
  })

  it('shows buyer name', () => {
    expect(factory().text()).toContain('Transportes MN')
  })

  it('shows buyer contact', () => {
    expect(factory().text()).toContain('600123456')
  })

  it('formats financial values', () => {
    const text = factory().text()
    expect(text).toContain('85000 €')
    expect(text).toContain('80000 €')
    expect(text).toContain('60000 €')
  })

  it('shows profit with margin percent', () => {
    const text = factory().text()
    expect(text).toContain('20000 €')
    expect(text).toContain('25.0')
  })

  it('applies profit-pos class for positive profit', () => {
    expect(factory().find('.profit-pos').exists()).toBe(true)
  })

  it('emits close on close button', async () => {
    const w = factory()
    await w.find('.modal-head button').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on footer button', async () => {
    const w = factory()
    await w.find('.modal-foot .btn').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on backdrop click', async () => {
    const w = factory()
    await w.find('.modal-bg').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
