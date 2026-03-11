/**
 * Tests for app/components/admin/subastas/AdminAuctionCancelModal.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'

beforeAll(() => {
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'es' } }))
})

import AdminAuctionCancelModal from '../../../app/components/admin/subastas/AdminAuctionCancelModal.vue'

describe('AdminAuctionCancelModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminAuctionCancelModal, {
      props: { show: true, reason: '', ...overrides },
      global: { stubs: { Teleport: true } },
    })

  it('renders modal when show=true', () => {
    expect(factory().find('.modal-overlay').exists()).toBe(true)
  })

  it('hides modal when show=false', () => {
    expect(factory({ show: false }).find('.modal-overlay').exists()).toBe(false)
  })

  it('shows danger header', () => {
    expect(factory().find('.modal-header.danger').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h3').text()).toBe('admin.subastas.cancelTitle')
  })

  it('shows warning text', () => {
    expect(factory().find('.text-danger').text()).toBe('admin.subastas.cancelWarning')
  })

  it('has textarea for reason', () => {
    expect(factory().find('textarea').exists()).toBe(true)
  })

  it('emits update:reason on textarea input', async () => {
    const w = factory()
    const ta = w.find('textarea')
    Object.defineProperty(ta.element, 'value', { value: 'Too late', writable: true })
    await ta.trigger('input')
    expect(w.emitted('update:reason')![0]).toEqual(['Too late'])
  })

  it('emits confirm on confirm button click', async () => {
    const w = factory()
    await w.find('.btn-danger').trigger('click')
    expect(w.emitted('confirm')).toBeTruthy()
  })

  it('emits close on cancel button click', async () => {
    const w = factory()
    await w.find('.btn-secondary').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on close button click', async () => {
    const w = factory()
    await w.find('.modal-close').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on overlay click', async () => {
    const w = factory()
    await w.find('.modal-overlay').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
