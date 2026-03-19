import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import UiSubmitButton from '../../../app/components/ui/SubmitButton.vue'

vi.stubGlobal('useI18n', () => ({
  t: (key: string) => {
    const map: Record<string, string> = {
      'common.loading': 'Cargando...',
      'common.save': 'Guardar',
    }
    return map[key] ?? key
  },
}))

describe('UiSubmitButton', () => {
  describe('Props', () => {
    it('renders label text', () => {
      const wrapper = mount(UiSubmitButton, { props: { label: 'Send' } })
      expect(wrapper.text()).toContain('Send')
    })

    it('defaults to i18n save text when no label', () => {
      const wrapper = mount(UiSubmitButton)
      expect(wrapper.text()).toContain('Guardar')
    })

    it('defaults type to button', () => {
      const wrapper = mount(UiSubmitButton)
      expect(wrapper.find('button').attributes('type')).toBe('button')
    })

    it('accepts type=submit', () => {
      const wrapper = mount(UiSubmitButton, { props: { type: 'submit' } })
      expect(wrapper.find('button').attributes('type')).toBe('submit')
    })

    it('applies primary variant class by default', () => {
      const wrapper = mount(UiSubmitButton)
      expect(wrapper.find('button').classes()).toContain('submit-btn--primary')
    })

    it('applies danger variant class', () => {
      const wrapper = mount(UiSubmitButton, { props: { variant: 'danger' } })
      expect(wrapper.find('button').classes()).toContain('submit-btn--danger')
    })

    it('applies outline variant class', () => {
      const wrapper = mount(UiSubmitButton, { props: { variant: 'outline' } })
      expect(wrapper.find('button').classes()).toContain('submit-btn--outline')
    })

    it('applies secondary variant class', () => {
      const wrapper = mount(UiSubmitButton, { props: { variant: 'secondary' } })
      expect(wrapper.find('button').classes()).toContain('submit-btn--secondary')
    })
  })

  describe('Loading state', () => {
    it('disables button when loading', () => {
      const wrapper = mount(UiSubmitButton, { props: { loading: true } })
      expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    })

    it('sets aria-busy when loading', () => {
      const wrapper = mount(UiSubmitButton, { props: { loading: true } })
      expect(wrapper.find('button').attributes('aria-busy')).toBe('true')
    })

    it('shows spinner when loading', () => {
      const wrapper = mount(UiSubmitButton, { props: { loading: true } })
      expect(wrapper.find('.submit-btn__spinner').exists()).toBe(true)
    })

    it('hides spinner when not loading', () => {
      const wrapper = mount(UiSubmitButton, { props: { loading: false } })
      expect(wrapper.find('.submit-btn__spinner').exists()).toBe(false)
    })

    it('spinner has aria-hidden', () => {
      const wrapper = mount(UiSubmitButton, { props: { loading: true } })
      expect(wrapper.find('.submit-btn__spinner').attributes('aria-hidden')).toBe('true')
    })

    it('shows loadingLabel when loading', () => {
      const wrapper = mount(UiSubmitButton, {
        props: { loading: true, label: 'Save', loadingLabel: 'Saving...' },
      })
      expect(wrapper.text()).toContain('Saving...')
    })

    it('falls back to label when loadingLabel not set', () => {
      const wrapper = mount(UiSubmitButton, {
        props: { loading: true, label: 'Save' },
      })
      expect(wrapper.text()).toContain('Save')
    })

    it('falls back to i18n loading text when no labels', () => {
      const wrapper = mount(UiSubmitButton, { props: { loading: true } })
      expect(wrapper.text()).toContain('Cargando...')
    })
  })

  describe('Disabled state', () => {
    it('disables button when disabled prop is true', () => {
      const wrapper = mount(UiSubmitButton, { props: { disabled: true } })
      expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    })

    it('disables when both loading and disabled', () => {
      const wrapper = mount(UiSubmitButton, { props: { loading: true, disabled: true } })
      expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    })
  })

  describe('Events', () => {
    it('emits click on button click', async () => {
      const wrapper = mount(UiSubmitButton)
      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('click')).toHaveLength(1)
    })
  })
})
