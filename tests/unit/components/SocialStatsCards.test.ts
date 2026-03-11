/**
 * Tests for app/components/admin/social/StatsCards.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import StatsCards from '../../../app/components/admin/social/StatsCards.vue'

describe('SocialStatsCards', () => {
  const counts = {
    all: 50,
    pending: 10,
    approved: 15,
    posted: 20,
    rejected: 3,
    failed: 2,
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(StatsCards, {
      props: { counts, ...overrides },
    })

  it('renders stats grid', () => {
    expect(factory().find('.stats-grid').exists()).toBe(true)
  })

  it('renders 5 stat cards', () => {
    expect(factory().findAll('.stat-card')).toHaveLength(5)
  })

  it('shows total count', () => {
    const text = factory().text()
    expect(text).toContain('50')
  })

  it('shows pending count', () => {
    expect(factory().find('.stat-pending .stat-value').text()).toBe('10')
  })

  it('shows approved count', () => {
    expect(factory().find('.stat-approved .stat-value').text()).toBe('15')
  })

  it('shows posted count', () => {
    expect(factory().find('.stat-posted .stat-value').text()).toBe('20')
  })

  it('shows failed count', () => {
    expect(factory().find('.stat-failed .stat-value').text()).toBe('2')
  })
})
