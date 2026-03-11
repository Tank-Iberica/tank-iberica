/**
 * Tests for app/components/admin/productos/AdminProductFinancialSection.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminProductFinancialSection from '../../../app/components/admin/productos/AdminProductFinancialSection.vue'

describe('AdminProductFinancialSection', () => {
  const maintenanceRecords = [
    { id: 'm-1', date: '2026-01-15', reason: 'Cambio aceite', cost: 350, invoice_url: '' },
    { id: 'm-2', date: '2026-02-20', reason: 'Frenos', cost: 1200, invoice_url: '' },
  ]
  const rentalRecords = [
    { id: 'r-1', from_date: '2025-06-01', to_date: '2025-12-31', notes: 'Alquiler A', amount: 9000 },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminProductFinancialSection, {
      props: {
        minPrice: 50000,
        acquisitionCost: 65000,
        acquisitionDate: '2024-06-15',
        maintenanceRecords,
        rentalRecords,
        totalMaint: 1550,
        totalRental: 9000,
        totalCost: 57550,
        fmt: (v: number | null | undefined) => (v != null ? `${v} €` : '-'),
        ...overrides,
      },
    })

  it('renders section', () => {
    expect(factory().find('.section-content').exists()).toBe(true)
  })

  it('renders 3 price fields', () => {
    expect(factory().findAll('.field')).toHaveLength(3)
  })

  it('shows maintenance header', () => {
    expect(factory().findAll('.records-header')[0].text()).toContain('Mantenimiento')
  })

  it('shows rental header', () => {
    expect(factory().findAll('.records-header')[1].text()).toContain('Renta')
  })

  it('renders maintenance rows', () => {
    expect(factory().findAll('.records-table')[0].findAll('tbody tr')).toHaveLength(2)
  })

  it('renders rental rows', () => {
    expect(factory().findAll('.records-table')[1].findAll('tbody tr')).toHaveLength(1)
  })

  it('shows add maintenance button', () => {
    const btns = factory().findAll('.btn-add')
    expect(btns[0].text()).toBe('+ Añadir')
  })

  it('emits add-maint on click', async () => {
    const w = factory()
    await w.findAll('.btn-add')[0].trigger('click')
    expect(w.emitted('add-maint')).toBeTruthy()
  })

  it('emits add-rental on click', async () => {
    const w = factory()
    await w.findAll('.btn-add')[1].trigger('click')
    expect(w.emitted('add-rental')).toBeTruthy()
  })

  it('emits remove-maint on delete click', async () => {
    const w = factory()
    await w.findAll('.records-table')[0].find('.btn-x').trigger('click')
    expect(w.emitted('remove-maint')).toBeTruthy()
  })

  it('shows cost summary', () => {
    expect(factory().find('.cost-summary').exists()).toBe(true)
  })

  it('shows total cost', () => {
    const total = factory().find('.cost-row.total')
    expect(total.text()).toContain('COSTE TOTAL')
  })

  it('shows empty msg when no maintenance', () => {
    const w = factory({ maintenanceRecords: [] })
    expect(w.findAll('.empty-msg')[0].text()).toContain('Sin registros de mantenimiento')
  })

  it('shows empty msg when no rentals', () => {
    const w = factory({ rentalRecords: [] })
    expect(w.findAll('.empty-msg')[0].text()).toContain('Sin registros de alquiler')
  })
})
