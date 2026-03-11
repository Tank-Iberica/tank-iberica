/**
 * Tests for app/components/admin/subastas/AdminAuctionCard.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'

vi.mock('~/composables/shared/useListingUtils', () => ({
  formatPriceCents: (cents: number | null) => cents ? `${cents / 100} €` : '-',
}))

beforeAll(() => {
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'es' } }))
})

import { shallowMount } from '@vue/test-utils'
import AdminAuctionCard from '../../../app/components/admin/subastas/AdminAuctionCard.vue'

describe('AdminAuctionCard', () => {
  const auction = {
    id: 'auc-1',
    title: 'Iveco Daily 2021',
    status: 'active',
    start_price_cents: 100000,
    current_bid_cents: 150000,
    reserve_price_cents: 200000,
    deposit_cents: 10000,
    bid_count: 8,
    registrations_count: 5,
    starts_at: '2026-01-01T10:00:00Z',
    ends_at: '2026-01-15T18:00:00Z',
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminAuctionCard, {
      props: {
        auction,
        saving: false,
        formatDate: (d: string | null) => d ?? '-',
        getStatusColor: () => '#10B981',
        getVehicleTitle: () => 'Iveco Daily 2021',
        canEdit: () => true,
        canCancel: () => true,
        canAdjudicate: () => false,
        ...overrides,
      },
    })

  it('renders card', () => {
    expect(factory().find('.auction-card').exists()).toBe(true)
  })

  it('shows auction title', () => {
    expect(factory().find('.auction-title').text()).toBe('Iveco Daily 2021')
  })

  it('shows status badge', () => {
    expect(factory().find('.status-badge').exists()).toBe(true)
  })

  it('shows bid count', () => {
    expect(factory().text()).toContain('8')
  })

  it('shows registrations count', () => {
    expect(factory().text()).toContain('5')
  })

  it('shows price values', () => {
    const text = factory().text()
    expect(text).toContain('1000 €')  // start_price
    expect(text).toContain('1500 €')  // current_bid
  })

  it('shows dates', () => {
    const text = factory().text()
    expect(text).toContain('2026-01-01T10:00:00Z')
    expect(text).toContain('2026-01-15T18:00:00Z')
  })

  it('shows edit button when canEdit', () => {
    expect(factory().find('.action-edit').exists()).toBe(true)
  })

  it('hides edit button when cannot edit', () => {
    expect(factory({ canEdit: () => false }).find('.action-edit').exists()).toBe(false)
  })

  it('shows cancel button when canCancel', () => {
    expect(factory().find('.action-cancel').exists()).toBe(true)
  })

  it('hides adjudicate button when canAdjudicate false', () => {
    expect(factory().find('.action-adjudicate').exists()).toBe(false)
  })

  it('shows adjudicate button when canAdjudicate', () => {
    expect(factory({ canAdjudicate: () => true }).find('.action-adjudicate').exists()).toBe(true)
  })

  it('disables action buttons when saving', () => {
    const w = factory({ saving: true })
    expect((w.find('.action-edit').element as HTMLButtonElement).disabled).toBe(true)
  })

  it('emits edit on edit click', async () => {
    const w = factory()
    await w.find('.action-edit').trigger('click')
    expect(w.emitted('edit')).toBeTruthy()
  })

  it('emits view-registrations on registrations click', async () => {
    const w = factory()
    await w.find('.action-registrations').trigger('click')
    expect(w.emitted('view-registrations')).toBeTruthy()
  })

  it('emits cancel on cancel click', async () => {
    const w = factory()
    await w.find('.action-cancel').trigger('click')
    expect(w.emitted('cancel')![0]).toEqual(['auc-1'])
  })

  it('emits adjudicate on adjudicate click', async () => {
    const w = factory({ canAdjudicate: () => true })
    await w.find('.action-adjudicate').trigger('click')
    expect(w.emitted('adjudicate')![0]).toEqual(['auc-1'])
  })
})
