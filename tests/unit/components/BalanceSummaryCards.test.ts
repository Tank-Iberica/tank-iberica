/**
 * Tests for app/components/admin/balance/SummaryCards.vue
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('~/composables/admin/useAdminBalanceUI', () => ({
  fmt: (val: number) => `${val} €`,
}))

import { shallowMount } from '@vue/test-utils'
import SummaryCards from '../../../app/components/admin/balance/SummaryCards.vue'

describe('BalanceSummaryCards', () => {
  const factory = (summary = { totalIngresos: 1000, totalGastos: 500, balanceNeto: 500 }) =>
    shallowMount(SummaryCards, {
      props: { summary },
    })

  it('renders summary cards container', () => {
    expect(factory().find('.summary-cards').exists()).toBe(true)
  })

  it('renders 3 cards', () => {
    expect(factory().findAll('.summary-card')).toHaveLength(3)
  })

  it('shows ingresos card', () => {
    expect(factory().find('.ingresos').text()).toContain('1000 €')
  })

  it('shows gastos card', () => {
    expect(factory().find('.gastos').text()).toContain('500 €')
  })

  it('shows neto card', () => {
    expect(factory().find('.neto').text()).toContain('500 €')
  })

  it('applies positive class for positive balance', () => {
    expect(factory().find('.neto').classes()).toContain('positive')
  })

  it('applies negative class for negative balance', () => {
    const w = factory({ totalIngresos: 100, totalGastos: 500, balanceNeto: -400 })
    expect(w.find('.neto').classes()).toContain('negative')
  })
})
