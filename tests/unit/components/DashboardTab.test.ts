/**
 * Tests for app/components/admin/publicidad/DashboardTab.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/shared/useListingUtils', () => ({
  formatPriceCents: (v: number) => `${(v / 100).toFixed(2)} €`,
}))

vi.mock('~/composables/admin/useAdminPublicidad', () => ({
  formatNumber: (v: number) => v.toLocaleString(),
}))

import DashboardTab from '../../../app/components/admin/publicidad/DashboardTab.vue'

const summary = {
  totalImpressions: 50000,
  totalClicks: 1200,
  avgCTR: '2.4%',
  activeAds: 8,
  estimatedRevenue: 35000,
  avgEcpm: 700,
  fillRate: '85%',
  viewabilityRate: '72%',
}

const revenueBySource = [
  { source: 'adsense', impressions: 30000, revenue: 20000, ecpm: 667 },
]

const performance = [
  { position: 'header', impressions: 10000, clicks: 300, ctr: '3%', viewabilityRate: '90%', revenue: 15000 },
]

const ctrByFormat = [
  { format: 'banner', impressions: 20000, clicks: 500, ctr: '2.5%' },
]

const topAds = [
  { adId: 'a1', title: 'Ad 1', advertiser: 'Corp', impressions: 5000, clicks: 100, ctr: '2%', viewableRate: '80%' },
]

const audience = [
  { segment: 'transport', userCount: 1500 },
]

describe('DashboardTab', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DashboardTab, {
      props: {
        dateRange: '30d',
        customFrom: '',
        customTo: '',
        summary,
        revenueBySource,
        performance,
        ctrByFormat,
        topAds,
        audience,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders 4 date range buttons', () => {
    expect(factory().findAll('.range-btn')).toHaveLength(4)
  })

  it('shows active class on selected range', () => {
    expect(factory().findAll('.range-btn')[1].classes()).toContain('active')
  })

  it('emits update:dateRange on button click', async () => {
    const w = factory()
    await w.findAll('.range-btn')[0].trigger('click')
    expect(w.emitted('update:dateRange')?.[0]?.[0]).toBe('7d')
  })

  it('shows custom date inputs when range is custom', () => {
    const w = factory({ dateRange: 'custom' })
    expect(w.findAll('.date-input')).toHaveLength(2)
  })

  it('hides custom date inputs for preset ranges', () => {
    expect(factory().findAll('.date-input')).toHaveLength(0)
  })

  it('renders 8 stat cards', () => {
    expect(factory().findAll('.stat-card')).toHaveLength(8)
  })

  it('shows total impressions', () => {
    const values = factory().findAll('.stat-value')
    expect(values[0].text()).toContain('50')
  })

  it('renders revenue by source table', () => {
    const tables = factory().findAll('.admin-table')
    expect(tables.length).toBeGreaterThanOrEqual(1)
  })

  it('shows revenue source row', () => {
    const w = factory()
    const rows = w.findAll('tbody tr')
    expect(rows.length).toBeGreaterThanOrEqual(1)
  })

  it('shows empty state when no revenue sources', () => {
    const w = factory({ revenueBySource: [] })
    expect(w.find('.empty-state').exists()).toBe(true)
  })

  it('shows performance table rows', () => {
    const w = factory()
    expect(w.html()).toContain('header')
  })

  it('shows ctr by format rows', () => {
    expect(factory().html()).toContain('banner')
  })

  it('shows top ads rows', () => {
    expect(factory().html()).toContain('Ad 1')
  })

  it('shows audience section when segments exist', () => {
    expect(factory().html()).toContain('transport')
  })

  it('hides audience section when empty', () => {
    const w = factory({ audience: [] })
    expect(w.html()).not.toContain('admin.publicidad.audienceSegments')
  })

  it('emits refresh on apply button in custom range', async () => {
    const w = factory({ dateRange: 'custom' })
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('refresh')).toBeTruthy()
  })
})
