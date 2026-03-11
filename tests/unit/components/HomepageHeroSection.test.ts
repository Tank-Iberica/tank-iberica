/**
 * Tests for app/components/admin/config/homepage/HomepageHeroSection.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import HomepageHeroSection from '../../../app/components/admin/config/homepage/HomepageHeroSection.vue'

describe('HomepageHeroSection', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(HomepageHeroSection, {
      props: {
        heroTitle: { es: 'Bienvenido', en: 'Welcome' },
        heroSubtitle: { es: 'Subtitulo', en: 'Subtitle' },
        heroCtaText: { es: 'Ver catálogo', en: 'View catalog' },
        heroCtaUrl: '/catalogo',
        heroImageUrl: 'https://example.com/hero.jpg',
        ...overrides,
      },
    })

  it('renders config card', () => {
    expect(factory().find('.config-card').exists()).toBe(true)
  })

  it('shows Hero title', () => {
    expect(factory().find('.card-title').text()).toBe('Hero')
  })

  it('shows subtitle', () => {
    expect(factory().find('.card-subtitle').text()).toContain('Contenido principal')
  })

  it('renders lang badges (ES, EN)', () => {
    const badges = factory().findAll('.lang-badge')
    expect(badges.length).toBeGreaterThanOrEqual(6) // 3 fields × 2 langs
  })

  it('shows title ES input value', () => {
    const inputs = factory().findAll('.lang-field input')
    expect((inputs[0].element as HTMLInputElement).value).toBe('Bienvenido')
  })

  it('shows title EN input value', () => {
    const inputs = factory().findAll('.lang-field input')
    expect((inputs[1].element as HTMLInputElement).value).toBe('Welcome')
  })

  it('shows CTA URL input', () => {
    const input = factory().find('#hero_cta_url')
    expect((input.element as HTMLInputElement).value).toBe('/catalogo')
  })

  it('shows image URL input', () => {
    const input = factory().find('#hero_image_url')
    expect((input.element as HTMLInputElement).value).toBe('https://example.com/hero.jpg')
  })

  it('shows image preview when URL is set', () => {
    expect(factory().find('.image-preview img').attributes('src')).toBe('https://example.com/hero.jpg')
  })

  it('hides image preview when URL is empty', () => {
    const w = factory({ heroImageUrl: '' })
    expect(w.find('.image-preview').exists()).toBe(false)
  })
})
