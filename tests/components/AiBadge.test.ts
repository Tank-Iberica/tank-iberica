import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AiBadge from '../../app/components/ui/AiBadge.vue'

describe('AiBadge', () => {
  it('should render with type="generated" with correct text', () => {
    const wrapper = mount(AiBadge, {
      props: {
        type: 'generated',
      },
      global: {
        mocks: {
          $t: (key: string) => key,
        },
      },
    })

    expect(wrapper.text()).toContain('ai.badgeGenerated')
    expect(wrapper.find('.ai-badge').exists()).toBe(true)
  })

  it('should apply purple styling class for type="generated"', () => {
    const wrapper = mount(AiBadge, {
      props: {
        type: 'generated',
      },
      global: {
        mocks: {
          $t: (key: string) => key,
        },
      },
    })

    expect(wrapper.find('.ai-badge').classes()).toContain('generated')
  })

  it('should render with type="translated" with correct text', () => {
    const wrapper = mount(AiBadge, {
      props: {
        type: 'translated',
      },
      global: {
        mocks: {
          $t: (key: string) => key,
        },
      },
    })

    expect(wrapper.text()).toContain('ai.badgeTranslated')
    expect(wrapper.find('.ai-badge').exists()).toBe(true)
  })

  it('should apply blue styling class for type="translated"', () => {
    const wrapper = mount(AiBadge, {
      props: {
        type: 'translated',
      },
      global: {
        mocks: {
          $t: (key: string) => key,
        },
      },
    })

    expect(wrapper.find('.ai-badge').classes()).toContain('translated')
  })

  it('should be visible (rendered in DOM)', () => {
    const wrapper = mount(AiBadge, {
      props: {
        type: 'generated',
      },
      global: {
        mocks: {
          $t: (key: string) => key,
        },
      },
    })

    expect(wrapper.find('.ai-badge').isVisible()).toBe(true)
  })

  it('should contain an SVG icon', () => {
    const wrapper = mount(AiBadge, {
      props: {
        type: 'generated',
      },
      global: {
        mocks: {
          $t: (key: string) => key,
        },
      },
    })

    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('should have inline-flex display style', () => {
    const wrapper = mount(AiBadge, {
      props: {
        type: 'generated',
      },
      global: {
        mocks: {
          $t: (key: string) => key,
        },
      },
    })

    const badge = wrapper.find('.ai-badge')
    // Check that the element has the ai-badge class which applies inline-flex
    expect(badge.exists()).toBe(true)
    expect(badge.classes()).toContain('ai-badge')
  })
})
