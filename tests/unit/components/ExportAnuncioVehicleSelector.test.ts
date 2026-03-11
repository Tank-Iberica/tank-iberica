/**
 * Tests for app/components/dashboard/herramientas/exportar-anuncio/ExportAnuncioVehicleSelector.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/shared/useListingUtils', () => ({
  formatPrice: (n: number) => `${n.toLocaleString()} €`,
}))

import ExportAnuncioVehicleSelector from '../../../app/components/dashboard/herramientas/exportar-anuncio/ExportAnuncioVehicleSelector.vue'

const NuxtLinkStub = { template: '<a :href="to"><slot /></a>', props: ['to'] }

describe('ExportAnuncioVehicleSelector', () => {
  const vehicles = [
    { id: 'v-1', brand: 'Volvo', model: 'FH 500', year: 2023, price: 85000, location: 'León' },
    { id: 'v-2', brand: 'Scania', model: 'R 450', year: null, price: null, location: null },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ExportAnuncioVehicleSelector, {
      props: { vehicles, selectedVehicleId: null, ...overrides },
      global: {
        stubs: { NuxtLink: NuxtLinkStub },
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders card', () => {
    expect(factory().find('.card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.card-title').text()).toBe('dashboard.adExport.selectVehicle')
  })

  it('renders select with vehicles', () => {
    // 2 vehicles + 1 placeholder
    expect(factory().findAll('option')).toHaveLength(3)
  })

  it('shows vehicle label in option', () => {
    const opts = factory().findAll('option')
    expect(opts[1].text()).toContain('Volvo FH 500')
    expect(opts[1].text()).toContain('2023')
  })

  it('shows empty state when no vehicles', () => {
    const w = factory({ vehicles: [] })
    expect(w.find('.empty-state').exists()).toBe(true)
  })

  it('shows publish link in empty state', () => {
    const w = factory({ vehicles: [] })
    expect(w.find('.btn-primary').attributes('href')).toBe('/dashboard/vehiculos/nuevo')
  })

  it('hides select when no vehicles', () => {
    expect(factory({ vehicles: [] }).find('.select-vehicle').exists()).toBe(false)
  })
})
