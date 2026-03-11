/**
 * Tests for app/components/catalog/VehicleTablePdfModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import VehicleTablePdfModal from '../../../app/components/catalog/VehicleTablePdfModal.vue'

describe('VehicleTablePdfModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(VehicleTablePdfModal, {
      props: { open: true, selectedCount: 3, totalCount: 10, ...overrides },
      global: {
        mocks: { $t: (k: string) => k },
        stubs: { Teleport: true },
      },
    })

  it('renders when open', () => {
    expect(factory().find('.pdf-modal-overlay').exists()).toBe(true)
  })

  it('hides when not open', () => {
    const w = factory({ open: false })
    expect(w.find('.pdf-modal-overlay').exists()).toBe(false)
  })

  it('shows title', () => {
    expect(factory().find('.pdf-modal-title').text()).toBe('catalog.exportPdf')
  })

  it('shows count', () => {
    expect(factory().find('.pdf-modal-count').text()).toBe('3 / 10')
  })

  it('emits close on back click', async () => {
    const w = factory()
    await w.find('.pdf-btn-back').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits selectAll on select all click', async () => {
    const w = factory()
    await w.find('.pdf-btn-select-all').trigger('click')
    expect(w.emitted('selectAll')).toBeTruthy()
  })

  it('emits confirm on confirm click', async () => {
    const w = factory()
    await w.find('.pdf-btn-confirm').trigger('click')
    expect(w.emitted('confirm')).toBeTruthy()
  })

  it('disables confirm when selectedCount=0', () => {
    const w = factory({ selectedCount: 0 })
    expect(w.find('.pdf-btn-confirm').attributes('disabled')).toBeDefined()
  })

  it('emits close on overlay click', async () => {
    const w = factory()
    await w.find('.pdf-modal-overlay').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
