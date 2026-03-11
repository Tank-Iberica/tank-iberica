/**
 * Tests for app/components/precios/PreciosHero.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import PreciosHero from '../../../app/components/precios/PreciosHero.vue'

describe('PreciosHero', () => {
  const factory = () =>
    shallowMount(PreciosHero, {
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders hero section', () => {
    expect(factory().find('.pricing-hero').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.pricing-title').text()).toBe('pricing.title')
  })

  it('shows subtitle', () => {
    expect(factory().find('.pricing-subtitle').text()).toBe('pricing.subtitle')
  })
})
