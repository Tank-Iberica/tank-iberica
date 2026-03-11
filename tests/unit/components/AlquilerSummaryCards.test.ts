/**
 * Tests for app/components/dashboard/herramientas/alquileres/AlquilerSummaryCards.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'

beforeAll(() => {
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'es' } }))
})

import AlquilerSummaryCards from '../../../app/components/dashboard/herramientas/alquileres/AlquilerSummaryCards.vue'

describe('AlquilerSummaryCards', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AlquilerSummaryCards, {
      props: {
        totalActiveRentals: 3,
        totalMonthlyIncome: 2400,
        vehiclesAvailableSoon: 1,
        fmt: (v: number) => `${v} €`,
        ...overrides,
      },
    })

  it('renders summary cards', () => {
    expect(factory().find('.summary-cards').exists()).toBe(true)
  })

  it('renders 3 cards', () => {
    expect(factory().findAll('.summary-card')).toHaveLength(3)
  })

  it('shows active rentals count', () => {
    expect(factory().find('.active-rentals .card-value').text()).toBe('3')
  })

  it('shows active rentals label', () => {
    expect(factory().find('.active-rentals .card-label').text()).toBe(
      'dashboard.tools.rentals.summary.activeRentals',
    )
  })

  it('shows formatted monthly income', () => {
    expect(factory().find('.monthly-income .card-value').text()).toBe('2400 €')
  })

  it('shows vehicles available soon count', () => {
    expect(factory().find('.available-soon .card-value').text()).toBe('1')
  })
})
