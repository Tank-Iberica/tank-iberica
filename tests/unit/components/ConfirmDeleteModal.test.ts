/**
 * Tests for app/components/shared/ConfirmDeleteModal.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { ref, computed, toRef } from 'vue'

beforeAll(() => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('toRef', toRef)
  vi.stubGlobal('watch', vi.fn())
  vi.stubGlobal('useScrollLock', vi.fn())
  vi.stubGlobal('onMounted', vi.fn())
  vi.stubGlobal('onUnmounted', vi.fn())
})

import ConfirmDeleteModal from '../../../app/components/shared/ConfirmDeleteModal.vue'

describe('ConfirmDeleteModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ConfirmDeleteModal, {
      props: {
        show: true,
        title: 'Eliminar vehiculo',
        ...overrides,
      },
      global: {
        mocks: { $t: (key: string) => key },
        stubs: { Teleport: true },
      },
    })

  it('renders modal overlay when show is true', () => {
    const w = factory()
    expect(w.find('.modal-overlay').exists()).toBe(true)
  })

  it('does not render modal overlay when show is false', () => {
    const w = factory({ show: false })
    expect(w.find('.modal-overlay').exists()).toBe(false)
  })

  it('shows modal title', () => {
    const w = factory()
    expect(w.find('.modal-header h3').text()).toBe('Eliminar vehiculo')
  })

  it('shows default warning text', () => {
    const w = factory()
    expect(w.find('.modal-warning-text').text()).toBe('shared.deleteModal.irreversible')
  })

  it('shows custom warning text', () => {
    const w = factory({ warningText: 'Custom warning' })
    expect(w.find('.modal-warning-text').text()).toBe('Custom warning')
  })

  it('shows item label when provided', () => {
    const w = factory({ itemLabel: 'Camion Mercedes 2020' })
    expect(w.find('.modal-item-label').text()).toBe('Camion Mercedes 2020')
  })

  it('hides item label when not provided', () => {
    const w = factory()
    expect(w.find('.modal-item-label').exists()).toBe(false)
  })

  it('shows cancel and delete buttons', () => {
    const w = factory()
    expect(w.find('.btn-secondary').text()).toBe('common.cancel')
    expect(w.find('.btn-danger').text()).toBe('common.delete')
  })

  it('shows loading text when loading', () => {
    const w = factory({ loading: true })
    expect(w.find('.btn-danger').text()).toBe('common.loading')
  })

  it('disables delete button when loading', () => {
    const w = factory({ loading: true })
    expect(w.find('.btn-danger').attributes('disabled')).toBeDefined()
  })

  it('does not show confirmation input without requireConfirmation', () => {
    const w = factory()
    expect(w.find('.form-group').exists()).toBe(false)
  })

  it('shows confirmation input when requireConfirmation is true', () => {
    const w = factory({ requireConfirmation: true })
    expect(w.find('.form-group').exists()).toBe(true)
    expect(w.find('.form-input').exists()).toBe(true)
  })

  it('delete button is disabled when confirmation word not typed', () => {
    const w = factory({ requireConfirmation: true, confirmWord: 'borrar' })
    expect(w.find('.btn-danger').attributes('disabled')).toBeDefined()
  })

  it('emits update:show false on cancel click', async () => {
    const w = factory()
    await w.find('.btn-secondary').trigger('click')
    expect(w.emitted('update:show')).toBeTruthy()
    expect(w.emitted('update:show')![0]).toEqual([false])
  })

  it('emits update:show false on close button click', async () => {
    const w = factory()
    await w.find('.modal-close').trigger('click')
    expect(w.emitted('update:show')![0]).toEqual([false])
  })

  it('emits confirm on delete button click when no confirmation required', async () => {
    const w = factory()
    await w.find('.btn-danger').trigger('click')
    expect(w.emitted('confirm')).toBeTruthy()
  })

  it('close button has aria-label', () => {
    const w = factory()
    expect(w.find('.modal-close').attributes('aria-label')).toBe('common.close')
  })

  it('confirmation input has placeholder', () => {
    const w = factory({ requireConfirmation: true, confirmWord: 'borrar' })
    expect(w.find('.form-input').attributes('placeholder')).toBe('borrar')
  })

  it('confirmation input has autocomplete off', () => {
    const w = factory({ requireConfirmation: true })
    expect(w.find('.form-input').attributes('autocomplete')).toBe('off')
  })
})
