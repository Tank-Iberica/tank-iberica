/**
 * Tests for app/components/admin/dealers/SuscripcionTable.vue
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('~/composables/shared/useListingUtils', () => ({
  formatPriceCents: (v: number | null) => (v ? `${(v / 100).toFixed(2)} €` : '—'),
}))

import { shallowMount } from '@vue/test-utils'
import SuscripcionTable from '../../../app/components/admin/dealers/SuscripcionTable.vue'

describe('SuscripcionTable', () => {
  const subs = [
    {
      id: 'sub-1',
      plan: 'premium',
      status: 'active',
      vertical: 'tracciona',
      started_at: '2026-01-01',
      expires_at: '2026-12-31',
      price_cents: 7900,
      dealer: { slug: 'dealer-one' },
    },
    {
      id: 'sub-2',
      plan: 'basic',
      status: 'canceled',
      vertical: 'tracciona',
      started_at: '2025-06-01',
      expires_at: '2025-12-31',
      price_cents: 2900,
      dealer: { slug: null },
    },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(SuscripcionTable, {
      props: {
        filteredSubscriptions: subs,
        saving: false,
        getPlanConfig: (plan: string) => ({ value: plan, label: plan.toUpperCase(), color: '#3b82f6' }),
        getStatusConfig: (status: string | null) => ({ value: status || '', label: (status || '').toUpperCase(), color: '#10b981' }),
        getDealerName: (sub: Record<string, unknown>) => `Dealer ${sub.id}`,
        formatDate: (d: string | null) => d || '—',
        isExpired: (d: string | null) => d === '2025-12-31',
        ...overrides,
      },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders table container', () => {
    expect(factory().find('.table-container').exists()).toBe(true)
  })

  it('renders admin table', () => {
    expect(factory().find('.admin-table').exists()).toBe(true)
  })

  it('renders 8 headers', () => {
    expect(factory().findAll('th')).toHaveLength(8)
  })

  it('renders rows for each subscription', () => {
    // 2 data rows (no empty row)
    expect(factory().findAll('tbody tr')).toHaveLength(2)
  })

  it('shows dealer name from function prop', () => {
    expect(factory().find('.dealer-info strong').text()).toBe('Dealer sub-1')
  })

  it('shows dealer slug when present', () => {
    expect(factory().find('.dealer-slug').text()).toBe('/dealer-one')
  })

  it('shows plan badge', () => {
    expect(factory().find('.plan-badge').text()).toBe('PREMIUM')
  })

  it('shows status badge', () => {
    expect(factory().find('.status-badge').text()).toBe('ACTIVE')
  })

  it('shows vertical badge', () => {
    expect(factory().find('.vertical-badge').text()).toBe('tracciona')
  })

  it('shows formatted dates', () => {
    const tds = factory().findAll('tbody tr')[0].findAll('td')
    expect(tds[4].text()).toBe('2026-01-01')
    expect(tds[5].text()).toBe('2026-12-31')
  })

  it('shows formatted price', () => {
    const tds = factory().findAll('tbody tr')[0].findAll('td')
    expect(tds[6].text()).toBe('79.00 €')
  })

  it('applies row-canceled class', () => {
    const rows = factory().findAll('tbody tr')
    expect(rows[1].classes()).toContain('row-canceled')
  })

  it('applies row-expired class when expired and active', () => {
    const expiredSubs = [
      { ...subs[0], expires_at: '2025-12-31', status: 'active' },
    ]
    const w = factory({ filteredSubscriptions: expiredSubs })
    expect(w.find('tbody tr').classes()).toContain('row-expired')
  })

  it('shows 3 action buttons for active subscription', () => {
    const btns = factory().findAll('tbody tr')[0].findAll('.btn-icon')
    expect(btns).toHaveLength(3)
  })

  it('hides cancel button for canceled subscription', () => {
    const btns = factory().findAll('tbody tr')[1].findAll('.btn-icon')
    expect(btns).toHaveLength(2)
  })

  it('emits change-plan on edit button click', async () => {
    const w = factory()
    await w.find('.btn-edit').trigger('click')
    expect(w.emitted('change-plan')?.[0]?.[0]).toEqual(subs[0])
  })

  it('emits extend on extend button click', async () => {
    const w = factory()
    await w.find('.btn-extend').trigger('click')
    expect(w.emitted('extend')?.[0]?.[0]).toEqual(subs[0])
  })

  it('emits cancel on cancel button click', async () => {
    const w = factory()
    await w.find('.btn-cancel').trigger('click')
    expect(w.emitted('cancel')?.[0]?.[0]).toEqual(subs[0])
  })

  it('shows empty state when no subscriptions', () => {
    const w = factory({ filteredSubscriptions: [] })
    expect(w.find('.empty-state').exists()).toBe(true)
  })

  it('applies text-expired class on expired date cell', () => {
    const expiredSubs = [
      { ...subs[0], expires_at: '2025-12-31', status: 'active' },
    ]
    const w = factory({ filteredSubscriptions: expiredSubs })
    expect(w.find('.text-expired').exists()).toBe(true)
  })
})
