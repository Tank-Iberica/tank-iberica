/**
 * Tests for app/components/admin/dashboard/MetricsChurnCard.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminDashboardPage', () => ({
  formatNumber: (n: number) => n.toLocaleString(),
}))

import MetricsChurnCard from '../../../app/components/admin/dashboard/MetricsChurnCard.vue'

describe('MetricsChurnCard', () => {
  const churnData = {
    totalDealers: 100,
    cancelledDealers: 3,
    churnRate: 3.0,
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(MetricsChurnCard, {
      props: {
        churnData,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders churn card', () => {
    expect(factory().find('.churn-card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.churn-card__title').text()).toBe('admin.metrics.churnTitle')
  })

  it('shows empty state when no data', () => {
    const w = factory({ churnData: null })
    expect(w.find('.churn-card__empty').exists()).toBe(true)
    expect(w.find('.churn-card__body').exists()).toBe(false)
  })

  it('shows body when data present', () => {
    expect(factory().find('.churn-card__body').exists()).toBe(true)
  })

  it('renders 3 stat items', () => {
    expect(factory().findAll('.churn-stat')).toHaveLength(3)
  })

  it('shows total dealers', () => {
    expect(factory().findAll('.churn-stat__value')[0].text()).toBe('100')
  })

  it('shows cancelled dealers', () => {
    expect(factory().findAll('.churn-stat__value')[1].text()).toBe('3')
  })

  it('shows churn rate', () => {
    expect(factory().findAll('.churn-stat__value')[2].text()).toBe('3.0%')
  })

  it('shows progress bar', () => {
    expect(factory().find('.churn-progress__bar').exists()).toBe(true)
  })

  it('applies low class for rate < 5', () => {
    expect(factory().find('.churn-progress__bar').classes()).toContain('churn-progress__bar--low')
  })

  it('applies medium class for rate 5-15', () => {
    const w = factory({ churnData: { ...churnData, churnRate: 10 } })
    expect(w.find('.churn-progress__bar').classes()).toContain('churn-progress__bar--medium')
  })

  it('applies high class for rate >= 15', () => {
    const w = factory({ churnData: { ...churnData, churnRate: 20 } })
    expect(w.find('.churn-progress__bar').classes()).toContain('churn-progress__bar--high')
  })

  it('sets bar width from churn rate', () => {
    expect(factory().find('.churn-progress__bar').attributes('style')).toContain('width: 3%')
  })

  it('caps bar width at 100%', () => {
    const w = factory({ churnData: { ...churnData, churnRate: 120 } })
    expect(w.find('.churn-progress__bar').attributes('style')).toContain('width: 100%')
  })
})
