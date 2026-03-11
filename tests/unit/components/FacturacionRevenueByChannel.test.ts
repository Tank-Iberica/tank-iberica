/**
 * Tests for app/components/admin/facturacion/FacturacionRevenueByChannel.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminFacturacion', () => ({
  formatAmount: (v: number) => `${(v / 100).toFixed(2)} €`,
}))

import FacturacionRevenueByChannel from '../../../app/components/admin/facturacion/FacturacionRevenueByChannel.vue'

describe('FacturacionRevenueByChannel', () => {
  const channelRevenue = [
    { key: 'stripe', label: 'Stripe', amount: 500000, percentage: 62.5 },
    { key: 'transfer', label: 'Transferencia', amount: 300000, percentage: 37.5 },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(FacturacionRevenueByChannel, {
      props: { channelRevenue, ...overrides },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders section card', () => {
    expect(factory().find('.section-card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.section-title').text()).toBe('billing.revenueByChannel')
  })

  it('renders channel rows', () => {
    expect(factory().findAll('.type-row')).toHaveLength(2)
  })

  it('shows channel label', () => {
    expect(factory().findAll('.type-label')[0].text()).toBe('Stripe')
  })

  it('shows formatted amount', () => {
    expect(factory().findAll('.type-amount')[0].text()).toBe('5000.00 €')
  })

  it('shows percentage', () => {
    expect(factory().findAll('.type-pct')[0].text()).toBe('62.5%')
  })

  it('sets bar width from percentage', () => {
    expect(factory().findAll('.type-bar-fill')[0].attributes('style')).toContain('width: 62.5%')
  })

  it('renders second channel', () => {
    expect(factory().findAll('.type-label')[1].text()).toBe('Transferencia')
  })
})
