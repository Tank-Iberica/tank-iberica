/**
 * Tests for app/components/admin/social/StatusTabs.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'

beforeAll(() => {
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'es' } }))
})

import SocialStatusTabs from '../../../app/components/admin/social/StatusTabs.vue'

describe('SocialStatusTabs', () => {
  const counts = { all: 50, pending: 10, approved: 15, posted: 20, rejected: 3, failed: 2 }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(SocialStatusTabs, {
      props: { modelValue: 'all', counts, ...overrides },
    })

  it('renders filters bar', () => {
    expect(factory().find('.filters-bar').exists()).toBe(true)
  })

  it('renders 6 status pills', () => {
    expect(factory().findAll('.status-pill')).toHaveLength(6)
  })

  it('marks active pill', () => {
    const pills = factory({ modelValue: 'posted' }).findAll('.status-pill')
    expect(pills[3].classes()).toContain('active')
    expect(pills[0].classes()).not.toContain('active')
  })

  it('shows pill counts', () => {
    const pillCounts = factory().findAll('.pill-count')
    expect(pillCounts[0].text()).toBe('50')
    expect(pillCounts[4].text()).toBe('3')
  })

  it('emits update:modelValue on click', async () => {
    const w = factory()
    await w.findAll('.status-pill')[2].trigger('click')
    expect(w.emitted('update:modelValue')![0]).toEqual(['approved'])
  })

  it('shows translated labels', () => {
    const pills = factory().findAll('.status-pill')
    expect(pills[0].text()).toContain('admin.social.tabs.all')
    expect(pills[5].text()).toContain('admin.social.tabs.failed')
  })
})
