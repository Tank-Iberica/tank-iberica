/**
 * Tests for app/components/admin/dashboard/MetricsRankings.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminDashboardPage', () => ({
  formatNumber: (v: number) => v.toLocaleString(),
}))

import MetricsRankings from '../../../app/components/admin/dashboard/MetricsRankings.vue'

describe('MetricsRankings', () => {
  const topDealers = [
    { dealerId: 'd-1', name: 'Dealer A', vehicleCount: 45, leadCount: 120 },
    { dealerId: 'd-2', name: 'Dealer B', vehicleCount: 30, leadCount: 80 },
  ]

  const topVehicles = [
    { vehicleId: 'v-1', title: 'Volvo FH 500', views: 1500 },
    { vehicleId: 'v-2', title: 'Scania R 450', views: 1200 },
    { vehicleId: 'v-3', title: 'MAN TGX 18.500', views: 900 },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(MetricsRankings, {
      props: {
        topDealers,
        topVehicles,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders rankings grid', () => {
    expect(factory().find('.rankings-grid').exists()).toBe(true)
  })

  it('renders 2 ranking cards', () => {
    expect(factory().findAll('.ranking-card')).toHaveLength(2)
  })

  it('renders 2 ranking tables', () => {
    expect(factory().findAll('.ranking-table')).toHaveLength(2)
  })

  it('renders dealer rows', () => {
    const dealerTable = factory().findAll('.ranking-table')[0]
    expect(dealerTable.findAll('tbody tr')).toHaveLength(2)
  })

  it('shows dealer names', () => {
    expect(factory().text()).toContain('Dealer A')
    expect(factory().text()).toContain('Dealer B')
  })

  it('renders vehicle rows', () => {
    const vehicleTable = factory().findAll('.ranking-table')[1]
    expect(vehicleTable.findAll('tbody tr')).toHaveLength(3)
  })

  it('shows vehicle titles', () => {
    expect(factory().text()).toContain('Volvo FH 500')
    expect(factory().text()).toContain('Scania R 450')
  })

  it('shows rank numbers', () => {
    const ranks = factory().findAll('.col-rank')
    // headers + data: first table has 1 header + 2 data ranks, second has 1 header + 3
    expect(ranks.length).toBeGreaterThanOrEqual(5)
  })

  it('shows empty state when no dealers', () => {
    const w = factory({ topDealers: [] })
    expect(w.find('.ranking-card__empty').exists()).toBe(true)
  })

  it('shows empty state when no vehicles', () => {
    const w = factory({ topVehicles: [] })
    expect(w.findAll('.ranking-card__empty')).toHaveLength(1)
  })
})
