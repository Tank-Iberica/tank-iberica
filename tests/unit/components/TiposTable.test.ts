/**
 * Tests for app/components/admin/config/tipos/TiposTable.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import TiposTable from '../../../app/components/admin/config/tipos/TiposTable.vue'

describe('TiposTable', () => {
  const types = [
    {
      id: 'type-1',
      name_es: 'Camión',
      name_en: 'Truck',
      applicable_filters: ['f-1'],
      stock_count: 8,
      status: 'published',
    },
    {
      id: 'type-2',
      name_es: 'Furgoneta',
      name_en: null,
      applicable_filters: undefined,
      stock_count: 0,
      status: 'draft',
    },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(TiposTable, {
      props: {
        types,
        saving: false,
        getSubcategoryNames: (typeId: string) => `subs(${typeId})`,
        getFilterNames: (ids: string[] | undefined) => (ids ? `filters(${ids.length})` : '—'),
        ...overrides,
      },
    })

  it('renders table container', () => {
    expect(factory().find('.table-container').exists()).toBe(true)
  })

  it('renders admin table', () => {
    expect(factory().find('.admin-table').exists()).toBe(true)
  })

  it('renders 7 headers', () => {
    expect(factory().findAll('th')).toHaveLength(7)
  })

  it('renders rows for each type', () => {
    expect(factory().findAll('tbody tr')).toHaveLength(2)
  })

  it('shows name_es', () => {
    expect(factory().find('.name-cell strong').text()).toBe('Camión')
  })

  it('shows name_en when present', () => {
    expect(factory().find('.name-en').text()).toBe('Truck')
  })

  it('hides name_en when null', () => {
    const rows = factory().findAll('tbody tr')
    expect(rows[1].find('.name-en').exists()).toBe(false)
  })

  it('shows subcategory names from function prop', () => {
    expect(factory().find('.subcategories-list').text()).toBe('subs(type-1)')
  })

  it('shows filter names from function prop', () => {
    expect(factory().find('.filters-list').text()).toBe('filters(1)')
  })

  it('shows stock count', () => {
    expect(factory().find('.stock-badge').text()).toBe('8')
  })

  it('shows ON for published status', () => {
    const toggle = factory().find('.status-toggle')
    expect(toggle.text()).toBe('ON')
    expect(toggle.classes()).toContain('active')
  })

  it('shows OFF for draft status', () => {
    const toggles = factory().findAll('.status-toggle')
    expect(toggles[1].text()).toBe('OFF')
    expect(toggles[1].classes()).toContain('inactive')
  })

  it('disables up button on first row', () => {
    const btns = factory().findAll('.order-buttons')[0].findAll('.btn-icon')
    expect(btns[0].attributes('disabled')).toBeDefined()
  })

  it('disables down button on last row', () => {
    const btns = factory().findAll('.order-buttons')[1].findAll('.btn-icon')
    expect(btns[1].attributes('disabled')).toBeDefined()
  })

  it('emits toggleStatus on status click', async () => {
    const w = factory()
    await w.find('.status-toggle').trigger('click')
    expect(w.emitted('toggleStatus')?.[0]?.[0]).toEqual(types[0])
  })

  it('emits edit on edit button click', async () => {
    const w = factory()
    await w.find('.btn-edit').trigger('click')
    expect(w.emitted('edit')?.[0]?.[0]).toEqual(types[0])
  })

  it('emits delete on delete button click', async () => {
    const w = factory()
    await w.find('.btn-delete').trigger('click')
    expect(w.emitted('delete')?.[0]?.[0]).toEqual(types[0])
  })

  it('emits moveUp on up button click', async () => {
    const w = factory()
    const btns = w.findAll('.order-buttons')[1].findAll('.btn-icon')
    await btns[0].trigger('click')
    expect(w.emitted('moveUp')?.[0]?.[0]).toBe('type-2')
  })

  it('emits moveDown on down button click', async () => {
    const w = factory()
    const btns = w.findAll('.order-buttons')[0].findAll('.btn-icon')
    await btns[1].trigger('click')
    expect(w.emitted('moveDown')?.[0]?.[0]).toBe('type-1')
  })

  it('shows empty state when no types', () => {
    const w = factory({ types: [] })
    expect(w.find('.empty-state').exists()).toBe(true)
  })
})
