/**
 * Tests for app/components/dashboard/contrato/ContratoPartes.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import ContratoPartes from '../../../app/components/dashboard/contrato/ContratoPartes.vue'

describe('ContratoPartes', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ContratoPartes, {
      props: {
        contractType: 'compraventa' as const,
        lessorRepresentative: 'Juan García',
        lessorRepresentativeNIF: '12345678A',
        lessorCompany: 'Tank Ibérica SL',
        lessorCIF: 'B12345678',
        lessorAddress: 'Calle Mayor 1, Madrid',
        clientType: 'persona' as const,
        clientName: 'Pedro López',
        clientNIF: '87654321B',
        clientCompany: '',
        clientCIF: '',
        clientRepresentative: '',
        clientRepresentativeNIF: '',
        clientAddress: 'Calle Sol 5, León',
        ...overrides,
      },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders contrato partes', () => {
    expect(factory().find('.contrato-partes').exists()).toBe(true)
  })

  it('shows seller data summary for compraventa', () => {
    expect(factory().find('summary').text()).toBe('dashboard.tools.contract.sellerData')
  })

  it('shows lessor data summary for arrendamiento', () => {
    const w = factory({ contractType: 'arrendamiento' })
    expect(w.find('summary').text()).toBe('dashboard.tools.contract.lessorData')
  })

  it('renders lessor form fields (5 fields)', () => {
    expect(factory().findAll('.company-details .form-group')).toHaveLength(5)
  })

  it('shows buyer subtitle for compraventa', () => {
    expect(factory().find('.section-subtitle').text()).toBe('dashboard.tools.contract.buyerData')
  })

  it('shows lessee subtitle for arrendamiento', () => {
    const w = factory({ contractType: 'arrendamiento' })
    expect(w.find('.section-subtitle').text()).toBe('dashboard.tools.contract.lesseeData')
  })

  it('shows radio buttons for client type', () => {
    expect(factory().findAll('.radio-group-inline input[type="radio"]')).toHaveLength(2)
  })

  it('shows person fields when clientType is persona', () => {
    // persona: clientName, clientNIF, clientAddress = 3 fields
    const grids = factory().findAll('.form-grid-3')
    // First grid = lessor fields, second = client persona fields
    expect(grids.length).toBeGreaterThanOrEqual(2)
  })

  it('shows company fields when clientType is empresa', () => {
    const w = factory({ clientType: 'empresa' })
    const grids = w.findAll('.form-grid-3')
    expect(grids.length).toBeGreaterThanOrEqual(2)
  })

  it('emits update:clientType on radio change', async () => {
    const w = factory()
    const radios = w.findAll('.radio-group-inline input[type="radio"]')
    await radios[1].trigger('change')
    expect(w.emitted('update:clientType')?.[0]?.[0]).toBe('empresa')
  })

  it('shows divider between sections', () => {
    expect(factory().find('.divider').exists()).toBe(true)
  })
})
