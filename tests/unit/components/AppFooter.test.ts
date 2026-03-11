/**
 * Tests for app/components/layout/AppFooter.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import AppFooter from '../../../app/components/layout/AppFooter.vue'

describe('AppFooter', () => {
  const factory = () =>
    shallowMount(AppFooter, {
      global: {
        mocks: { $t: (k: string) => k },
        stubs: { NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] } },
      },
    })

  it('renders footer', () => {
    expect(factory().find('.app-footer').exists()).toBe(true)
  })

  it('renders 3 footer sections', () => {
    expect(factory().findAll('.footer-section')).toHaveLength(3)
  })

  it('shows communications section', () => {
    expect(factory().findAll('.footer-section h3')[0].text()).toBe('footer.communications')
  })

  it('shows about us section', () => {
    expect(factory().findAll('.footer-section h3')[1].text()).toBe('footer.aboutUs')
  })

  it('shows legal section', () => {
    expect(factory().findAll('.footer-section h3')[2].text()).toBe('footer.legal')
  })

  it('shows copyright with current year', () => {
    const year = new Date().getFullYear()
    expect(factory().find('.footer-bottom').text()).toContain(String(year))
  })

  it('renders footer links', () => {
    const links = factory().findAll('.footer-links a')
    expect(links.length).toBeGreaterThan(0)
  })
})
