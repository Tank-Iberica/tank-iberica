/**
 * Tests for app/components/admin/solicitantes/FiltersBar.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminSolicitantes', () => ({
  DEMAND_STATUSES: [
    { value: 'new', label: 'Nuevo', color: '#3b82f6' },
    { value: 'contacted', label: 'Contactado', color: '#22c55e' },
    { value: 'closed', label: 'Cerrado', color: '#6b7280' },
  ],
}))

import FiltersBar from '../../../app/components/admin/solicitantes/FiltersBar.vue'

describe('SolicitantesFiltersBar', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(FiltersBar, {
      props: {
        currentStatus: null,
        searchQuery: '',
        ...overrides,
      },
    })

  it('renders filters bar', () => {
    expect(factory().find('.filters-bar').exists()).toBe(true)
  })

  it('renders Todos + status buttons', () => {
    // 1 "Todos" + 3 DEMAND_STATUSES
    expect(factory().findAll('.filter-btn')).toHaveLength(4)
  })

  it('shows Todos label on first button', () => {
    expect(factory().findAll('.filter-btn')[0].text()).toBe('Todos')
  })

  it('shows status labels', () => {
    const btns = factory().findAll('.filter-btn')
    expect(btns[1].text()).toBe('Nuevo')
    expect(btns[2].text()).toBe('Contactado')
    expect(btns[3].text()).toBe('Cerrado')
  })

  it('applies active class to null (Todos) by default', () => {
    expect(factory().findAll('.filter-btn')[0].classes()).toContain('active')
  })

  it('applies active class to matching status', () => {
    const w = factory({ currentStatus: 'contacted' })
    const btns = w.findAll('.filter-btn')
    expect(btns[0].classes()).not.toContain('active')
    expect(btns[2].classes()).toContain('active')
  })

  it('applies inline style when active status has color', () => {
    const w = factory({ currentStatus: 'new' })
    const btn = w.findAll('.filter-btn')[1]
    expect(btn.attributes('style')).toContain('#3b82f6')
  })

  it('emits update:status with null on Todos click', async () => {
    const w = factory({ currentStatus: 'new' })
    await w.findAll('.filter-btn')[0].trigger('click')
    expect(w.emitted('update:status')![0]).toEqual([null])
  })

  it('emits update:status on status click', async () => {
    const w = factory()
    await w.findAll('.filter-btn')[2].trigger('click')
    expect(w.emitted('update:status')![0]).toEqual(['contacted'])
  })

  it('renders search input', () => {
    expect(factory().find('.filter-search').exists()).toBe(true)
  })

  it('emits update:search on input', async () => {
    const w = factory()
    const input = w.find('.filter-search')
    const el = input.element as HTMLInputElement
    Object.defineProperty(el, 'value', { value: 'Volvo', writable: true })
    await input.trigger('input')
    expect(w.emitted('update:search')).toBeTruthy()
  })
})
