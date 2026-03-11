/**
 * Tests for app/components/ui/AiDisclosureBadge.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { computed, ref } from 'vue'

// Use real Vue computed/ref so proxyRefs() in the template unwraps correctly
beforeAll(() => {
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('ref', ref)
})

import AiDisclosureBadge from '../../../app/components/ui/AiDisclosureBadge.vue'

describe('AiDisclosureBadge', () => {
  const factory = (props: { type: 'translated' | 'generated' | 'assisted'; size?: 'sm' | 'md' }) =>
    shallowMount(AiDisclosureBadge, {
      props,
      global: {
        mocks: { $t: (key: string) => key },
      },
    })

  it('renders translated badge text', () => {
    const w = factory({ type: 'translated' })
    expect(w.find('.badge-label').text()).toBe('ai.disclosure.translated')
  })

  it('renders generated badge text', () => {
    const w = factory({ type: 'generated' })
    expect(w.find('.badge-label').text()).toBe('ai.disclosure.generated')
  })

  it('renders assisted badge text', () => {
    const w = factory({ type: 'assisted' })
    expect(w.find('.badge-label').text()).toBe('ai.disclosure.assisted')
  })

  it('applies type CSS class', () => {
    const w = factory({ type: 'translated' })
    expect(w.find('.ai-disclosure-badge').classes()).toContain('type--translated')
  })

  it('defaults to size sm', () => {
    const w = factory({ type: 'generated' })
    expect(w.find('.ai-disclosure-badge').classes()).toContain('size--sm')
  })

  it('applies size md when specified', () => {
    const w = factory({ type: 'generated', size: 'md' })
    expect(w.find('.ai-disclosure-badge').classes()).toContain('size--md')
  })

  it('has role="note" for accessibility', () => {
    const w = factory({ type: 'assisted' })
    expect(w.find('.ai-disclosure-badge').attributes('role')).toBe('note')
  })

  it('sets aria-label with tooltip text', () => {
    const w = factory({ type: 'translated' })
    expect(w.find('.ai-disclosure-badge').attributes('aria-label')).toBeTruthy()
  })

  it('has title attribute for tooltip', () => {
    const w = factory({ type: 'generated' })
    expect(w.find('.ai-disclosure-badge').attributes('title')).toBeTruthy()
  })

  it('contains an SVG icon with aria-hidden', () => {
    const w = factory({ type: 'generated' })
    const svg = w.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('aria-hidden')).toBe('true')
  })

  it('uses default label for unknown type', () => {
    const w = factory({ type: 'unknown' })
    expect(w.text()).toContain('ai.disclosure.assisted')
  })
})
