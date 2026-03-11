/**
 * Tests for app/components/admin/anunciantes/AnunciantesDeleteModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import DeleteModal from '../../../app/components/admin/anunciantes/AnunciantesDeleteModal.vue'

describe('AnunciantesDeleteModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DeleteModal, {
      props: {
        show: true,
        advertisementName: 'Empresa Test',
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
    expect(factory().find('.modal-header h3').text()).toBe('admin.anunciantes.confirmDelete')
  })

  it('shows advertiser name in delete confirm message', () => {
    // $t mock returns the key without interpolation; confirm the key is rendered
    expect(factory().html()).toContain('admin.anunciantes.deleteConfirmMsg')
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

  it('disables delete when canDelete is false', () => {
    expect(factory().find('.btn-danger').attributes('disabled')).toBeDefined()
  })

  it('enables delete when canDelete is true', () => {
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

  it('emits update-confirm-text on input', async () => {
    const w = factory()
    await w.find('#delete-confirm').setValue('Borrar')
    expect(w.emitted('update-confirm-text')).toBeTruthy()
  })
})
