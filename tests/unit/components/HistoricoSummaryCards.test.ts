/**
 * Tests for app/components/dashboard/historico/HistoricoSummaryCards.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import HistoricoSummaryCards from '../../../app/components/dashboard/historico/HistoricoSummaryCards.vue'

describe('HistoricoSummaryCards', () => {
  const summary = { totalSales: 15, totalRevenue: 120000, totalProfit: 25000, avgMarginPercent: 20.8 }
  const fmt = (v: number | null | undefined) => (v != null ? `${v} €` : '-')

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(HistoricoSummaryCards, {
      props: { summary, fmt, ...overrides },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders 4 summary cards', () => {
    expect(factory().findAll('.summary-card')).toHaveLength(4)
  })

  it('shows total sales value', () => {
    expect(factory().find('.summary-card.sales .card-value').text()).toBe('15')
  })

  it('shows formatted revenue', () => {
    expect(factory().find('.summary-card.revenue .card-value').text()).toBe('120000 €')
  })

  it('shows formatted profit', () => {
    expect(factory().find('.summary-card.profit .card-value').text()).toBe('25000 €')
  })

  it('shows margin percentage', () => {
    expect(factory().find('.summary-card.margin .card-value').text()).toBe('20.8%')
  })

  it('adds negative class when profit is negative', () => {
    const w = factory({ summary: { ...summary, totalProfit: -5000 } })
    expect(w.find('.summary-card.profit').classes()).toContain('negative')
  })

  it('no negative class when profit is positive', () => {
    expect(factory().find('.summary-card.profit').classes()).not.toContain('negative')
  })
})
