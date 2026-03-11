/**
 * Tests for app/components/admin/config/subcategorias/SubcategoriasTable.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import SubcategoriasTable from '../../../app/components/admin/config/subcategorias/SubcategoriasTable.vue'

describe('SubcategoriasTable', () => {
  const subcategories = [
    {
      id: 'sub-1',
      name_es: 'Grúas',
      name_en: 'Cranes',
      applicable_categories: ['cat-1'],
      applicable_filters: ['f-1', 'f-2'],
      stock_count: 12,
      status: 'published',
    },
    {
      id: 'sub-2',
      name_es: 'Excavadoras',
      name_en: null,
      applicable_categories: undefined,
      applicable_filters: undefined,
      stock_count: 0,
      status: 'draft',
    },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(SubcategoriasTable, {
      props: {
        subcategories,
        saving: false,
        getCategoryLabels: (ids: string[] | undefined) => (ids ? `cats(${ids.length})` : '—'),
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

  it('renders rows for each subcategory', () => {
    expect(factory().findAll('tbody tr')).toHaveLength(2)
  })

  it('shows name_es', () => {
    expect(factory().find('.name-cell strong').text()).toBe('Grúas')
  })

  it('shows name_en when present', () => {
    expect(factory().find('.name-en').text()).toBe('Cranes')
  })

  it('hides name_en when null', () => {
    const rows = factory().findAll('tbody tr')
    expect(rows[1].find('.name-en').exists()).toBe(false)
  })

  it('shows category labels from function prop', () => {
    expect(factory().find('.categories-list').text()).toBe('cats(1)')
  })

  it('shows filter names from function prop', () => {
    expect(factory().find('.filters-list').text()).toBe('filters(2)')
  })

  it('shows stock count', () => {
    expect(factory().find('.stock-badge').text()).toBe('12')
  })

  it('shows 0 stock for zero count', () => {
    const badges = factory().findAll('.stock-badge')
    expect(badges[1].text()).toBe('0')
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

  it('disables status toggle when saving', () => {
    const w = factory({ saving: true })
    expect(w.find('.status-toggle').attributes('disabled')).toBeDefined()
  })

  it('renders order buttons per row', () => {
    expect(factory().findAll('.order-buttons')).toHaveLength(2)
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
    expect(w.emitted('toggleStatus')?.[0]?.[0]).toEqual(subcategories[0])
  })

  it('emits edit on edit button click', async () => {
    const w = factory()
    await w.find('.btn-edit').trigger('click')
    expect(w.emitted('edit')?.[0]?.[0]).toEqual(subcategories[0])
  })

  it('emits delete on delete button click', async () => {
    const w = factory()
    await w.find('.btn-delete').trigger('click')
    expect(w.emitted('delete')?.[0]?.[0]).toEqual(subcategories[0])
  })

  it('emits moveUp on up button click', async () => {
    const w = factory()
    // Second row's up button is enabled
    const btns = w.findAll('.order-buttons')[1].findAll('.btn-icon')
    await btns[0].trigger('click')
    expect(w.emitted('moveUp')?.[0]?.[0]).toBe('sub-2')
  })

  it('emits moveDown on down button click', async () => {
    const w = factory()
    // First row's down button is enabled
    const btns = w.findAll('.order-buttons')[0].findAll('.btn-icon')
    await btns[1].trigger('click')
    expect(w.emitted('moveDown')?.[0]?.[0]).toBe('sub-1')
  })

  it('shows empty state when no subcategories', () => {
    const w = factory({ subcategories: [] })
    expect(w.find('.empty-state').exists()).toBe(true)
  })
})
