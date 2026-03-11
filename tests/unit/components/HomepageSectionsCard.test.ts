/**
 * Tests for app/components/admin/config/homepage/HomepageSectionsCard.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import HomepageSectionsCard from '../../../app/components/admin/config/homepage/HomepageSectionsCard.vue'

describe('HomepageSectionsCard', () => {
  const sectionDefinitions = [
    { key: 'hero', label: 'Hero', description: 'Banner principal' },
    { key: 'featured', label: 'Destacados', description: 'Vehículos destacados' },
    { key: 'news', label: 'Noticias', description: 'Últimas noticias' },
  ]

  const sections: Record<string, boolean> = {
    hero: true,
    featured: true,
    news: false,
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(HomepageSectionsCard, {
      props: { sections, sectionDefinitions, ...overrides },
    })

  it('renders config card', () => {
    expect(factory().find('.config-card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.card-title').text()).toBe('Secciones')
  })

  it('shows subtitle', () => {
    expect(factory().find('.card-subtitle').text()).toContain('Activa o desactiva')
  })

  it('renders section toggles', () => {
    expect(factory().findAll('.section-toggle-card')).toHaveLength(3)
  })

  it('shows section label', () => {
    expect(factory().findAll('.section-toggle-label')[0].text()).toBe('Hero')
  })

  it('shows section description', () => {
    expect(factory().findAll('.section-toggle-desc')[0].text()).toBe('Banner principal')
  })

  it('marks active sections', () => {
    const cards = factory().findAll('.section-toggle-card')
    expect(cards[0].classes()).toContain('active')
    expect(cards[2].classes()).not.toContain('active')
  })

  it('checkbox reflects section state', () => {
    const checkboxes = factory().findAll('.section-checkbox')
    expect((checkboxes[0].element as HTMLInputElement).checked).toBe(true)
    expect((checkboxes[2].element as HTMLInputElement).checked).toBe(false)
  })

  it('emits toggle-section on checkbox change', async () => {
    const w = factory()
    await w.findAll('.section-checkbox')[0].trigger('change')
    expect(w.emitted('toggle-section')).toBeTruthy()
  })
})
