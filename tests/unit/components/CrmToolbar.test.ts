/**
 * Tests for app/components/dashboard/crm/CrmToolbar.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import CrmToolbar from '../../../app/components/dashboard/crm/CrmToolbar.vue'

describe('CrmToolbar', () => {
  const contactTypes = [
    { value: 'buyer', labelKey: 'crm.buyer' },
    { value: 'seller', labelKey: 'crm.seller' },
  ]
  const filters = { search: '', contact_type: null }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(CrmToolbar, {
      props: { filters, contactTypes, ...overrides },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders toolbar', () => {
    expect(factory().find('.toolbar').exists()).toBe(true)
  })

  it('renders search input', () => {
    expect(factory().find('.search-box input').exists()).toBe(true)
  })

  it('renders segment buttons for all + types', () => {
    const buttons = factory().findAll('.segment-control button')
    expect(buttons).toHaveLength(3) // all + buyer + seller
  })

  it('all button is active by default', () => {
    expect(factory().findAll('.segment-control button')[0].classes()).toContain('active')
  })

  it('hides clear button when search empty', () => {
    expect(factory().find('.clear-btn').exists()).toBe(false)
  })

  it('shows clear button when search has text', () => {
    const w = factory({ filters: { search: 'test', contact_type: null } })
    expect(w.find('.clear-btn').exists()).toBe(true)
  })

  it('emits update:filters on type click', async () => {
    const w = factory()
    await w.findAll('.segment-control button')[1].trigger('click')
    expect(w.emitted('update:filters')).toBeTruthy()
    expect(w.emitted('update:filters')![0][0]).toEqual({ search: '', contact_type: 'buyer' })
  })

  it('emits update:filters on clear click', async () => {
    const w = factory({ filters: { search: 'test', contact_type: null } })
    await w.find('.clear-btn').trigger('click')
    expect(w.emitted('update:filters')![0][0]).toEqual({ search: '', contact_type: null })
  })
})
