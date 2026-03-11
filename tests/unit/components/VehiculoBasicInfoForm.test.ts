/**
 * Tests for app/components/dashboard/vehiculos/VehiculoBasicInfoForm.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import VehiculoBasicInfoForm from '../../../app/components/dashboard/vehiculos/VehiculoBasicInfoForm.vue'

describe('VehiculoBasicInfoForm', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(VehiculoBasicInfoForm, {
      props: {
        brand: 'Scania',
        model: 'R450',
        year: 2022,
        km: 150000,
        price: 85000,
        location: 'Madrid',
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders section', () => {
    expect(factory().find('.form-section').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h2').text()).toBeTruthy()
  })

  it('renders brand input', () => {
    expect((factory().find('#brand').element as HTMLInputElement).value).toBe('Scania')
  })

  it('renders model input', () => {
    expect((factory().find('#model').element as HTMLInputElement).value).toBe('R450')
  })

  it('renders year input', () => {
    expect((factory().find('#year').element as HTMLInputElement).value).toBe('2022')
  })

  it('renders km input', () => {
    expect((factory().find('#km').element as HTMLInputElement).value).toBe('150000')
  })

  it('renders price input', () => {
    expect((factory().find('#price').element as HTMLInputElement).value).toBe('85000')
  })

  it('renders location input', () => {
    expect((factory().find('#location').element as HTMLInputElement).value).toBe('Madrid')
  })

  it('renders 6 form groups', () => {
    expect(factory().findAll('.form-group')).toHaveLength(6)
  })
})
