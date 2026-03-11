/**
 * Tests for app/components/admin/vehiculos/AdminVehiculoTransactionModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminVehiculoTransactionModal from '../../../app/components/admin/vehiculos/AdminVehiculoTransactionModal.vue'

const sellForm = {
  sale_price: 85000,
  sale_category: 'venta_directa',
  buyer_name: 'Juan',
  buyer_contact: '600000000',
}

const rentalForm = {
  monthly_price: 2500,
  start_date: '2026-01-01',
  end_date: '2026-12-31',
  renter_name: 'Pedro',
  renter_contact: '611111111',
  notes: 'Con fianza',
}

describe('AdminVehiculoTransactionModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminVehiculoTransactionModal, {
      props: {
        visible: true,
        tab: 'venta' as const,
        sellForm: { ...sellForm },
        rentalForm: { ...rentalForm },
        saving: false,
        acquisitionCost: 70000,
        formatCurrency: (v: number) => `${v} €`,
        calcBeneficio: (sale: number, cost: number | null | undefined) =>
          cost ? `${sale - cost} €` : '-',
        ...overrides,
      },
      global: {
        stubs: { Teleport: true },
      },
    })

  it('hides modal when not visible', () => {
    expect(factory({ visible: false }).find('.modal-backdrop').exists()).toBe(false)
  })

  it('shows modal when visible', () => {
    expect(factory().find('.modal-backdrop').exists()).toBe(true)
  })

  it('shows 2 tabs', () => {
    expect(factory().findAll('.tx-tab')).toHaveLength(2)
  })

  it('shows venta tab active', () => {
    expect(factory().findAll('.tx-tab')[0].classes()).toContain('active')
  })

  it('shows alquiler tab active when tab=alquiler', () => {
    const w = factory({ tab: 'alquiler' })
    expect(w.findAll('.tx-tab')[1].classes()).toContain('active')
  })

  it('emits update:tab on tab click', async () => {
    const w = factory()
    await w.findAll('.tx-tab')[1].trigger('click')
    expect(w.emitted('update:tab')?.[0]?.[0]).toBe('alquiler')
  })

  // -- Sale form --
  it('shows sale price input', () => {
    const inputs = factory().findAll('input[type="number"]')
    expect((inputs[0].element as HTMLInputElement).value).toBe('85000')
  })

  it('shows sale category select with 4 options', () => {
    const options = factory().find('.form-select').findAll('option')
    expect(options).toHaveLength(4) // placeholder + 3
  })

  it('shows buyer name input', () => {
    const inputs = factory().findAll('input[type="text"]')
    expect((inputs[0].element as HTMLInputElement).value).toBe('Juan')
  })

  it('shows buyer contact input', () => {
    const inputs = factory().findAll('input[type="text"]')
    expect((inputs[1].element as HTMLInputElement).value).toBe('600000000')
  })

  it('shows balance preview when sale_price > 0', () => {
    expect(factory().find('.tx-preview').exists()).toBe(true)
  })

  it('shows formatted currency in preview', () => {
    expect(factory().find('.tx-preview-item.ingreso').text()).toContain('admin.vehicles.balanceIncome')
  })

  it('shows beneficio when acquisition cost exists', () => {
    expect(factory().find('.tx-preview').text()).toContain('admin.vehicles.balanceProfit')
  })

  it('emits sell on confirm click', async () => {
    const w = factory()
    await w.find('.btn-sell').trigger('click')
    expect(w.emitted('sell')).toBeTruthy()
  })

  it('disables sell when saving', () => {
    expect(factory({ saving: true }).find('.btn-sell').attributes('disabled')).toBeDefined()
  })

  it('disables sell when no price', () => {
    const w = factory({ sellForm: { ...sellForm, sale_price: 0 } })
    expect(w.find('.btn-sell').attributes('disabled')).toBeDefined()
  })

  it('shows saving text on sell button', () => {
    expect(factory({ saving: true }).find('.btn-sell').text()).toBe('common.processing')
  })

  it('emits close on cancel', async () => {
    const w = factory()
    await w.find('.btn-secondary').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on backdrop click', async () => {
    const w = factory()
    await w.find('.modal-backdrop').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  // -- Rental form --
  it('shows rental form on alquiler tab', () => {
    const w = factory({ tab: 'alquiler' })
    expect(w.find('.btn-rent-action').exists()).toBe(true)
  })

  it('shows rental price input', () => {
    const w = factory({ tab: 'alquiler' })
    const inputs = w.findAll('input[type="number"]')
    expect((inputs[0].element as HTMLInputElement).value).toBe('2500')
  })

  it('shows rental dates', () => {
    const w = factory({ tab: 'alquiler' })
    const dates = w.findAll('input[type="date"]')
    expect(dates).toHaveLength(2)
  })

  it('shows renter name', () => {
    const w = factory({ tab: 'alquiler' })
    const texts = w.findAll('input[type="text"]')
    expect((texts[0].element as HTMLInputElement).value).toBe('Pedro')
  })

  it('shows rental notes textarea', () => {
    const w = factory({ tab: 'alquiler' })
    expect((w.find('textarea').element as HTMLTextAreaElement).value).toBe('Con fianza')
  })

  it('emits rent on confirm rental click', async () => {
    const w = factory({ tab: 'alquiler' })
    await w.find('.btn-rent-action').trigger('click')
    expect(w.emitted('rent')).toBeTruthy()
  })

  it('disables rental button when no price', () => {
    const w = factory({ tab: 'alquiler', rentalForm: { ...rentalForm, monthly_price: 0 } })
    expect(w.find('.btn-rent-action').attributes('disabled')).toBeDefined()
  })
})
