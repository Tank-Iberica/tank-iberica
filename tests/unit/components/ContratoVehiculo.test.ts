/**
 * Tests for app/components/dashboard/contrato/ContratoVehiculo.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import ContratoVehiculo from '../../../app/components/dashboard/contrato/ContratoVehiculo.vue'

describe('ContratoVehiculo', () => {
  const vehicleOptions = [
    { id: 'v-1', label: 'Volvo FH 500', plate: '1234-ABC', vehicleType: 'Cabeza tractora' },
    { id: 'v-2', label: 'Scania R 450', plate: '5678-DEF', vehicleType: 'Camión' },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ContratoVehiculo, {
      props: {
        contractVehicle: '',
        contractVehicleType: '',
        contractVehiclePlate: '',
        vehicleOptions,
        loadingVehicles: false,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders component', () => {
    expect(factory().find('.contrato-vehiculo').exists()).toBe(true)
  })

  it('renders vehicle select', () => {
    expect(factory().find('select').exists()).toBe(true)
  })

  it('renders vehicle options', () => {
    // 2 vehicles + 1 placeholder option
    expect(factory().findAll('option')).toHaveLength(3)
  })

  it('disables select when loading', () => {
    expect(factory({ loadingVehicles: true }).find('select').attributes('disabled')).toBeDefined()
  })

  it('select not disabled when not loading', () => {
    expect(factory().find('select').attributes('disabled')).toBeUndefined()
  })

  it('renders vehicle type input', () => {
    const inputs = factory().findAll('input[type="text"]')
    expect(inputs).toHaveLength(2) // vehicleType + plate
  })

  it('shows 3 form groups', () => {
    expect(factory().findAll('.form-group')).toHaveLength(3)
  })

  it('shows labels', () => {
    const labels = factory().findAll('label')
    expect(labels).toHaveLength(3)
  })
})
