/**
 * Tests for app/components/vehicle/DetailHeader.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/shared/useListingUtils', () => ({
  formatPrice: (v: number) => `${v} €`,
}))

import DetailHeader from '../../../app/components/vehicle/DetailHeader.vue'

describe('DetailHeader', () => {
  const baseProps = {
    vehicleId: 'v1',
    slug: 'camion-iveco-2020',
    productName: 'Iveco Daily',
    priceText: '25.000 €',
    featured: false,
    rentalPrice: null as number | null,
    price: 25000 as number | null,
    category: 'camiones',
    vehicleLocation: 'Madrid' as string | null,
    vehicleFlagCode: 'es' as string | null,
    locationCountry: 'España' as string | null,
    isAiGenerated: false,
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DetailHeader, {
      props: { ...baseProps, ...overrides },
      global: {
        mocks: { $t: (k: string) => k },
        stubs: {
          VehicleFairPriceBadge: true,
          UiAiBadge: true,
          UiShareButtons: true,
        },
      },
    })

  it('renders vehicle header', () => {
    expect(factory().find('.vehicle-header').exists()).toBe(true)
  })

  it('shows product name', () => {
    expect(factory().find('.vehicle-title').text()).toContain('Iveco Daily')
  })

  it('shows price text', () => {
    expect(factory().find('.vehicle-price').text()).toBe('25.000 €')
  })

  it('shows featured badge when featured', () => {
    expect(factory({ featured: true }).find('.vehicle-badge').exists()).toBe(true)
  })

  it('hides featured badge when not featured', () => {
    expect(factory({ featured: false }).find('.vehicle-badge').exists()).toBe(false)
  })

  it('shows category badge', () => {
    expect(factory().find('.vehicle-category-badge').text()).toBe('catalog.camiones')
  })

  it('shows location', () => {
    expect(factory().find('.vehicle-location').text()).toContain('Madrid')
  })

  it('hides location when null', () => {
    expect(factory({ vehicleLocation: null }).find('.vehicle-location').exists()).toBe(false)
  })

  it('shows rental price when set and not terceros', () => {
    const w = factory({ rentalPrice: 800, category: 'camiones' })
    expect(w.find('.vehicle-rental').exists()).toBe(true)
    expect(w.find('.vehicle-rental').text()).toContain('800 €')
  })

  it('hides rental price for terceros category', () => {
    expect(factory({ rentalPrice: 800, category: 'terceros' }).find('.vehicle-rental').exists()).toBe(false)
  })

  it('shows AI badge when AI generated', () => {
    expect(factory({ isAiGenerated: true }).findComponent({ name: 'UiAiBadge' }).exists()).toBe(true)
  })

  it('hides AI badge when not AI generated', () => {
    expect(factory({ isAiGenerated: false }).findComponent({ name: 'UiAiBadge' }).exists()).toBe(false)
  })

  it('shows flag when flag code provided', () => {
    expect(factory().find('.location-flag').exists()).toBe(true)
  })
})
