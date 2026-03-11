/**
 * Tests for app/components/dashboard/herramientas/presupuesto/PresupuestoTotalCard.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/shared/useListingUtils', () => ({
  formatPrice: (v: number) => `${v} €`,
}))

import PresupuestoTotalCard from '../../../app/components/dashboard/herramientas/presupuesto/PresupuestoTotalCard.vue'

describe('PresupuestoTotalCard', () => {
  const factory = (amount = 5000) =>
    shallowMount(PresupuestoTotalCard, {
      props: { totalAmount: amount },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders total card', () => {
    expect(factory().find('.total-card').exists()).toBe(true)
  })

  it('shows label', () => {
    expect(factory().find('.total-label').text()).toBe('dashboard.quote.totalAmount')
  })

  it('shows formatted value', () => {
    expect(factory().find('.total-value').text()).toBe('5000 €')
  })

  it('formats different amounts', () => {
    expect(factory(12500).find('.total-value').text()).toBe('12500 €')
  })
})
