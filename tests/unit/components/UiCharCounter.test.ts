/**
 * Tests for UiCharCounter component.
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UiCharCounter from '../../../app/components/ui/UiCharCounter.vue'

describe('UiCharCounter', () => {
  it('renders current/max text', () => {
    const wrapper = mount(UiCharCounter, { props: { current: 50, max: 100 } })
    expect(wrapper.text()).toBe('50/100')
  })

  it('does not show warning under 80%', () => {
    const wrapper = mount(UiCharCounter, { props: { current: 79, max: 100 } })
    expect(wrapper.classes()).not.toContain('char-counter--warning')
    expect(wrapper.classes()).not.toContain('char-counter--limit')
  })

  it('shows warning at 80%', () => {
    const wrapper = mount(UiCharCounter, { props: { current: 80, max: 100 } })
    expect(wrapper.classes()).toContain('char-counter--warning')
  })

  it('shows warning at 99%', () => {
    const wrapper = mount(UiCharCounter, { props: { current: 99, max: 100 } })
    expect(wrapper.classes()).toContain('char-counter--warning')
  })

  it('shows limit style at 100%', () => {
    const wrapper = mount(UiCharCounter, { props: { current: 100, max: 100 } })
    expect(wrapper.classes()).toContain('char-counter--limit')
    expect(wrapper.classes()).not.toContain('char-counter--warning')
  })

  it('has aria-live for accessibility', () => {
    const wrapper = mount(UiCharCounter, { props: { current: 0, max: 200 } })
    expect(wrapper.attributes('aria-live')).toBe('polite')
  })

  it('handles zero max gracefully', () => {
    const wrapper = mount(UiCharCounter, { props: { current: 0, max: 0 } })
    expect(wrapper.text()).toBe('0/0')
    expect(wrapper.classes()).not.toContain('char-counter--warning')
  })
})
