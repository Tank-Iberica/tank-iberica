/**
 * Tests for app/components/admin/config/subcategorias/SubcategoriasDeleteModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import SubcategoriasDeleteModal from '../../../app/components/admin/config/subcategorias/SubcategoriasDeleteModal.vue'

describe('SubcategoriasDeleteModal', () => {
  const deleteModal = { show: true, subcategory: { id: '1', name_es: 'Camiones' }, confirmText: '' }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(SubcategoriasDeleteModal, {
      props: { deleteModal, saving: false, canDelete: false, ...overrides },
      global: { stubs: { Teleport: true } },
    })

  it('renders modal when show is true', () => {
    expect(factory().find('.modal-overlay').exists()).toBe(true)
  })

  it('hides modal when show is false', () => {
    expect(factory({ deleteModal: { ...deleteModal, show: false } }).find('.modal-overlay').exists()).toBe(false)
  })

  it('shows subcategory name', () => {
    expect(factory().text()).toContain('Camiones')
  })

  it('shows confirmation input', () => {
    expect(factory().find('#delete-confirm').exists()).toBe(true)
  })

  it('disables delete button when canDelete is false', () => {
    expect(factory().find('.btn-danger').attributes('disabled')).toBeDefined()
  })

  it('enables delete button when canDelete is true', () => {
    expect(factory({ canDelete: true }).find('.btn-danger').attributes('disabled')).toBeUndefined()
  })

  it('shows saving text when saving', () => {
    expect(factory({ saving: true }).find('.btn-danger').text()).toContain('Eliminando...')
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

  it('emits close on X button click', async () => {
    const w = factory()
    await w.find('.modal-close').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('shows error text when confirmText present but canDelete false', () => {
    const w = factory({ deleteModal: { ...deleteModal, confirmText: 'wrong' } })
    expect(w.find('.text-error').exists()).toBe(true)
  })
})
