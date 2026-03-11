/**
 * Tests for app/components/dashboard/herramientas/merchandising/MerchHeroBanner.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import MerchHeroBanner from '../../../app/components/dashboard/herramientas/merchandising/MerchHeroBanner.vue'

describe('MerchHeroBanner', () => {
  const factory = () =>
    shallowMount(MerchHeroBanner, {
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders hero banner', () => {
    expect(factory().find('.hero-banner').exists()).toBe(true)
  })

  it('shows badge', () => {
    expect(factory().find('.hero-badge').text()).toBe('dashboard.tools.merchandising.badge')
  })

  it('shows title', () => {
    expect(factory().find('h1').text()).toBe('dashboard.tools.merchandising.title')
  })

  it('shows description', () => {
    expect(factory().find('.hero-desc').text()).toBe('dashboard.tools.merchandising.heroDesc')
  })

  it('has decorative icon', () => {
    expect(factory().find('.hero-icon').attributes('aria-hidden')).toBe('true')
  })
})
