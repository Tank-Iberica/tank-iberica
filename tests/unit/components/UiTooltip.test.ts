/**
 * Tests for UiTooltip component.
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UiTooltip from '../../../app/components/ui/UiTooltip.vue'

describe('UiTooltip', () => {
  it('renders trigger button with question mark icon', () => {
    const wrapper = mount(UiTooltip, { props: { text: 'Help text' } })
    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('does not show tooltip content by default', () => {
    const wrapper = mount(UiTooltip, { props: { text: 'Help text' } })
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
  })

  it('shows tooltip on hover', async () => {
    const wrapper = mount(UiTooltip, { props: { text: 'Help text' } })
    await wrapper.find('button').trigger('mouseenter')
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(true)
    expect(wrapper.find('[role="tooltip"]').text()).toBe('Help text')
  })

  it('hides tooltip on mouseleave', async () => {
    const wrapper = mount(UiTooltip, { props: { text: 'Help text' } })
    await wrapper.find('button').trigger('mouseenter')
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(true)
    await wrapper.find('button').trigger('mouseleave')
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
  })

  it('shows tooltip on focus', async () => {
    const wrapper = mount(UiTooltip, { props: { text: 'Help text' } })
    await wrapper.find('button').trigger('focus')
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(true)
  })

  it('toggles tooltip on click (touch support)', async () => {
    const wrapper = mount(UiTooltip, { props: { text: 'Help text' } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(true)
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
  })

  it('uses aria-describedby linking trigger to tooltip', async () => {
    const wrapper = mount(UiTooltip, { props: { text: 'Help text' } })
    const btn = wrapper.find('button')
    const describedBy = btn.attributes('aria-describedby')
    expect(describedBy).toBeTruthy()

    await btn.trigger('mouseenter')
    const tooltip = wrapper.find('[role="tooltip"]')
    expect(tooltip.attributes('id')).toBe(describedBy)
  })

  it('sets aria-label on trigger button', () => {
    const wrapper = mount(UiTooltip, { props: { text: 'Help', label: 'More info' } })
    expect(wrapper.find('button').attributes('aria-label')).toBe('More info')
  })

  it('renders slot content instead of text prop', async () => {
    const wrapper = mount(UiTooltip, {
      props: { text: 'Fallback' },
      slots: { default: '<strong>Custom content</strong>' },
    })
    await wrapper.find('button').trigger('mouseenter')
    expect(wrapper.find('[role="tooltip"]').html()).toContain('<strong>Custom content</strong>')
  })
})
