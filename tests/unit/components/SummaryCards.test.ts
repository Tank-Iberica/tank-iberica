/**
 * Tests for app/components/admin/balance/SummaryCards.vue
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('~/composables/admin/useAdminBalance', () => ({}))
vi.mock('~/composables/admin/useAdminBalanceUI', () => ({
  fmt: (v: number) => `${v.toFixed(2)} €`,
}))

import { shallowMount } from '@vue/test-utils'
import SummaryCards from '../../../app/components/admin/balance/SummaryCards.vue'

describe('SummaryCards', () => {
  const factory = (summary = { totalIngresos: 5000, totalGastos: 2000, balanceNeto: 3000 }) =>
    shallowMount(SummaryCards, {
      props: { summary },
    })

  it('renders summary cards container', () => {
    expect(factory().find('.summary-cards').exists()).toBe(true)
  })

  it('renders 3 summary cards', () => {
    expect(factory().findAll('.summary-card')).toHaveLength(3)
  })

  it('shows ingresos card', () => {
    const card = factory().find('.summary-card.ingresos')
    expect(card.find('.label').text()).toBe('Total Ingresos')
    expect(card.find('.value').text()).toBe('5000.00 €')
  })

  it('shows gastos card', () => {
    const card = factory().find('.summary-card.gastos')
    expect(card.find('.label').text()).toBe('Total Gastos')
    expect(card.find('.value').text()).toBe('2000.00 €')
  })

  it('shows neto card with positive class', () => {
    const card = factory().find('.summary-card.neto')
    expect(card.find('.label').text()).toBe('Balance Neto')
    expect(card.find('.value').text()).toBe('3000.00 €')
    expect(card.classes()).toContain('positive')
  })

  it('applies negative class when balance is negative', () => {
    const w = factory({ totalIngresos: 1000, totalGastos: 3000, balanceNeto: -2000 })
    const card = w.find('.summary-card.neto')
    expect(card.classes()).toContain('negative')
  })
})
