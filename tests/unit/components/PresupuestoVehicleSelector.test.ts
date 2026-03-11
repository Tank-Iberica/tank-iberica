/**
 * Tests for app/components/dashboard/herramientas/presupuesto/PresupuestoVehicleSelector.vue
 */
import { vi, describe, it, expect } from 'vitest'

vi.mock('~/composables/shared/useListingUtils', () => ({
  formatPrice: (v: number) => `${v} €`,
}))

import { shallowMount } from '@vue/test-utils'
import PresupuestoVehicleSelector from '../../../app/components/dashboard/herramientas/presupuesto/PresupuestoVehicleSelector.vue'

const vehicles = [
  { id: 'v1', brand: 'Scania', model: 'R450', year: 2022, price: 85000 },
  { id: 'v2', brand: 'Volvo', model: 'FH', year: 2021, price: 72000 },
]

describe('PresupuestoVehicleSelector', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(PresupuestoVehicleSelector, {
      props: {
        searchQuery: '',
        showDropdown: false,
        selectedVehicle: null,
        filteredVehicles: vehicles,
        vehicleThumbnail: null,
        vehicleTitle: '',
        vehiclePrice: 0,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders form section', () => {
    expect(factory().find('.form-section').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h2').text()).toBeTruthy()
  })

  it('renders search input', () => {
    expect(factory().find('.input-field').exists()).toBe(true)
  })

  it('hides clear button when no selection', () => {
    expect(factory().find('.clear-btn').exists()).toBe(false)
  })

  it('shows clear button when vehicle selected', () => {
    const w = factory({ selectedVehicle: vehicles[0] })
    expect(w.find('.clear-btn').exists()).toBe(true)
  })

  it('hides dropdown when showDropdown is false', () => {
    expect(factory().find('.vehicle-dropdown').exists()).toBe(false)
  })

  it('shows dropdown items when showDropdown is true', () => {
    const w = factory({ showDropdown: true })
    expect(w.findAll('.vehicle-dropdown-item')).toHaveLength(2)
  })

  it('shows vehicle brand and model in dropdown', () => {
    const w = factory({ showDropdown: true })
    expect(w.findAll('.vd-name')[0].text()).toBe('Scania R450')
  })

  it('shows year in dropdown', () => {
    const w = factory({ showDropdown: true })
    expect(w.findAll('.vd-year')[0].text()).toBe('(2022)')
  })

  it('shows price in dropdown', () => {
    const w = factory({ showDropdown: true })
    expect(w.findAll('.vd-price')[0].text()).toBe('85000 €')
  })

  it('shows empty message when no filtered vehicles', () => {
    const w = factory({ showDropdown: true, filteredVehicles: [] })
    expect(w.find('.vd-empty').exists()).toBe(true)
  })

  it('shows selected vehicle card', () => {
    const w = factory({ selectedVehicle: vehicles[0], vehicleTitle: 'Scania R450', vehiclePrice: 85000 })
    expect(w.find('.selected-vehicle-card').exists()).toBe(true)
    expect(w.find('.sv-title').text()).toBe('Scania R450')
    expect(w.find('.sv-price').text()).toBe('85000 €')
  })

  it('hides selected vehicle card when none selected', () => {
    expect(factory().find('.selected-vehicle-card').exists()).toBe(false)
  })

  it('shows thumbnail when available', () => {
    const w = factory({ selectedVehicle: vehicles[0], vehicleThumbnail: 'https://img.test/thumb.jpg', vehicleTitle: 'X', vehiclePrice: 1 })
    expect(w.find('.selected-vehicle-img').exists()).toBe(true)
  })

  it('emits clear on clear button click', async () => {
    const w = factory({ selectedVehicle: vehicles[0] })
    await w.find('.clear-btn').trigger('click')
    expect(w.emitted('clear')).toBeTruthy()
  })

  it('emits focus on input focus', async () => {
    const w = factory()
    await w.find('.input-field').trigger('focus')
    expect(w.emitted('focus')).toBeTruthy()
  })

  it('emits blur on input blur', async () => {
    const w = factory()
    await w.find('.input-field').trigger('blur')
    expect(w.emitted('blur')).toBeTruthy()
  })
})
