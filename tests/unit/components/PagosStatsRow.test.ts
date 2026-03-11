/**
 * Tests for app/components/admin/pagos/PagosStatsRow.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminPagos', () => ({
  formatCurrency: (v: number) => `€${v.toFixed(2)}`,
}))

import PagosStatsRow from '../../../app/components/admin/pagos/PagosStatsRow.vue'

describe('PagosStatsRow', () => {
  const revenueStats = {
    total: 5000,
    subscription: 2000,
    services: 2500,
    auction: 500,
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(PagosStatsRow, {
      props: { revenueStats, ...overrides },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders stats row', () => {
    expect(factory().find('.stats-row').exists()).toBe(true)
  })

  it('renders 4 stat cards', () => {
    expect(factory().findAll('.stat-card')).toHaveLength(4)
  })

  it('shows total revenue', () => {
    expect(factory().findAll('.stat-value')[0].text()).toBe('€5000.00')
  })

  it('shows subscription revenue', () => {
    expect(factory().find('.stat-subscription .stat-value').text()).toBe('€2000.00')
  })

  it('shows services revenue', () => {
    expect(factory().find('.stat-services .stat-value').text()).toBe('€2500.00')
  })

  it('shows auction revenue', () => {
    expect(factory().find('.stat-auction .stat-value').text()).toBe('€500.00')
  })

  it('shows labels', () => {
    const labels = factory().findAll('.stat-label')
    expect(labels[0].text()).toBe('admin.pagos.totalRevenue')
  })
})
