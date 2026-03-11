/**
 * Tests for app/components/catalog/FilterBarDynamicFilters.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import FilterBarDynamicFilters from '../../../app/components/catalog/FilterBarDynamicFilters.vue'

describe('FilterBarDynamicFilters', () => {
  const filters = [
    {
      id: 'f1',
      name: 'color',
      type: 'desplegable',
      label_es: 'Color',
      label_en: 'Color',
      options: { values: ['Rojo', 'Azul', 'Verde'] },
    },
    {
      id: 'f2',
      name: 'extras',
      type: 'desplegable_tick',
      label_es: 'Extras',
      label_en: 'Extras',
      options: { values: ['AC', 'GPS'] },
    },
    {
      id: 'f3',
      name: 'adr',
      type: 'tick',
      label_es: 'ADR',
      label_en: 'ADR',
    },
    {
      id: 'f4',
      name: 'weight',
      type: 'slider',
      label_es: 'Peso',
      label_en: 'Weight',
      unit: 'kg',
      options: { min: 0, max: 40000 },
    },
    {
      id: 'f5',
      name: 'plate',
      type: 'caja',
      label_es: 'Matricula',
      label_en: 'Plate',
    },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(FilterBarDynamicFilters, {
      props: {
        filters,
        activeFilters: {},
        variant: 'desktop' as const,
        ...overrides,
      },
    })

  it('renders filter items', () => {
    // desktop variant: class is advanced-panel-item (computed one-shot)
    const w = factory()
    // Should render 5 filter items
    expect(w.findAll('.filter-label').length + w.findAll('.filter-tick').length).toBe(5)
  })

  it('renders desplegable select with options', () => {
    const select = factory().find('select')
    // 3 options + 1 empty dash
    expect(select.findAll('option')).toHaveLength(4)
  })

  it('shows desplegable_tick checkboxes', () => {
    const checks = factory().findAll('.filter-check')
    expect(checks).toHaveLength(2)
  })

  it('shows desplegable_tick option labels', () => {
    const checks = factory().findAll('.filter-check span')
    expect(checks[0].text()).toBe('AC')
    expect(checks[1].text()).toBe('GPS')
  })

  it('shows tick checkbox', () => {
    const ticks = factory().findAll('.filter-tick input[type="checkbox"]')
    expect(ticks).toHaveLength(1)
  })

  it('shows slider/range dual inputs', () => {
    const rangeInputs = factory().findAll('.filter-dual-range input[type="number"]')
    expect(rangeInputs).toHaveLength(2)
  })

  it('shows unit hint for slider', () => {
    const labels = factory().findAll('.filter-label')
    const weightLabel = labels.find(l => l.text().includes('Peso'))
    expect(weightLabel?.text()).toContain('(kg)')
  })

  it('shows caja text input', () => {
    const textInputs = factory().findAll('input[type="text"]')
    expect(textInputs.length).toBeGreaterThanOrEqual(1)
  })

  it('shows filter label in ES by default', () => {
    expect(factory().find('.filter-label').text()).toBe('Color')
  })

  it('emits select on desplegable change', async () => {
    const w = factory()
    await w.find('select').trigger('change')
    expect(w.emitted('select')).toBeTruthy()
  })

  it('emits check on desplegable_tick change', async () => {
    const w = factory()
    const checkboxes = w.findAll('.filter-check input')
    await checkboxes[0].trigger('change')
    expect(w.emitted('check')?.[0]).toEqual(['extras', 'AC'])
  })

  it('emits tick on tick change', async () => {
    const w = factory()
    const tickInput = w.find('.filter-tick input')
    await tickInput.trigger('change')
    expect(w.emitted('tick')?.[0]?.[0]).toBe('adr')
  })

  it('emits range on slider input change', async () => {
    const w = factory()
    const rangeInputs = w.findAll('.filter-dual-range input')
    await rangeInputs[0].trigger('change')
    expect(w.emitted('range')).toBeTruthy()
  })

  it('shows checked state for desplegable_tick', () => {
    const w = factory({ activeFilters: { extras: ['AC'] } })
    const checkboxes = w.findAll('.filter-check input')
    expect((checkboxes[0].element as HTMLInputElement).checked).toBe(true)
    expect((checkboxes[1].element as HTMLInputElement).checked).toBe(false)
  })

  it('shows active value in desplegable select', () => {
    const w = factory({ activeFilters: { color: 'Rojo' } })
    expect((w.find('select').element as HTMLSelectElement).value).toBe('Rojo')
  })

  it('renders nothing when filters empty', () => {
    const w = factory({ filters: [] })
    expect(w.findAll('.filter-label')).toHaveLength(0)
  })
})
