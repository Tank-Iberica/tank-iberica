/**
 * Tests for app/components/admin/suscripciones/AdminSubscriptionsTable.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminSubscriptions', () => ({
  SUBSCRIPTION_PREFS: [
    { key: 'new_vehicles', label: 'Nuevos vehículos', color: '#3b82f6' },
    { key: 'price_drops', label: 'Bajadas de precio', color: '#22c55e' },
    { key: 'market_reports', label: 'Informes de mercado', color: '#8b5cf6' },
  ],
}))

import AdminSubscriptionsTable from '../../../app/components/admin/suscripciones/AdminSubscriptionsTable.vue'

describe('AdminSubscriptionsTable', () => {
  const subscriptions = [
    {
      id: 's-1',
      email: 'test@example.com',
      new_vehicles: true,
      price_drops: true,
      market_reports: false,
      created_at: '2026-01-15T10:00:00Z',
    },
    {
      id: 's-2',
      email: 'otro@example.com',
      new_vehicles: false,
      price_drops: false,
      market_reports: false,
      created_at: '2026-02-20T14:00:00Z',
    },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminSubscriptionsTable, {
      props: { subscriptions, ...overrides },
    })

  it('renders table container', () => {
    expect(factory().find('.table-container').exists()).toBe(true)
  })

  it('renders 4 table headers', () => {
    expect(factory().findAll('th')).toHaveLength(4)
  })

  it('renders subscription rows', () => {
    expect(factory().findAll('tbody tr')).toHaveLength(2)
  })

  it('shows email', () => {
    expect(factory().find('.email-cell').text()).toBe('test@example.com')
  })

  it('shows active pref chips', () => {
    const chips = factory().findAll('.pref-chip')
    expect(chips).toHaveLength(2) // new_vehicles + price_drops for first row
  })

  it('shows no-prefs for second row', () => {
    expect(factory().find('.no-prefs').text()).toBe('Sin preferencias')
  })

  it('renders delete button', () => {
    expect(factory().find('.btn-delete').exists()).toBe(true)
  })

  it('emits confirm-delete on delete click', async () => {
    const w = factory()
    await w.find('.btn-delete').trigger('click')
    expect(w.emitted('confirm-delete')![0]).toEqual([subscriptions[0]])
  })

  it('shows empty state when no subscriptions', () => {
    expect(factory({ subscriptions: [] }).find('.empty-state').exists()).toBe(true)
  })
})
