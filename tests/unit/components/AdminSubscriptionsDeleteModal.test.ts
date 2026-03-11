/**
 * Tests for app/components/admin/suscripciones/AdminSubscriptionsDeleteModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import DeleteModal from '../../../app/components/admin/suscripciones/AdminSubscriptionsDeleteModal.vue'

describe('AdminSubscriptionsDeleteModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DeleteModal, {
      props: {
        show: true,
        subscription: { id: 's1', email: 'user@test.com' },
        confirmText: '',
        canDelete: false,
        ...overrides,
      },
      global: { stubs: { Teleport: true } },
    })

  it('hides when show is false', () => {
    expect(factory({ show: false }).find('.modal-overlay').exists()).toBe(false)
  })

  it('shows when show is true', () => {
    expect(factory().find('.modal-overlay').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.modal-header h3').text()).toBe('Confirmar eliminación')
  })

  it('shows subscriber email', () => {
    expect(factory().html()).toContain('user@test.com')
  })

  it('shows confirm input', () => {
    expect(factory().find('#delete-confirm').exists()).toBe(true)
  })

  it('shows error when confirmText exists but canDelete false', () => {
    const w = factory({ confirmText: 'wrong', canDelete: false })
    expect(w.find('.text-error').exists()).toBe(true)
  })

  it('hides error when confirmText empty', () => {
    expect(factory().find('.text-error').exists()).toBe(false)
  })

  it('disables delete when canDelete false', () => {
    expect(factory().find('.btn-danger').attributes('disabled')).toBeDefined()
  })

  it('enables delete when canDelete true', () => {
    const w = factory({ canDelete: true })
    expect(w.find('.btn-danger').attributes('disabled')).toBeUndefined()
  })

  it('emits close on overlay click', async () => {
    const w = factory()
    await w.find('.modal-overlay').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on close button click', async () => {
    const w = factory()
    await w.find('.modal-close').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on cancel click', async () => {
    const w = factory()
    await w.find('.btn-secondary').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits confirm on delete click', async () => {
    const w = factory({ canDelete: true })
    await w.find('.btn-danger').trigger('click')
    expect(w.emitted('confirm')).toBeTruthy()
  })

  it('emits update:confirmText on input', async () => {
    const w = factory()
    const input = w.find('input[type="text"]')
    Object.defineProperty(input.element, 'value', { value: 'cancelar', writable: true })
    await input.trigger('input')
    expect(w.emitted('update:confirmText')).toBeTruthy()
  })
})
