/**
 * Tests for app/components/admin/balance/DesgloseGrid.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminBalance', () => ({}))
vi.mock('~/composables/admin/useAdminBalanceUI', () => ({
  fmt: (n: number) => `${n} €`,
}))

import DesgloseGrid from '../../../app/components/admin/balance/DesgloseGrid.vue'

describe('DesgloseGrid', () => {
  const reasonOptions: [string, string][] = [
    ['venta', 'Venta'],
    ['transporte', 'Transporte'],
  ]

  const summary = {
    byReason: {
      venta: { ingresos: 5000, gastos: 1200 },
      transporte: { ingresos: 800, gastos: 300 },
    },
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DesgloseGrid, {
      props: { showDesglose: true, reasonOptions, summary, ...overrides },
    })

  it('renders grid when showDesglose is true', () => {
    expect(factory().find('.desglose-grid').exists()).toBe(true)
  })

  it('hides grid when showDesglose is false', () => {
    expect(factory({ showDesglose: false }).find('.desglose-grid').exists()).toBe(false)
  })

  it('renders correct number of items', () => {
    expect(factory().findAll('.desglose-item')).toHaveLength(2)
  })

  it('shows reason label', () => {
    expect(factory().findAll('.desglose-label')[0].text()).toBe('Venta')
  })

  it('shows ingresos value', () => {
    expect(factory().findAll('.ing')[0].text()).toContain('5000 €')
  })

  it('shows gastos value', () => {
    expect(factory().findAll('.gas')[0].text()).toContain('1200 €')
  })

  it('defaults to 0 for missing reason', () => {
    const emptySummary = { byReason: {} }
    const w = factory({ summary: emptySummary })
    expect(w.findAll('.ing')[0].text()).toContain('0 €')
  })
})
