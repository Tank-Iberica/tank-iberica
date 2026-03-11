/**
 * Tests for app/components/datos/DatosHero.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import DatosHero from '../../../app/components/datos/DatosHero.vue'

describe('DatosHero', () => {
  const factory = (lastUpdated = 'Marzo 2026') =>
    shallowMount(DatosHero, {
      props: { lastUpdated },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders hero section', () => {
    expect(factory().find('.datos-hero').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.datos-hero__title').text()).toBe('data.heroTitle')
  })

  it('shows subtitle', () => {
    expect(factory().find('.datos-hero__subtitle').text()).toBe('data.heroSubtitle')
  })

  it('shows last updated', () => {
    expect(factory().find('.datos-hero__updated').text()).toContain('Marzo 2026')
  })

  it('hides updated when empty', () => {
    const w = factory('')
    expect(w.find('.datos-hero__updated').exists()).toBe(false)
  })
})
