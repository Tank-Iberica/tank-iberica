/**
 * Tests for app/components/admin/config/branding/BrandingColorsCard.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import BrandingColorsCard from '../../../app/components/admin/config/branding/BrandingColorsCard.vue'

describe('BrandingColorsCard', () => {
  const theme = {
    primary: '#23424A',
    secondary: '#1a8a6c',
    accent: '#f59e0b',
  }
  const colorLabels = {
    primary: 'Primario',
    secondary: 'Secundario',
    accent: 'Acento',
  }

  const factory = () =>
    shallowMount(BrandingColorsCard, {
      props: { theme, colorLabels },
    })

  it('renders config-card', () => {
    const w = factory()
    expect(w.find('.config-card').exists()).toBe(true)
  })

  it('shows title', () => {
    const w = factory()
    expect(w.find('.card-title').text()).toBe('Colores')
  })

  it('renders one color-field per theme key', () => {
    const w = factory()
    expect(w.findAll('.color-field')).toHaveLength(3)
  })

  it('shows color labels', () => {
    const w = factory()
    const labels = w.findAll('.color-field label')
    expect(labels[0].text()).toBe('Primario')
    expect(labels[1].text()).toBe('Secundario')
    expect(labels[2].text()).toBe('Acento')
  })

  it('renders color picker and hex input for each color', () => {
    const w = factory()
    expect(w.findAll('.color-picker')).toHaveLength(3)
    expect(w.findAll('.color-hex')).toHaveLength(3)
  })

  it('color picker has correct value', () => {
    const w = factory()
    const picker = w.findAll('.color-picker')[0]
    expect((picker.element as HTMLInputElement).value).toBe('#23424a')
  })

  it('hex input has correct value', () => {
    const w = factory()
    const hex = w.findAll('.color-hex')[0]
    expect((hex.element as HTMLInputElement).value).toBe('#23424A')
  })

  it('emits update:theme on color picker change', async () => {
    const w = factory()
    const picker = w.findAll('.color-picker')[0]
    Object.defineProperty(picker.element, 'value', { value: '#ff0000', writable: true })
    await picker.trigger('input')
    expect(w.emitted('update:theme')).toBeTruthy()
    expect(w.emitted('update:theme')![0][0]).toEqual(
      expect.objectContaining({ primary: '#ff0000', secondary: '#1a8a6c' }),
    )
  })

  it('emits update:theme on hex input change', async () => {
    const w = factory()
    const hex = w.findAll('.color-hex')[0]
    Object.defineProperty(hex.element, 'value', { value: '#abcdef', writable: true })
    await hex.trigger('input')
    expect(w.emitted('update:theme')).toBeTruthy()
  })
})
