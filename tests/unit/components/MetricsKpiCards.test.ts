/**
 * Tests for app/components/admin/dashboard/MetricsKpiCards.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminDashboardPage', () => ({
  formatCurrency: (v: number) => `${v} €`,
  formatNumber: (v: number) => String(v),
  formatPercent: (v: number) => `${v}%`,
}))

import MetricsKpiCards from '../../../app/components/admin/dashboard/MetricsKpiCards.vue'

describe('MetricsKpiCards', () => {
  const kpiSummary = {
    monthlyRevenue: { current: 50000, changePercent: 12 },
    activeVehicles: { current: 200, changePercent: -5 },
    activeDealers: { current: 30, changePercent: 0 },
    monthlyLeads: { current: 150, changePercent: 8 },
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(MetricsKpiCards, {
      props: { kpiSummary, ...overrides },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders kpi grid', () => {
    expect(factory().find('.kpi-grid').exists()).toBe(true)
  })

  it('renders 4 kpi cards', () => {
    expect(factory().findAll('.kpi-card')).toHaveLength(4)
  })

  it('shows revenue label', () => {
    const labels = factory().findAll('.kpi-label')
    expect(labels[0].text()).toBe('admin.metrics.revenue')
  })

  it('shows formatted revenue value', () => {
    const values = factory().findAll('.kpi-value')
    expect(values[0].text()).toContain('500 €') // 50000/100 = 500
  })

  it('adds up class for positive change', () => {
    const changes = factory().findAll('.kpi-change')
    expect(changes[0].classes()).toContain('kpi-change--up')
  })

  it('adds down class for negative change', () => {
    const changes = factory().findAll('.kpi-change')
    expect(changes[1].classes()).toContain('kpi-change--down')
  })

  it('shows no change text for zero percent', () => {
    const changes = factory().findAll('.kpi-change')
    expect(changes[2].text()).toContain('admin.metrics.noChange')
  })

  it('shows up arrow SVG for positive change', () => {
    const changes = factory().findAll('.kpi-change')
    expect(changes[0].find('.change-arrow').exists()).toBe(true)
  })

  it('shows sublabel for each card', () => {
    expect(factory().findAll('.kpi-sublabel')).toHaveLength(4)
  })
})
