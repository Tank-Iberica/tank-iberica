/**
 * Tests for app/components/admin/social/StatsCards.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import StatsCards from '../../../app/components/admin/social/StatsCards.vue'

describe('StatsCards', () => {
  const defaultCounts = {
    all: 100,
    pending: 20,
    approved: 50,
    posted: 25,
    rejected: 3,
    failed: 2,
  }

  const factory = (counts = defaultCounts) =>
    shallowMount(StatsCards, {
      props: { counts },
      global: { mocks: { $t: (key: string) => key } },
    })

  it('renders stats-grid container', () => {
    const w = factory()
    expect(w.find('.stats-grid').exists()).toBe(true)
  })

  it('renders 5 stat cards', () => {
    const w = factory()
    expect(w.findAll('.stat-card')).toHaveLength(5)
  })

  it('shows total count', () => {
    const w = factory()
    const cards = w.findAll('.stat-card')
    expect(cards[0].find('.stat-value').text()).toBe('100')
    expect(cards[0].find('.stat-label').text()).toBe('admin.social.stats.total')
  })

  it('shows pending count', () => {
    const w = factory()
    const card = w.find('.stat-pending')
    expect(card.find('.stat-value').text()).toBe('20')
    expect(card.find('.stat-label').text()).toBe('admin.social.stats.pending')
  })

  it('shows approved count', () => {
    const w = factory()
    const card = w.find('.stat-approved')
    expect(card.find('.stat-value').text()).toBe('50')
    expect(card.find('.stat-label').text()).toBe('admin.social.stats.approved')
  })

  it('shows posted count', () => {
    const w = factory()
    const card = w.find('.stat-posted')
    expect(card.find('.stat-value').text()).toBe('25')
    expect(card.find('.stat-label').text()).toBe('admin.social.stats.posted')
  })

  it('shows failed count', () => {
    const w = factory()
    const card = w.find('.stat-failed')
    expect(card.find('.stat-value').text()).toBe('2')
    expect(card.find('.stat-label').text()).toBe('admin.social.stats.failed')
  })

  it('updates values with different counts', () => {
    const w = factory({ all: 0, pending: 0, approved: 0, posted: 0, rejected: 0, failed: 0 })
    const values = w.findAll('.stat-value')
    values.forEach((v) => expect(v.text()).toBe('0'))
  })
})
