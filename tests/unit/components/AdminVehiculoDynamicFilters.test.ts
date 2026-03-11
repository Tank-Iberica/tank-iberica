/**
 * Tests for app/components/admin/vehiculos/AdminVehiculoDynamicFilters.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminVehiculoDynamicFilters from '../../../app/components/admin/vehiculos/AdminVehiculoDynamicFilters.vue'

describe('AdminVehiculoDynamicFilters', () => {
  const filters = [
    { id: 'f1', label_es: 'Peso', name: 'peso', type: 'caja', options: null },
    {
      id: 'f2',
      label_es: 'Color',
      name: 'color',
      type: 'desplegable',
      options: ['Rojo', 'Azul', 'Verde'],
    },
    { id: 'f3', label_es: 'ABS', name: 'abs', type: 'tick', options: null },
    {
      id: 'f4',
      label_es: 'Potencia',
      name: 'potencia',
      type: 'slider',
      options: { min: 100, max: 500 },
    },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminVehiculoDynamicFilters, {
      props: {
        filters,
        attributesJson: { peso: '2000', abs: true },
        ...overrides,
      },
    })

  it('renders form section', () => {
    expect(factory().find('.form-section').exists()).toBe(true)
  })

  it('shows section title', () => {
    expect(factory().find('.section-title').text()).toBe('Especificaciones')
  })

  it('renders filters grid', () => {
    expect(factory().find('.filters-grid').exists()).toBe(true)
  })

  it('renders a group per filter', () => {
    expect(factory().findAll('.form-group')).toHaveLength(4)
  })

  it('shows label from filter label_es', () => {
    expect(factory().find('.form-label').text()).toBe('Peso')
  })

  it('shows text input for caja type', () => {
    const group = factory().findAll('.form-group')[0]
    expect(group.find('input.form-input[type="text"]').exists()).toBe(true)
  })

  it('shows select for desplegable type', () => {
    const group = factory().findAll('.form-group')[1]
    const select = group.find('select.form-select')
    expect(select.exists()).toBe(true)
    // 3 options + 1 "Seleccionar..."
    expect(select.findAll('option')).toHaveLength(4)
  })

  it('shows checkbox for tick type', () => {
    const group = factory().findAll('.form-group')[2]
    expect(group.find('.checkbox-label input[type="checkbox"]').exists()).toBe(true)
  })

  it('shows number input for slider type', () => {
    const group = factory().findAll('.form-group')[3]
    expect(group.find('input.form-input[type="number"]').exists()).toBe(true)
  })

  it('populates text input from attributesJson', () => {
    const group = factory().findAll('.form-group')[0]
    expect((group.find('input.form-input').element as HTMLInputElement).value).toBe('2000')
  })

  it('checks checkbox from attributesJson', () => {
    const group = factory().findAll('.form-group')[2]
    expect((group.find('input[type="checkbox"]').element as HTMLInputElement).checked).toBe(true)
  })

  it('hides section when no filters', () => {
    const w = factory({ filters: [] })
    expect(w.find('.form-section').exists()).toBe(false)
  })
})
