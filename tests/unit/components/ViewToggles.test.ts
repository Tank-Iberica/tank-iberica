/**
 * Tests for app/components/admin/balance/ViewToggles.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ViewToggles from '../../../app/components/admin/balance/ViewToggles.vue'

describe('ViewToggles', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ViewToggles, {
      props: {
        showDesglose: false,
        showCharts: false,
        chartType: 'bar' as const,
        total: 42,
        ...overrides,
      },
      global: { mocks: { $t: (key: string) => key } },
    })

  it('renders view-toggles container', () => {
    const w = factory()
    expect(w.find('.view-toggles').exists()).toBe(true)
  })

  it('shows desglose checkbox', () => {
    const w = factory()
    const labels = w.findAll('.toggle-check')
    expect(labels[0].text()).toContain('admin.balance.breakdownByReason')
  })

  it('shows charts checkbox', () => {
    const w = factory()
    const labels = w.findAll('.toggle-check')
    expect(labels[1].text()).toContain('admin.balance.charts')
  })

  it('desglose checkbox reflects showDesglose prop', () => {
    const w = factory({ showDesglose: true })
    const checkbox = w.findAll('input[type="checkbox"]')[0]
    expect((checkbox.element as HTMLInputElement).checked).toBe(true)
  })

  it('charts checkbox reflects showCharts prop', () => {
    const w = factory({ showCharts: true })
    const checkbox = w.findAll('input[type="checkbox"]')[1]
    expect((checkbox.element as HTMLInputElement).checked).toBe(true)
  })

  it('emits update:showDesglose on checkbox change', async () => {
    const w = factory()
    await w.findAll('input[type="checkbox"]')[0].trigger('change')
    expect(w.emitted('update:showDesglose')).toBeTruthy()
  })

  it('emits update:showCharts on checkbox change', async () => {
    const w = factory()
    await w.findAll('input[type="checkbox"]')[1].trigger('change')
    expect(w.emitted('update:showCharts')).toBeTruthy()
  })

  it('shows chart type select when showCharts is true', () => {
    const w = factory({ showCharts: true })
    expect(w.find('.chart-type-select').exists()).toBe(true)
  })

  it('hides chart type select when showCharts is false', () => {
    const w = factory({ showCharts: false })
    expect(w.find('.chart-type-select').exists()).toBe(false)
  })

  it('chart type select has bar and pie options', () => {
    const w = factory({ showCharts: true })
    const options = w.findAll('.chart-type-select option')
    expect(options).toHaveLength(2)
    expect(options[0].attributes('value')).toBe('bar')
    expect(options[1].attributes('value')).toBe('pie')
  })

  it('shows transaction count', () => {
    const w = factory({ total: 42 })
    expect(w.find('.count').text()).toContain('42')
    expect(w.find('.count').text()).toContain('admin.balance.transactions')
  })

  it('chart type select has aria-label', () => {
    const w = factory({ showCharts: true })
    expect(w.find('.chart-type-select').attributes('aria-label')).toBe('admin.balance.chartTypeLabel')
  })
})
