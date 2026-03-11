/**
 * Tests for app/components/admin/transporte/TransporteTable.vue
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('~/composables/shared/useListingUtils', () => ({
  formatPriceCents: (v: number | null) => (v ? `${(v / 100).toFixed(2)} €` : '—'),
}))

vi.mock('~/composables/admin/useAdminTransporte', () => ({
  STATUS_OPTIONS: ['pending', 'accepted', 'in_transit', 'completed', 'cancelled'],
}))

import { shallowMount } from '@vue/test-utils'
import TransporteTable from '../../../app/components/admin/transporte/TransporteTable.vue'

describe('TransporteTable', () => {
  const requests = [
    {
      id: 'req-1',
      vehicles: { title: 'Camión Volvo FH' },
      user_id: 'abcdefgh-1234',
      origin: 'Madrid',
      destination_postal_code: '28001',
      estimated_price_cents: 45000,
      status: 'pending',
      created_at: '2026-03-01',
      admin_notes: 'Urgent',
    },
    {
      id: 'req-2',
      vehicles: null,
      user_id: '12345678-abcd',
      origin: null,
      destination_postal_code: null,
      estimated_price_cents: null,
      status: 'completed',
      created_at: '2026-02-15',
      admin_notes: '',
    },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(TransporteTable, {
      props: {
        requests,
        expandedId: null,
        editingNotes: '',
        savingNotes: false,
        updatingStatus: null,
        getStatusClass: (s: string) => `status-${s}`,
        getStatusLabel: (s: string) => s.toUpperCase(),
        formatDate: (d: string | null) => d || '—',
        ...overrides,
      },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders table wrapper', () => {
    expect(factory().find('.table-wrapper').exists()).toBe(true)
  })

  it('renders data table', () => {
    expect(factory().find('.data-table').exists()).toBe(true)
  })

  it('renders 7 headers', () => {
    expect(factory().findAll('th')).toHaveLength(7)
  })

  it('renders rows for each request', () => {
    expect(factory().findAll('.table-row')).toHaveLength(2)
  })

  it('shows vehicle title', () => {
    expect(factory().find('.cell-vehicle').text()).toBe('Camión Volvo FH')
  })

  it('shows dash for missing vehicle', () => {
    const rows = factory().findAll('.table-row')
    expect(rows[1].find('.cell-vehicle').text()).toBe('-')
  })

  it('shows truncated user id', () => {
    expect(factory().find('.cell-requester').text()).toBe('abcdefgh...')
  })

  it('shows origin', () => {
    const tds = factory().findAll('.table-row')[0].findAll('td')
    expect(tds[2].text()).toBe('Madrid')
  })

  it('shows dash for missing origin', () => {
    const tds = factory().findAll('.table-row')[1].findAll('td')
    expect(tds[2].text()).toBe('-')
  })

  it('shows formatted price', () => {
    const tds = factory().findAll('.table-row')[0].findAll('td')
    expect(tds[4].text()).toBe('450.00 €')
  })

  it('shows status badge with class', () => {
    const badge = factory().find('.status-badge')
    expect(badge.classes()).toContain('status-pending')
    expect(badge.text()).toBe('PENDING')
  })

  it('shows formatted date', () => {
    const tds = factory().findAll('.table-row')[0].findAll('td')
    expect(tds[6].text()).toBe('2026-03-01')
  })

  it('emits toggleExpand on row click', async () => {
    const w = factory()
    await w.find('.table-row').trigger('click')
    expect(w.emitted('toggleExpand')?.[0]?.[0]).toBe('req-1')
  })

  it('applies expanded class on expanded row', () => {
    const w = factory({ expandedId: 'req-1' })
    expect(w.find('.table-row').classes()).toContain('expanded')
  })

  it('shows expanded row when expandedId matches', () => {
    const w = factory({ expandedId: 'req-1' })
    expect(w.find('.expanded-row').exists()).toBe(true)
  })

  it('hides expanded row when expandedId is null', () => {
    expect(factory().find('.expanded-row').exists()).toBe(false)
  })

  it('shows status select in expanded row with 5 options', () => {
    const w = factory({ expandedId: 'req-1' })
    expect(w.findAll('.expanded-row option')).toHaveLength(5)
  })

  it('shows notes textarea in expanded row', () => {
    const w = factory({ expandedId: 'req-1' })
    expect(w.find('.notes-field textarea').exists()).toBe(true)
  })

  it('shows save notes button', () => {
    const w = factory({ expandedId: 'req-1' })
    expect(w.find('.btn-save-notes').exists()).toBe(true)
  })

  it('disables save button when savingNotes', () => {
    const w = factory({ expandedId: 'req-1', savingNotes: true })
    expect(w.find('.btn-save-notes').attributes('disabled')).toBeDefined()
  })

  it('emits saveNotes on save click', async () => {
    const w = factory({ expandedId: 'req-1' })
    await w.find('.btn-save-notes').trigger('click')
    expect(w.emitted('saveNotes')?.[0]?.[0]).toBe('req-1')
  })
})
