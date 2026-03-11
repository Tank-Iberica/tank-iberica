/**
 * Tests for app/components/admin/social/StatusTabs.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import StatusTabs from '../../../app/components/admin/social/StatusTabs.vue'

describe('StatusTabs', () => {
  const counts = { all: 100, pending: 20, approved: 50, posted: 25, rejected: 3, failed: 2 }

  const factory = (modelValue = 'all') =>
    shallowMount(StatusTabs, {
      props: { modelValue, counts },
      global: { mocks: { $t: (key: string) => key } },
    })

  it('renders filters-bar', () => {
    const w = factory()
    expect(w.find('.filters-bar').exists()).toBe(true)
  })

  it('renders 6 status pills', () => {
    const w = factory()
    expect(w.findAll('.status-pill')).toHaveLength(6)
  })

  it('shows translated tab labels', () => {
    const w = factory()
    const pills = w.findAll('.status-pill')
    expect(pills[0].text()).toContain('admin.social.tabs.all')
  })

  it('shows count in each pill', () => {
    const w = factory()
    const pills = w.findAll('.status-pill')
    expect(pills[0].find('.pill-count').text()).toBe('100')
    expect(pills[1].find('.pill-count').text()).toBe('20')
  })

  it('active tab has active class', () => {
    const w = factory('pending')
    const pills = w.findAll('.status-pill')
    expect(pills[1].classes()).toContain('active')
  })

  it('non-active tabs do not have active class', () => {
    const w = factory('pending')
    expect(w.findAll('.status-pill')[0].classes()).not.toContain('active')
  })

  it('emits update:modelValue on click', async () => {
    const w = factory()
    await w.findAll('.status-pill')[2].trigger('click')
    expect(w.emitted('update:modelValue')).toBeTruthy()
    expect(w.emitted('update:modelValue')![0]).toEqual(['approved'])
  })
})
