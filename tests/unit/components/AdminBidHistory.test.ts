/**
 * Tests for app/components/admin/subastas/AdminBidHistory.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminBidHistory from '../../../app/components/admin/subastas/AdminBidHistory.vue'

describe('AdminBidHistory', () => {
  const bids = [
    { id: 'b1', user_id: 'user-1234-abcd', amount_cents: 500000, created_at: '2026-01-01', is_winning: false },
    { id: 'b2', user_id: 'user-5678-efgh', amount_cents: 600000, created_at: '2026-01-02', is_winning: true },
  ]

  const formatCents = (c: number | null) => c ? `${c / 100} €` : '0 €'
  const formatDateShort = (d: string | null) => d || '--'

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminBidHistory, {
      props: {
        bids,
        formatCents,
        formatDateShort,
        ...overrides,
      },
    })

  it('renders section', () => {
    expect(factory().find('.section').exists()).toBe(true)
  })

  it('shows bid count badge', () => {
    expect(factory().find('.count-badge-sm').text()).toBe('2')
  })

  it('shows empty message when no bids', () => {
    const w = factory({ bids: [] })
    expect(w.find('.empty-msg').exists()).toBe(true)
    expect(w.find('.table-container').exists()).toBe(false)
  })

  it('renders table when bids exist', () => {
    expect(factory().find('.data-table').exists()).toBe(true)
    expect(factory().find('.empty-msg').exists()).toBe(false)
  })

  it('renders correct number of rows', () => {
    expect(factory().findAll('tbody tr')).toHaveLength(2)
  })

  it('shows row numbers in reverse order', () => {
    const rows = factory().findAll('tbody tr')
    expect(rows[0].findAll('td')[0].text()).toBe('2')
    expect(rows[1].findAll('td')[0].text()).toBe('1')
  })

  it('truncates user_id to first 8 chars', () => {
    const rows = factory().findAll('tbody tr')
    expect(rows[0].findAll('td')[1].text()).toBe('user-123...')
  })

  it('calls formatCents for amount', () => {
    const rows = factory().findAll('tbody tr')
    expect(rows[0].text()).toContain('5000 €')
  })

  it('calls formatDateShort for date', () => {
    const rows = factory().findAll('tbody tr')
    expect(rows[0].text()).toContain('2026-01-01')
  })

  it('marks winning bid row', () => {
    const rows = factory().findAll('tbody tr')
    expect(rows[1].classes()).toContain('bid-winning')
  })

  it('shows winner indicator for winning bid', () => {
    expect(factory().find('.winner-indicator').exists()).toBe(true)
  })

  it('shows highest indicator for first non-winning bid', () => {
    const singleBid = [
      { id: 'b1', user_id: 'user-1234-abcd', amount_cents: 500000, created_at: '2026-01-01', is_winning: false },
    ]
    const w = factory({ bids: singleBid })
    expect(w.find('.highest-indicator').exists()).toBe(true)
  })
})
