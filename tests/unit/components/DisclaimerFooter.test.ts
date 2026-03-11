/**
 * Tests for app/components/DisclaimerFooter.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import DisclaimerFooter from '../../../app/components/DisclaimerFooter.vue'

describe('DisclaimerFooter', () => {
  const factory = () =>
    shallowMount(DisclaimerFooter, {
      global: {
        mocks: { $t: (key: string) => key },
        stubs: { NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] } },
      },
    })

  it('renders disclaimer-footer container', () => {
    const w = factory()
    expect(w.find('.disclaimer-footer').exists()).toBe(true)
  })

  it('shows disclaimer text', () => {
    const w = factory()
    expect(w.find('.disclaimer-text').text()).toBe('disclaimer.footerText')
  })

  it('shows link to legal page', () => {
    const w = factory()
    const link = w.find('.disclaimer-link')
    expect(link.text()).toBe('disclaimer.moreInfo')
    expect(link.attributes('href')).toBe('/legal')
  })
})
