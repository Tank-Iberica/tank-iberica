/**
 * Tests for app/components/admin/anunciantes/AnunciantesTable.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/shared/useListingUtils', () => ({
  formatPrice: (p: number | null) => (p ? `${p} €` : 'Consultar'),
}))

vi.mock('~/composables/useLocalized', () => ({
  localizedName: (obj: Record<string, unknown> | null) => obj?.name_es || '',
}))

vi.mock('~/composables/admin/useAdminAnunciantes', () => ({
  ADVERTISEMENT_STATUSES: [
    { value: 'pending', label: 'Pendiente' },
    { value: 'contacted', label: 'Contactado' },
    { value: 'converted', label: 'Convertido' },
    { value: 'rejected', label: 'Rechazado' },
  ],
}))

import AnunciantesTable from '../../../app/components/admin/anunciantes/AnunciantesTable.vue'

describe('AnunciantesTable', () => {
  const advertisements = [
    {
      id: 'ad-1',
      contact_name: 'Juan García',
      contact_phone: '+34 600',
      contact_email: 'juan@example.com',
      brand: 'Volvo',
      model: 'FH 500',
      year: 2022,
      price: 85000,
      status: 'pending',
      created_at: '2026-03-01',
      vehicle_type: null,
      subcategory: null,
      type: null,
    },
    {
      id: 'ad-2',
      contact_name: 'María López',
      contact_phone: null,
      contact_email: null,
      brand: null,
      model: null,
      year: null,
      price: null,
      status: 'contacted',
      created_at: '2026-02-20',
      vehicle_type: 'Cabeza tractora',
      subcategory: null,
      type: null,
    },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AnunciantesTable, {
      props: {
        advertisements,
        loading: false,
        error: null,
        getStatusConfig: (s: string) => ({
          value: s,
          label: s.toUpperCase(),
          color: '#3b82f6',
        }),
        formatDate: (d: string) => d,
        ...overrides,
      },
    })

  it('renders table', () => {
    expect(factory().find('.admin-table').exists()).toBe(true)
  })

  it('renders 6 headers', () => {
    expect(factory().findAll('th')).toHaveLength(6)
  })

  it('renders rows', () => {
    // 2 data rows + 0 empty (since advertisements.length > 0)
    expect(factory().findAll('tbody tr')).toHaveLength(2)
  })

  it('shows contact name', () => {
    expect(factory().find('.contact-info strong').text()).toBe('Juan García')
  })

  it('shows phone when available', () => {
    expect(factory().find('.contact-detail').text()).toContain('+34 600')
  })

  it('shows vehicle brand and model', () => {
    expect(factory().find('.vehicle-name').text()).toContain('Volvo')
    expect(factory().find('.vehicle-name').text()).toContain('FH 500')
  })

  it('shows "Sin especificar" when no brand/model', () => {
    const rows = factory().findAll('tbody tr')
    expect(rows[1].find('.no-data').text()).toBe('Sin especificar')
  })

  it('shows status select', () => {
    expect(factory().find('.status-select').exists()).toBe(true)
  })

  it('renders status options per select', () => {
    // 4 options × 2 rows = 8
    expect(factory().findAll('.status-select option')).toHaveLength(8)
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

  it('emits delete on delete click', async () => {
    const w = factory()
    await w.find('.btn-delete').trigger('click')
    expect(w.emitted('delete')).toBeTruthy()
  })

  it('shows error banner', () => {
    const w = factory({ error: 'Error loading' })
    expect(w.find('.error-banner').text()).toBe('Error loading')
  })

  it('shows loading state', () => {
    const w = factory({ loading: true })
    expect(w.find('.loading-state').exists()).toBe(true)
  })

  it('shows empty state when no advertisements', () => {
    const w = factory({ advertisements: [] })
    expect(w.find('.empty-state').exists()).toBe(true)
  })

  it('applies row-pending class to pending rows', () => {
    expect(factory().find('tbody tr.row-pending').exists()).toBe(true)
  })
})
