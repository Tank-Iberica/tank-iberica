/**
 * Tests for app/components/admin/subastas/AdminAuctionInfo.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'

beforeAll(() => {
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'es' } }))
  vi.stubGlobal('computed', (fn: () => unknown) => {
    const val = fn()
    return { value: val, __v_isRef: true }
  })
})

import AdminAuctionInfo from '../../../app/components/admin/subastas/AdminAuctionInfo.vue'

describe('AdminAuctionInfo', () => {
  const auction = {
    status: 'active',
    start_price_cents: 100000,
    reserve_price_cents: 200000,
    current_bid_cents: 150000,
    bid_increment_cents: 5000,
    deposit_cents: 10000,
    buyer_premium_pct: 5,
    anti_snipe_seconds: 120,
    starts_at: '2026-01-01T10:00:00Z',
    ends_at: '2026-01-15T18:00:00Z',
    extended_until: null,
    created_at: '2025-12-20T10:00:00Z',
    bid_count: 15,
    description: 'Test auction',
    winner_id: null,
    winning_bid_cents: null,
    vehicle: { location: 'Madrid', price: 50000 },
  }

  const registrations = [
    { status: 'approved' },
    { status: 'approved' },
    { status: 'pending' },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminAuctionInfo, {
      props: {
        auction,
        bids: [],
        registrations,
        formatCents: (c: number | null) => c ? `${c / 100} €` : '-',
        formatDate: (d: string | null) => d ?? '-',
        getVehicleLabel: () => 'Iveco Daily 2021',
        getVehicleThumbnail: () => null,
        ...overrides,
      },
    })

  it('renders section', () => {
    expect(factory().find('.section').exists()).toBe(true)
  })

  it('shows info title', () => {
    expect(factory().find('.section-title').text()).toBe('admin.subastas.detail.info')
  })

  it('shows vehicle label', () => {
    expect(factory().find('.vehicle-card').text()).toContain('Iveco Daily 2021')
  })

  it('shows placeholder when no thumbnail', () => {
    expect(factory().find('.thumb-placeholder').exists()).toBe(true)
  })

  it('shows config values', () => {
    const text = factory().text()
    expect(text).toContain('1000 €') // start_price 100000/100
    expect(text).toContain('2000 €') // reserve_price 200000/100
  })

  it('shows bid count stat', () => {
    expect(factory().text()).toContain('15')
  })

  it('shows registration count', () => {
    expect(factory().text()).toContain('3') // registrations.length
  })

  it('shows description', () => {
    expect(factory().find('.auction-description').text()).toContain('Test auction')
  })

  it('hides winner when no winner', () => {
    expect(factory().find('.winner-card').exists()).toBe(false)
  })

  it('shows winner when present', () => {
    const w = factory({
      auction: { ...auction, winner_id: 'user-1', winning_bid_cents: 300000 },
    })
    expect(w.find('.winner-card').exists()).toBe(true)
  })
})
