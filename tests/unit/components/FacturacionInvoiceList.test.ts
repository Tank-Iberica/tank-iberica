/**
 * Tests for app/components/admin/facturacion/FacturacionInvoiceList.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminFacturacion', () => ({
  formatAmount: (cents: number) => `${(cents / 100).toFixed(2)} €`,
  formatDate: (d: string) => d,
  getServiceTypeLabel: (t: string) => t.toUpperCase(),
  getStatusClass: (s: string) => `status-${s}`,
}))

import FacturacionInvoiceList from '../../../app/components/admin/facturacion/FacturacionInvoiceList.vue'

describe('FacturacionInvoiceList', () => {
  const invoices = [
    {
      id: 'inv-1',
      created_at: '2026-03-01',
      status: 'paid',
      service_type: 'subscription',
      amount_cents: 7900,
      tax_cents: 1659,
    },
    {
      id: 'inv-2',
      created_at: '2026-02-15',
      status: 'pending',
      service_type: 'transport',
      amount_cents: 15000,
      tax_cents: 3150,
    },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(FacturacionInvoiceList, {
      props: {
        invoices,
        ...overrides,
      },
    })

  it('renders section card', () => {
    expect(factory().find('.section-card').exists()).toBe(true)
  })

  it('shows section title', () => {
    expect(factory().find('.section-title').exists()).toBe(true)
  })

  it('renders invoice cards', () => {
    expect(factory().findAll('.invoice-card')).toHaveLength(2)
  })

  it('shows invoice date', () => {
    expect(factory().find('.invoice-date').text()).toBe('2026-03-01')
  })

  it('shows status with class', () => {
    const status = factory().find('.invoice-status')
    expect(status.classes()).toContain('status-paid')
  })

  it('shows service type badge', () => {
    expect(factory().find('.invoice-type-badge').text()).toBe('SUBSCRIPTION')
  })

  it('shows formatted amount', () => {
    expect(factory().find('.invoice-amount').text()).toBe('79.00 €')
  })

  it('shows formatted tax', () => {
    expect(factory().find('.invoice-tax').text()).toContain('16.59 €')
  })

  it('shows empty state when no invoices', () => {
    const w = factory({ invoices: [] })
    expect(w.find('.empty-state').exists()).toBe(true)
  })

  it('hides invoices list when empty', () => {
    const w = factory({ invoices: [] })
    expect(w.find('.invoices-list').exists()).toBe(false)
  })
})
