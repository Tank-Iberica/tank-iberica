/**
 * Tests for app/components/dashboard/invoice/InvoiceHistory.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import InvoiceHistory from '../../../app/components/dashboard/invoice/InvoiceHistory.vue'

const invoices = [
  {
    id: 'inv1',
    invoice_date: '2026-01-15',
    invoice_number: 'INV-001',
    client_name: 'Empresa A',
    total: 5000,
    status: 'paid',
  },
  {
    id: 'inv2',
    invoice_date: '2026-02-01',
    invoice_number: 'INV-002',
    client_name: 'Empresa B',
    total: 3200,
    status: 'draft',
  },
]

describe('InvoiceHistory', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(InvoiceHistory, {
      props: {
        invoices,
        loading: false,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('shows loading state', () => {
    const w = factory({ loading: true })
    expect(w.find('.invoice-history__loading').exists()).toBe(true)
  })

  it('shows empty state when no invoices', () => {
    const w = factory({ invoices: [] })
    expect(w.find('.invoice-history__empty').exists()).toBe(true)
  })

  it('renders history list', () => {
    expect(factory().find('.history-list').exists()).toBe(true)
  })

  it('renders table with headers', () => {
    expect(factory().findAll('.history-table th')).toHaveLength(5)
  })

  it('renders 2 table rows', () => {
    expect(factory().findAll('.history-table tbody tr')).toHaveLength(2)
  })

  it('shows invoice number', () => {
    expect(factory().html()).toContain('INV-001')
  })

  it('shows client name', () => {
    expect(factory().html()).toContain('Empresa A')
  })

  it('shows status badge with class', () => {
    const badges = factory().findAll('.status-badge')
    expect(badges[0].classes()).toContain('status-paid')
  })

  it('renders mobile history cards', () => {
    expect(factory().findAll('.history-card')).toHaveLength(2)
  })

  it('shows mobile card number', () => {
    expect(factory().find('.history-card__number').text()).toBe('INV-001')
  })

  it('shows mobile card client', () => {
    expect(factory().find('.history-card__client').text()).toBe('Empresa A')
  })

  it('shows dash for null invoice_date', () => {
    const w = factory({ invoices: [{ ...invoices[0], invoice_date: null }] })
    expect(w.text()).toContain('-')
  })
})
