/**
 * Tests for app/components/admin/productos/AdminProductoFinancial.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminProductoFinancial from '../../../app/components/admin/productos/AdminProductoFinancial.vue'

describe('AdminProductoFinancial', () => {
  const maintenanceRecords = [
    { id: 'm1', date: '2026-01-15', reason: 'Aceite', cost: 200, invoice_url: 'https://example.com/inv1.pdf' },
    { id: 'm2', date: '2026-02-01', reason: 'Frenos', cost: 500, invoice_url: null },
  ]

  const rentalRecords = [
    { id: 'r1', from_date: '2026-01-01', to_date: '2026-03-01', notes: 'Alquiler empresa', amount: 3000, invoice_url: 'https://example.com/rent1.pdf' },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminProductoFinancial, {
      props: {
        open: true,
        acquisitionCost: 50000,
        acquisitionDate: '2025-06-01',
        minPrice: 45000,
        maintenanceRecords,
        rentalRecords,
        totalMaint: 700,
        totalRental: 3000,
        totalCost: 47700,
        driveLoading: false,
        fileNamingData: { brand: 'Volvo', model: 'FH', year: 2022 },
        driveSection: 'Vehiculos' as const,
        ...overrides,
      },
    })

  it('renders financial section', () => {
    expect(factory().find('.section.collapsible.financial').exists()).toBe(true)
  })

  it('shows toggle with total cost', () => {
    expect(factory().find('.section-toggle').text()).toContain('admin.productos.financial.accounts')
    expect(factory().find('.cost-badge').text()).toContain('admin.productos.financial.totalCost')
  })

  it('shows section content when open', () => {
    expect(factory().find('.section-content').exists()).toBe(true)
  })

  it('hides section content when closed', () => {
    const w = factory({ open: false })
    expect(w.find('.section-content').exists()).toBe(false)
  })

  it('renders 3 main fields (minPrice, acquisitionCost, acquisitionDate)', () => {
    expect(factory().findAll('.row-3 .field')).toHaveLength(3)
  })

  it('shows maintenance records table', () => {
    const tables = factory().findAll('.records-table')
    expect(tables.length).toBeGreaterThanOrEqual(1)
  })

  it('shows maintenance rows', () => {
    const firstTable = factory().findAll('.records-table')[0]
    expect(firstTable.findAll('tbody tr')).toHaveLength(2)
  })

  it('shows maintenance headers', () => {
    const firstTable = factory().findAll('.records-table')[0]
    const headers = firstTable.findAll('th')
    expect(headers[0].text()).toBe('common.date')
    expect(headers[1].text()).toBe('admin.productos.financial.reason')
    expect(headers[2].text()).toBe('admin.productos.financial.costEur')
  })

  it('shows invoice link for records with invoice_url', () => {
    expect(factory().find('.invoice-link').text()).toContain('common.view')
  })

  it('shows upload label for records without invoice_url', () => {
    expect(factory().find('.invoice-upload').text()).toContain('common.upload')
  })

  it('shows add-maint button', () => {
    const headers = factory().findAll('.records-header')
    expect(headers[0].text()).toContain('admin.productos.financial.maintenanceSum')
    expect(headers[0].find('.btn-add').exists()).toBe(true)
  })

  it('shows rental records table', () => {
    const tables = factory().findAll('.records-table')
    expect(tables.length).toBeGreaterThanOrEqual(2)
  })

  it('shows rental rows', () => {
    const rentalTable = factory().findAll('.records-table')[1]
    expect(rentalTable.findAll('tbody tr')).toHaveLength(1)
  })

  it('shows add-rental button', () => {
    const headers = factory().findAll('.records-header')
    expect(headers[1].text()).toContain('admin.productos.financial.rentalSubtracts')
    expect(headers[1].find('.btn-add').exists()).toBe(true)
  })

  it('emits update:open on toggle click', async () => {
    const w = factory()
    await w.find('.section-toggle').trigger('click')
    expect(w.emitted('update:open')?.[0]?.[0]).toBe(false)
  })

  it('emits add-maint on add button click', async () => {
    const w = factory()
    await w.findAll('.records-header')[0].find('.btn-add').trigger('click')
    expect(w.emitted('add-maint')).toBeTruthy()
  })

  it('emits add-rental on add button click', async () => {
    const w = factory()
    await w.findAll('.records-header')[1].find('.btn-add').trigger('click')
    expect(w.emitted('add-rental')).toBeTruthy()
  })

  it('emits remove-maint on remove button click', async () => {
    const w = factory()
    await w.findAll('.records-table')[0].find('.btn-x').trigger('click')
    expect(w.emitted('remove-maint')?.[0]?.[0]).toBe('m1')
  })

  it('emits remove-rental on remove button click', async () => {
    const w = factory()
    await w.findAll('.records-table')[1].find('.btn-x').trigger('click')
    expect(w.emitted('remove-rental')?.[0]?.[0]).toBe('r1')
  })

  it('shows empty msg when no maintenance records', () => {
    const w = factory({ maintenanceRecords: [] })
    expect(w.text()).toContain('admin.productos.financial.noMaintenanceRecords')
  })

  it('shows empty msg when no rental records', () => {
    const w = factory({ rentalRecords: [] })
    expect(w.text()).toContain('admin.productos.financial.noRentalRecords')
  })
})
