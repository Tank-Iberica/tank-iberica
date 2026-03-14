/**
 * Tests for app/components/admin/layout/AdminHeader.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { ref, computed } from 'vue'

const mockSignOut = vi.fn().mockResolvedValue({})
const mockNavigateTo = vi.fn()

beforeAll(() => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('onMounted', vi.fn())
  vi.stubGlobal('onUnmounted', vi.fn())
  vi.stubGlobal('navigateTo', mockNavigateTo)
  vi.stubGlobal('getVerticalSlug', () => 'tracciona')
  vi.stubGlobal('useSupabaseClient', () => ({
    auth: { signOut: mockSignOut },
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: [], error: null }),
      }),
    }),
  }))
})

import AdminHeader from '../../../app/components/admin/layout/AdminHeader.vue'

const buildWrapper = (
  routePath = '/admin',
  user: { email?: string; user_metadata?: { name?: string } } | null = { email: 'admin@test.com' },
) => {
  vi.stubGlobal('useRoute', () => ({ path: routePath }))
  vi.stubGlobal('useSupabaseUser', () => ({ value: user }))
  return shallowMount(AdminHeader, {
    global: {
      stubs: { NuxtLink: { template: '<a><slot /></a>' } },
    },
  })
}

describe('AdminHeader', () => {
  it('renders admin header element', () => {
    const w = buildWrapper()
    expect(w.find('.admin-header').exists()).toBe(true)
  })

  it('shows hamburger button', () => {
    const w = buildWrapper()
    expect(w.find('.hamburger-btn').exists()).toBe(true)
  })

  it('emits toggle-sidebar on hamburger click', async () => {
    const w = buildWrapper()
    await w.find('.hamburger-btn').trigger('click')
    expect(w.emitted('toggle-sidebar')).toHaveLength(1)
  })

  it('emits toggle-collapse on collapse button click', async () => {
    const w = buildWrapper()
    await w.find('.collapse-btn').trigger('click')
    expect(w.emitted('toggle-collapse')).toHaveLength(1)
  })

  it('shows Admin breadcrumb link', () => {
    const w = buildWrapper()
    expect(w.find('.breadcrumb').exists()).toBe(true)
  })

  it('shows currentSection for /admin/vehiculos', () => {
    const w = buildWrapper('/admin/vehiculos')
    expect(w.text()).toContain('admin.header.breadcrumbs.vehiculos')
  })

  it('shows currentSection for /admin/balance', () => {
    const w = buildWrapper('/admin/balance')
    expect(w.text()).toContain('admin.header.breadcrumbs.balance')
  })

  it('hides separator on root /admin path', () => {
    const w = buildWrapper('/admin')
    expect(w.find('.breadcrumb-separator').exists()).toBe(false)
  })

  it('shows separator when currentSection exists', () => {
    const w = buildWrapper('/admin/vehiculos')
    expect(w.find('.breadcrumb-separator').exists()).toBe(true)
  })

  it('displays username from email when no metadata name', () => {
    const w = buildWrapper('/admin', { email: 'pepe@example.com' })
    expect(w.find('.user-name').text()).toBe('pepe')
  })

  it('displays username from user_metadata.name', () => {
    const w = buildWrapper('/admin', {
      email: 'x@y.com',
      user_metadata: { name: 'Juan García' },
    })
    expect(w.find('.user-name').text()).toBe('Juan García')
  })

  it('shows Admin fallback when no user', () => {
    const w = buildWrapper('/admin', null)
    expect(w.find('.user-name').text()).toBe('Admin')
  })

  it('shows user avatar with initials from email', () => {
    const w = buildWrapper('/admin', { email: 'pepe@example.com' })
    // "pepe" → first 2 chars uppercase
    expect(w.find('.user-avatar').text()).toBe('PE')
  })

  it('shows initials from two-word name', () => {
    const w = buildWrapper('/admin', {
      email: 'x@y.com',
      user_metadata: { name: 'Juan García' },
    })
    expect(w.find('.user-avatar').text()).toBe('JG')
  })

  it('shows email in user dropdown when open', async () => {
    const w = buildWrapper('/admin', { email: 'admin@test.com' })
    // dropdown hidden initially
    expect(w.find('.user-dropdown').exists()).toBe(false)
    await w.find('.user-btn').trigger('click')
    expect(w.find('.user-dropdown').exists()).toBe(true)
    expect(w.find('.dropdown-email').text()).toBe('admin@test.com')
  })

  it('hides dropdown on second click', async () => {
    const w = buildWrapper()
    await w.find('.user-btn').trigger('click')
    expect(w.find('.user-dropdown').exists()).toBe(true)
    await w.find('.user-btn').trigger('click')
    expect(w.find('.user-dropdown').exists()).toBe(false)
  })

  it('calls signOut and navigates on logout click', async () => {
    mockSignOut.mockResolvedValueOnce({})
    const w = buildWrapper()
    await w.find('.user-btn').trigger('click')
    await w.find('.dropdown-item').trigger('click')
    expect(mockSignOut).toHaveBeenCalled()
  })

  it('shows view site link', () => {
    const w = buildWrapper()
    expect(w.find('.view-site-btn').exists()).toBe(true)
  })

  it('shows currentSection for /admin/noticias', () => {
    const w = buildWrapper('/admin/noticias')
    expect(w.text()).toContain('admin.header.breadcrumbs.noticias')
  })

  it('shows currentSection for /admin/usuarios', () => {
    const w = buildWrapper('/admin/usuarios')
    expect(w.text()).toContain('admin.header.breadcrumbs.usuarios')
  })
})
