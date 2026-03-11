/**
 * Tests for app/components/admin/solicitantes/DeleteModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import DeleteModal from '../../../app/components/admin/solicitantes/DeleteModal.vue'

const baseModal = {
  show: true,
  demand: { contact_name: 'Pedro López' },
  confirmText: '',
}

describe('SolicitantesDeleteModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DeleteModal, {
      props: {
        modal: { ...baseModal },
        canDelete: false,
        ...overrides,
      },
      global: { stubs: { Teleport: true } },
    })

  it('renders when modal.show=true', () => {
    expect(factory().find('.modal-overlay').exists()).toBe(true)
  })

  it('hides when modal.show=false', () => {
    const w = factory({ modal: { ...baseModal, show: false } })
    expect(w.find('.modal-overlay').exists()).toBe(false)
  })

  it('shows header title', () => {
    expect(factory().find('.modal-header h3').text()).toContain('Confirmar eliminación')
  })

  it('shows demand contact name', () => {
    expect(factory().find('.modal-body').text()).toContain('Pedro López')
  })

  it('shows confirm input field', () => {
    expect(factory().find('#delete-confirm').exists()).toBe(true)
  })

  it('disables delete button when canDelete=false', () => {
    expect(factory().find('.btn-danger').attributes('disabled')).toBeDefined()
  })

  it('enables delete button when canDelete=true', () => {
    const w = factory({ canDelete: true })
    expect(w.find('.btn-danger').attributes('disabled')).toBeUndefined()
  })

  it('shows error message when confirmText wrong', () => {
    const w = factory({ modal: { ...baseModal, confirmText: 'wrong' } })
    expect(w.find('.text-error').exists()).toBe(true)
  })

  it('hides error when confirmText empty', () => {
    expect(factory().find('.text-error').exists()).toBe(false)
  })

  it('emits confirm on delete click', async () => {
    const w = factory({ canDelete: true })
    await w.find('.btn-danger').trigger('click')
    expect(w.emitted('confirm')).toBeTruthy()
  })

  it('emits close on cancel click', async () => {
    const w = factory()
    await w.find('.btn-secondary').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on X click', async () => {
    const w = factory()
    await w.find('.modal-close').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits update:confirmText on input', async () => {
    const w = factory()
    const input = w.find('#delete-confirm')
    const el = input.element as HTMLInputElement
    Object.defineProperty(el, 'value', { value: 'Borrar', writable: true })
    await input.trigger('input')
    expect(w.emitted('update:confirmText')).toBeTruthy()
  })

  it('emits close on overlay click', async () => {
    const w = factory()
    await w.find('.modal-overlay').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
