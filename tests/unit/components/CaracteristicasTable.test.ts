/**
 * Tests for app/components/admin/config/caracteristicas/CaracteristicasTable.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import CaracteristicasTable from '../../../app/components/admin/config/caracteristicas/CaracteristicasTable.vue'

describe('CaracteristicasTable', () => {
  const filters = [
    {
      id: 'f-1',
      name: 'potencia',
      label_es: 'Potencia',
      label_en: 'Power',
      unit: 'CV',
      type: 'number' as const,
      status: 'published' as const,
      order: 1,
      extra_filters: [],
      hides: [],
    },
    {
      id: 'f-2',
      name: 'abs',
      label_es: 'ABS',
      label_en: '',
      unit: '',
      type: 'tick' as const,
      status: 'draft' as const,
      order: 2,
      extra_filters: ['f-3'],
      hides: ['f-4'],
    },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(CaracteristicasTable, {
      props: {
        filters,
        saving: false,
        getTypeLabel: (t: string) => t.toUpperCase(),
        getStatusClass: (s: string) => `status-${s}`,
        getStatusLabel: (s: string) => s.charAt(0).toUpperCase() + s.slice(1),
        getExtraFiltersDisplay: () => 'Filter X',
        getHidesDisplay: () => 'Filter Y',
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

  it('renders rows for each filter', () => {
    expect(factory().findAll('tbody tr')).toHaveLength(2)
  })

  it('shows filter label_es', () => {
    expect(factory().find('.name-cell strong').text()).toBe('Potencia')
  })

  it('shows label_en when available', () => {
    expect(factory().find('.name-en').text()).toBe('Power')
  })

  it('shows unit badge', () => {
    expect(factory().find('.unit-badge').text()).toBe('CV')
  })

  it('shows type badge from getTypeLabel', () => {
    expect(factory().find('.type-badge').text()).toBe('NUMBER')
  })

  it('shows extra filters display for tick type', () => {
    const rows = factory().findAll('tbody tr')
    expect(rows[1].find('.extra-list').text()).toBe('Filter X')
  })

  it('shows dash for non-tick extra column', () => {
    expect(factory().find('.text-muted').text()).toBe('-')
  })

  it('shows status badge with class', () => {
    const badge = factory().find('.status-badge')
    expect(badge.classes()).toContain('status-published')
  })

  it('shows status label', () => {
    expect(factory().find('.status-badge').text()).toBe('Published')
  })

  it('shows edit and delete buttons per row', () => {
    expect(factory().findAll('.btn-edit')).toHaveLength(2)
    expect(factory().findAll('.btn-delete')).toHaveLength(2)
  })

  it('shows order buttons per row', () => {
    // 2 buttons (up + down) × 2 rows = 4
    expect(factory().findAll('.order-buttons .btn-icon')).toHaveLength(4)
  })

  it('disables up button on first row', () => {
    const firstUpBtn = factory().findAll('.order-buttons .btn-icon')[0]
    expect((firstUpBtn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('disables down button on last row', () => {
    const allOrderBtns = factory().findAll('.order-buttons .btn-icon')
    const lastDownBtn = allOrderBtns[allOrderBtns.length - 1]
    expect((lastDownBtn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('emits edit on edit click', async () => {
    const w = factory()
    await w.find('.btn-edit').trigger('click')
    expect(w.emitted('edit')).toBeTruthy()
  })

  it('emits delete on delete click', async () => {
    const w = factory()
    await w.find('.btn-delete').trigger('click')
    expect(w.emitted('delete')).toBeTruthy()
  })

  it('emits move-up on up click', async () => {
    const w = factory()
    // Second row's up button (index 2) is enabled
    await w.findAll('.order-buttons .btn-icon')[2].trigger('click')
    expect(w.emitted('move-up')).toBeTruthy()
  })

  it('emits move-down on down click', async () => {
    const w = factory()
    // First row's down button (index 1) is enabled
    await w.findAll('.order-buttons .btn-icon')[1].trigger('click')
    expect(w.emitted('move-down')).toBeTruthy()
  })

  it('shows empty state when no filters', () => {
    const w = factory({ filters: [] })
    expect(w.find('.empty-state').exists()).toBe(true)
  })
})
