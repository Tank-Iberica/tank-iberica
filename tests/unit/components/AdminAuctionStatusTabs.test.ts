/**
 * Tests for app/components/admin/subastas/AdminAuctionStatusTabs.vue
 */
import { vi, describe, it, expect } from 'vitest'

vi.mock('~/composables/admin/useAdminAuctionList', () => ({
  STATUS_TABS: [
    { value: 'all', labelKey: 'admin.subastas.all' },
    { value: 'active', labelKey: 'admin.subastas.active' },
    { value: 'ended', labelKey: 'admin.subastas.ended' },
    { value: 'cancelled', labelKey: 'admin.subastas.cancelled' },
  ],
}))

import { shallowMount } from '@vue/test-utils'
import StatusTabs from '../../../app/components/admin/subastas/AdminAuctionStatusTabs.vue'

describe('AdminAuctionStatusTabs', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(StatusTabs, {
      props: {
        activeTab: 'all',
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders tabs row', () => {
    expect(factory().find('.tabs-row').exists()).toBe(true)
  })

  it('renders 4 tab buttons', () => {
    expect(factory().findAll('.tab-btn')).toHaveLength(4)
  })

  it('marks active tab', () => {
    expect(factory().findAll('.tab-btn')[0].classes()).toContain('active')
  })

  it('marks non-active tabs', () => {
    expect(factory().findAll('.tab-btn')[1].classes()).not.toContain('active')
  })

  it('emits update:activeTab on click', async () => {
    const w = factory()
    await w.findAll('.tab-btn')[1].trigger('click')
    expect(w.emitted('update:activeTab')?.[0]).toEqual(['active'])
  })

  it('applies active to correct tab', () => {
    const w = factory({ activeTab: 'ended' })
    expect(w.findAll('.tab-btn')[2].classes()).toContain('active')
  })
})
