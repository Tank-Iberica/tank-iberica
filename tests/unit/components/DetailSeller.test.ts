/**
 * Tests for app/components/vehicle/DetailSeller.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { ref, computed } from 'vue'

// Override setup.ts plain-object stubs with real Vue refs so v-if auto-unwraps correctly
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)

import DetailSeller from '../../../app/components/vehicle/DetailSeller.vue'

describe('DetailSeller', () => {
  const factory = (props: {
    sellerInfo: { company_name?: string; location?: string; cif?: string } | null
    dealerId: string | null
    dealerSlug: string | null
    isTerceros: boolean
  }) =>
    shallowMount(DetailSeller, {
      props,
      global: {
        mocks: { $t: (key: string) => key },
        stubs: { NuxtLink: { template: '<a><slot /></a>' } },
      },
    })

  it('renders seller info when provided', () => {
    const w = factory({
      sellerInfo: { company_name: 'Acme SL', location: 'Madrid', cif: 'B12345678' },
      dealerId: 'd-1',
      dealerSlug: 'acme',
      isTerceros: false,
    })
    expect(w.find('.vehicle-seller-info').exists()).toBe(true)
    expect(w.text()).toContain('Acme SL')
    expect(w.text()).toContain('Madrid')
    expect(w.text()).toContain('B12345678')
  })

  it('hides seller info when null', () => {
    const w = factory({
      sellerInfo: null,
      dealerId: null,
      dealerSlug: null,
      isTerceros: false,
    })
    expect(w.find('.vehicle-seller-info').exists()).toBe(false)
  })

  it('renders company name only when location/cif are absent', () => {
    const w = factory({
      sellerInfo: { company_name: 'Solo SL' },
      dealerId: 'd-1',
      dealerSlug: null,
      isTerceros: false,
    })
    expect(w.text()).toContain('Solo SL')
    expect(w.findAll('.seller-item')).toHaveLength(1)
  })

  it('shows seller profile link when sellerInfo and dealerId exist', () => {
    const w = factory({
      sellerInfo: { company_name: 'Test' },
      dealerId: 'd-1',
      dealerSlug: 'test-dealer',
      isTerceros: false,
    })
    expect(w.find('.seller-profile-link').exists()).toBe(true)
  })

  it('hides seller profile link when dealerId is null', () => {
    const w = factory({
      sellerInfo: { company_name: 'Test' },
      dealerId: null,
      dealerSlug: null,
      isTerceros: false,
    })
    expect(w.find('.seller-profile-link').exists()).toBe(false)
  })

  it('shows disclaimer when isTerceros is true', () => {
    const w = factory({
      sellerInfo: null,
      dealerId: null,
      dealerSlug: null,
      isTerceros: true,
    })
    expect(w.find('.vehicle-disclaimer').exists()).toBe(true)
    expect(w.text()).toContain('vehicle.disclaimer')
  })

  it('hides disclaimer when isTerceros is false', () => {
    const w = factory({
      sellerInfo: null,
      dealerId: null,
      dealerSlug: null,
      isTerceros: false,
    })
    expect(w.find('.vehicle-disclaimer').exists()).toBe(false)
  })
})
