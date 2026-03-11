/**
 * Tests for app/components/admin/pagos/PagosPaymentTable.vue
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

import PagosPaymentTable from '../../../app/components/admin/pagos/PagosPaymentTable.vue'

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

describe('PagosPaymentTable', () => {
  const factory = (payments = [basePayment], expandedId: string | null = null) =>
    shallowMount(PagosPaymentTable, {
      props: { payments, expandedId },
      global: {
        mocks: { $t: (key: string) => key },
      },
    })

  it('renders table with header row', () => {
    const w = factory()
    expect(w.find('table').exists()).toBe(true)
    expect(w.findAll('th').length).toBe(7)
  })

  it('renders a row for each payment', () => {
    const w = factory([basePayment, { ...basePayment, id: 'pay-2' }])
    expect(w.findAll('.table-row')).toHaveLength(2)
  })

  it('shows truncated id in first cell', () => {
    const w = factory()
    expect(w.find('.cell-id').text()).toBe('pay-1234')
  })

  it('shows type badge', () => {
    const w = factory()
    expect(w.find('.type-badge').classes()).toContain('type-subscription')
  })

  it('shows status badge', () => {
    const w = factory()
    expect(w.find('.status-badge').classes()).toContain('status-succeeded')
  })

  it('shows formatted amount', () => {
    const w = factory()
    expect(w.find('.cell-amount').text()).toBe('79.00€')
  })

  it('shows stripe link when stripe_payment_id exists', () => {
    const w = factory()
    const link = w.find('.stripe-link')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('https://stripe.com/pi_test123')
  })

  it('shows dash when stripe_payment_id is null', () => {
    const w = factory([{ ...basePayment, stripe_payment_id: null }])
    expect(w.find('.no-stripe').text()).toBe('-')
  })

  it('emits toggle-expand on row click', async () => {
    const w = factory()
    await w.find('.table-row').trigger('click')
    expect(w.emitted('toggle-expand')).toEqual([['pay-12345678-abcd']])
  })

  it('shows expanded row when expandedId matches', () => {
    const w = factory([basePayment], 'pay-12345678-abcd')
    expect(w.find('.expanded-row').exists()).toBe(true)
  })

  it('hides expanded row when expandedId does not match', () => {
    const w = factory([basePayment], null)
    expect(w.find('.expanded-row').exists()).toBe(false)
  })

  it('applies expanded class when expandedId matches', () => {
    const w = factory([basePayment], 'pay-12345678-abcd')
    expect(w.find('.table-row').classes()).toContain('expanded')
  })

  it('shows description in expanded row', () => {
    const w = factory([basePayment], 'pay-12345678-abcd')
    expect(w.find('.expanded-content').text()).toContain('Monthly subscription')
  })

  it('shows metadata in expanded row', () => {
    const w = factory([basePayment], 'pay-12345678-abcd')
    expect(w.find('.metadata-pre').exists()).toBe(true)
  })

  it('hides description field when description is empty', () => {
    const p = { ...basePayment, description: '' }
    const w = factory([p], p.id)
    const fields = w.findAll('.expanded-field')
    const texts = fields.map(f => f.text())
    expect(texts.some(t => t.includes('admin.pagos.description'))).toBe(false)
  })
})
