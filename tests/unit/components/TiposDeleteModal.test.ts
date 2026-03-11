/**
 * Tests for app/components/admin/config/tipos/TiposDeleteModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import TiposDeleteModal from '../../../app/components/admin/config/tipos/TiposDeleteModal.vue'

describe('TiposDeleteModal', () => {
  const deleteModal = { show: true, type: { id: '1', name_es: 'Grua' }, confirmText: '' }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(TiposDeleteModal, {
      props: { deleteModal, saving: false, canDelete: false, ...overrides },
      global: { stubs: { Teleport: true } },
    })

  it('renders modal when show is true', () => {
    expect(factory().find('.modal-overlay').exists()).toBe(true)
  })

  it('shows type name', () => {
    expect(factory().text()).toContain('admin.configTipos.deleteConfirmMsg')
  })

  it('disables delete button when canDelete is false', () => {
    expect(factory().find('.btn-danger').attributes('disabled')).toBeDefined()
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

  it('shows saving text', () => {
    expect(factory({ saving: true }).find('.btn-danger').text()).toBe('Eliminando...')
  })
})
