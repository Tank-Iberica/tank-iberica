/**
 * Tests for app/components/catalog/VehicleCard.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { ref, computed, watch } from 'vue'

const mockToggle = vi.fn()
const mockIsFavorite = vi.fn().mockReturnValue(false)

beforeAll(() => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('watch', watch)
  vi.stubGlobal('onMounted', vi.fn())
  vi.stubGlobal('nextTick', () => Promise.resolve())
  vi.stubGlobal('inject', (_key: string, def?: unknown) => def)
  vi.stubGlobal('useI18n', () => ({
    locale: ref('es'),
    t: (k: string) => k,
  }))
  vi.stubGlobal('useFavorites', () => ({
    toggle: mockToggle,
    isFavorite: mockIsFavorite,
  }))
  vi.stubGlobal('useUserLocation', () => ({
    location: ref({ country: 'ES' }),
  }))
  vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
})

vi.mock('~/composables/shared/useListingUtils', () => ({
  formatPrice: (p: number) => `${p.toLocaleString()} €`,
}))

vi.mock('~/composables/useVehicles', () => ({}))

import VehicleCard from '../../../app/components/catalog/VehicleCard.vue'

const baseVehicle = {
  id: 'v-1',
  slug: 'camion-volvo-2020',
  category: 'venta',
  brand: 'Volvo',
  model: 'FH',
  year: 2020,
  price: 75000,
  rental_price: null,
  location: 'Madrid, España',
  location_en: 'Madrid, Spain',
  location_country: 'ES',
  vehicle_images: [
    { url: 'https://res.cloudinary.com/test/image/upload/v1/img.jpg', position: 0 },
  ],
}

const factory = (overrides = {}) =>
  shallowMount(VehicleCard, {
    props: { vehicle: { ...baseVehicle, ...overrides } },
    global: {
      mocks: {
        $t: (k: string) => k,
        buildProductName: (v: Record<string, unknown>, _locale: string) =>
          `${v.brand} ${v.model}`,
      },
      stubs: {
        NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
        NuxtImg: { template: '<img />' },
      },
    },
  })

describe('VehicleCard', () => {
  it('renders a product card link', () => {
    const w = factory()
    expect(w.find('.product-card').exists()).toBe(true)
  })

  it('links to vehicle detail page', () => {
    const w = factory()
    expect(w.find('.product-card').attributes('href')).toContain('camion-volvo-2020')
  })

  it('shows price badge with price', () => {
    const w = factory()
    expect(w.find('.badge-price').exists()).toBe(true)
    expect(w.find('.badge-price').text()).toContain('75')
  })

  it('shows solicitar when price is null', () => {
    const w = factory({ price: null })
    expect(w.find('.badge-price').text()).toContain('catalog.solicitar')
  })

  it('shows solicitar for terceros category', () => {
    const w = factory({ category: 'terceros' })
    expect(w.find('.badge-price').text()).toContain('catalog.solicitar')
  })

  it('shows category badge', () => {
    const w = factory()
    expect(w.find('.badge-category').exists()).toBe(true)
  })

  it('shows location badge when location is set', () => {
    const w = factory()
    expect(w.find('.badge-location').exists()).toBe(true)
  })

  it('hides location badge when no location', () => {
    const w = factory({ location: null })
    expect(w.find('.badge-location').exists()).toBe(false)
  })

  it('strips country name when both user and vehicle are in Spain', () => {
    const w = factory({ location: 'Madrid, España' })
    const badge = w.find('.badge-location')
    expect(badge.text()).not.toContain('España')
    expect(badge.text()).toContain('Madrid')
  })

  it('shows full location when countries differ', () => {
    vi.stubGlobal('useUserLocation', () => ({
      location: ref({ country: 'FR' }),
    }))
    const w = factory({ location: 'Madrid, España', location_country: 'ES' })
    const badge = w.find('.badge-location')
    expect(badge.text()).toContain('España')
    vi.stubGlobal('useUserLocation', () => ({
      location: ref({ country: 'ES' }),
    }))
  })

  it('shows flag when vehicle is from a different country than user', () => {
    vi.stubGlobal('useUserLocation', () => ({
      location: ref({ country: 'FR' }),
    }))
    const w = factory({ location_country: 'ES' })
    expect(w.find('.location-flag').exists()).toBe(true)
    vi.stubGlobal('useUserLocation', () => ({
      location: ref({ country: 'ES' }),
    }))
  })

  it('hides flag when user and vehicle are in same country', () => {
    const w = factory({ location_country: 'ES' })
    expect(w.find('.location-flag').exists()).toBe(false)
  })

  it('renders image when images exist', () => {
    const w = factory()
    expect(w.find('img').exists()).toBe(true)
  })

  it('shows placeholder when no images', () => {
    const w = factory({ vehicle_images: [] })
    expect(w.find('.card-img-placeholder').exists()).toBe(true)
  })

  it('shows nav arrows when multiple images', () => {
    const w = factory({
      vehicle_images: [
        { url: 'https://res.cloudinary.com/t/image/upload/v1/a.jpg', position: 0 },
        { url: 'https://res.cloudinary.com/t/image/upload/v1/b.jpg', position: 1 },
      ],
    })
    expect(w.find('.img-nav-prev').exists()).toBe(true)
    expect(w.find('.img-nav-next').exists()).toBe(true)
  })

  it('hides nav arrows with single image', () => {
    const w = factory()
    expect(w.find('.img-nav-prev').exists()).toBe(false)
  })

  it('shows indicator dots with multiple images', () => {
    const w = factory({
      vehicle_images: [
        { url: 'https://cloudinary.com/a.jpg', position: 0 },
        { url: 'https://cloudinary.com/b.jpg', position: 1 },
      ],
    })
    expect(w.find('.image-indicators').exists()).toBe(true)
  })

  it('renders favorite button', () => {
    const w = factory()
    expect(w.find('.fav-btn').exists()).toBe(true)
  })

  it('applies active class to fav button when favorite', () => {
    mockIsFavorite.mockReturnValueOnce(true)
    const w = factory()
    expect(w.find('.fav-btn').classes()).toContain('active')
  })

  it('calls toggle on fav click when user logged in', async () => {
    const w = factory()
    await w.find('.fav-btn').trigger('click')
    expect(mockToggle).toHaveBeenCalledWith('v-1')
  })

  it('opens auth modal when unauthenticated user clicks fav', async () => {
    const mockOpenAuth = vi.fn()
    vi.stubGlobal('inject', (_key: string, _def?: unknown) => mockOpenAuth)
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const w = factory()
    await w.find('.fav-btn').trigger('click')
    expect(mockOpenAuth).toHaveBeenCalled()
    vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
    vi.stubGlobal('inject', (_key: string, def?: unknown) => def)
  })

  it('shows year spec when year is set', () => {
    const w = factory()
    expect(w.find('.product-specs').exists()).toBe(true)
    expect(w.text()).toContain('2020')
  })

  it('hides specs when no year and no rental price', () => {
    const w = factory({ year: null, rental_price: null, price: 50000 })
    expect(w.find('.product-specs').exists()).toBe(false)
  })

  it('shows terceros banner for terceros category', () => {
    const w = factory({ category: 'terceros' })
    expect(w.find('.terceros-banner').exists()).toBe(true)
  })

  it('hides terceros banner for venta category', () => {
    const w = factory({ category: 'venta' })
    expect(w.find('.terceros-banner').exists()).toBe(false)
  })

  it('shows product title', () => {
    const w = factory()
    expect(w.find('.product-title').exists()).toBe(true)
  })
})
