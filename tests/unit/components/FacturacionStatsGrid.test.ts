/**
 * Tests for app/components/admin/facturacion/FacturacionStatsGrid.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminFacturacion', () => ({
  formatAmount: (v: number) => `€${(v / 100).toFixed(2)}`,
}))

import FacturacionStatsGrid from '../../../app/components/admin/facturacion/FacturacionStatsGrid.vue'

describe('FacturacionStatsGrid', () => {
  const defaults = {
    totalRevenue: 100000,
    totalTax: 21000,
    paidCount: 10,
    pendingCount: 3,
    failedCount: 1,
    mrr: 50000,
    arr: 600000,
    leadMetrics: { totalLeads: 25, totalValue: 150 },
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(FacturacionStatsGrid, {
      props: { ...defaults, ...overrides },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders primary stats row', () => {
    expect(factory().findAll('.stats-row')[0].exists()).toBe(true)
  })

  it('renders 5 primary stat cards', () => {
    const primary = factory().findAll('.stats-row')[0]
    expect(primary.findAll('.stat-card')).toHaveLength(5)
  })

  it('shows total revenue', () => {
    expect(factory().find('.stat-revenue .stat-value').text()).toBe('€1000.00')
  })

  it('shows total tax', () => {
    expect(factory().find('.stat-tax .stat-value').text()).toBe('€210.00')
  })

  it('shows paid count', () => {
    expect(factory().find('.stat-paid .stat-value').text()).toBe('10')
  })

  it('shows pending count', () => {
    expect(factory().find('.stat-pending .stat-value').text()).toBe('3')
  })

  it('shows failed count', () => {
    expect(factory().find('.stat-failed .stat-value').text()).toBe('1')
  })

  it('renders secondary stats row', () => {
    expect(factory().find('.stats-row--secondary').exists()).toBe(true)
  })

  it('shows MRR', () => {
    expect(factory().find('.stat-mrr .stat-value').text()).toBe('€500.00')
  })

  it('shows ARR', () => {
    expect(factory().find('.stat-arr .stat-value').text()).toBe('€6000.00')
  })

  it('shows total leads', () => {
    expect(factory().find('.stat-leads .stat-value').text()).toBe('25')
  })
})
