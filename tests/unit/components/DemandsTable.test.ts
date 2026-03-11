/**
 * Tests for app/components/admin/solicitantes/DemandsTable.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminSolicitantes', () => ({
  DEMAND_STATUSES: [
    { value: 'pending', label: 'Pendiente' },
    { value: 'contacted', label: 'Contactado' },
    { value: 'resolved', label: 'Resuelto' },
  ],
  getStatusConfig: (s: string) => ({ value: s, label: s, color: '#3b82f6' }),
  getTypeLabel: () => 'Cabeza tractora',
  formatDate: (d: string) => d,
  formatPriceRange: (min: number | null, max: number | null) => `${min || 0} - ${max || 0} €`,
  formatYearRange: (min: number | null, max: number | null) => `${min || ''} - ${max || ''}`,
}))

import DemandsTable from '../../../app/components/admin/solicitantes/DemandsTable.vue'

describe('DemandsTable', () => {
  const demands = [
    {
      id: 'd-1',
      contact_name: 'Juan García',
      contact_phone: '+34 600 111 222',
      contact_email: 'juan@example.com',
      brand_preference: 'Volvo',
      price_min: 50000,
      price_max: 80000,
      year_min: 2020,
      year_max: 2024,
      status: 'pending' as const,
      created_at: '2026-03-01',
      vehicle_type: null,
      subcategory: null,
      type: null,
    },
    {
      id: 'd-2',
      contact_name: 'María López',
      contact_phone: null,
      contact_email: null,
      brand_preference: null,
      price_min: null,
      price_max: null,
      year_min: null,
      year_max: null,
      status: 'contacted' as const,
      created_at: '2026-02-20',
      vehicle_type: null,
      subcategory: null,
      type: null,
    },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DemandsTable, {
      props: {
        demands,
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

  it('renders demand rows', () => {
    expect(factory().findAll('tbody tr')).toHaveLength(2)
  })

  it('shows contact name', () => {
    expect(factory().find('.contact-info strong').text()).toBe('Juan García')
  })

  it('shows phone when available', () => {
    expect(factory().find('.contact-detail').text()).toContain('+34 600 111 222')
  })

  it('shows vehicle type label', () => {
    expect(factory().find('.vehicle-type-label').text()).toBe('Cabeza tractora')
  })

  it('shows brand preference', () => {
    expect(factory().find('.vehicle-brand').text()).toBe('Volvo')
  })

  it('shows status select', () => {
    expect(factory().find('.status-select').exists()).toBe(true)
  })

  it('renders status options per select', () => {
    // 3 options × 2 rows = 6
    expect(factory().findAll('.status-select option')).toHaveLength(6)
  })

  it('shows view and delete buttons', () => {
    expect(factory().findAll('.btn-view')).toHaveLength(2)
    expect(factory().findAll('.btn-delete')).toHaveLength(2)
  })

  it('emits view-detail on view click', async () => {
    const w = factory()
    await w.find('.btn-view').trigger('click')
    expect(w.emitted('view-detail')).toBeTruthy()
  })

  it('emits confirm-delete on delete click', async () => {
    const w = factory()
    await w.find('.btn-delete').trigger('click')
    expect(w.emitted('confirm-delete')).toBeTruthy()
  })

  it('shows empty state when no demands', () => {
    const w = factory({ demands: [] })
    expect(w.find('.empty-state').exists()).toBe(true)
  })

  it('applies row-pending class', () => {
    expect(factory().find('tbody tr.row-pending').exists()).toBe(true)
  })
})
