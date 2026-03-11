/**
 * Tests for app/components/dashboard/transaccion/TransaccionHeader.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import TransaccionHeader from '../../../app/components/dashboard/transaccion/TransaccionHeader.vue'

const NuxtLinkStub = { template: '<a :href="to"><slot /></a>', props: ['to'] }

describe('TransaccionHeader', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(TransaccionHeader, {
      props: {
        vehicleId: 'v-123',
        vehicleTitle: 'Volvo FH 500 2022',
        ...overrides,
      },
      global: {
        stubs: { NuxtLink: NuxtLinkStub },
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders page header', () => {
    expect(factory().find('.page-header').exists()).toBe(true)
  })

  it('shows back link to vehicle', () => {
    const link = factory().find('.back-link')
    expect(link.attributes('href')).toBe('/dashboard/vehiculos/v-123')
  })

  it('shows title', () => {
    expect(factory().find('h1').text()).toBe('dashboard.transaction.title')
  })

  it('shows vehicle name', () => {
    expect(factory().find('.vehicle-name').text()).toBe('Volvo FH 500 2022')
  })

  it('hides vehicle name when empty', () => {
    expect(factory({ vehicleTitle: '' }).find('.vehicle-name').exists()).toBe(false)
  })
})
