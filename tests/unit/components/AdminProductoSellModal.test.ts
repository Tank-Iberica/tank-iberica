/**
 * Tests for app/components/admin/productos/AdminProductoSellModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminProductoSellModal from '../../../app/components/admin/productos/AdminProductoSellModal.vue'

describe('AdminProductoSellModal', () => {
  const sellData = {
    sale_price: 70000,
    buyer: 'Empresa ABC',
    sale_date: '2026-03-01',
    commission: 5,
    notes: 'Pago al contado',
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminProductoSellModal, {
      props: {
        show: true,
        vehicleBrand: 'Volvo',
        vehicleModel: 'FH 500',
        sellData,
        totalCost: 60000,
        finalProfit: 6500,
        ...overrides,
      },
      global: {
        stubs: { Teleport: true },
      },
    })

  it('renders modal when show is true', () => {
    expect(factory().find('.modal').exists()).toBe(true)
  })

  it('hides modal when show is false', () => {
    expect(factory({ show: false }).find('.modal').exists()).toBe(false)
  })

  it('shows title', () => {
    expect(factory().find('.modal-head span').text()).toContain('admin.productos.registerSale')
  })

  it('shows vehicle name', () => {
    expect(factory().text()).toContain('admin.productos.sellVehicle')
  })

  it('renders 5 fields', () => {
    expect(factory().findAll('.field')).toHaveLength(5)
  })

  it('shows sale price input', () => {
    const input = factory().findAll('.field input[type="number"]')[0]
    expect(input.exists()).toBe(true)
  })

  it('shows commission input', () => {
    const input = factory().findAll('.field input[type="number"]')[1]
    expect(input.exists()).toBe(true)
  })

  it('shows buyer input', () => {
    expect(factory().find('.field input[type="text"]').exists()).toBe(true)
  })

  it('shows date input', () => {
    expect(factory().find('.field input[type="date"]').exists()).toBe(true)
  })

  it('shows notes textarea', () => {
    expect(factory().find('.field textarea').exists()).toBe(true)
  })

  it('shows profit box', () => {
    expect(factory().find('.profit-box').exists()).toBe(true)
  })

  it('shows profit rows', () => {
    expect(factory().findAll('.profit-row').length).toBeGreaterThanOrEqual(4)
  })

  it('shows BENEFICIO FINAL', () => {
    expect(factory().find('.profit-row.final').text()).toContain('admin.productos.finalProfit')
  })

  it('adds pos class for positive profit', () => {
    expect(factory().find('.profit-row.final').classes()).toContain('pos')
  })

  it('adds neg class for negative profit', () => {
    const w = factory({ finalProfit: -5000 })
    expect(w.find('.profit-row.final').classes()).toContain('neg')
  })

  it('shows cancel and confirm buttons', () => {
    const btns = factory().findAll('.modal-foot .btn')
    expect(btns).toHaveLength(2)
  })

  it('emits sell on confirm click', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('sell')).toBeTruthy()
  })

  it('emits update:show on cancel click', async () => {
    const w = factory()
    await w.findAll('.modal-foot .btn')[0].trigger('click')
    expect(w.emitted('update:show')).toBeTruthy()
  })
})
