/**
 * Tests for app/components/dashboard/index/DashboardKpiGrid.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import DashboardKpiGrid from '../../../app/components/dashboard/index/DashboardKpiGrid.vue'

describe('DashboardKpiGrid', () => {
  const defaults = {
    activeListings: 5,
    totalViews: 1200,
    leadsThisMonth: 8,
    responseRate: 95,
    planLimits: { maxActiveListings: 10 },
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DashboardKpiGrid, {
      props: { ...defaults, ...overrides },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders kpi grid', () => {
    expect(factory().find('.kpi-grid').exists()).toBe(true)
  })

  it('renders 4 kpi cards', () => {
    expect(factory().findAll('.kpi-card')).toHaveLength(4)
  })

  it('shows active listings value', () => {
    const values = factory().findAll('.kpi-value')
    expect(values[0].text()).toBe('5')
  })

  it('shows plan limit', () => {
    expect(factory().find('.kpi-limit').text()).toContain('5/10')
  })

  it('shows infinity when maxActiveListings is Infinity', () => {
    const w = factory({ planLimits: { maxActiveListings: Infinity } })
    expect(w.find('.kpi-limit').text()).toContain('\u221E')
  })

  it('shows total views', () => {
    const values = factory().findAll('.kpi-value')
    expect(values[1].text()).toBe('1200')
  })

  it('shows leads this month', () => {
    const values = factory().findAll('.kpi-value')
    expect(values[2].text()).toBe('8')
  })

  it('shows response rate with percent', () => {
    const values = factory().findAll('.kpi-value')
    expect(values[3].text()).toBe('95%')
  })
})
