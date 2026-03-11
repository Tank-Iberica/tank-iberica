/**
 * Tests for app/components/admin/transporte/TransporteCards.vue
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('~/composables/shared/useListingUtils', () => ({
  formatPriceCents: (v: number | null) => (v ? `${(v / 100).toFixed(2)} €` : '—'),
}))

vi.mock('~/composables/admin/useAdminTransporte', () => ({
  STATUS_OPTIONS: ['pending', 'accepted', 'in_transit', 'completed', 'cancelled'],
}))

import { shallowMount } from '@vue/test-utils'
import TransporteCards from '../../../app/components/admin/transporte/TransporteCards.vue'

describe('TransporteCards', () => {
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
    },
    {
      id: 'req-2',
      vehicles: null,
      user_id: '12345678-abcd',
      origin: null,
      destination_postal_code: null,
      estimated_price_cents: null,
      status: 'completed',
      created_at: null,
    },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(TransporteCards, {
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

  it('renders card list', () => {
    expect(factory().find('.card-list').exists()).toBe(true)
  })

  it('renders a card per request', () => {
    expect(factory().findAll('.request-card')).toHaveLength(2)
  })

  it('shows vehicle title', () => {
    expect(factory().find('.card-vehicle').text()).toBe('Camión Volvo FH')
  })

  it('shows dash for missing vehicle', () => {
    const cards = factory().findAll('.card-vehicle')
    expect(cards[1].text()).toBe('-')
  })

  it('shows status badge with class', () => {
    const badge = factory().find('.status-badge')
    expect(badge.classes()).toContain('status-pending')
    expect(badge.text()).toBe('PENDING')
  })

  it('shows 4 detail fields per card', () => {
    expect(factory().findAll('.request-card')[0].findAll('.card-detail')).toHaveLength(4)
  })

  it('shows origin detail', () => {
    const vals = factory().findAll('.request-card')[0].findAll('.detail-value')
    expect(vals[0].text()).toBe('Madrid')
  })

  it('shows formatted price', () => {
    const vals = factory().findAll('.request-card')[0].findAll('.detail-value')
    expect(vals[2].text()).toBe('450.00 €')
  })

  it('shows formatted date', () => {
    const vals = factory().findAll('.request-card')[0].findAll('.detail-value')
    expect(vals[3].text()).toBe('2026-03-01')
  })

  it('emits toggleExpand on header click', async () => {
    const w = factory()
    await w.find('.card-header').trigger('click')
    expect(w.emitted('toggleExpand')?.[0]?.[0]).toBe('req-1')
  })

  it('applies expanded class when expandedId matches', () => {
    const w = factory({ expandedId: 'req-1' })
    expect(w.find('.request-card').classes()).toContain('expanded')
  })

  it('shows expanded section when expandedId matches', () => {
    const w = factory({ expandedId: 'req-1' })
    expect(w.find('.card-expanded').exists()).toBe(true)
  })

  it('hides expanded section when no expandedId', () => {
    expect(factory().find('.card-expanded').exists()).toBe(false)
  })

  it('shows status select with 5 options in expanded', () => {
    const w = factory({ expandedId: 'req-1' })
    expect(w.findAll('.card-expanded option')).toHaveLength(5)
  })

  it('shows notes textarea in expanded', () => {
    const w = factory({ expandedId: 'req-1' })
    expect(w.find('.notes-field textarea').exists()).toBe(true)
  })

  it('shows save button in expanded', () => {
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

  it('shows expand icon', () => {
    expect(factory().find('.card-expand-icon svg').exists()).toBe(true)
  })

  it('rotates expand icon when expanded', () => {
    const w = factory({ expandedId: 'req-1' })
    expect(w.find('.card-expand-icon svg').classes()).toContain('rotated')
  })
})
