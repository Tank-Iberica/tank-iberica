/**
 * Tests for app/components/admin/captacion/AdminLeadTabs.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import AdminLeadTabs from '../../../app/components/admin/captacion/AdminLeadTabs.vue'

const tabCounts = {
  all: 20, new: 5, contacted: 4, interested: 3, onboarding: 2, active: 4, rejected: 2,
}

describe('AdminLeadTabs', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminLeadTabs, {
      props: {
        activeTab: 'all' as const,
        tabCounts,
        hasSelection: false,
        selectedCount: 0,
        bulkProcessing: false,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders tabs row', () => {
    expect(factory().find('.tabs-row').exists()).toBe(true)
  })

  it('renders 7 tabs', () => {
    expect(factory().findAll('.tab-btn')).toHaveLength(7)
  })

  it('marks active tab', () => {
    expect(factory().findAll('.tab-btn')[0].classes()).toContain('active')
  })

  it('shows tab counts', () => {
    expect(factory().findAll('.tab-count')[0].text()).toBe('20')
  })

  it('emits update:activeTab on click', async () => {
    const w = factory()
    await w.findAll('.tab-btn')[1].trigger('click')
    expect(w.emitted('update:activeTab')?.[0]).toEqual(['new'])
  })

  it('hides bulk bar when no selection', () => {
    expect(factory().find('.bulk-bar').exists()).toBe(false)
  })

  it('shows bulk bar when hasSelection', () => {
    const w = factory({ hasSelection: true, selectedCount: 3 })
    expect(w.find('.bulk-bar').exists()).toBe(true)
  })

  it('shows selected count in bulk bar', () => {
    const w = factory({ hasSelection: true, selectedCount: 3 })
    expect(w.find('.bulk-count').text()).toBeTruthy()
  })

  it('emits bulkMarkContacted on bulk button click', async () => {
    const w = factory({ hasSelection: true, selectedCount: 2 })
    await w.find('.btn-bulk').trigger('click')
    expect(w.emitted('bulkMarkContacted')).toBeTruthy()
  })

  it('disables bulk button when processing', () => {
    const w = factory({ hasSelection: true, selectedCount: 2, bulkProcessing: true })
    expect(w.find('.btn-bulk').attributes('disabled')).toBeDefined()
  })
})
