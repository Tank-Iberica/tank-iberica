/**
 * Tests for app/components/admin/verificaciones/VerificacionFilters.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import VerificacionFilters from '../../../app/components/admin/verificaciones/VerificacionFilters.vue'

describe('VerificacionFilters', () => {
  const defaults = {
    statusFilter: 'all',
    statusCounts: { all: 20, pending: 5, verified: 12, rejected: 3 },
    search: '',
    pendingCount: 5,
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(VerificacionFilters, {
      props: { ...defaults, ...overrides },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders filters bar', () => {
    expect(factory().find('.filters-bar').exists()).toBe(true)
  })

  it('renders 4 status pills', () => {
    expect(factory().findAll('.status-pill')).toHaveLength(4)
  })

  it('marks active pill', () => {
    expect(factory().findAll('.status-pill')[0].classes()).toContain('active')
  })

  it('shows counts in pills', () => {
    const counts = factory().findAll('.pill-count')
    expect(counts[0].text()).toBe('20')
    expect(counts[1].text()).toBe('5')
  })

  it('emits update:statusFilter on pill click', async () => {
    const w = factory()
    await w.findAll('.status-pill')[1].trigger('click')
    expect(w.emitted('update:statusFilter')![0]).toEqual(['pending'])
  })

  it('renders search input', () => {
    expect(factory().find('.search-box input').exists()).toBe(true)
  })

  it('hides clear button when no search', () => {
    expect(factory().find('.clear-btn').exists()).toBe(false)
  })

  it('shows clear button when search present', () => {
    expect(factory({ search: 'volvo' }).find('.clear-btn').exists()).toBe(true)
  })

  it('emits update:search empty on clear click', async () => {
    const w = factory({ search: 'test' })
    await w.find('.clear-btn').trigger('click')
    expect(w.emitted('update:search')![0]).toEqual([''])
  })

  it('emits update:search on search input', async () => {
    const w = factory()
    const input = w.find('input[type="text"]')
    Object.defineProperty(input.element, 'value', { value: 'volvo', writable: true })
    await input.trigger('input')
    expect(w.emitted('update:search')).toBeTruthy()
  })
})
