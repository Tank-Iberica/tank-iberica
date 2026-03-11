/**
 * Tests for app/components/dashboard/vehiculos/VehiculoPhotosSection.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import VehiculoPhotosSection from '../../../app/components/dashboard/vehiculos/VehiculoPhotosSection.vue'

describe('VehiculoPhotosSection', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(VehiculoPhotosSection, {
      props: {
        maxPhotos: 20,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string, params?: Record<string, unknown>) => params ? `${k} ${JSON.stringify(params)}` : k },
      },
    })

  it('renders section', () => {
    expect(factory().find('.form-section').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h2').text()).toBeTruthy()
  })

  it('shows placeholder', () => {
    expect(factory().find('.photo-placeholder').exists()).toBe(true)
  })

  it('shows photo limit info', () => {
    expect(factory().find('.photo-limit').exists()).toBe(true)
  })
})
