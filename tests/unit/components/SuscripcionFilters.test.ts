/**
 * Tests for app/components/admin/dealers/SuscripcionFilters.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import SuscripcionFilters from '../../../app/components/admin/dealers/SuscripcionFilters.vue'

describe('SuscripcionFilters', () => {
  const plans = [
    { value: 'free', label: 'Free', color: '#94a3b8' },
    { value: 'basic', label: 'Basic', color: '#3b82f6' },
  ]
  const statuses = [
    { value: 'active', label: 'Activo', color: '#22c55e' },
    { value: 'cancelled', label: 'Cancelado', color: '#ef4444' },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(SuscripcionFilters, {
      props: {
        filterPlan: null,
        filterStatus: null,
        searchQuery: '',
        plans,
        statuses,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders filters bar', () => {
    expect(factory().find('.filters-bar').exists()).toBe(true)
  })

  it('renders plan filter group', () => {
    expect(factory().find('.plan-filter').exists()).toBe(true)
  })

  it('renders "All" + plan buttons', () => {
    const planBtns = factory().find('.plan-filter').findAll('.filter-btn')
    expect(planBtns).toHaveLength(3) // All + 2 plans
  })

  it('marks All active when no plan filter', () => {
    const btns = factory().find('.plan-filter').findAll('.filter-btn')
    expect(btns[0].classes()).toContain('active')
  })

  it('marks plan active when filter matches', () => {
    const btns = factory({ filterPlan: 'basic' }).find('.plan-filter').findAll('.filter-btn')
    expect(btns[0].classes()).not.toContain('active')
    expect(btns[2].classes()).toContain('active')
  })

  it('emits update:filterPlan null on All click', async () => {
    const w = factory({ filterPlan: 'free' })
    await w.find('.plan-filter').findAll('.filter-btn')[0].trigger('click')
    expect(w.emitted('update:filterPlan')![0]).toEqual([null])
  })

  it('emits update:filterPlan with value on plan click', async () => {
    const w = factory()
    await w.find('.plan-filter').findAll('.filter-btn')[1].trigger('click')
    expect(w.emitted('update:filterPlan')![0]).toEqual(['free'])
  })

  it('renders status filter group', () => {
    expect(factory().find('.status-filter').exists()).toBe(true)
  })

  it('emits update:filterStatus on status click', async () => {
    const w = factory()
    await w.find('.status-filter').findAll('.filter-btn')[1].trigger('click')
    expect(w.emitted('update:filterStatus')![0]).toEqual(['active'])
  })

  it('renders search input', () => {
    expect(factory().find('.filter-search').exists()).toBe(true)
  })
})
