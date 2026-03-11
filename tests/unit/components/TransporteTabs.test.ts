/**
 * Tests for app/components/admin/transporte/TransporteTabs.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import TransporteTabs from '../../../app/components/admin/transporte/TransporteTabs.vue'

const tabCounts = { all: 15, pending: 3, inProgress: 5, completed: 6, cancelled: 1 }

describe('TransporteTabs', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(TransporteTabs, {
      props: {
        activeTab: 'all' as const,
        tabCounts,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders tabs row', () => {
    expect(factory().find('.tabs-row').exists()).toBe(true)
  })

  it('renders 5 tabs', () => {
    expect(factory().findAll('.tab-btn')).toHaveLength(5)
  })

  it('marks active tab', () => {
    expect(factory().findAll('.tab-btn')[0].classes()).toContain('active')
  })

  it('shows tab counts', () => {
    expect(factory().findAll('.tab-count')[0].text()).toBe('15')
  })

  it('emits update:activeTab on click', async () => {
    const w = factory()
    await w.findAll('.tab-btn')[2].trigger('click')
    expect(w.emitted('update:activeTab')?.[0]).toEqual(['inProgress'])
  })

  it('applies active to correct tab', () => {
    const w = factory({ activeTab: 'completed' })
    expect(w.findAll('.tab-btn')[3].classes()).toContain('active')
  })
})
