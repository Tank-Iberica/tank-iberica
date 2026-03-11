/**
 * Tests for app/components/admin/config/navigation/FooterSection.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import FooterSection from '../../../app/components/admin/config/navigation/FooterSection.vue'

describe('FooterSection', () => {
  const footerText = { es: 'Todos los derechos reservados', en: 'All rights reserved' }
  const links = [
    { label_es: 'Legal', label_en: 'Legal', url: '/legal', external: false },
    { label_es: 'Privacidad', label_en: 'Privacy', url: '/privacidad', external: false },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(FooterSection, {
      props: { footerText, links, ...overrides },
    })

  it('renders config card', () => {
    expect(factory().find('.config-card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.card-title').text()).toBe('Footer')
  })

  it('shows subtitle', () => {
    expect(factory().find('.card-subtitle').text()).toContain('Texto del pie')
  })

  it('renders ES lang badge', () => {
    const badges = factory().findAll('.lang-badge')
    expect(badges[0].text()).toBe('ES')
  })

  it('renders EN lang badge', () => {
    const badges = factory().findAll('.lang-badge')
    expect(badges[1].text()).toBe('EN')
  })

  it('shows ES input value', () => {
    const inputs = factory().findAll('.lang-field input')
    expect(inputs[0].element.getAttribute('value')).toBe('Todos los derechos reservados')
  })

  it('shows EN input value', () => {
    const inputs = factory().findAll('.lang-field input')
    expect(inputs[1].element.getAttribute('value')).toBe('All rights reserved')
  })

  it('renders add link button', () => {
    expect(factory().find('.btn-add').text()).toContain('Anadir')
  })

  it('emits add-link on button click', async () => {
    const w = factory()
    await w.find('.btn-add').trigger('click')
    expect(w.emitted('add-link')).toHaveLength(1)
  })
})
