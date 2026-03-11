/**
 * Tests for app/components/dashboard/index/DashboardHealthScore.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import DashboardHealthScore from '../../../app/components/dashboard/index/DashboardHealthScore.vue'

describe('DashboardHealthScore', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DashboardHealthScore, {
      props: {
        total: 85,
        scoreClass: 'score-high',
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders health score card', () => {
    expect(factory().find('.health-score-card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.health-score-header h3').text()).toBe('dashboard.healthScore.title')
  })

  it('shows score value', () => {
    expect(factory().find('.health-score-value').text()).toBe('85/100')
  })

  it('applies score class to value', () => {
    expect(factory().find('.health-score-value').classes()).toContain('score-high')
  })

  it('renders health bar', () => {
    expect(factory().find('.health-bar').exists()).toBe(true)
  })

  it('sets bar fill width from total', () => {
    const fill = factory().find('.health-bar-fill')
    expect(fill.attributes('style')).toContain('width: 85%')
  })

  it('applies score class to bar fill', () => {
    expect(factory().find('.health-bar-fill').classes()).toContain('score-high')
  })

  it('shows badge eligible when score >= 80', () => {
    expect(factory({ total: 80, scoreClass: 'score-high' }).find('.health-badge-eligible').exists()).toBe(true)
  })

  it('hides badge eligible when score < 80', () => {
    expect(factory({ total: 60, scoreClass: 'score-mid' }).find('.health-badge-eligible').exists()).toBe(false)
  })
})
