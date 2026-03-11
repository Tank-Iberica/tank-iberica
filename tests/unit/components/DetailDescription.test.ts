/**
 * Tests for app/components/vehicle/DetailDescription.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import DetailDescription from '../../../app/components/vehicle/DetailDescription.vue'

describe('DetailDescription', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DetailDescription, {
      props: {
        description: 'Camión en perfecto estado',
        vehicleId: 'v-1',
        locale: 'es',
        isAiGenerated: false,
        ...overrides,
      },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders description section', () => {
    expect(factory().find('.vehicle-description-section').exists()).toBe(true)
  })

  it('shows description text', () => {
    expect(factory().find('.vehicle-description p').text()).toBe('Camión en perfecto estado')
  })

  it('hides description when null', () => {
    const w = factory({ description: null })
    expect(w.find('.vehicle-description').exists()).toBe(false)
  })

  it('shows price history section', () => {
    expect(factory().find('.vehicle-price-history').exists()).toBe(true)
  })

  it('hides price history when no vehicleId', () => {
    const w = factory({ vehicleId: '' })
    expect(w.find('.vehicle-price-history').exists()).toBe(false)
  })

  it('shows description heading', () => {
    expect(factory().find('.vehicle-description h2').text()).toBe('vehicle.description')
  })
})
