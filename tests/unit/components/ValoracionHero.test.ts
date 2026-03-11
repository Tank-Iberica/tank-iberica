/**
 * Tests for app/components/valoracion/ValoracionHero.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ValoracionHero from '../../../app/components/valoracion/ValoracionHero.vue'

describe('ValoracionHero', () => {
  const factory = () =>
    shallowMount(ValoracionHero, {
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders hero section', () => {
    expect(factory().find('.valuation-hero').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.hero-title').text()).toBe('valuation.heroTitle')
  })

  it('shows subtitle', () => {
    expect(factory().find('.hero-subtitle').text()).toBe('valuation.heroSubtitle')
  })
})
