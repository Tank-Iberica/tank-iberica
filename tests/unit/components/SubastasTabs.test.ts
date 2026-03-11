/**
 * Tests for app/components/subastas/index/SubastasTabs.vue
 *
 * This component uses computed(() => [...]) for the tabs array.
 * The global computed stub returns a plain {value} object that Vue's
 * template renderer can't auto-unwrap, so we restore Vue's real computed.
 */
import { vi, describe, it, expect } from 'vitest'
import { computed } from 'vue'

// Replace global one-shot stub with real Vue computed for this file
vi.stubGlobal('computed', computed)

import { shallowMount } from '@vue/test-utils'
import SubastasTabs from '../../../app/components/subastas/index/SubastasTabs.vue'

describe('SubastasTabs', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(SubastasTabs, {
      props: {
        activeTab: 'live',
        loading: false,
        auctionCount: 12,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders tabs container', () => {
    expect(factory().find('.auctions-tabs').exists()).toBe(true)
  })

  it('renders 3 tab buttons', () => {
    expect(factory().findAll('.tab-btn')).toHaveLength(3)
  })

  it('marks active tab', () => {
    expect(factory().findAll('.tab-btn')[0].classes()).toContain('active')
  })

  it('does not mark inactive tabs', () => {
    expect(factory().findAll('.tab-btn')[1].classes()).not.toContain('active')
  })

  it('shows badge when not loading', () => {
    expect(factory().findAll('.tab-badge')).toHaveLength(3)
    expect(factory().findAll('.tab-badge')[0].text()).toBe('12')
  })

  it('hides badge when loading', () => {
    const w = factory({ loading: true })
    expect(w.findAll('.tab-badge')).toHaveLength(0)
  })

  it('emits select-tab on click', async () => {
    const w = factory()
    await w.findAll('.tab-btn')[1].trigger('click')
    expect(w.emitted('select-tab')?.[0]).toEqual(['scheduled'])
  })

  it('emits correct key for third tab', async () => {
    const w = factory()
    await w.findAll('.tab-btn')[2].trigger('click')
    expect(w.emitted('select-tab')?.[0]).toEqual(['ended'])
  })
})
