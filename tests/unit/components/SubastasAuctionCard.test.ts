/**
 * Tests for app/components/subastas/index/SubastasAuctionCard.vue
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('~/composables/useAuction', () => ({
  formatCents: (cents: number) => `${(cents / 100).toLocaleString('es-ES')} €`,
}))

import { shallowMount } from '@vue/test-utils'
import SubastasAuctionCard from '../../../app/components/subastas/index/SubastasAuctionCard.vue'

const baseAuction = {
  id: 'auc-1',
  status: 'active',
  start_price_cents: 2500000,
  current_bid_cents: 3000000,
  winning_bid_cents: 0,
  bid_count: 5,
  vehicle: { brand: 'Volvo', model: 'FH 500', year: 2022, location: 'Madrid' },
}

describe('SubastasAuctionCard', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(SubastasAuctionCard, {
      props: {
        auction: { ...baseAuction },
        firstImage: 'https://img.com/1.jpg',
        vehicleTitle: 'Volvo FH 500',
        statusLabel: 'Activa',
        countdown: '2d 5h',
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
        stubs: {
          NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
          NuxtImg: { template: '<img :src="src" :alt="alt" />', props: ['src', 'alt', 'width', 'height', 'loading', 'decoding', 'sizes'] },
        },
      },
    })

  it('renders auction card', () => {
    expect(factory().find('.auction-card').exists()).toBe(true)
  })

  it('links to auction detail', () => {
    expect(factory().find('.auction-card').attributes('href')).toBe('/subastas/auc-1')
  })

  it('shows image', () => {
    expect(factory().find('.auction-card-image img').attributes('src')).toBe('https://img.com/1.jpg')
  })

  it('shows placeholder when no image', () => {
    const w = factory({ firstImage: null })
    expect(w.find('.auction-card-placeholder').exists()).toBe(true)
  })

  it('shows status badge', () => {
    const badge = factory().find('.status-badge')
    expect(badge.text()).toBe('Activa')
    expect(badge.classes()).toContain('status-active')
  })

  it('shows vehicle title', () => {
    expect(factory().find('.auction-card-title').text()).toBe('Volvo FH 500')
  })

  it('shows vehicle year', () => {
    expect(factory().find('.meta-item').text()).toContain('2022')
  })

  it('shows countdown', () => {
    expect(factory().find('.card-countdown').text()).toContain('2d 5h')
  })

  it('shows bid count', () => {
    expect(factory().find('.card-bids').text()).toContain('5')
  })

  it('shows current bid for active auction with bids', () => {
    const w = factory()
    expect(w.find('.price-label').text()).toBe('auction.currentBid')
  })

  it('shows start price for active auction without bids', () => {
    const w = factory({
      auction: { ...baseAuction, current_bid_cents: 0 },
    })
    expect(w.find('.price-label').text()).toBe('auction.startPrice')
  })

  it('shows start price for scheduled auction', () => {
    const w = factory({
      auction: { ...baseAuction, status: 'scheduled', current_bid_cents: 0 },
    })
    expect(w.find('.price-label').text()).toBe('auction.startPrice')
  })
})
