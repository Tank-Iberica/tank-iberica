/**
 * Tests for app/components/admin/whatsapp/AdminWhatsAppFilters.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminWhatsAppFilters from '../../../app/components/admin/whatsapp/AdminWhatsAppFilters.vue'

describe('AdminWhatsAppFilters', () => {
  const statusCounts = { all: 50, received: 10, processing: 5, processed: 15, published: 18, failed: 2 }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminWhatsAppFilters, {
      props: {
        statusFilter: 'all' as const,
        search: '',
        statusCounts,
        ...overrides,
      },
    })

  it('renders filters bar', () => {
    expect(factory().find('.filters-bar').exists()).toBe(true)
  })

  it('renders 6 status pills', () => {
    expect(factory().findAll('.status-pill')).toHaveLength(6)
  })

  it('marks active pill', () => {
    const pills = factory().findAll('.status-pill')
    expect(pills[0].classes()).toContain('active')
    expect(pills[1].classes()).not.toContain('active')
  })

  it('marks different active pill', () => {
    const pills = factory({ statusFilter: 'failed' }).findAll('.status-pill')
    expect(pills[0].classes()).not.toContain('active')
    expect(pills[5].classes()).toContain('active')
  })

  it('shows counts in pills', () => {
    const pills = factory().findAll('.status-pill')
    expect(pills[0].find('.pill-count').text()).toBe('50')
    expect(pills[5].find('.pill-count').text()).toBe('2')
  })

  it('emits update:statusFilter on pill click', async () => {
    const w = factory()
    await w.findAll('.status-pill')[3].trigger('click')
    expect(w.emitted('update:statusFilter')![0]).toEqual(['processed'])
  })

  it('renders search input', () => {
    expect(factory().find('.search-box input').exists()).toBe(true)
  })

  it('emits update:search on input', async () => {
    const w = factory()
    const input = w.find('.search-box input')
    Object.defineProperty(input.element, 'value', { value: 'test', writable: true })
    await input.trigger('input')
    expect(w.emitted('update:search')![0]).toEqual(['test'])
  })

  it('shows clear button when search has value', () => {
    expect(factory({ search: 'x' }).find('.clear-btn').exists()).toBe(true)
  })

  it('hides clear button when search is empty', () => {
    expect(factory().find('.clear-btn').exists()).toBe(false)
  })

  it('emits empty search on clear click', async () => {
    const w = factory({ search: 'test' })
    await w.find('.clear-btn').trigger('click')
    expect(w.emitted('update:search')![0]).toEqual([''])
  })
})
