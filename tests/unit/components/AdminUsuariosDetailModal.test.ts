/**
 * Tests for app/components/admin/usuarios/AdminUsuariosDetailModal.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminUsuariosPage', () => ({
  USER_ROLES: [
    { value: 'user', label: 'Usuario' },
    { value: 'dealer', label: 'Dealer' },
    { value: 'admin', label: 'Admin' },
  ],
  getRoleConfig: (r: string) => ({
    color: r === 'admin' ? '#ef4444' : '#3b82f6',
    label: r.toUpperCase(),
  }),
  getInitials: () => 'JG',
  getDisplayName: (u: Record<string, unknown>) => u.pseudonimo || u.email,
  getProviderLabel: (p: string) => p.toUpperCase(),
  formatDate: (d: string) => d,
}))

import AdminUsuariosDetailModal from '../../../app/components/admin/usuarios/AdminUsuariosDetailModal.vue'

describe('AdminUsuariosDetailModal', () => {
  const user = {
    id: 'u-1',
    pseudonimo: 'Juan García',
    email: 'juan@example.com',
    avatar_url: null,
    provider: 'email',
    role: 'user',
    created_at: '2026-01-15',
    phone: '+34 600 000 000',
    lang: 'es',
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminUsuariosDetailModal, {
      props: {
        show: true,
        user,
        selectedRole: 'user',
        saving: false,
        ...overrides,
      },
      global: {
        stubs: { Teleport: true },
      },
    })

  it('renders modal when show is true', () => {
    expect(factory().find('.modal-content').exists()).toBe(true)
  })

  it('hides modal when show is false', () => {
    expect(factory({ show: false }).find('.modal-content').exists()).toBe(false)
  })

  it('shows title', () => {
    expect(factory().find('h3').text()).toBe('Detalles del Usuario')
  })

  it('shows user name', () => {
    expect(factory().find('.user-main-name').text()).toBe('Juan García')
  })

  it('shows avatar initials when no image', () => {
    expect(factory().find('.avatar-initials').text()).toBe('JG')
  })

  it('shows contact section', () => {
    expect(factory().find('.detail-section').exists()).toBe(true)
  })

  it('shows email', () => {
    expect(factory().text()).toContain('juan@example.com')
  })

  it('shows phone when available', () => {
    expect(factory().text()).toContain('+34 600 000 000')
  })

  it('shows role badge', () => {
    expect(factory().find('.role-badge').exists()).toBe(true)
  })

  it('renders role select with options', () => {
    expect(factory().find('.role-select-large').exists()).toBe(true)
    expect(factory().findAll('.role-select-large option')).toHaveLength(3)
  })

  it('save button shows Guardar Rol', () => {
    expect(factory().find('.btn-primary').text()).toBe('Guardar Rol')
  })

  it('save button shows saving text', () => {
    expect(factory({ saving: true }).find('.btn-primary').text()).toBe('Guardando...')
  })

  it('emits close on close click', async () => {
    const w = factory()
    await w.find('.modal-close').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits save on primary click', async () => {
    const w = factory({ selectedRole: 'admin' })
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('save')).toBeTruthy()
  })

  it('emits close on footer close click', async () => {
    const w = factory()
    await w.find('.btn-secondary').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
