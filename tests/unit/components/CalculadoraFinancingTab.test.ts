/**
 * Tests for app/components/dashboard/calculadora/CalculadoraFinancingTab.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/dashboard/useDashboardCalculadora', () => ({
  formatCurrency: (v: number) => `${v} €`,
  formatCurrencyDecimals: (v: number) => `${v.toFixed(2)} €`,
}))

import CalculadoraFinancingTab from '../../../app/components/dashboard/calculadora/CalculadoraFinancingTab.vue'

describe('CalculadoraFinancingTab', () => {
  const financingResult = {
    monthlyPayment: 1234.56,
    totalInterest: 5000,
    totalPayment: 55000,
  }

  const amortizationPreview = [
    { month: 1, payment: 1234.56, principal: 900, interest: 334.56, balance: 49100 },
    null,
    { month: 60, payment: 1234.56, principal: 1230, interest: 4.56, balance: 0 },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(CalculadoraFinancingTab, {
      props: {
        finVehiclePrice: 50000,
        finDownPaymentPct: 20,
        finInterestRate: 5.5,
        finTermMonths: 60,
        termOptions: [12, 24, 36, 48, 60, 72],
        finDownPaymentAmount: 10000,
        hasValidFinancing: true,
        financingResult,
        amortizationPreview,
        ...overrides,
      },
    })

  it('renders form section', () => {
    expect(factory().find('.form-section').exists()).toBe(true)
  })

  it('renders 3 number inputs', () => {
    expect(factory().findAll('input[type="number"]')).toHaveLength(3)
  })

  it('renders term select', () => {
    expect(factory().find('select#fin-term').exists()).toBe(true)
  })

  it('renders term options', () => {
    expect(factory().findAll('select#fin-term option')).toHaveLength(6)
  })

  it('shows down payment hint', () => {
    expect(factory().find('.input-hint').text()).toContain('10000 €')
  })

  it('shows results section when valid', () => {
    expect(factory().find('.results-section').exists()).toBe(true)
  })

  it('shows 3 metric cards', () => {
    expect(factory().findAll('.metric-card')).toHaveLength(3)
  })

  it('shows monthly payment', () => {
    expect(factory().find('.metric-neutral .metric-value').text()).toBe('1234.56 €')
  })

  it('shows total interest', () => {
    expect(factory().find('.metric-negative .metric-value').text()).toBe('5000 €')
  })

  it('shows total cost (totalPayment + downPayment)', () => {
    // 55000 + 10000 = 65000
    expect(factory().find('.metric-warning .metric-value').text()).toBe('65000 €')
  })

  it('shows amortization table', () => {
    expect(factory().find('.data-table').exists()).toBe(true)
  })

  it('renders 5 amortization headers', () => {
    expect(factory().findAll('.data-table th')).toHaveLength(5)
  })

  it('renders amortization rows including separator', () => {
    // 2 data rows + 1 separator row
    expect(factory().findAll('.data-table tbody tr')).toHaveLength(3)
  })

  it('shows separator row with dots', () => {
    expect(factory().find('.separator-row').text()).toBe('...')
  })

  it('shows print button', () => {
    expect(factory().find('.btn-primary').exists()).toBe(true)
  })

  it('emits print on button click', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('print')).toBeTruthy()
  })

  it('shows empty state when not valid', () => {
    const w = factory({ hasValidFinancing: false })
    expect(w.find('.empty-state').exists()).toBe(true)
  })

  it('hides results when not valid', () => {
    const w = factory({ hasValidFinancing: false })
    expect(w.find('.results-section').exists()).toBe(false)
  })
})
