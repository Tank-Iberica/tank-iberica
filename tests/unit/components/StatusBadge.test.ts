/**
 * Tests for app/components/shared/StatusBadge.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { computed, ref } from 'vue'

// Use real Vue computed/ref so proxyRefs() in the template unwraps correctly
beforeAll(() => {
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('ref', ref)
})

// Mock the composable that provides getStatusConfig
vi.mock('~/composables/shared/useListingUtils', () => ({
  getStatusConfig: (status: string) => {
    const map: Record<string, { label: string; cssClass: string }> = {
      published: { label: 'shared.status.published', cssClass: 'status--published' },
      draft: { label: 'shared.status.draft', cssClass: 'status--draft' },
      sold: { label: 'shared.status.sold', cssClass: 'status--sold' },
      paused: { label: 'shared.status.paused', cssClass: 'status--paused' },
    }
    return map[status] || { label: 'shared.status.unknown', cssClass: 'status--unknown' }
  },
}))

import StatusBadge from '../../../app/components/shared/StatusBadge.vue'

describe('StatusBadge', () => {
  const factory = (props: { status: string; size?: 'sm' | 'md'; variant?: 'pill' | 'badge' }) =>
    shallowMount(StatusBadge, {
      props,
      global: {
        mocks: { $t: (key: string) => key },
      },
    })

  it('renders the translated status label', () => {
    const w = factory({ status: 'published' })
    expect(w.text()).toBe('shared.status.published')
  })

  it('applies the status CSS class', () => {
    const w = factory({ status: 'published' })
    expect(w.find('.status-badge').classes()).toContain('status--published')
  })

  it('applies draft CSS class', () => {
    const w = factory({ status: 'draft' })
    expect(w.find('.status-badge').classes()).toContain('status--draft')
  })

  it('applies sold CSS class', () => {
    const w = factory({ status: 'sold' })
    expect(w.find('.status-badge').classes()).toContain('status--sold')
  })

  it('defaults to size sm', () => {
    const w = factory({ status: 'published' })
    expect(w.find('.status-badge').classes()).toContain('status-badge--sm')
  })

  it('applies size md', () => {
    const w = factory({ status: 'published', size: 'md' })
    expect(w.find('.status-badge').classes()).toContain('status-badge--md')
  })

  it('defaults to variant pill', () => {
    const w = factory({ status: 'published' })
    expect(w.find('.status-badge').classes()).toContain('status-badge--pill')
  })

  it('applies variant badge', () => {
    const w = factory({ status: 'published', variant: 'badge' })
    expect(w.find('.status-badge').classes()).toContain('status-badge--badge')
  })

  it('handles unknown status gracefully', () => {
    const w = factory({ status: 'nonexistent' })
    expect(w.find('.status-badge').classes()).toContain('status--unknown')
  })
})
