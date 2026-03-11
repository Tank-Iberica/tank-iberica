/**
 * Tests for app/components/perfil/reservas/ReservationCard.vue
 */
import { vi, describe, it, expect } from 'vitest'

vi.stubGlobal('useImageUrl', () => ({
  getImageUrl: (url: string, _variant: string) => `https://img.test/${url}`,
}))

import { shallowMount } from '@vue/test-utils'
import ReservationCard from '../../../app/components/perfil/reservas/ReservationCard.vue'

const baseReservation = {
  id: 'r1',
  vehicle_id: 'v1',
  vehicle_title: 'Scania R450',
  vehicle_image: 'img1.jpg',
  seller_name: 'Dealer Motors',
  deposit_cents: 50000,
  subscription_freebie: false,
  seller_response: null as string | null,
  seller_responded_at: null as string | null,
  created_at: '2026-03-01T10:00:00Z',
}

describe('ReservationCard', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ReservationCard, {
      props: {
        reservation: { ...baseReservation },
        statusLabel: 'reservations.statusPending',
        statusClass: 'status--pending',
        countdown: '2d 5h',
        canCancel: true,
        canConfirm: false,
        isCancelling: false,
        isConfirming: false,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders card', () => {
    expect(factory().find('.reservation-card').exists()).toBe(true)
  })

  it('shows vehicle title', () => {
    expect(factory().find('.reservation-card__title').text()).toBe('Scania R450')
  })

  it('shows seller name', () => {
    expect(factory().find('.reservation-card__seller').text()).toContain('Dealer Motors')
  })

  it('shows status badge with class', () => {
    const badge = factory().find('.status-badge')
    expect(badge.classes()).toContain('status--pending')
  })

  it('shows deposit amount', () => {
    expect(factory().html()).toContain('500')
  })

  it('shows countdown', () => {
    expect(factory().find('.detail-value--countdown').text()).toBe('2d 5h')
  })

  it('hides countdown when null', () => {
    const w = factory({ countdown: null })
    expect(w.find('.detail-value--countdown').exists()).toBe(false)
  })

  it('shows freebie badge when subscription_freebie', () => {
    const w = factory({ reservation: { ...baseReservation, subscription_freebie: true } })
    expect(w.find('.freebie-badge').exists()).toBe(true)
  })

  it('hides freebie badge by default', () => {
    expect(factory().find('.freebie-badge').exists()).toBe(false)
  })

  it('shows cancel button when canCancel', () => {
    expect(factory().find('.btn-cancel').exists()).toBe(true)
  })

  it('hides confirm button when canConfirm is false', () => {
    expect(factory().find('.btn-confirm').exists()).toBe(false)
  })

  it('shows confirm button when canConfirm', () => {
    const w = factory({ canConfirm: true })
    expect(w.find('.btn-confirm').exists()).toBe(true)
  })

  it('emits cancel on cancel click', async () => {
    const w = factory()
    await w.find('.btn-cancel').trigger('click')
    expect(w.emitted('cancel')).toBeTruthy()
  })

  it('emits confirm on confirm click', async () => {
    const w = factory({ canConfirm: true })
    await w.find('.btn-confirm').trigger('click')
    expect(w.emitted('confirm')).toBeTruthy()
  })

  it('disables cancel when cancelling', () => {
    const w = factory({ isCancelling: true })
    expect(w.find('.btn-cancel').attributes('disabled')).toBeDefined()
  })

  it('hides actions when neither canCancel nor canConfirm', () => {
    const w = factory({ canCancel: false, canConfirm: false })
    expect(w.find('.reservation-card__actions').exists()).toBe(false)
  })

  it('shows seller response when present', () => {
    const w = factory({
      reservation: { ...baseReservation, seller_response: 'Acepto la reserva' },
    })
    expect(w.find('.response-content').text()).toBe('Acepto la reserva')
  })

  it('hides seller response by default', () => {
    expect(factory().find('.reservation-card__response').exists()).toBe(false)
  })

  it('shows image placeholder when no image', () => {
    const w = factory({ reservation: { ...baseReservation, vehicle_image: null } })
    expect(w.find('.reservation-card__image-placeholder').exists()).toBe(true)
  })
})
