/**
 * Tests for app/components/dashboard/historico/HistoricoSummaryCards.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import HistoricoSummaryCards from '../../../app/components/dashboard/historico/HistoricoSummaryCards.vue'

const baseSummary = {
  totalSales: 12,
  totalRevenue: 360000,
  totalProfit: 48000,
  avgMarginPercent: 13.3,
}

describe('DashboardHistoricoSummaryCards', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(HistoricoSummaryCards, {
      props: {
        summary: { ...baseSummary },
        fmt: (v: number | null | undefined) => (v != null ? `${v} €` : '--'),
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders summary cards', () => {
    expect(factory().find('.summary-cards').exists()).toBe(true)
  })

  it('renders 4 cards', () => {
    expect(factory().findAll('.summary-card')).toHaveLength(4)
  })

  it('shows total sales count', () => {
    const card = factory().find('.summary-card.sales')
    expect(card.find('.card-value').text()).toBe('12')
  })

  it('shows total revenue formatted', () => {
    const card = factory().find('.summary-card.revenue')
    expect(card.find('.card-value').text()).toBe('360000 €')
  })

  it('shows total profit formatted', () => {
    const card = factory().find('.summary-card.profit')
    expect(card.find('.card-value').text()).toBe('48000 €')
  })

  it('shows negative class for negative profit', () => {
    const w = factory({ summary: { ...baseSummary, totalProfit: -2000 } })
    expect(w.find('.summary-card.profit').classes()).toContain('negative')
  })

  it('no negative class for positive profit', () => {
    expect(factory().find('.summary-card.profit').classes()).not.toContain('negative')
  })

  it('shows avg margin percent', () => {
    const card = factory().find('.summary-card.margin')
    expect(card.find('.card-value').text()).toBe('13.3%')
  })
})
