/**
 * Tests for app/components/admin/balance/ViewToggles.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import ViewToggles from '../../../app/components/admin/balance/ViewToggles.vue'

describe('BalanceViewToggles', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ViewToggles, {
      props: {
        showDesglose: false,
        showCharts: false,
        chartType: 'bar' as const,
        total: 42,
        ...overrides,
      },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders view toggles', () => {
    expect(factory().find('.view-toggles').exists()).toBe(true)
  })

  it('shows 2 checkboxes', () => {
    expect(factory().findAll('input[type="checkbox"]')).toHaveLength(2)
  })

  it('shows transaction count', () => {
    expect(factory().find('.count').text()).toContain('42')
  })

  it('hides chart type select when charts off', () => {
    expect(factory().find('select').exists()).toBe(false)
  })

  it('shows chart type select when charts on', () => {
    expect(factory({ showCharts: true }).find('select').exists()).toBe(true)
  })

  it('select has bar and pie options', () => {
    const w = factory({ showCharts: true })
    const options = w.findAll('option')
    expect(options).toHaveLength(2)
  })

  it('emits update:showDesglose on checkbox change', async () => {
    const w = factory()
    const cb = w.findAll('input[type="checkbox"]')[0]
    Object.defineProperty(cb.element, 'checked', { value: true, writable: true })
    await cb.trigger('change')
    expect(w.emitted('update:showDesglose')![0]).toEqual([true])
  })

  it('emits update:showCharts on checkbox change', async () => {
    const w = factory()
    const cb = w.findAll('input[type="checkbox"]')[1]
    Object.defineProperty(cb.element, 'checked', { value: true, writable: true })
    await cb.trigger('change')
    expect(w.emitted('update:showCharts')![0]).toEqual([true])
  })

  it('emits update:chartType on select change', async () => {
    const w = factory({ showCharts: true })
    const select = w.find('select')
    Object.defineProperty(select.element, 'value', { value: 'pie', writable: true })
    await select.trigger('change')
    expect(w.emitted('update:chartType')![0]).toEqual(['pie'])
  })
})
