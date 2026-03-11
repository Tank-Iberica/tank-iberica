/**
 * Tests for app/components/ui/AiBadge.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import AiBadge from '../../../app/components/ui/AiBadge.vue'

describe('AiBadge', () => {
  const factory = (props: { type: 'generated' | 'translated' }) =>
    shallowMount(AiBadge, {
      props,
      global: {
        mocks: { $t: (key: string) => key },
      },
    })

  it('renders with type "generated"', () => {
    const w = factory({ type: 'generated' })
    expect(w.text()).toContain('ai.badgeGenerated')
  })

  it('renders with type "translated"', () => {
    const w = factory({ type: 'translated' })
    expect(w.text()).toContain('ai.badgeTranslated')
  })

  it('applies correct CSS class for generated', () => {
    const w = factory({ type: 'generated' })
    expect(w.find('.ai-badge').classes()).toContain('generated')
  })

  it('applies correct CSS class for translated', () => {
    const w = factory({ type: 'translated' })
    expect(w.find('.ai-badge').classes()).toContain('translated')
  })

  it('contains an SVG icon', () => {
    const w = factory({ type: 'generated' })
    expect(w.find('svg').exists()).toBe(true)
  })

  it('has inline-flex display via ai-badge class', () => {
    const w = factory({ type: 'generated' })
    expect(w.find('.ai-badge').exists()).toBe(true)
  })
})
