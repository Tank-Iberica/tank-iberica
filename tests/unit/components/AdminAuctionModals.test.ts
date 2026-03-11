/**
 * Tests for app/components/admin/subastas/AdminAuctionModals.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminAuctionModals from '../../../app/components/admin/subastas/AdminAuctionModals.vue'

describe('AdminAuctionModals', () => {
  const auction = {
    id: 'a-1',
    reserve_price_cents: 5000000,
    current_bid_cents: 6500000,
  }

  const highestBid = {
    amount_cents: 6500000,
    user_id: 'user-123456789012',
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminAuctionModals, {
      props: {
        activeModal: 'cancel' as const,
        auction,
        highestBid,
        reserveMet: true,
        actionLoading: false,
        cancelReason: '',
        rejectReason: '',
        formatCents: (c: number | null) => (c ? `${c / 100} €` : '-'),
        ...overrides,
      },
      global: {
        stubs: { Teleport: true },
        mocks: { $t: (k: string) => k },
      },
    })

  // Cancel modal
  it('shows cancel modal', () => {
    expect(factory().find('.modal-sm').exists()).toBe(true)
  })

  it('shows cancel title', () => {
    expect(factory().find('h3').text()).toBe('admin.subastas.cancelTitle')
  })

  it('shows cancel reason textarea', () => {
    expect(factory().find('textarea').exists()).toBe(true)
  })

  it('emits confirmCancel on danger button click', async () => {
    const w = factory()
    await w.find('.btn-danger').trigger('click')
    expect(w.emitted('confirmCancel')).toBeTruthy()
  })

  it('emits close on cancel click', async () => {
    const w = factory()
    await w.find('.btn-secondary').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  // Adjudicate modal
  it('shows adjudicate modal', () => {
    const w = factory({ activeModal: 'adjudicate' })
    expect(w.find('.modal-md').exists()).toBe(true)
  })

  it('shows highest bid info', () => {
    const w = factory({ activeModal: 'adjudicate' })
    expect(w.find('.adjudicate-info').exists()).toBe(true)
  })

  it('shows reserve met indicator', () => {
    const w = factory({ activeModal: 'adjudicate' })
    expect(w.find('.reserve-met').exists()).toBe(true)
  })

  it('shows reserve not met warning', () => {
    const w = factory({ activeModal: 'adjudicate', reserveMet: false })
    expect(w.find('.reserve-not-met').exists()).toBe(true)
  })

  it('shows markNoSale button when reserve not met', () => {
    const w = factory({ activeModal: 'adjudicate', reserveMet: false })
    const btns = w.findAll('.btn-secondary')
    expect(btns.length).toBeGreaterThanOrEqual(2)
  })

  it('emits confirmAdjudicate', async () => {
    const w = factory({ activeModal: 'adjudicate' })
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('confirmAdjudicate')).toBeTruthy()
  })

  // Reject modal
  it('shows reject modal', () => {
    const w = factory({ activeModal: 'reject' })
    expect(w.find('.modal-sm').exists()).toBe(true)
  })

  it('shows reject title', () => {
    const w = factory({ activeModal: 'reject' })
    expect(w.find('h3').text()).toBe('admin.subastas.detail.rejectTitle')
  })

  it('emits confirmReject', async () => {
    const w = factory({ activeModal: 'reject' })
    await w.find('.btn-danger').trigger('click')
    expect(w.emitted('confirmReject')).toBeTruthy()
  })

  // No modal
  it('hides all modals when activeModal is none', () => {
    const w = factory({ activeModal: 'none' })
    expect(w.find('.modal').exists()).toBe(false)
  })
})
