/**
 * Tests for app/components/admin/pagos/PagosStatusTabs.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import PagosStatusTabs from '../../../app/components/admin/pagos/PagosStatusTabs.vue'

const tabCounts = { all: 50, succeeded: 30, pending: 10, failed: 5, refunded: 5 }

describe('PagosStatusTabs', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(PagosStatusTabs, {
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

  it('renders 5 tab buttons', () => {
    expect(factory().findAll('.tab-btn')).toHaveLength(5)
  })

  it('marks active tab', () => {
    expect(factory().findAll('.tab-btn')[0].classes()).toContain('active')
  })

  it('marks non-active tabs', () => {
    expect(factory().findAll('.tab-btn')[1].classes()).not.toContain('active')
  })

  it('shows tab counts', () => {
    expect(factory().findAll('.tab-count')[0].text()).toBe('50')
  })

  it('emits change on tab click', async () => {
    const w = factory()
    await w.findAll('.tab-btn')[1].trigger('click')
    expect(w.emitted('change')?.[0]).toEqual(['succeeded'])
  })

  it('applies active to correct tab', () => {
    const w = factory({ activeTab: 'pending' })
    expect(w.findAll('.tab-btn')[2].classes()).toContain('active')
  })
})
