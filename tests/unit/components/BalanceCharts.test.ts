/**
 * Tests for app/components/admin/balance/Charts.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminBalanceUI', () => ({
  fmt: (n: number) => `€${n.toFixed(2)}`,
}))

import BalanceCharts from '../../../app/components/admin/balance/Charts.vue'

const baseRazon = { labels: ['Venta', 'Comisión'], ingresos: [5000, 2000], gastos: [1000, 500] }
const baseSubcat = { labels: ['Camiones', 'Remolques'], beneficios: [15, -5] }

describe('BalanceCharts', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(BalanceCharts, {
      props: {
        showCharts: true,
        chartType: 'bar' as const,
        chartRazonData: { ...baseRazon },
        chartSubcatData: { ...baseSubcat },
        ...overrides,
      },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders when showCharts=true', () => {
    expect(factory().find('.charts-section').exists()).toBe(true)
  })

  it('hides when showCharts=false', () => {
    expect(factory({ showCharts: false }).find('.charts-section').exists()).toBe(false)
  })

  it('renders 2 chart boxes', () => {
    expect(factory().findAll('.chart-box')).toHaveLength(2)
  })

  it('shows bar groups for razon data', () => {
    const groups = factory().findAll('.bar-group')
    expect(groups.length).toBeGreaterThanOrEqual(2)
  })

  it('shows ingreso and gasto bars', () => {
    const w = factory()
    expect(w.findAll('.bar.ingreso').length).toBeGreaterThanOrEqual(1)
    expect(w.findAll('.bar.gasto').length).toBeGreaterThanOrEqual(1)
  })

  it('renders pie items when chartType=pie', () => {
    const w = factory({ chartType: 'pie' })
    expect(w.findAll('.pie-item').length).toBeGreaterThanOrEqual(2)
  })

  it('shows beneficios bar for subcat data', () => {
    const groups = factory().findAll('.chart-box')
    // Second chart box has subcat data
    const subcatBars = groups[1].findAll('.bar')
    expect(subcatBars.length).toBeGreaterThanOrEqual(1)
  })

  it('shows empty message when no subcat data', () => {
    const w = factory({ chartSubcatData: { labels: [], beneficios: [] } })
    expect(w.find('.chart-empty').exists()).toBe(true)
  })

  it('applies ingreso class for positive beneficio', () => {
    const w = factory()
    const chartBoxes = w.findAll('.chart-box')
    const bars = chartBoxes[1].findAll('.bar')
    expect(bars[0].classes()).toContain('ingreso')
  })

  it('applies gasto class for negative beneficio', () => {
    const w = factory()
    const chartBoxes = w.findAll('.chart-box')
    const bars = chartBoxes[1].findAll('.bar')
    expect(bars[1].classes()).toContain('gasto')
  })
})
