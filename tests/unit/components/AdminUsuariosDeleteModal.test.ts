/**
 * Tests for app/components/admin/usuarios/AdminUsuariosDeleteModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminUsuariosDeleteModal from '../../../app/components/admin/usuarios/AdminUsuariosDeleteModal.vue'

describe('AdminUsuariosDeleteModal', () => {
  const user = { pseudonimo: 'Juan García', email: 'juan@example.com' }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminUsuariosDeleteModal, {
      props: { show: true, user, ...overrides },
      global: {
        stubs: { Teleport: true },
      },
    })

  it('renders modal when show is true', () => {
    expect(factory().find('.modal-content').exists()).toBe(true)
  })

  it('hides modal when not show', () => {
    expect(factory({ show: false }).find('.modal-content').exists()).toBe(false)
  })

  it('shows user name', () => {
    expect(factory().find('.modal-body').text()).toContain('Juan García')
  })

  it('shows email when no pseudonimo', () => {
    const w = factory({ user: { pseudonimo: null, email: 'otro@example.com' } })
    expect(w.find('.modal-body').text()).toContain('otro@example.com')
  })

  it('shows warning text', () => {
    expect(factory().find('.text-warning').text()).toContain('eliminará la cuenta')
  })

  it('renders confirm input', () => {
    expect(factory().find('#delete-confirm').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h3').text()).toBe('Confirmar eliminación')
  })

  it('emits close on cancel click', async () => {
    const w = factory()
    await w.find('.btn-secondary').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
