/**
 * Tests for app/components/dashboard/herramientas/mantenimientos/MantenimientosTable.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import MantenimientosTable from '../../../app/components/dashboard/herramientas/mantenimientos/MantenimientosTable.vue'

describe('MantenimientosTable', () => {
  const records = [
    {
      id: 'm-1',
      vehicle_brand: 'Volvo',
      vehicle_model: 'FH 500',
      vehicle_year: 2022,
      date: '2026-02-01',
      type: 'preventivo',
      description: 'Cambio de aceite y filtros',
      cost: 450,
      km: 150000,
    },
    {
      id: 'm-2',
      vehicle_brand: 'Scania',
      vehicle_model: 'R 450',
      vehicle_year: null,
      date: '2026-01-15',
      type: 'correctivo',
      description: 'Reparación frenos',
      cost: 1200,
      km: null,
    },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(MantenimientosTable, {
      props: {
        records,
        loading: false,
        sortCol: 'date' as const,
        sortAsc: false,
        getSortIcon: () => '↕',
        fmt: (v: number) => `${v} €`,
        fmtDate: (d: string) => d,
        fmtKm: (km: number | null) => (km ? `${km} km` : '—'),
        getTypeBadgeClass: (t: string) => `badge-${t}`,
        ...overrides,
      },
    })

  it('renders table container', () => {
    expect(factory().find('.table-container').exists()).toBe(true)
  })

  it('renders data table', () => {
    expect(factory().find('.data-table').exists()).toBe(true)
  })

  it('renders 7 headers', () => {
    expect(factory().findAll('th')).toHaveLength(7)
  })

  it('renders record rows', () => {
    expect(factory().findAll('tbody tr')).toHaveLength(2)
  })

  it('shows vehicle brand and model', () => {
    expect(factory().find('.vehicle-cell').text()).toContain('Volvo')
    expect(factory().find('.vehicle-cell').text()).toContain('FH 500')
  })

  it('shows year tag', () => {
    expect(factory().find('.year-tag').text()).toContain('2022')
  })

  it('shows type badge with class', () => {
    const badge = factory().find('.type-badge')
    expect(badge.classes()).toContain('badge-preventivo')
  })

  it('shows description', () => {
    expect(factory().text()).toContain('Cambio de aceite y filtros')
  })

  it('shows formatted cost', () => {
    expect(factory().text()).toContain('450 €')
  })

  it('shows formatted km', () => {
    expect(factory().text()).toContain('150000 km')
  })

  it('shows 2 action buttons per row', () => {
    expect(factory().findAll('.btn-icon')).toHaveLength(4)
  })

  it('emits toggleSort on sortable header click', async () => {
    const w = factory()
    await w.find('.sortable').trigger('click')
    expect(w.emitted('toggleSort')).toBeTruthy()
  })

  it('emits edit on edit button click', async () => {
    const w = factory()
    await w.findAll('.btn-icon')[0].trigger('click')
    expect(w.emitted('edit')).toBeTruthy()
  })

  it('emits delete on delete button click', async () => {
    const w = factory()
    await w.find('.btn-icon.delete').trigger('click')
    expect(w.emitted('delete')).toBeTruthy()
  })

  it('shows loading state', () => {
    const w = factory({ loading: true })
    expect(w.find('.loading-state').exists()).toBe(true)
    expect(w.find('.data-table').exists()).toBe(false)
  })

  it('shows empty state with create button', () => {
    const w = factory({ records: [] })
    expect(w.find('.empty-state').exists()).toBe(true)
    expect(w.find('.btn-primary').exists()).toBe(true)
  })

  it('emits create on empty state button click', async () => {
    const w = factory({ records: [] })
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('create')).toBeTruthy()
  })
})
