/**
 * Tests for app/components/dashboard/herramientas/exportar-anuncio/ExportAnuncioVehiclePreview.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/shared/useListingUtils', () => ({
  formatPrice: (n: number) => `${n.toLocaleString()} €`,
}))

import ExportAnuncioVehiclePreview from '../../../app/components/dashboard/herramientas/exportar-anuncio/ExportAnuncioVehiclePreview.vue'

describe('ExportAnuncioVehiclePreview', () => {
  const vehicle = {
    id: 'v-1',
    brand: 'Volvo',
    model: 'FH 500',
    year: 2023,
    price: 85000,
    location: 'León',
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ExportAnuncioVehiclePreview, {
      props: { vehicle, thumbnail: 'https://cdn.example.com/img.jpg', ...overrides },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders preview card', () => {
    expect(factory().find('.preview-card').exists()).toBe(true)
  })

  it('shows vehicle name', () => {
    expect(factory().find('h3').text()).toBe('Volvo FH 500')
  })

  it('shows thumbnail image', () => {
    expect(factory().find('img').attributes('src')).toBe('https://cdn.example.com/img.jpg')
  })

  it('shows placeholder when no thumbnail', () => {
    const w = factory({ thumbnail: null })
    expect(w.find('.image-placeholder').exists()).toBe(true)
  })

  it('shows year', () => {
    expect(factory().find('.spec-item').text()).toBe('2023')
  })

  it('shows formatted price', () => {
    expect(factory().find('.spec-price').text()).toContain('85')
  })

  it('shows location', () => {
    const specs = factory().findAll('.spec-item')
    expect(specs[1].text()).toBe('León')
  })
})
