/**
 * Tests for app/components/admin/anunciantes/AnunciantesFilters.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminAnunciantes', () => ({
  ADVERTISEMENT_STATUSES: [
    { value: 'active', label: 'Activo', color: '#22c55e' },
    { value: 'pending', label: 'Pendiente', color: '#f59e0b' },
    { value: 'rejected', label: 'Rechazado', color: '#ef4444' },
  ],
}))

import AnunciantesFilters from '../../../app/components/admin/anunciantes/AnunciantesFilters.vue'

describe('AnunciantesFilters', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AnunciantesFilters, {
      props: {
        statusFilter: null,
        searchText: '',
        ...overrides,
      },
    })

  it('renders filters bar', () => {
    expect(factory().find('.filters-bar').exists()).toBe(true)
  })

  it('renders "Todos" button plus status buttons', () => {
    const btns = factory().findAll('.filter-btn')
    expect(btns).toHaveLength(4) // Todos + 3 statuses
  })

  it('marks Todos as active when no status filter', () => {
    const btns = factory().findAll('.filter-btn')
    expect(btns[0].classes()).toContain('active')
  })

  it('marks status button active when matching filter', () => {
    const btns = factory({ statusFilter: 'active' }).findAll('.filter-btn')
    expect(btns[0].classes()).not.toContain('active')
    expect(btns[1].classes()).toContain('active')
  })

  it('emits update-status null on Todos click', async () => {
    const w = factory({ statusFilter: 'active' })
    await w.findAll('.filter-btn')[0].trigger('click')
    expect(w.emitted('update-status')![0]).toEqual([null])
  })

  it('emits update-status with value on status click', async () => {
    const w = factory()
    await w.findAll('.filter-btn')[2].trigger('click')
    expect(w.emitted('update-status')![0]).toEqual(['pending'])
  })

  it('renders search input', () => {
    expect(factory().find('.filter-search').exists()).toBe(true)
  })

  it('emits update-search on input', async () => {
    const w = factory()
    const input = w.find('.filter-search')
    await input.setValue('volvo')
    expect(w.emitted('update-search')).toBeTruthy()
  })
})
