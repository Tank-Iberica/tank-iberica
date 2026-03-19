import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// useId is Nuxt auto-import, must exist before component mounts
vi.hoisted(() => {
  ;(globalThis as any).useId = () => 'auto-1'
})

import UiFormField from '../../../app/components/ui/FormField.vue'

describe('UiFormField', () => {
  describe('Label', () => {
    it('renders label text', () => {
      const wrapper = mount(UiFormField, { props: { label: 'Email' } })
      expect(wrapper.find('label').text()).toContain('Email')
    })

    it('label has for attribute', () => {
      const wrapper = mount(UiFormField, { props: { label: 'Name' } })
      const forAttr = wrapper.find('label').attributes('for')
      expect(forAttr).toBeDefined()
      expect(forAttr!.length).toBeGreaterThan(0)
    })

    it('shows required asterisk when required', () => {
      const wrapper = mount(UiFormField, { props: { label: 'Name', required: true } })
      expect(wrapper.find('.form-field__required').exists()).toBe(true)
      expect(wrapper.find('.form-field__required').text()).toBe('*')
    })

    it('hides required asterisk when not required', () => {
      const wrapper = mount(UiFormField, { props: { label: 'Name' } })
      expect(wrapper.find('.form-field__required').exists()).toBe(false)
    })

    it('required asterisk is aria-hidden', () => {
      const wrapper = mount(UiFormField, { props: { label: 'Name', required: true } })
      expect(wrapper.find('.form-field__required').attributes('aria-hidden')).toBe('true')
    })
  })

  describe('Error display', () => {
    it('shows error message when error prop is set', () => {
      const wrapper = mount(UiFormField, { props: { label: 'Email', error: 'Invalid email' } })
      expect(wrapper.find('.form-field__error').exists()).toBe(true)
      expect(wrapper.find('.form-field__error').text()).toBe('Invalid email')
    })

    it('error has role=alert for screen readers', () => {
      const wrapper = mount(UiFormField, { props: { label: 'Email', error: 'Required' } })
      expect(wrapper.find('.form-field__error').attributes('role')).toBe('alert')
    })

    it('error ID has -error suffix matching label for', () => {
      const wrapper = mount(UiFormField, { props: { label: 'Email', error: 'Error' } })
      const labelFor = wrapper.find('label').attributes('for')
      const errorId = wrapper.find('.form-field__error').attributes('id')
      expect(errorId).toBe(`${labelFor}-error`)
    })

    it('applies error class to wrapper', () => {
      const wrapper = mount(UiFormField, { props: { label: 'Email', error: 'Error' } })
      expect(wrapper.find('.form-field').classes()).toContain('form-field--error')
    })

    it('no error class when no error', () => {
      const wrapper = mount(UiFormField, { props: { label: 'Email' } })
      expect(wrapper.find('.form-field').classes()).not.toContain('form-field--error')
    })

    it('hides error when prop is null', () => {
      const wrapper = mount(UiFormField, { props: { label: 'Email', error: null } })
      expect(wrapper.find('.form-field__error').exists()).toBe(false)
    })
  })

  describe('Hint display', () => {
    it('shows hint when hint prop is set and no error', () => {
      const wrapper = mount(UiFormField, { props: { label: 'Email', hint: "We won't share it" } })
      expect(wrapper.find('.form-field__hint').exists()).toBe(true)
      expect(wrapper.find('.form-field__hint').text()).toBe("We won't share it")
    })

    it('hint ID has -hint suffix matching label for', () => {
      const wrapper = mount(UiFormField, { props: { label: 'Email', hint: 'Hint text' } })
      const labelFor = wrapper.find('label').attributes('for')
      const hintId = wrapper.find('.form-field__hint').attributes('id')
      expect(hintId).toBe(`${labelFor}-hint`)
    })

    it('hides hint when error is present', () => {
      const wrapper = mount(UiFormField, {
        props: { label: 'Email', hint: 'Hint', error: 'Error' },
      })
      expect(wrapper.find('.form-field__hint').exists()).toBe(false)
    })
  })

  describe('ID generation', () => {
    it('generates a non-empty auto ID', () => {
      const wrapper = mount(UiFormField, { props: { label: 'Name' } })
      const forAttr = wrapper.find('label').attributes('for')
      expect(forAttr).toBeTruthy()
    })

    it('each instance gets an ID', () => {
      const w1 = mount(UiFormField, { props: { label: 'A' } })
      const w2 = mount(UiFormField, { props: { label: 'B' } })
      expect(w1.find('label').attributes('for')).toBeTruthy()
      expect(w2.find('label').attributes('for')).toBeTruthy()
    })
  })

  describe('Slot rendering', () => {
    it('renders slot content', () => {
      const wrapper = mount(UiFormField, {
        props: { label: 'Name' },
        slots: { default: '<input type="text" />' },
      })
      expect(wrapper.find('input').exists()).toBe(true)
    })

    it('slot is inside form-field__input wrapper', () => {
      const wrapper = mount(UiFormField, {
        props: { label: 'Name' },
        slots: { default: '<input type="text" />' },
      })
      expect(wrapper.find('.form-field__input input').exists()).toBe(true)
    })

    it('error and hint IDs share the same base as label for', () => {
      const wrapper = mount(UiFormField, {
        props: { label: 'Email', error: 'Error' },
        slots: { default: '<input />' },
      })
      const labelFor = wrapper.find('label').attributes('for')!
      const errorId = wrapper.find('.form-field__error').attributes('id')!
      expect(errorId).toContain(labelFor)
      expect(errorId.endsWith('-error')).toBe(true)
    })
  })
})
