/**
 * Tests for app/components/admin/usuarios/AdminUsuariosTable.vue
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
  getInitials: (u: Record<string, unknown>) => 'JG',
  getDisplayName: (u: Record<string, unknown>) => u.pseudonimo || u.email,
  getProviderLabel: (p: string) => p.toUpperCase(),
  formatDate: (d: string) => d,
}))

import AdminUsuariosTable from '../../../app/components/admin/usuarios/AdminUsuariosTable.vue'

describe('AdminUsuariosTable', () => {
  const users = [
    {
      id: 'u-1',
      pseudonimo: 'Juan García',
      email: 'juan@example.com',
      avatar_url: 'https://cdn.example.com/avatar.jpg',
      provider: 'email',
      role: 'user',
      created_at: '2026-01-15',
      phone: null,
      lang: 'es',
    },
    {
      id: 'u-2',
      pseudonimo: null,
      email: 'maria@example.com',
      avatar_url: null,
      provider: 'google',
      role: 'admin',
      created_at: '2026-02-20',
      phone: '+34 600',
      lang: 'en',
    },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminUsuariosTable, {
      props: {
        users,
        loading: false,
        error: null,
        ...overrides,
      },
    })

  it('renders table', () => {
    expect(factory().find('.admin-table').exists()).toBe(true)
  })

  it('renders 8 headers', () => {
    expect(factory().findAll('th')).toHaveLength(8)
  })

  it('renders user rows', () => {
    expect(factory().findAll('tbody tr')).toHaveLength(2)
  })

  it('shows pseudonimo', () => {
    expect(factory().find('strong').text()).toBe('Juan García')
  })

  it('shows dash for missing pseudonimo', () => {
    const rows = factory().findAll('tbody tr')
    expect(rows[1].find('strong').text()).toBe('-')
  })

  it('shows avatar image', () => {
    expect(factory().find('.avatar img').exists()).toBe(true)
  })

  it('shows avatar initials when no image', () => {
    const rows = factory().findAll('tbody tr')
    expect(rows[1].find('.avatar-initials').text()).toBe('JG')
  })

  it('shows provider badge', () => {
    expect(factory().find('.provider-badge').text()).toBe('EMAIL')
  })

  it('renders role select', () => {
    expect(factory().find('.role-select').exists()).toBe(true)
  })

  it('shows view and delete buttons', () => {
    expect(factory().findAll('.btn-view')).toHaveLength(2)
    expect(factory().findAll('.btn-delete')).toHaveLength(2)
  })

  it('emits view-detail on view click', async () => {
    const w = factory()
    await w.find('.btn-view').trigger('click')
    expect(w.emitted('view-detail')).toBeTruthy()
  })

  it('emits confirm-delete on delete click', async () => {
    const w = factory()
    await w.find('.btn-delete').trigger('click')
    expect(w.emitted('confirm-delete')).toBeTruthy()
  })

  it('shows error banner', () => {
    const w = factory({ error: 'Error loading' })
    expect(w.find('.error-banner').text()).toBe('Error loading')
  })

  it('shows loading state', () => {
    const w = factory({ loading: true })
    expect(w.find('.loading-state').exists()).toBe(true)
  })

  it('shows empty state', () => {
    const w = factory({ users: [] })
    expect(w.find('.empty-state').exists()).toBe(true)
  })
})
