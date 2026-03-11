/**
 * Tests for app/components/user/UserPanelItemsList.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import UserPanelItemsList from '../../../app/components/user/UserPanelItemsList.vue'

const baseItems = [
  { id: '1', title: 'Volvo FH 500', date: '2026-01-15T10:00:00Z', status: 'approved' },
  { id: '2', title: 'Scania R450', date: '2026-02-20T14:00:00Z', status: 'pending' },
  { id: '3', title: 'MAN TGX', date: '2026-03-01T09:00:00Z', status: 'rejected' },
]

describe('UserPanelItemsList', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(UserPanelItemsList, {
      props: {
        items: [...baseItems],
        loading: false,
        emptyKey: 'user.noItems',
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders items list', () => {
    expect(factory().find('.items-list').exists()).toBe(true)
  })

  it('renders correct number of items', () => {
    expect(factory().findAll('.item-card')).toHaveLength(3)
  })

  it('shows item titles', () => {
    const titles = factory().findAll('.item-title')
    expect(titles[0].text()).toBe('Volvo FH 500')
    expect(titles[1].text()).toBe('Scania R450')
  })

  it('shows status badges', () => {
    const badges = factory().findAll('.status-badge')
    expect(badges[0].text()).toBe('approved')
    expect(badges[0].classes()).toContain('approved')
    expect(badges[1].text()).toBe('pending')
    expect(badges[1].classes()).toContain('pending')
  })

  it('shows loading state', () => {
    const w = factory({ loading: true })
    expect(w.find('.empty-state').text()).toBe('common.loading')
    expect(w.find('.items-list').exists()).toBe(false)
  })

  it('shows empty state when no items', () => {
    const w = factory({ items: [] })
    expect(w.find('.empty-state').text()).toBe('user.noItems')
    expect(w.find('.items-list').exists()).toBe(false)
  })

  it('shows item dates', () => {
    const dates = factory().findAll('.item-date')
    expect(dates.length).toBe(3)
    dates.forEach((d) => {
      expect(d.text()).toBeTruthy()
    })
  })

  it('shows rejected badge with class', () => {
    const badges = factory().findAll('.status-badge')
    expect(badges[2].classes()).toContain('rejected')
  })
})
