/**
 * Tests for app/components/dashboard/herramientas/factura/FacturaClientSection.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import FacturaClientSection from '../../../app/components/dashboard/herramientas/factura/FacturaClientSection.vue'

describe('FacturaClientSection', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(FacturaClientSection, {
      props: {
        clientName: 'Juan García',
        clientDocType: 'NIF',
        clientDocNumber: '12345678A',
        clientAddress1: 'Av. Constitución 5',
        clientAddress2: 'Madrid',
        clientAddress3: '28001',
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
    expect(factory().find('.form-section__legend').text()).toBe('dashboard.tools.invoice.clientData')
  })

  it('renders 6 form fields', () => {
    expect(factory().findAll('.form-field')).toHaveLength(6)
  })

  it('shows client name input', () => {
    const input = factory().find('.form-field--full .form-field__input')
    expect(input.element.getAttribute('value')).toBe('Juan García')
  })

  it('renders doc type select', () => {
    expect(factory().find('.form-field__select').exists()).toBe(true)
  })

  it('shows doc type options', () => {
    expect(factory().findAll('.form-field__select option')).toHaveLength(4)
  })

  it('renders labels', () => {
    expect(factory().findAll('.form-field__label').length).toBeGreaterThanOrEqual(6)
  })
})
