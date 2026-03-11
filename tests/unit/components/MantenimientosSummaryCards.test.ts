/**
 * Tests for app/components/dashboard/herramientas/mantenimientos/MantenimientosSummaryCards.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'

beforeAll(() => {
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'es' } }))
})

import MantenimientosSummaryCards from '../../../app/components/dashboard/herramientas/mantenimientos/MantenimientosSummaryCards.vue'

describe('MantenimientosSummaryCards', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(MantenimientosSummaryCards, {
      props: {
        summaryTotalCostThisYear: 5000,
        summaryTotalRecords: 12,
        summaryAvgCost: 416,
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

  it('shows cost this year label', () => {
    expect(factory().find('.cost-year .card-label').text()).toBe(
      'dashboard.tools.maintenance.summary.costThisYear',
    )
  })

  it('shows formatted cost this year', () => {
    expect(factory().find('.cost-year .card-value').text()).toBe('5000 €')
  })

  it('shows total records count', () => {
    expect(factory().find('.total-records .card-value').text()).toBe('12')
  })

  it('shows formatted avg cost', () => {
    expect(factory().find('.avg-cost .card-value').text()).toBe('416 €')
  })
})
