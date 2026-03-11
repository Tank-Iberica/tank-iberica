/**
 * Tests for app/components/admin/config/branding/BrandingTypographyCard.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import BrandingTypographyCard from '../../../app/components/admin/config/branding/BrandingTypographyCard.vue'

describe('BrandingTypographyCard', () => {
  const presets = [
    { value: 'inter', label: 'Inter' },
    { value: 'roboto', label: 'Roboto' },
    { value: 'poppins', label: 'Poppins' },
  ]

  const factory = (fontPreset = 'inter') =>
    shallowMount(BrandingTypographyCard, {
      props: { fontPreset, fontPresets: presets },
    })

  it('renders config-card', () => {
    expect(factory().find('.config-card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.card-title').text()).toBe('Tipografia')
  })

  it('shows subtitle', () => {
    expect(factory().text()).toContain('Selecciona el estilo tipografico del sitio')
  })

  it('renders radio cards for each preset', () => {
    expect(factory().findAll('.radio-card')).toHaveLength(3)
  })

  it('selected preset has selected class', () => {
    const cards = factory('roboto').findAll('.radio-card')
    expect(cards[0].classes()).not.toContain('selected')
    expect(cards[1].classes()).toContain('selected')
  })

  it('radio is checked for selected preset', () => {
    const radios = factory('poppins').findAll('input[type="radio"]')
    expect((radios[2].element as HTMLInputElement).checked).toBe(true)
    expect((radios[0].element as HTMLInputElement).checked).toBe(false)
  })

  it('shows preset labels', () => {
    const labels = factory().findAll('.radio-label')
    expect(labels[0].text()).toBe('Inter')
    expect(labels[1].text()).toBe('Roboto')
    expect(labels[2].text()).toBe('Poppins')
  })

  it('emits update:fontPreset on radio change', async () => {
    const w = factory()
    const radio = w.findAll('input[type="radio"]')[2]
    await radio.trigger('change')
    expect(w.emitted('update:fontPreset')).toBeTruthy()
    expect(w.emitted('update:fontPreset')![0]).toEqual(['poppins'])
  })
})
