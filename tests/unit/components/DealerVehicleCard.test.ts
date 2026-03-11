/**
 * Tests for app/components/dashboard/vehiculos/DealerVehicleCard.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/shared/useListingUtils', () => ({
  formatPrice: (p: number | null) => (p ? `${p} €` : 'Consultar'),
}))

import DealerVehicleCard from '../../../app/components/dashboard/vehiculos/DealerVehicleCard.vue'

describe('DealerVehicleCard', () => {
  const vehicle = {
    id: 'v-1',
    brand: 'Volvo',
    model: 'FH 500',
    year: 2022,
    price: 85000,
    status: 'published',
    views: 142,
    slug: 'volvo-fh-500',
    created_at: '2026-01-15',
    vehicle_images: [
      { url: 'https://cdn.example.com/img2.jpg', position: 2 },
      { url: 'https://cdn.example.com/img1.jpg', position: 1 },
    ],
  }

  const NuxtLinkStub = {
    template: '<a :href="to"><slot /></a>',
    props: ['to'],
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DealerVehicleCard, {
      props: {
        vehicle,
        deleteConfirmId: null,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
        stubs: { NuxtLink: NuxtLinkStub },
      },
    })

  it('renders vehicle card', () => {
    expect(factory().find('.vehicle-card').exists()).toBe(true)
  })

  it('shows vehicle name', () => {
    expect(factory().find('.card-body h3').text()).toBe('Volvo FH 500')
  })

  it('shows year', () => {
    expect(factory().find('.meta-item').text()).toBe('2022')
  })

  it('hides year when null', () => {
    const v = { ...vehicle, year: null }
    expect(factory({ vehicle: v }).find('.meta-item').exists()).toBe(false)
  })

  it('shows formatted price', () => {
    expect(factory().find('.meta-price').text()).toBe('85000 €')
  })

  it('shows views count', () => {
    expect(factory().find('.card-stats').text()).toContain('142')
  })

  it('shows thumbnail sorted by position', () => {
    const img = factory().find('.card-image img')
    expect(img.attributes('src')).toBe('https://cdn.example.com/img1.jpg')
  })

  it('shows placeholder when no images', () => {
    const v = { ...vehicle, vehicle_images: [] }
    expect(factory({ vehicle: v }).find('.image-placeholder').exists()).toBe(true)
  })

  it('shows status pill with correct class', () => {
    const pill = factory().find('.status-pill')
    expect(pill.classes()).toContain('status-published')
  })

  it('shows edit link', () => {
    const link = factory().find('a[href="/dashboard/vehiculos/v-1"]')
    expect(link.exists()).toBe(true)
  })

  it('shows toggle-status button for non-sold', () => {
    const btns = factory().findAll('.action-btn')
    expect(btns.some((b) => b.text() === 'dashboard.vehicles.pause')).toBe(true)
  })

  it('hides toggle-status for sold vehicles', () => {
    const v = { ...vehicle, status: 'sold' }
    const btns = factory({ vehicle: v }).findAll('.action-btn')
    expect(btns.some((b) => b.text() === 'dashboard.vehicles.pause')).toBe(false)
  })

  it('shows delete button', () => {
    expect(factory().find('.action-delete').exists()).toBe(true)
  })

  it('shows confirm delete when deleteConfirmId matches', () => {
    const w = factory({ deleteConfirmId: 'v-1' })
    expect(w.find('.action-delete-confirm').exists()).toBe(true)
    expect(w.find('.action-delete').exists()).toBe(false)
  })

  it('emits toggle-status on click', async () => {
    const w = factory()
    const btn = w.findAll('.action-btn').find((b) => b.text() === 'dashboard.vehicles.pause')
    await btn!.trigger('click')
    expect(w.emitted('toggle-status')).toBeTruthy()
  })

  it('emits set-delete-confirm on delete click', async () => {
    const w = factory()
    await w.find('.action-delete').trigger('click')
    expect(w.emitted('set-delete-confirm')).toBeTruthy()
  })

  it('emits delete-vehicle on confirm delete click', async () => {
    const w = factory({ deleteConfirmId: 'v-1' })
    await w.find('.action-delete-confirm').trigger('click')
    expect(w.emitted('delete-vehicle')).toBeTruthy()
  })

  it('emits open-sold-modal on mark sold click', async () => {
    const w = factory()
    const btn = w.find('.action-sold')
    if (btn.exists()) {
      await btn.trigger('click')
      expect(w.emitted('open-sold-modal')).toBeTruthy()
    }
  })
})
