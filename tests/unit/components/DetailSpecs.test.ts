/**
 * Tests for app/components/vehicle/DetailSpecs.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import DetailSpecs from '../../../app/components/vehicle/DetailSpecs.vue'

describe('DetailSpecs', () => {
  const factory = (attrs: Record<string, unknown> = { motor: '450cv', peso: '18000', combustible: { es: 'Diésel', en: 'Diesel' } }, locale = 'es') =>
    shallowMount(DetailSpecs, {
      props: { attributesJson: attrs, locale },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders characteristics section', () => {
    expect(factory().find('.vehicle-characteristics').exists()).toBe(true)
  })

  it('shows heading', () => {
    expect(factory().find('h2').text()).toBe('vehicle.characteristics')
  })

  it('renders attribute items', () => {
    expect(factory().findAll('.vehicle-char-item')).toHaveLength(3)
  })

  it('capitalizes attribute labels', () => {
    const labels = factory().findAll('.vehicle-char-label')
    expect(labels[0].text()).toBe('Motor')
  })

  it('shows string values', () => {
    const values = factory().findAll('.vehicle-char-value')
    expect(values[0].text()).toBe('450cv')
  })

  it('resolves multilang value in es', () => {
    const values = factory().findAll('.vehicle-char-value')
    expect(values[2].text()).toBe('Diésel')
  })

  it('resolves multilang value in en', () => {
    const w = factory({ combustible: { es: 'Diésel', en: 'Diesel' } }, 'en')
    expect(w.find('.vehicle-char-value').text()).toBe('Diesel')
  })

  it('renders empty when no attributes', () => {
    const w = factory({})
    expect(w.findAll('.vehicle-char-item')).toHaveLength(0)
  })

  it('shows empty string for falsy attribute value', () => {
    const w = factory({ motor: null })
    const values = w.findAll('.vehicle-char-value')
    expect(values[0].text()).toBe('')
  })
})
