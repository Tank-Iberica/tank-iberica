/**
 * Tests for app/components/dashboard/index/DashboardTopVehicles.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/dashboard/useDashboardIndex', () => ({
  formatPrice: (n: number) => `${n.toLocaleString()} €`,
}))

import DashboardTopVehicles from '../../../app/components/dashboard/index/DashboardTopVehicles.vue'

const NuxtLinkStub = { template: '<a :href="to"><slot /></a>', props: ['to'] }

describe('DashboardTopVehicles', () => {
  const vehicles = [
    { id: 'v-1', brand: 'Volvo', model: 'FH 500', price: 85000, views: 120 },
    { id: 'v-2', brand: 'Scania', model: 'R 450', price: 72000, views: 95 },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DashboardTopVehicles, {
      props: { vehicles, ...overrides },
      global: {
        stubs: { NuxtLink: NuxtLinkStub },
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders card', () => {
    expect(factory().find('.card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.card-header h2').text()).toBe('dashboard.topVehicles')
  })

  it('shows view all link', () => {
    expect(factory().find('.link-more').attributes('href')).toBe('/dashboard/vehiculos')
  })

  it('renders vehicle items', () => {
    expect(factory().findAll('.vehicle-item')).toHaveLength(2)
  })

  it('shows vehicle name', () => {
    expect(factory().findAll('.vehicle-name')[0].text()).toBe('Volvo FH 500')
  })

  it('shows formatted price', () => {
    expect(factory().findAll('.vehicle-price')[0].text()).toContain('85')
  })

  it('shows views count', () => {
    expect(factory().findAll('.stat')[0].text()).toContain('120')
  })

  it('links vehicle item to detail', () => {
    expect(factory().findAll('.vehicle-item')[0].attributes('href')).toBe('/dashboard/vehiculos/v-1')
  })

  it('shows empty state when no vehicles', () => {
    const w = factory({ vehicles: [] })
    expect(w.find('.empty-state').exists()).toBe(true)
  })

  it('hides vehicle list when empty', () => {
    const w = factory({ vehicles: [] })
    expect(w.find('.vehicles-list').exists()).toBe(false)
  })

  it('shows publish first link in empty state', () => {
    const w = factory({ vehicles: [] })
    expect(w.find('.btn-secondary').attributes('href')).toBe('/dashboard/vehiculos/nuevo')
  })
})
