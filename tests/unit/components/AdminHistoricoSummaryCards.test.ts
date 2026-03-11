/**
 * Tests for app/components/admin/historico/HistoricoSummaryCards.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import HistoricoSummaryCards from '../../../app/components/admin/historico/HistoricoSummaryCards.vue'

const baseSummary = {
  totalVentas: 15,
  totalIngresos: 450000,
  totalBeneficio: 75000,
  avgBeneficioPercent: 16.7,
}

describe('AdminHistoricoSummaryCards', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(HistoricoSummaryCards, {
      props: {
        summary: { ...baseSummary },
        fmt: (v: number | null | undefined) => (v != null ? `${v} €` : '--'),
        ...overrides,
      },
    })

  it('renders summary cards container', () => {
    expect(factory().find('.summary-cards').exists()).toBe(true)
  })

  it('renders 4 summary cards', () => {
    expect(factory().findAll('.summary-card')).toHaveLength(4)
  })

  it('shows total ventas', () => {
    const card = factory().find('.summary-card.ventas')
    expect(card.find('.label').text()).toBe('Total Ventas')
    expect(card.find('.value').text()).toBe('15')
  })

  it('shows total ingresos formatted', () => {
    const card = factory().find('.summary-card.ingresos')
    expect(card.find('.label').text()).toBe('Total Ingresos')
    expect(card.find('.value').text()).toBe('450000 €')
  })

  it('shows total beneficio formatted', () => {
    const card = factory().find('.summary-card.beneficio')
    expect(card.find('.label').text()).toBe('Total Beneficio')
    expect(card.find('.value').text()).toBe('75000 €')
  })

  it('shows positive class for positive beneficio', () => {
    expect(factory().find('.summary-card.beneficio').classes()).toContain('positive')
  })

  it('shows negative class for negative beneficio', () => {
    const w = factory({ summary: { ...baseSummary, totalBeneficio: -5000 } })
    expect(w.find('.summary-card.beneficio').classes()).toContain('negative')
  })

  it('shows avg beneficio percent', () => {
    const card = factory().find('.summary-card.percent')
    expect(card.find('.label').text()).toBe('Beneficio Medio')
    expect(card.find('.value').text()).toBe('16.7%')
  })
})
