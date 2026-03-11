/**
 * Tests for app/components/vendedor/VendedorVehiclesGrid.vue
 */
import { describe, it, expect, vi } from 'vitest'

vi.stubGlobal('useImageUrl', () => ({ getImageUrl: (url: string) => url }))

import { shallowMount } from '@vue/test-utils'
import VendedorVehiclesGrid from '../../../app/components/vendedor/VendedorVehiclesGrid.vue'

const baseVehicles = [
  { id: 'v1', slug: 'volvo-fh-500', brand: 'Volvo', model: 'FH 500', price: 45000, images_json: ['https://img/1.jpg'] },
  { id: 'v2', slug: 'scania-r450', brand: 'Scania', model: 'R450', price: 38000, images_json: [] },
]

describe('VendedorVehiclesGrid', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(VendedorVehiclesGrid, {
      props: { vehicles: [...baseVehicles], ...overrides },
      global: {
        mocks: { $t: (k: string) => k },
        stubs: { NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] } },
      },
    })

  it('renders vehicles section', () => {
    expect(factory().find('.vehicles-section').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.section-title').text()).toBe('seller.vehiclesTitle')
  })

  it('renders vehicle cards', () => {
    expect(factory().findAll('.vehicle-card')).toHaveLength(2)
  })

  it('shows vehicle title', () => {
    expect(factory().findAll('.vehicle-card__title')[0].text()).toBe('Volvo FH 500')
  })

  it('shows placeholder when no images', () => {
    expect(factory().findAll('.vehicle-card__placeholder')[0].text()).toBe('S')
  })

  it('hides section when empty', () => {
    const w = factory({ vehicles: [] })
    expect(w.find('.vehicles-section').exists()).toBe(false)
  })
})
