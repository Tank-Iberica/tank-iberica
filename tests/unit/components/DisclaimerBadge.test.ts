/**
 * Tests for app/components/DisclaimerBadge.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { ref } from 'vue'

beforeAll(() => {
  vi.stubGlobal('ref', ref)
})

import DisclaimerBadge from '../../../app/components/DisclaimerBadge.vue'

describe('DisclaimerBadge', () => {
  const factory = () =>
    shallowMount(DisclaimerBadge, {
      global: { mocks: { $t: (key: string) => key } },
    })

  it('renders disclaimer-badge span', () => {
    const w = factory()
    expect(w.find('.disclaimer-badge').exists()).toBe(true)
  })

  it('renders info icon SVG', () => {
    const w = factory()
    expect(w.find('.info-icon').exists()).toBe(true)
  })

  it('does not show tooltip initially', () => {
    const w = factory()
    expect(w.find('.badge-tooltip').exists()).toBe(false)
  })

  it('shows tooltip on click', async () => {
    const w = factory()
    await w.find('.disclaimer-badge').trigger('click')
    expect(w.find('.badge-tooltip').exists()).toBe(true)
  })

  it('hides tooltip on second click', async () => {
    const w = factory()
    await w.find('.disclaimer-badge').trigger('click')
    await w.find('.disclaimer-badge').trigger('click')
    expect(w.find('.badge-tooltip').exists()).toBe(false)
  })

  it('tooltip shows title and text', async () => {
    const w = factory()
    await w.find('.disclaimer-badge').trigger('click')
    expect(w.find('.badge-tooltip strong').text()).toBe('disclaimer.badgeTitle')
    expect(w.find('.badge-tooltip p').text()).toBe('disclaimer.badgeText')
  })
})
