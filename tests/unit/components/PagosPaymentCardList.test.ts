/**
 * Tests for app/components/admin/pagos/PagosPaymentCardList.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminPagos', () => ({
  formatCurrency: (cents: number) => `${(cents / 100).toFixed(2)}€`,
  formatDate: (d: string) => d.split('T')[0],
  truncateId: (id: string) => id.substring(0, 8),
  getTypeBadgeClass: (type: string) => `type-${type}`,
  getStatusBadgeClass: (status: string) => `status-${status}`,
  getStripePaymentUrl: (id: string) => `https://stripe.com/${id}`,
}))

import PagosPaymentCardList from '../../../app/components/admin/pagos/PagosPaymentCardList.vue'

const basePayment = {
  id: 'pay-12345678-abcd',
  user_id: 'user-1234-5678',
  type: 'subscription',
  amount_cents: 7900,
  status: 'succeeded',
  stripe_payment_id: 'pi_test123',
  created_at: '2026-01-15T10:00:00Z',
  description: 'Monthly subscription',
  metadata: { plan: 'premium' },
}

describe('PagosPaymentCardList', () => {
  const factory = (payments = [basePayment], expandedId: string | null = null) =>
    shallowMount(PagosPaymentCardList, {
      props: { payments, expandedId },
      global: {
        mocks: { $t: (key: string) => key },
      },
    })

  it('renders a card for each payment', () => {
    const w = factory([basePayment, { ...basePayment, id: 'pay-2' }])
    expect(w.findAll('.payment-card')).toHaveLength(2)
  })

  it('shows type badge with correct class', () => {
    const w = factory()
    expect(w.find('.type-badge').classes()).toContain('type-subscription')
  })

  it('shows status badge with correct class', () => {
    const w = factory()
    expect(w.find('.status-badge').classes()).toContain('status-succeeded')
  })

  it('displays formatted amount', () => {
    const w = factory()
    expect(w.find('.detail-amount').text()).toBe('79.00€')
  })

  it('displays truncated user id', () => {
    const w = factory()
    const monos = w.findAll('.mono-text')
    expect(monos[0].text()).toBe('user-123')
  })

  it('emits toggle-expand on card header click', async () => {
    const w = factory()
    await w.find('.card-header').trigger('click')
    expect(w.emitted('toggle-expand')).toEqual([['pay-12345678-abcd']])
  })

  it('applies expanded class when expandedId matches', () => {
    const w = factory([basePayment], 'pay-12345678-abcd')
    expect(w.find('.payment-card').classes()).toContain('expanded')
  })

  it('shows expanded section when expandedId matches', () => {
    const w = factory([basePayment], 'pay-12345678-abcd')
    expect(w.find('.card-expanded').exists()).toBe(true)
  })

  it('hides expanded section when expandedId does not match', () => {
    const w = factory([basePayment], null)
    expect(w.find('.card-expanded').exists()).toBe(false)
  })

  it('shows description in expanded section', () => {
    const w = factory([basePayment], 'pay-12345678-abcd')
    expect(w.text()).toContain('Monthly subscription')
  })

  it('shows stripe link in expanded section', () => {
    const w = factory([basePayment], 'pay-12345678-abcd')
    const link = w.find('.stripe-link')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('https://stripe.com/pi_test123')
  })

  it('shows metadata in expanded section', () => {
    const w = factory([basePayment], 'pay-12345678-abcd')
    expect(w.find('.metadata-pre').exists()).toBe(true)
  })

  it('hides stripe link when stripe_payment_id is null', () => {
    const p = { ...basePayment, stripe_payment_id: null }
    const w = factory([p], p.id)
    expect(w.find('.stripe-link').exists()).toBe(false)
  })

  it('shows dash when stripe_payment_id is null in card view', () => {
    const p = { ...basePayment, stripe_payment_id: null }
    const w = factory([p])
    expect(w.text()).toContain('-')
  })

  it('rotates chevron icon when expanded', () => {
    const w = factory([basePayment], 'pay-12345678-abcd')
    expect(w.find('.card-expand-icon svg').classes()).toContain('rotated')
  })
})
