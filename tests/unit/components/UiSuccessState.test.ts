import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import UiSuccessState from '../../../app/components/ui/SuccessState.vue'

const NuxtLinkStub = {
  template: '<a :href="to" :class="$attrs.class"><slot /></a>',
  props: ['to'],
}

const UiSuccessCheckmarkStub = {
  template: '<span class="checkmark-stub" />',
  props: ['show'],
}

const stubs = {
  NuxtLink: NuxtLinkStub,
  UiSuccessCheckmark: UiSuccessCheckmarkStub,
  Transition: {
    template: '<div><slot /></div>',
  },
}

describe('UiSuccessState', () => {
  describe('Conditional rendering', () => {
    it('renders when show is true', () => {
      const wrapper = mount(UiSuccessState, {
        props: { show: true, message: 'Done!' },
        global: { stubs },
      })
      expect(wrapper.find('.success-state').exists()).toBe(true)
    })

    it('does not render when show is false', () => {
      const wrapper = mount(UiSuccessState, {
        props: { show: false, message: 'Done!' },
        global: { stubs },
      })
      expect(wrapper.find('.success-state').exists()).toBe(false)
    })
  })

  describe('Message', () => {
    it('displays the message text', () => {
      const wrapper = mount(UiSuccessState, {
        props: { show: true, message: 'Vehicle published!' },
        global: { stubs },
      })
      expect(wrapper.find('.success-state__message').text()).toBe('Vehicle published!')
    })
  })

  describe('Accessibility', () => {
    it('has role=status', () => {
      const wrapper = mount(UiSuccessState, {
        props: { show: true, message: 'OK' },
        global: { stubs },
      })
      expect(wrapper.find('.success-state').attributes('role')).toBe('status')
    })

    it('has aria-live=polite', () => {
      const wrapper = mount(UiSuccessState, {
        props: { show: true, message: 'OK' },
        global: { stubs },
      })
      expect(wrapper.find('.success-state').attributes('aria-live')).toBe('polite')
    })
  })

  describe('Checkmark', () => {
    it('renders UiSuccessCheckmark subcomponent', () => {
      const wrapper = mount(UiSuccessState, {
        props: { show: true, message: 'OK' },
        global: { stubs },
      })
      expect(wrapper.find('.checkmark-stub').exists()).toBe(true)
    })
  })

  describe('Actions', () => {
    it('renders no actions when empty', () => {
      const wrapper = mount(UiSuccessState, {
        props: { show: true, message: 'OK', actions: [] },
        global: { stubs },
      })
      expect(wrapper.find('.success-state__actions').exists()).toBe(false)
    })

    it('renders NuxtLink for action with to', () => {
      const wrapper = mount(UiSuccessState, {
        props: {
          show: true,
          message: 'OK',
          actions: [{ label: 'View', to: '/vehicles/123' }],
        },
        global: { stubs },
      })
      const link = wrapper.find('a')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toBe('/vehicles/123')
      expect(link.text()).toBe('View')
    })

    it('renders button for action with onClick', async () => {
      const onClick = vi.fn()
      const wrapper = mount(UiSuccessState, {
        props: {
          show: true,
          message: 'OK',
          actions: [{ label: 'Continue', onClick }],
        },
        global: { stubs },
      })
      const btn = wrapper.find('button')
      expect(btn.exists()).toBe(true)
      expect(btn.text()).toBe('Continue')
      await btn.trigger('click')
      expect(onClick).toHaveBeenCalled()
    })

    it('applies primary variant class by default', () => {
      const wrapper = mount(UiSuccessState, {
        props: {
          show: true,
          message: 'OK',
          actions: [{ label: 'Go', to: '/next' }],
        },
        global: { stubs },
      })
      const link = wrapper.find('a')
      expect(link.classes()).toContain('success-state__btn--primary')
    })

    it('applies secondary variant class', () => {
      const wrapper = mount(UiSuccessState, {
        props: {
          show: true,
          message: 'OK',
          actions: [{ label: 'Skip', to: '/skip', variant: 'secondary' }],
        },
        global: { stubs },
      })
      const link = wrapper.find('a')
      expect(link.classes()).toContain('success-state__btn--secondary')
    })

    it('renders multiple actions', () => {
      const wrapper = mount(UiSuccessState, {
        props: {
          show: true,
          message: 'OK',
          actions: [
            { label: 'View', to: '/view' },
            { label: 'New', to: '/new', variant: 'secondary' },
          ],
        },
        global: { stubs },
      })
      const links = wrapper.findAll('a')
      expect(links).toHaveLength(2)
      expect(links[0].text()).toBe('View')
      expect(links[1].text()).toBe('New')
    })
  })
})
