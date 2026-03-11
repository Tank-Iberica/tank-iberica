/**
 * Tests for app/components/admin/agenda/AdminAgendaToolbar.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminAgenda', () => ({
  CONTACT_TYPES: [
    { value: 'client', label: 'Cliente' },
    { value: 'supplier', label: 'Proveedor' },
    { value: 'partner', label: 'Socio' },
  ],
}))

import AdminAgendaToolbar from '../../../app/components/admin/agenda/AdminAgendaToolbar.vue'

describe('AdminAgendaToolbar', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminAgendaToolbar, {
      props: {
        search: '',
        contactType: null,
        ...overrides,
      },
    })

  it('renders toolbar', () => {
    expect(factory().find('.toolbar').exists()).toBe(true)
  })

  it('renders search input', () => {
    expect(factory().find('.search-box input').exists()).toBe(true)
  })

  it('sets search value from prop', () => {
    const w = factory({ search: 'test' })
    expect((w.find('.search-box input').element as HTMLInputElement).value).toBe('test')
  })

  it('emits update:search on input', async () => {
    const w = factory()
    const input = w.find('.search-box input')
    Object.defineProperty(input.element, 'value', { value: 'hello', writable: true })
    await input.trigger('input')
    expect(w.emitted('update:search')![0]).toEqual(['hello'])
  })

  it('shows clear button when search has value', () => {
    expect(factory({ search: 'x' }).find('.clear-btn').exists()).toBe(true)
  })

  it('hides clear button when search is empty', () => {
    expect(factory({ search: '' }).find('.clear-btn').exists()).toBe(false)
  })

  it('emits update:search empty on clear click', async () => {
    const w = factory({ search: 'test' })
    await w.find('.clear-btn').trigger('click')
    expect(w.emitted('update:search')![0]).toEqual([''])
  })

  it('renders Todos + 3 contact type buttons', () => {
    const buttons = factory().findAll('.segment-control button')
    expect(buttons).toHaveLength(4) // Todos + 3 types
  })

  it('marks Todos as active when contactType is null', () => {
    const buttons = factory().findAll('.segment-control button')
    expect(buttons[0].classes()).toContain('active')
  })

  it('marks contact type as active', () => {
    const buttons = factory({ contactType: 'client' }).findAll('.segment-control button')
    expect(buttons[0].classes()).not.toContain('active')
    expect(buttons[1].classes()).toContain('active')
  })

  it('emits update:contactType null on Todos click', async () => {
    const w = factory({ contactType: 'client' })
    await w.findAll('.segment-control button')[0].trigger('click')
    expect(w.emitted('update:contactType')![0]).toEqual([null])
  })

  it('emits update:contactType on type click', async () => {
    const w = factory()
    await w.findAll('.segment-control button')[2].trigger('click')
    expect(w.emitted('update:contactType')![0]).toEqual(['supplier'])
  })
})
