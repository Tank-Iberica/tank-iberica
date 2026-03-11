/**
 * Tests for app/components/admin/productos/nuevo/NuevoFinancial.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import NuevoFinancial from '../../../app/components/admin/productos/nuevo/NuevoFinancial.vue'

describe('NuevoFinancial', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(NuevoFinancial, {
      props: {
        open: true,
        minPrice: 10000,
        acquisitionCost: 8000,
        acquisitionDate: '2025-01-15',
        maintenanceRecords: [],
        rentalRecords: [],
        totalMaint: 500,
        totalRental: 3000,
        totalCost: 5500,
        fmt: (v: number | null | undefined) => (v != null ? `${v} €` : '--'),
        ...overrides,
      },
    })

  it('renders financial section', () => {
    expect(factory().find('.section.financial').exists()).toBe(true)
  })

  it('shows toggle button', () => {
    expect(factory().find('.section-toggle').exists()).toBe(true)
  })

  it('shows Cuentas label', () => {
    expect(factory().find('.section-toggle').text()).toContain('Cuentas')
  })

  it('shows cost badge with formatted total', () => {
    expect(factory().find('.cost-badge').text()).toContain('5500 €')
  })

  it('emits update:open with false on toggle click when open', async () => {
    const w = factory()
    await w.find('.section-toggle').trigger('click')
    expect(w.emitted('update:open')?.[0]).toEqual([false])
  })

  it('emits update:open with true on toggle click when closed', async () => {
    const w = factory({ open: false })
    await w.find('.section-toggle').trigger('click')
    expect(w.emitted('update:open')?.[0]).toEqual([true])
  })

  it('shows child AdminProductFinancialSection when open', () => {
    expect(factory().html()).toContain('adminproductfinancialsection')
  })

  it('hides child AdminProductFinancialSection when closed', () => {
    expect(factory({ open: false }).html()).not.toContain('adminproductfinancialsection')
  })
})
