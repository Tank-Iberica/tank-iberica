/**
 * Tests for app/components/admin/productos/detail/DetailModals.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import DetailModals from '../../../app/components/admin/productos/detail/DetailModals.vue'

const baseProps = {
  showDeleteModal: false,
  deleteConfirm: '',
  vehicleBrand: 'MAN',
  vehicleModel: 'TGX',
  canDelete: false,
  showSellModal: false,
  sellData: { sale_price: 0, buyer: '', sale_date: '', commission: 0, notes: '' },
  totalCost: 50000,
  finalProfit: 10000,
}

describe('DetailModals', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DetailModals, {
      props: { ...baseProps, ...overrides },
      global: {
        stubs: {
          AdminProductoDeleteModal: true,
          AdminProductoSellModal: true,
        },
      },
    })

  it('renders delete modal stub', () => {
    const w = factory()
    expect(w.findComponent({ name: 'AdminProductoDeleteModal' }).exists()).toBe(true)
  })

  it('renders sell modal stub', () => {
    const w = factory()
    expect(w.findComponent({ name: 'AdminProductoSellModal' }).exists()).toBe(true)
  })

  it('passes showDeleteModal to delete modal', () => {
    const w = factory({ showDeleteModal: true })
    const deleteModal = w.findComponent({ name: 'AdminProductoDeleteModal' })
    expect(deleteModal.attributes('show')).toBe('true')
  })

  it('passes showSellModal to sell modal', () => {
    const w = factory({ showSellModal: true })
    const sellModal = w.findComponent({ name: 'AdminProductoSellModal' })
    expect(sellModal.attributes('show')).toBe('true')
  })

  it('passes vehicle info to delete modal', () => {
    const w = factory()
    const deleteModal = w.findComponent({ name: 'AdminProductoDeleteModal' })
    expect(deleteModal.attributes('vehicle-brand')).toBe('MAN')
    expect(deleteModal.attributes('vehicle-model')).toBe('TGX')
  })

  it('passes sell data to sell modal', () => {
    const w = factory()
    const sellModal = w.findComponent({ name: 'AdminProductoSellModal' })
    expect(sellModal.attributes('total-cost')).toBe('50000')
    expect(sellModal.attributes('final-profit')).toBe('10000')
  })

  it('emits update:showDeleteModal from delete modal', async () => {
    const w = factory()
    const deleteModal = w.findComponent({ name: 'AdminProductoDeleteModal' })
    await deleteModal.vm.$emit('update:show', true)
    expect(w.emitted('update:showDeleteModal')).toEqual([[true]])
  })

  it('emits update:showSellModal from sell modal', async () => {
    const w = factory()
    const sellModal = w.findComponent({ name: 'AdminProductoSellModal' })
    await sellModal.vm.$emit('update:show', true)
    expect(w.emitted('update:showSellModal')).toEqual([[true]])
  })

  it('emits delete from delete modal', async () => {
    const w = factory()
    const deleteModal = w.findComponent({ name: 'AdminProductoDeleteModal' })
    await deleteModal.vm.$emit('delete')
    expect(w.emitted('delete')).toHaveLength(1)
  })

  it('emits sell from sell modal', async () => {
    const w = factory()
    const sellModal = w.findComponent({ name: 'AdminProductoSellModal' })
    await sellModal.vm.$emit('sell')
    expect(w.emitted('sell')).toHaveLength(1)
  })
})
