/**
 * Tests for app/components/dashboard/calculadora/CalculadoraProfitabilityTab.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/dashboard/useDashboardCalculadora', () => ({
  formatCurrency: (v: number) => `${v} €`,
  formatPercent: (v: number) => `${v}%`,
  metricColorClass: (v: number) => (v >= 0 ? 'metric-positive' : 'metric-negative'),
  roiColorClass: (v: number) => (v >= 10 ? 'metric-positive' : 'metric-warning'),
}))

import CalculadoraProfitabilityTab from '../../../app/components/dashboard/calculadora/CalculadoraProfitabilityTab.vue'

describe('CalculadoraProfitabilityTab', () => {
  const LazyStub = { template: '<canvas />' }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(CalculadoraProfitabilityTab, {
      props: {
        purchasePrice: 80000,
        monthlyRent: 3000,
        annualInsurance: 2000,
        annualMaintenance: 3000,
        annualTaxes: 500,
        hasValidInputs: true,
        grossAnnualIncome: 36000,
        annualCosts: 5500,
        netAnnualProfit: 30500,
        monthsToRecover: 31,
        annualRoi: 38.1,
        breakEvenMonth: 31,
        residualValue3y: 50000,
        totalProfitability3y: 141500,
        chartData: {},
        chartOptions: {},
        lazyLineComponent: LazyStub,
        formatMonths: (v: number) => `${v} meses`,
        monthLabel: 'mes',
        annualTaxesLabel: 'año',
        ...overrides,
      },
    })

  it('renders form section', () => {
    expect(factory().find('.form-section').exists()).toBe(true)
  })

  it('renders 5 number inputs', () => {
    expect(factory().findAll('input[type="number"]')).toHaveLength(5)
  })

  it('shows results section when valid', () => {
    expect(factory().find('.results-section').exists()).toBe(true)
  })

  it('shows metric cards', () => {
    expect(factory().findAll('.metric-card').length).toBeGreaterThanOrEqual(5)
  })

  it('shows gross annual income', () => {
    expect(factory().find('.metric-positive .metric-value').text()).toBe('36000 €')
  })

  it('shows annual costs', () => {
    expect(factory().find('.metric-negative .metric-value').text()).toBe('5500 €')
  })

  it('shows ROI percentage', () => {
    expect(factory().text()).toContain('38.1%')
  })

  it('shows months to recover', () => {
    expect(factory().text()).toContain('31 meses')
  })

  it('shows print button when valid', () => {
    expect(factory().find('.btn-primary').exists()).toBe(true)
  })

  it('emits print on button click', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('print')).toBeTruthy()
  })

  it('shows empty state when not valid', () => {
    const w = factory({ hasValidInputs: false })
    expect(w.find('.empty-state').exists()).toBe(true)
  })

  it('hides results when not valid', () => {
    const w = factory({ hasValidInputs: false })
    expect(w.find('.results-section').exists()).toBe(false)
  })
})
