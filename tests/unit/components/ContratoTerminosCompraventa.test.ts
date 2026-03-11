/**
 * Tests for app/components/dashboard/contrato/ContratoTerminosCompraventa.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import ContratoTerminosCompraventa from '../../../app/components/dashboard/contrato/ContratoTerminosCompraventa.vue'

describe('ContratoTerminosCompraventa', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ContratoTerminosCompraventa, {
      props: {
        salePrice: 85000,
        paymentMethod: 'Transferencia bancaria',
        deliveryConditions: 'En campa',
        warranty: '6 meses',
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders component', () => {
    expect(factory().find('.contrato-terminos-compraventa').exists()).toBe(true)
  })

  it('shows section subtitle', () => {
    expect(factory().find('.section-subtitle').text()).toBe('dashboard.tools.contract.saleTerms')
  })

  it('renders 4 form groups', () => {
    expect(factory().findAll('.form-group')).toHaveLength(4)
  })

  it('shows price input', () => {
    const input = factory().find('input[type="number"]')
    expect(input.element.getAttribute('value')).toBe('85000')
  })

  it('renders payment method select', () => {
    expect(factory().find('select').exists()).toBe(true)
  })

  it('has 4 payment options', () => {
    expect(factory().findAll('select option')).toHaveLength(4)
  })

  it('renders text inputs for delivery and warranty', () => {
    expect(factory().findAll('input[type="text"]')).toHaveLength(2)
  })

  it('shows labels', () => {
    expect(factory().findAll('label')).toHaveLength(4)
  })
})
