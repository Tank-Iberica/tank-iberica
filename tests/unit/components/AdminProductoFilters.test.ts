/**
 * Tests for app/components/admin/productos/AdminProductoFilters.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminProductoFilters from '../../../app/components/admin/productos/AdminProductoFilters.vue'

describe('AdminProductoFilters', () => {
  const filters = [
    { id: 'f-1', name: 'potencia', label_es: 'Potencia', type: 'caja', unit: 'CV', options: null },
    {
      id: 'f-2',
      name: 'combustible',
      label_es: 'Combustible',
      type: 'desplegable',
      unit: null,
      options: { choices: ['Diésel', 'Eléctrico', 'GNL'] },
    },
    { id: 'f-3', name: 'adr', label_es: 'ADR', type: 'tick', unit: null, options: null },
    { id: 'f-4', name: 'ejes', label_es: null, type: 'numerico', unit: null, options: null },
    {
      id: 'f-5',
      name: 'marca_neumaticos',
      label_es: 'Marca neumáticos',
      type: 'desplegable',
      unit: null,
      options: { choices: [] },
    },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminProductoFilters, {
      props: {
        open: true,
        filters,
        attributesJson: { 'f-1': '460', 'f-3': true },
        ...overrides,
      },
    })

  it('renders section when filters exist', () => {
    expect(factory().find('.section').exists()).toBe(true)
  })

  it('hides section when no filters', () => {
    expect(factory({ filters: [] }).find('.section').exists()).toBe(false)
  })

  it('shows filter count in toggle', () => {
    expect(factory().find('.section-toggle').text()).toContain('5')
  })

  it('shows content when open', () => {
    expect(factory().find('.section-content').exists()).toBe(true)
  })

  it('hides content when closed', () => {
    expect(factory({ open: false }).find('.section-content').exists()).toBe(false)
  })

  it('renders filter fields', () => {
    expect(factory().findAll('.field-sm')).toHaveLength(5)
  })

  it('shows label_es when available', () => {
    const labels = factory().findAll('.field-sm label')
    expect(labels[0].text()).toContain('Potencia')
  })

  it('falls back to name when no label_es', () => {
    // tick type nests a label inside .tick-inline, so index shifts
    const labels = factory().findAll('.field-sm label')
    expect(labels[4].text()).toContain('ejes')
  })

  it('shows unit hint', () => {
    expect(factory().find('.hint').text()).toContain('CV')
  })

  it('renders text input for caja type', () => {
    const fields = factory().findAll('.field-sm')
    expect(fields[0].find('input[type="text"]').exists()).toBe(true)
  })

  it('renders select for desplegable with choices', () => {
    const fields = factory().findAll('.field-sm')
    expect(fields[1].find('select').exists()).toBe(true)
  })

  it('renders select options', () => {
    const fields = factory().findAll('.field-sm')
    // 3 choices + 1 empty placeholder
    expect(fields[1].findAll('option')).toHaveLength(4)
  })

  it('renders text input fallback for desplegable without choices', () => {
    const fields = factory().findAll('.field-sm')
    expect(fields[4].find('input[placeholder="Valor libre"]').exists()).toBe(true)
  })

  it('renders checkbox for tick type', () => {
    expect(factory().find('.tick-inline input[type="checkbox"]').exists()).toBe(true)
  })

  it('renders number input for other types', () => {
    const fields = factory().findAll('.field-sm')
    expect(fields[3].find('input[type="number"]').exists()).toBe(true)
  })

  it('emits update:open on toggle click', async () => {
    const w = factory()
    await w.find('.section-toggle').trigger('click')
    expect(w.emitted('update:open')).toBeTruthy()
  })
})
