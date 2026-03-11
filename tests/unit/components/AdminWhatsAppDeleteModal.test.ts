/**
 * Tests for app/components/admin/whatsapp/AdminWhatsAppDeleteModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminWhatsAppDeleteModal from '../../../app/components/admin/whatsapp/AdminWhatsAppDeleteModal.vue'

describe('AdminWhatsAppDeleteModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminWhatsAppDeleteModal, {
      props: {
        show: true,
        actionLoading: false,
        ...overrides,
      },
      global: { stubs: { Teleport: true, Transition: true } },
    })

  it('renders when show is true', () => {
    expect(factory().find('.modal-overlay').exists()).toBe(true)
  })

  it('hides when show is false', () => {
    expect(factory({ show: false }).find('.modal-overlay').exists()).toBe(false)
  })

  it('shows header', () => {
    expect(factory().find('.modal-header h2').exists()).toBe(true)
  })

  it('shows body text', () => {
    expect(factory().find('.modal-body p').exists()).toBe(true)
  })

  it('enables confirm button when not loading', () => {
    const btn = factory().find('.btn-confirm-delete')
    expect((btn.element as HTMLButtonElement).disabled).toBe(false)
  })

  it('disables confirm button when loading', () => {
    const btn = factory({ actionLoading: true }).find('.btn-confirm-delete')
    expect((btn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('emits confirm on delete click', async () => {
    const w = factory()
    await w.find('.btn-confirm-delete').trigger('click')
    expect(w.emitted('confirm')).toBeTruthy()
  })

  it('emits cancel on cancel button click', async () => {
    const w = factory()
    await w.find('.btn-cancel').trigger('click')
    expect(w.emitted('cancel')).toBeTruthy()
  })

  it('emits cancel on close button click', async () => {
    const w = factory()
    await w.find('.modal-close').trigger('click')
    expect(w.emitted('cancel')).toBeTruthy()
  })

  it('emits cancel on backdrop click', async () => {
    const w = factory()
    await w.find('.modal-overlay').trigger('click')
    expect(w.emitted('cancel')).toBeTruthy()
  })
})
