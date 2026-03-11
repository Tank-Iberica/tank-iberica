/**
 * Tests for app/components/admin/dashboard/KpiSummary.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import KpiSummary from '../../../app/components/admin/dashboard/KpiSummary.vue'

describe('KpiSummary', () => {
  const kpiSummary = {
    monthlyRevenue: { current: 50000, changePercent: 12 },
    activeVehicles: { current: 200, changePercent: -5 },
    activeDealers: { current: 30, changePercent: 0 },
    monthlyLeads: { current: 150, changePercent: 8 },
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(KpiSummary, {
      props: {
        kpiSummary,
        formatEuros: (cents: number) => `${cents} €`,
        changeClass: (pct: number) => pct > 0 ? 'kpi-change-up' : pct < 0 ? 'kpi-change-down' : 'kpi-change-flat',
        ...overrides,
      },
    })

  it('renders kpi summary row', () => {
    expect(factory().find('.kpi-summary-row').exists()).toBe(true)
  })

  it('renders 4 mini cards', () => {
    expect(factory().findAll('.kpi-mini-card')).toHaveLength(4)
  })

  it('shows revenue formatted', () => {
    const values = factory().findAll('.kpi-mini-value')
    expect(values[0].text()).toBe('50000 €')
  })

  it('shows vehicle count', () => {
    const values = factory().findAll('.kpi-mini-value')
    expect(values[1].text()).toBe('200')
  })

  it('applies change class for positive', () => {
    const changes = factory().findAll('.kpi-mini-change')
    expect(changes[0].classes()).toContain('kpi-change-up')
  })

  it('applies change class for negative', () => {
    const changes = factory().findAll('.kpi-mini-change')
    expect(changes[1].classes()).toContain('kpi-change-down')
  })

  it('applies change class for flat', () => {
    const changes = factory().findAll('.kpi-mini-change')
    expect(changes[2].classes()).toContain('kpi-change-flat')
  })

  it('shows change percent text', () => {
    const changes = factory().findAll('.kpi-mini-change')
    expect(changes[0].text()).toContain('+12%')
    expect(changes[1].text()).toContain('-5%')
  })
})
