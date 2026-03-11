/**
 * Tests for app/components/dashboard/calculadora/CalculadoraTotalCostTab.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/dashboard/useDashboardCalculadora', () => ({
  formatCurrency: (v: number) => `${v} €`,
}))

import CalculadoraTotalCostTab from '../../../app/components/dashboard/calculadora/CalculadoraTotalCostTab.vue'

describe('CalculadoraTotalCostTab', () => {
  const itpRates = [
    { comunidad: 'Madrid', rate: 4 },
    { comunidad: 'Cataluña', rate: 5 },
    { comunidad: 'Andalucía', rate: 4 },
  ]

  const totalCostResult = {
    grandTotal: 98000,
    insurance: [1500, 1500, 1500],
    maintenance: [3000, 3500, 4000],
    totalByYear: [54500, 59500, 65000],
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(CalculadoraTotalCostTab, {
      props: {
        tcPurchasePrice: 50000,
        tcYears: 3,
        tcInsuranceEstimate: 1500,
        tcMaintenanceEstimate: 3000,
        selectedComunidad: 'Madrid',
        itpRates,
        hasValidTotalCost: true,
        itpRate: 4,
        itpAmount: 2000,
        totalCostResult,
        yearLabel: 'año',
        yearsLabel: 'años',
        ...overrides,
      },
    })

  it('renders form section', () => {
    expect(factory().find('.form-section').exists()).toBe(true)
  })

  it('renders purchase price input', () => {
    expect(factory().find('#tc-price').exists()).toBe(true)
  })

  it('renders comunidad select', () => {
    expect(factory().find('#tc-comunidad').exists()).toBe(true)
  })

  it('renders comunidad options', () => {
    expect(factory().findAll('#tc-comunidad option')).toHaveLength(3)
  })

  it('renders years range slider', () => {
    expect(factory().find('#tc-years[type="range"]').exists()).toBe(true)
  })

  it('shows years label with value', () => {
    expect(factory().text()).toContain('3')
    expect(factory().text()).toContain('años')
  })

  it('renders insurance and maintenance inputs', () => {
    expect(factory().find('#tc-insurance').exists()).toBe(true)
    expect(factory().find('#tc-maintenance').exists()).toBe(true)
  })

  it('shows results section when valid', () => {
    expect(factory().find('.results-section').exists()).toBe(true)
  })

  it('shows 3 metric cards', () => {
    expect(factory().findAll('.metric-card')).toHaveLength(3)
  })

  it('shows purchase price metric', () => {
    expect(factory().find('.metric-neutral .metric-value').text()).toBe('50000 €')
  })

  it('shows ITP amount', () => {
    expect(factory().find('.metric-negative .metric-value').text()).toBe('2000 €')
  })

  it('shows grand total', () => {
    expect(factory().find('.metric-warning .metric-value').text()).toBe('98000 €')
  })

  it('shows year-by-year breakdown table', () => {
    expect(factory().find('.data-table').exists()).toBe(true)
  })

  it('renders 4 table headers', () => {
    expect(factory().findAll('.data-table th')).toHaveLength(4)
  })

  it('renders rows per year', () => {
    expect(factory().findAll('.data-table tbody tr')).toHaveLength(3)
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
    const w = factory({ hasValidTotalCost: false })
    expect(w.find('.empty-state').exists()).toBe(true)
  })

  it('hides results when not valid', () => {
    const w = factory({ hasValidTotalCost: false })
    expect(w.find('.results-section').exists()).toBe(false)
  })
})
