/**
 * Tests for app/components/admin/balance/DesgloseGrid.vue
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('~/composables/admin/useAdminBalanceUI', () => ({
  fmt: (val: number) => `${val} €`,
}))

import { shallowMount } from '@vue/test-utils'
import DesgloseGrid from '../../../app/components/admin/balance/DesgloseGrid.vue'

describe('BalanceDesgloseGrid', () => {
  const reasonOptions: [string, string][] = [
    ['sale', 'Venta'],
    ['subscription', 'Suscripción'],
  ]

  const summary = {
    totalIngresos: 1000,
    totalGastos: 500,
    balanceNeto: 500,
    byReason: {
      sale: { ingresos: 800, gastos: 200 },
      subscription: { ingresos: 200, gastos: 300 },
    },
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DesgloseGrid, {
      props: {
        showDesglose: true,
        reasonOptions,
        summary,
        ...overrides,
      },
    })

  it('renders grid when showDesglose is true', () => {
    expect(factory().find('.desglose-grid').exists()).toBe(true)
  })

  it('hides grid when showDesglose is false', () => {
    expect(factory({ showDesglose: false }).find('.desglose-grid').exists()).toBe(false)
  })

  it('renders items for each reason', () => {
    expect(factory().findAll('.desglose-item')).toHaveLength(2)
  })

  it('shows reason labels', () => {
    const items = factory().findAll('.desglose-label')
    expect(items[0].text()).toBe('Venta')
    expect(items[1].text()).toBe('Suscripción')
  })

  it('shows formatted income values', () => {
    const ings = factory().findAll('.ing')
    expect(ings[0].text()).toContain('800 €')
  })

  it('shows formatted expense values', () => {
    const gas = factory().findAll('.gas')
    expect(gas[0].text()).toContain('200 €')
  })
})
