/**
 * Tests for app/components/dashboard/herramientas/alquileres/AlquilerTable.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AlquilerTable from '../../../app/components/dashboard/herramientas/alquileres/AlquilerTable.vue'

describe('AlquilerTable', () => {
  const records = [
    {
      id: 'r-1',
      vehicle_id: 'v-1',
      vehicle_brand: 'Volvo',
      vehicle_model: 'FH 500',
      client_name: 'Empresa A',
      start_date: '2026-01-01',
      end_date: '2026-06-30',
      monthly_rent: 2500,
      status: 'active' as const,
      notes: '',
    },
    {
      id: 'r-2',
      vehicle_id: 'v-2',
      vehicle_brand: 'Scania',
      vehicle_model: 'R 450',
      client_name: 'Empresa B',
      start_date: '2025-06-01',
      end_date: '2025-12-31',
      monthly_rent: 1800,
      status: 'finished' as const,
      notes: '',
    },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AlquilerTable, {
      props: {
        sortedRecords: records,
        getStatusClass: (s: string) => `status-${s}`,
        fmt: (v: number) => `${v} €`,
        fmtDate: (d: string | null) => d || '-',
        isEndingSoon: () => false,
        daysUntilEnd: () => 0,
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

  it('renders rows for each record', () => {
    expect(factory().findAll('tbody tr')).toHaveLength(2)
  })

  it('shows vehicle brand and model', () => {
    expect(factory().find('.vehicle-cell').text()).toContain('Volvo')
    expect(factory().find('.vehicle-cell').text()).toContain('FH 500')
  })

  it('shows client name', () => {
    expect(factory().text()).toContain('Empresa A')
  })

  it('shows formatted monthly rent', () => {
    expect(factory().text()).toContain('2500 €')
  })

  it('shows status badge with class', () => {
    const badge = factory().find('.status-badge')
    expect(badge.classes()).toContain('status-active')
  })

  it('shows ending badge when ending soon', () => {
    const w = factory({
      isEndingSoon: () => true,
      daysUntilEnd: () => 5,
    })
    expect(w.find('.ending-badge').text()).toBe('5d')
  })

  it('hides ending badge when not ending soon', () => {
    expect(factory().find('.ending-badge').exists()).toBe(false)
  })

  it('shows edit and delete buttons per row', () => {
    expect(factory().findAll('.btn-icon')).toHaveLength(4) // 2 per row
  })

  it('emits edit on edit click', async () => {
    const w = factory()
    await w.findAll('.btn-icon')[0].trigger('click')
    expect(w.emitted('edit')).toBeTruthy()
  })

  it('emits delete on delete click', async () => {
    const w = factory()
    await w.find('.btn-icon.delete').trigger('click')
    expect(w.emitted('delete')).toBeTruthy()
  })

  it('shows empty state when no records', () => {
    const w = factory({ sortedRecords: [] })
    expect(w.find('.empty-state').exists()).toBe(true)
  })
})
