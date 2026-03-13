/**
 * Tests for app/components/shared/DealerTrustBadge.vue
 *
 * Tests:
 *  - Renders nothing when tier is null
 *  - Renders badge for 'verified' tier
 *  - Renders badge for 'top' tier
 *  - Badge has correct CSS class per tier
 *  - Badge has aria-label
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { computed } from 'vue'

beforeAll(() => {
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('useI18n', () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }))
})

import DealerTrustBadge from '../../../app/components/shared/DealerTrustBadge.vue'

function factory(tier: 'top' | 'verified' | null) {
  return shallowMount(DealerTrustBadge, {
    props: { tier },
    global: { mocks: { $t: (k: string, fb?: string) => fb ?? k } },
  })
}

describe('DealerTrustBadge', () => {
  it('renders nothing when tier is null', () => {
    const wrapper = factory(null)
    expect(wrapper.find('.dealer-trust-badge').exists()).toBe(false)
  })

  it('renders badge element when tier is "verified"', () => {
    const wrapper = factory('verified')
    expect(wrapper.find('.dealer-trust-badge').exists()).toBe(true)
  })

  it('renders badge element when tier is "top"', () => {
    const wrapper = factory('top')
    expect(wrapper.find('.dealer-trust-badge').exists()).toBe(true)
  })

  it('applies --verified class for verified tier', () => {
    const wrapper = factory('verified')
    expect(wrapper.find('.dealer-trust-badge--verified').exists()).toBe(true)
    expect(wrapper.find('.dealer-trust-badge--top').exists()).toBe(false)
  })

  it('applies --top class for top tier', () => {
    const wrapper = factory('top')
    expect(wrapper.find('.dealer-trust-badge--top').exists()).toBe(true)
    expect(wrapper.find('.dealer-trust-badge--verified').exists()).toBe(false)
  })

  it('has aria-label attribute on badge', () => {
    const wrapper = factory('verified')
    const badge = wrapper.find('.dealer-trust-badge')
    expect(badge.attributes('aria-label')).toBeTruthy()
  })

  it('has role="status" on badge', () => {
    const wrapper = factory('top')
    const badge = wrapper.find('.dealer-trust-badge')
    expect(badge.attributes('role')).toBe('status')
  })

  it('shows star SVG for top tier', () => {
    const wrapper = factory('top')
    // SVG polygon is the star
    expect(wrapper.find('polygon').exists()).toBe(true)
  })

  it('shows checkmark SVG for verified tier', () => {
    const wrapper = factory('verified')
    // SVG polyline is the checkmark
    expect(wrapper.find('polyline').exists()).toBe(true)
  })
})
