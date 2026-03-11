/**
 * Tests for app/components/admin/facturacion/FacturacionRevenueByType.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminFacturacion', () => ({
  formatAmount: (v: number) => `€${(v / 100).toFixed(2)}`,
  getServiceTypeLabel: (t: string) => t.toUpperCase(),
}))

import FacturacionRevenueByType from '../../../app/components/admin/facturacion/FacturacionRevenueByType.vue'

describe('FacturacionRevenueByType', () => {
  const revenueByType: [string, number][] = [
    ['transport', 60000],
    ['verification', 40000],
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(FacturacionRevenueByType, {
      props: {
        revenueByType,
        totalRevenue: 100000,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders section card', () => {
    expect(factory().find('.section-card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.section-title').text()).toBe('billing.byType')
  })

  it('renders type rows', () => {
    expect(factory().findAll('.type-row')).toHaveLength(2)
  })

  it('shows type labels', () => {
    const labels = factory().findAll('.type-label')
    expect(labels[0].text()).toBe('TRANSPORT')
    expect(labels[1].text()).toBe('VERIFICATION')
  })

  it('shows formatted amounts', () => {
    const amounts = factory().findAll('.type-amount')
    expect(amounts[0].text()).toBe('€600.00')
  })

  it('shows percentage', () => {
    const pcts = factory().findAll('.type-pct')
    expect(pcts[0].text()).toBe('60.0%')
    expect(pcts[1].text()).toBe('40.0%')
  })

  it('renders progress bars', () => {
    expect(factory().findAll('.type-bar-fill')).toHaveLength(2)
  })

  it('sets bar width from percentage', () => {
    const bars = factory().findAll('.type-bar-fill')
    expect(bars[0].attributes('style')).toContain('width: 60%')
  })

  it('handles zero total revenue', () => {
    const w = factory({ totalRevenue: 0 })
    expect(w.findAll('.type-pct')[0].text()).toBe('0.0%')
  })
})
