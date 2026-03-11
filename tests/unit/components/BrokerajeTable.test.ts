/**
 * Tests for app/components/admin/brokeraje/BrokerajeTable.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminBrokerage', () => ({
  getStatusLabel: (s: string) => s.toUpperCase(),
  getStatusColor: () => '#3b82f6',
  getDealModeLabel: (m: string) => m === 'broker' ? 'Broker' : 'Tank',
  formatDealPrice: (p: number | null) => (p ? `${p} €` : '-'),
  formatDealDate: (d: string) => d,
}))

import BrokerajeTable from '../../../app/components/admin/brokeraje/BrokerajeTable.vue'

describe('BrokerajeTable', () => {
  const deals = [
    {
      id: 'd-1',
      vehicle_id: 'v-1',
      buyer_id: 'u-1',
      buyer_phone: '+34 600 000 000',
      deal_mode: 'broker' as const,
      status: 'active' as const,
      asking_price: 85000,
      created_at: '2026-03-01',
      vehicle: { brand: 'Volvo', model: 'FH 500', year: 2022 },
      buyer: { email: 'buyer@example.com' },
    },
    {
      id: 'd-2',
      vehicle_id: null,
      buyer_id: null,
      buyer_phone: '+34 611 222 333',
      deal_mode: 'tank' as const,
      status: 'closed' as const,
      asking_price: null,
      created_at: '2026-02-15',
      vehicle: null,
      buyer: null,
    },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(BrokerajeTable, {
      props: {
        deals,
        loading: false,
        error: null,
        ...overrides,
      },
    })

  it('renders table wrapper', () => {
    expect(factory().find('.table-wrapper').exists()).toBe(true)
  })

  it('renders data table', () => {
    expect(factory().find('.data-table').exists()).toBe(true)
  })

  it('renders 6 headers', () => {
    expect(factory().findAll('th')).toHaveLength(6)
  })

  it('renders deal rows', () => {
    expect(factory().findAll('.table-row')).toHaveLength(2)
  })

  it('shows vehicle title', () => {
    expect(factory().find('.cell-vehicle').text()).toBe('Volvo FH 500 2022')
  })

  it('shows dash for missing vehicle', () => {
    const rows = factory().findAll('.table-row')
    expect(rows[1].find('.cell-vehicle').text()).toBe('-')
  })

  it('shows buyer email', () => {
    expect(factory().find('.cell-buyer').text()).toBe('buyer@example.com')
  })

  it('shows buyer phone when no email', () => {
    const rows = factory().findAll('.table-row')
    expect(rows[1].find('.cell-buyer').text()).toBe('+34 611 222 333')
  })

  it('shows status badge', () => {
    expect(factory().find('.status-badge').text()).toBe('ACTIVE')
  })

  it('shows mode badge', () => {
    expect(factory().find('.mode-badge').text()).toBe('Broker')
  })

  it('emits select on row click', async () => {
    const w = factory()
    await w.find('.table-row').trigger('click')
    expect(w.emitted('select')).toBeTruthy()
  })

  it('shows loading state', () => {
    const w = factory({ loading: true })
    expect(w.find('.table-loading').exists()).toBe(true)
  })

  it('shows error state', () => {
    const w = factory({ error: 'Connection failed' })
    expect(w.find('.table-error').text()).toBe('Connection failed')
  })

  it('shows empty state', () => {
    const w = factory({ deals: [] })
    expect(w.find('.table-empty').exists()).toBe(true)
  })

  it('shows mobile cards', () => {
    expect(factory().findAll('.deal-card')).toHaveLength(2)
  })

  it('shows formatted price', () => {
    expect(factory().text()).toContain('85000 €')
  })
})
