/**
 * Tests for app/components/admin/productos/AdminProductDynamicFilters.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminProductDynamicFilters from '../../../app/components/admin/productos/AdminProductDynamicFilters.vue'

describe('AdminProductDynamicFilters', () => {
  const filters = [
    { id: 'f1', label_es: 'Peso', name: 'peso', type: 'caja', unit: 'kg', options: null },
    {
      id: 'f2',
      label_es: 'Color',
      name: 'color',
      type: 'desplegable',
      unit: null,
      options: { choices: ['Rojo', 'Azul', 'Verde'] },
    },
    { id: 'f3', label_es: 'Garantía', name: 'garantia', type: 'tick', unit: null, options: null },
    { id: 'f4', label_es: 'Potencia', name: 'potencia', type: 'slider', unit: 'CV', options: null },
    {
      id: 'f5',
      label_es: 'Marca',
      name: 'marca',
      type: 'desplegable',
      unit: null,
      options: { choices: [] },
    },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminProductDynamicFilters, {
      props: {
        dynamicFilters: filters,
        getFilterValue: (id: string) => (id === 'f1' ? '1500' : undefined),
        ...overrides,
      },
    })

  it('renders filters grid', () => {
    expect(factory().find('.filters-grid').exists()).toBe(true)
  })

  it('renders a field per filter', () => {
    expect(factory().findAll('.field-sm')).toHaveLength(5)
  })

  it('shows label with unit hint', () => {
    const first = factory().findAll('.field-sm')[0]
    expect(first.find('label').text()).toContain('Peso')
    expect(first.find('.hint').text()).toBe('(kg)')
  })

  it('shows text input for caja type', () => {
    const first = factory().findAll('.field-sm')[0]
    expect(first.find('input[type="text"]').exists()).toBe(true)
  })

  it('shows select for desplegable type with choices', () => {
    const second = factory().findAll('.field-sm')[1]
    const select = second.find('select')
    expect(select.exists()).toBe(true)
    // 3 choices + 1 empty option
    expect(select.findAll('option')).toHaveLength(4)
  })

  it('shows text input for desplegable with empty choices', () => {
    const fifth = factory().findAll('.field-sm')[4]
    expect(fifth.find('input[placeholder="Valor libre"]').exists()).toBe(true)
  })

  it('shows checkbox for tick type', () => {
    const third = factory().findAll('.field-sm')[2]
    expect(third.find('.tick-inline input[type="checkbox"]').exists()).toBe(true)
  })

  it('shows number input for slider type', () => {
    const fourth = factory().findAll('.field-sm')[3]
    expect(fourth.find('input[type="number"]').exists()).toBe(true)
  })

  it('populates input value from getFilterValue', () => {
    const first = factory().findAll('.field-sm')[0]
    expect((first.find('input[type="text"]').element as HTMLInputElement).value).toBe('1500')
  })
})
