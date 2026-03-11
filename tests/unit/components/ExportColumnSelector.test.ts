/**
 * Tests for app/components/dashboard/herramientas/exportar/ExportColumnSelector.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import ExportColumnSelector from '../../../app/components/dashboard/herramientas/exportar/ExportColumnSelector.vue'

describe('ExportColumnSelector', () => {
  const csvColumns = [
    { key: 'brand', enabled: true },
    { key: 'model', enabled: true },
    { key: 'price', enabled: false },
    { key: 'year', enabled: true },
  ]

  const getColumnLabel = (key: string) => key.charAt(0).toUpperCase() + key.slice(1)

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ExportColumnSelector, {
      props: { csvColumns, selectedColumnsCount: 3, getColumnLabel, ...overrides },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders options card', () => {
    expect(factory().find('.options-card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h2').text()).toBe('dashboard.tools.export.selectColumns')
  })

  it('shows selected columns count', () => {
    expect(factory().find('.columns-count').text()).toContain('3')
  })

  it('renders column checkboxes', () => {
    expect(factory().findAll('.column-checkbox')).toHaveLength(4)
  })

  it('shows column label', () => {
    expect(factory().findAll('.column-checkbox span')[0].text()).toBe('Brand')
  })

  it('checkbox reflects enabled state', () => {
    const checkboxes = factory().findAll('.column-checkbox input')
    expect((checkboxes[0].element as HTMLInputElement).checked).toBe(true)
    expect((checkboxes[2].element as HTMLInputElement).checked).toBe(false)
  })

  it('has select all button', () => {
    const buttons = factory().findAll('.btn-text')
    expect(buttons[0].text()).toBe('dashboard.tools.export.selectAll')
  })

  it('has deselect all button', () => {
    const buttons = factory().findAll('.btn-text')
    expect(buttons[1].text()).toBe('dashboard.tools.export.deselectAll')
  })

  it('emits toggleAllColumns true on select all click', async () => {
    const w = factory()
    await w.findAll('.btn-text')[0].trigger('click')
    expect(w.emitted('toggleAllColumns')![0]).toEqual([true])
  })

  it('emits toggleAllColumns false on deselect all click', async () => {
    const w = factory()
    await w.findAll('.btn-text')[1].trigger('click')
    expect(w.emitted('toggleAllColumns')![0]).toEqual([false])
  })

  it('emits toggleColumn on checkbox change', async () => {
    const w = factory()
    await w.findAll('input[type="checkbox"]')[0].trigger('change')
    expect(w.emitted('toggleColumn')).toBeTruthy()
  })
})
