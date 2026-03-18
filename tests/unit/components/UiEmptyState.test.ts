/**
 * Tests for UiEmptyState component.
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UiEmptyState from '../../../app/components/ui/UiEmptyState.vue'

const NuxtLinkStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to'],
}

describe('UiEmptyState', () => {
  const stubs = { NuxtLink: NuxtLinkStub }

  it('renders title and description', () => {
    const wrapper = mount(UiEmptyState, {
      props: { title: 'No results', description: 'Try adjusting your filters' },
      global: { stubs },
    })
    expect(wrapper.find('.empty-state-title').text()).toBe('No results')
    expect(wrapper.find('.empty-state-description').text()).toBe('Try adjusting your filters')
  })

  it('renders default icon when no icon slot', () => {
    const wrapper = mount(UiEmptyState, {
      props: { title: 'Empty' },
      global: { stubs },
    })
    expect(wrapper.find('.empty-state-icon svg').exists()).toBe(true)
  })

  it('renders custom icon slot', () => {
    const wrapper = mount(UiEmptyState, {
      props: { title: 'Empty' },
      global: { stubs },
      slots: { icon: '<span class="custom-icon">*</span>' },
    })
    expect(wrapper.find('.custom-icon').exists()).toBe(true)
  })

  it('renders CTA button with label', () => {
    const wrapper = mount(UiEmptyState, {
      props: { title: 'Empty', ctaLabel: 'Browse catalog' },
      global: { stubs },
    })
    const btn = wrapper.find('.empty-state-btn')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toBe('Browse catalog')
  })

  it('renders CTA as NuxtLink when ctaTo provided', () => {
    const wrapper = mount(UiEmptyState, {
      props: { title: 'Empty', ctaLabel: 'Go home', ctaTo: '/' },
      global: { stubs },
    })
    const link = wrapper.find('.empty-state-btn')
    expect(link.element.tagName).toBe('A')
    expect(link.attributes('href')).toBe('/')
  })

  it('emits cta event on button click (no ctaTo)', async () => {
    const wrapper = mount(UiEmptyState, {
      props: { title: 'Empty', ctaLabel: 'Retry' },
      global: { stubs },
    })
    await wrapper.find('.empty-state-btn').trigger('click')
    expect(wrapper.emitted('cta')).toHaveLength(1)
  })

  it('hides title when not provided', () => {
    const wrapper = mount(UiEmptyState, {
      props: { description: 'Some text' },
      global: { stubs },
    })
    expect(wrapper.find('.empty-state-title').exists()).toBe(false)
  })

  it('hides CTA when no label', () => {
    const wrapper = mount(UiEmptyState, {
      props: { title: 'Empty' },
      global: { stubs },
    })
    expect(wrapper.find('.empty-state-btn').exists()).toBe(false)
  })

  it('renders custom actions slot', () => {
    const wrapper = mount(UiEmptyState, {
      props: { title: 'Empty' },
      global: { stubs },
      slots: { actions: '<button class="custom-action">Custom</button>' },
    })
    expect(wrapper.find('.custom-action').exists()).toBe(true)
  })
})
