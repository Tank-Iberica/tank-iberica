/**
 * Tests for app/components/dashboard/herramientas/factura/FacturaDealerSection.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import FacturaDealerSection from '../../../app/components/dashboard/herramientas/factura/FacturaDealerSection.vue'

describe('FacturaDealerSection', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(FacturaDealerSection, {
      props: {
        companyName: 'Tank Ibérica SL',
        companyTaxId: 'B12345678',
        companyAddress1: 'Calle Mayor 1',
        companyAddress2: 'León',
        companyAddress3: '24001',
        companyPhone: '+34 987 654 321',
        companyEmail: 'info@tank.es',
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders form section', () => {
    expect(factory().find('.form-section').exists()).toBe(true)
  })

  it('shows legend', () => {
    expect(factory().find('.form-section__legend').text()).toBe('dashboard.tools.invoice.dealerData')
  })

  it('renders 7 form fields', () => {
    expect(factory().findAll('.form-field')).toHaveLength(7)
  })

  it('shows company name input', () => {
    const input = factory().findAll('.form-field__input')[0]
    expect(input.element.getAttribute('value')).toBe('Tank Ibérica SL')
  })

  it('shows tax id input', () => {
    const input = factory().findAll('.form-field__input')[1]
    expect(input.element.getAttribute('value')).toBe('B12345678')
  })

  it('renders labels', () => {
    const labels = factory().findAll('.form-field__label')
    expect(labels.length).toBeGreaterThanOrEqual(7)
  })
})
