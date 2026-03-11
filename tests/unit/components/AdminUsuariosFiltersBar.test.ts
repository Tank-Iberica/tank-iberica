/**
 * Tests for app/components/admin/usuarios/AdminUsuariosFiltersBar.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminUsuariosPage', () => ({
  USER_ROLES: [
    { value: 'user', label: 'Usuario', color: '#3b82f6' },
    { value: 'admin', label: 'Admin', color: '#8b5cf6' },
    { value: 'visitor', label: 'Visitante', color: '#9ca3af' },
  ],
}))

import AdminUsuariosFiltersBar from '../../../app/components/admin/usuarios/AdminUsuariosFiltersBar.vue'

describe('AdminUsuariosFiltersBar', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminUsuariosFiltersBar, {
      props: {
        role: null,
        search: '',
        ...overrides,
      },
    })

  it('renders filters bar', () => {
    expect(factory().find('.filters-bar').exists()).toBe(true)
  })

  it('renders Todos + 3 role buttons', () => {
    expect(factory().findAll('.filter-btn')).toHaveLength(4)
  })

  it('marks Todos as active when role is null', () => {
    const btns = factory().findAll('.filter-btn')
    expect(btns[0].classes()).toContain('active')
  })

  it('marks role button as active', () => {
    const btns = factory({ role: 'admin' }).findAll('.filter-btn')
    expect(btns[0].classes()).not.toContain('active')
    expect(btns[2].classes()).toContain('active')
  })

  it('emits filter-role null on Todos click', async () => {
    const w = factory({ role: 'user' })
    await w.findAll('.filter-btn')[0].trigger('click')
    expect(w.emitted('filter-role')![0]).toEqual([null])
  })

  it('emits filter-role on role click', async () => {
    const w = factory()
    await w.findAll('.filter-btn')[1].trigger('click')
    expect(w.emitted('filter-role')![0]).toEqual(['user'])
  })

  it('renders search input', () => {
    expect(factory().find('.filter-search').exists()).toBe(true)
  })

  it('sets search value from prop', () => {
    const w = factory({ search: 'test' })
    expect((w.find('.filter-search').element as HTMLInputElement).value).toBe('test')
  })

  it('emits filter-search on input', async () => {
    const w = factory()
    const input = w.find('.filter-search')
    Object.defineProperty(input.element, 'value', { value: 'abc', writable: true })
    await input.trigger('input')
    expect(w.emitted('filter-search')![0]).toEqual(['abc'])
  })
})
