/**
 * Tests for app/components/admin/vehiculos/AdminVehiclesTable.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/shared/useListingUtils', () => ({
  formatPrice: (p: number | null) => (p ? `${p} €` : 'Consultar'),
}))

import AdminVehiclesTable from '../../../app/components/admin/vehiculos/AdminVehiclesTable.vue'

describe('AdminVehiclesTable', () => {
  const vehicles = [
    {
      id: 'v-1',
      brand: 'Volvo',
      model: 'FH 500',
      year: 2022,
      price: 85000,
      status: 'published',
      category: 'venta',
      vehicle_images: [{ url: 'https://cdn.example.com/img.jpg', thumbnail_url: null }],
    },
    {
      id: 'v-2',
      brand: 'Scania',
      model: 'R 450',
      year: null,
      price: null,
      status: 'draft',
      category: 'alquiler',
      vehicle_images: [],
    },
  ]

  const NuxtLinkStub = {
    template: '<a :href="to"><slot /></a>',
    props: ['to'],
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminVehiclesTable, {
      props: {
        vehicles,
        ...overrides,
      },
      global: {
        stubs: { NuxtLink: NuxtLinkStub },
      },
    })

  it('renders table', () => {
    expect(factory().find('.vehicles-table').exists()).toBe(true)
  })

  it('renders 6 headers', () => {
    expect(factory().findAll('th')).toHaveLength(6)
  })

  it('renders vehicle rows', () => {
    expect(factory().findAll('tbody tr')).toHaveLength(2)
  })

  it('shows vehicle image', () => {
    expect(factory().find('.vehicle-thumbnail img').exists()).toBe(true)
  })

  it('shows no-image placeholder when no images', () => {
    const rows = factory().findAll('tbody tr')
    expect(rows[1].find('.no-image').exists()).toBe(true)
  })

  it('shows delete button', () => {
    expect(factory().findAll('.action-btn.danger')).toHaveLength(2)
  })

  it('emits confirm-delete on delete click', async () => {
    const w = factory()
    await w.find('.action-btn.danger').trigger('click')
    expect(w.emitted('confirm-delete')).toBeTruthy()
  })

  it('shows empty tbody when no vehicles', () => {
    const w = factory({ vehicles: [] })
    expect(w.findAll('tbody tr')).toHaveLength(0)
  })
})
