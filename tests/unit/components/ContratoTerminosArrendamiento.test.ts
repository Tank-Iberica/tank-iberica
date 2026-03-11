/**
 * Tests for app/components/dashboard/contrato/ContratoTerminosArrendamiento.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import ContratoTerminosArrendamiento from '../../../app/components/dashboard/contrato/ContratoTerminosArrendamiento.vue'

describe('ContratoTerminosArrendamiento', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ContratoTerminosArrendamiento, {
      props: {
        monthlyRent: 1500,
        deposit: 3000,
        paymentDays: 30,
        duration: 24,
        durationUnit: 'meses',
        residualValue: 15000,
        hasPurchaseOption: false,
        purchasePrice: 0,
        purchaseNotice: 0,
        rentMonthsToDiscount: 0,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders component', () => {
    expect(factory().find('.contrato-terminos-arrendamiento').exists()).toBe(true)
  })

  it('shows subtitle', () => {
    expect(factory().find('.section-subtitle').text()).toBe('dashboard.tools.contract.rentalTerms')
  })

  it('renders 6 form groups for rental terms', () => {
    expect(factory().findAll('.form-group')).toHaveLength(6)
  })

  it('renders monthly rent input', () => {
    const inputs = factory().findAll('.form-group input[type="number"]')
    expect(inputs.length).toBeGreaterThanOrEqual(1)
  })

  it('renders duration unit select with 2 options', () => {
    const select = factory().find('select')
    expect(select.findAll('option')).toHaveLength(2)
  })

  it('shows purchase option toggle', () => {
    expect(factory().find('.option-toggle').exists()).toBe(true)
  })

  it('hides purchase options by default', () => {
    expect(factory().find('.purchase-options').exists()).toBe(false)
  })

  it('shows purchase options when hasPurchaseOption is true', () => {
    const w = factory({ hasPurchaseOption: true })
    expect(w.find('.purchase-options').exists()).toBe(true)
  })

  it('renders 3 purchase option fields', () => {
    const w = factory({ hasPurchaseOption: true })
    // 6 rental + 3 purchase = 9
    expect(w.findAll('.form-group')).toHaveLength(9)
  })

  it('shows labels', () => {
    const labels = factory().findAll('.form-group label')
    expect(labels[0].text()).toBe('dashboard.tools.contract.monthlyRent')
    expect(labels[1].text()).toBe('dashboard.tools.contract.deposit')
  })
})
