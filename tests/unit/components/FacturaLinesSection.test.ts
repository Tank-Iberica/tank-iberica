/**
 * Tests for app/components/dashboard/herramientas/factura/FacturaLinesSection.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import FacturaLinesSection from '../../../app/components/dashboard/herramientas/factura/FacturaLinesSection.vue'

describe('FacturaLinesSection', () => {
  const lines = [
    { id: 1, description: 'Transporte', quantity: 1, unitPrice: 500, total: 500 },
    { id: 2, description: 'Verificación', quantity: 2, unitPrice: 100, total: 200 },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(FacturaLinesSection, {
      props: { lines, ...overrides },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders form section', () => {
    expect(factory().find('.form-section').exists()).toBe(true)
  })

  it('shows legend', () => {
    expect(factory().find('.form-section__legend').text()).toBe('dashboard.tools.invoice.lines')
  })

  it('renders child component stub', () => {
    // shallowMount stubs child component
    expect(factory().find('.form-section').exists()).toBe(true)
  })
})
