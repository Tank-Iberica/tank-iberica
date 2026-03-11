/**
 * Tests for app/components/admin/publicidad/AdsTab.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/shared/useListingUtils', () => ({
  formatPriceCents: (cents: number) => `${(cents / 100).toFixed(2)} €`,
}))
vi.mock('~/composables/admin/useAdminPublicidad', () => ({
  getStatusColor: (status: string) => (status === 'active' ? '#22c55e' : '#94a3b8'),
  formatDate: (d: string) => d.split('T')[0],
  formatNumber: (n: number) => String(n),
  calcCTR: (imp: number, clicks: number) => (imp > 0 ? ((clicks / imp) * 100).toFixed(2) + '%' : '0%'),
}))

import AdsTab from '../../../app/components/admin/publicidad/AdsTab.vue'

describe('AdsTab', () => {
  const ads = [
    {
      id: 'ad-1',
      title: 'Banner Volvo',
      positions: ['header-top', 'sidebar'],
      format: 'banner',
      status: 'active',
      price_monthly_cents: 50000,
      impressions: 10000,
      clicks: 250,
      starts_at: '2026-01-01T00:00:00Z',
      ends_at: '2026-12-31T00:00:00Z',
    },
  ]

  const getAdvertiserName = () => 'Volvo Trucks'

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdsTab, {
      props: { ads, getAdvertiserName, ...overrides },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('shows record count', () => {
    expect(factory().find('.total-badge').text()).toContain('1')
  })

  it('renders create button', () => {
    expect(factory().find('.btn-primary').text()).toContain('admin.publicidad.createAd')
  })

  it('renders ad row', () => {
    expect(factory().findAll('tbody tr')).toHaveLength(1)
  })

  it('shows advertiser name', () => {
    expect(factory().find('strong').text()).toBe('Volvo Trucks')
  })

  it('shows ad title', () => {
    const tds = factory().findAll('td')
    expect(tds[1].text()).toBe('Banner Volvo')
  })

  it('shows position chips', () => {
    expect(factory().findAll('.position-chip')).toHaveLength(2)
  })

  it('shows format badge', () => {
    expect(factory().find('.format-badge').text()).toBe('banner')
  })

  it('shows status badge', () => {
    expect(factory().find('.status-badge').exists()).toBe(true)
  })

  it('emits newAd on create click', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('newAd')).toHaveLength(1)
  })

  it('shows empty state when no ads', () => {
    expect(factory({ ads: [] }).find('.empty-state').exists()).toBe(true)
  })
})
