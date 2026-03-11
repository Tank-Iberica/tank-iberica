/**
 * Tests for app/components/dashboard/herramientas/factura/FacturaTotals.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'

beforeAll(() => {
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'es' } }))
})

import FacturaTotals from '../../../app/components/dashboard/herramientas/factura/FacturaTotals.vue'

describe('FacturaTotals', () => {
  const fmt = (v: number) => `${v.toFixed(2)} €`

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(FacturaTotals, {
      props: { subtotal: 1000, totalIva: 210, total: 1210, formatCurrency: fmt, ...overrides },
    })

  it('renders totals container', () => {
    expect(factory().find('.invoice-totals').exists()).toBe(true)
  })

  it('renders 3 rows', () => {
    expect(factory().findAll('.invoice-totals__row')).toHaveLength(3)
  })

  it('shows base amount label', () => {
    const rows = factory().findAll('.invoice-totals__row')
    expect(rows[0].text()).toContain('dashboard.tools.invoice.baseAmount')
  })

  it('shows formatted subtotal', () => {
    expect(factory().findAll('.invoice-totals__row')[0].text()).toContain('1000.00 €')
  })

  it('shows IVA label', () => {
    expect(factory().findAll('.invoice-totals__row')[1].text()).toContain('dashboard.tools.invoice.totalIVA')
  })

  it('shows formatted IVA', () => {
    expect(factory().findAll('.invoice-totals__row')[1].text()).toContain('210.00 €')
  })

  it('shows grand total with special class', () => {
    const grand = factory().find('.invoice-totals__row--grand')
    expect(grand.exists()).toBe(true)
    expect(grand.text()).toContain('1210.00 €')
  })

  it('grand total shows label', () => {
    expect(factory().find('.invoice-totals__row--grand').text()).toContain('dashboard.tools.invoice.grandTotal')
  })
})
