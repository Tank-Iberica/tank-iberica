/**
 * Tests for app/components/admin/productos/nuevo/NuevoCharacteristics.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import NuevoCharacteristics from '../../../app/components/admin/productos/nuevo/NuevoCharacteristics.vue'

describe('NuevoCharacteristics', () => {
  const characteristics = [
    { id: 'c-1', key_es: 'Motor', key_en: 'Engine', value_es: '500cv', value_en: '500hp' },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(NuevoCharacteristics, {
      props: {
        open: true,
        characteristics,
        ...overrides,
      },
    })

  it('renders collapsible section', () => {
    expect(factory().find('.collapsible').exists()).toBe(true)
  })

  it('shows toggle title', () => {
    expect(factory().find('.section-toggle').text()).toContain('Caracteristicas adicionales')
  })

  it('shows add button', () => {
    expect(factory().find('.btn-add').text()).toContain('Anadir')
  })

  it('emits add on add click', async () => {
    const w = factory()
    await w.find('.btn-add').trigger('click')
    expect(w.emitted('add')).toBeTruthy()
  })

  it('emits update:open on toggle click', async () => {
    const w = factory()
    await w.find('.section-toggle').trigger('click')
    expect(w.emitted('update:open')?.[0]?.[0]).toBe(false)
  })

  it('hides content when closed', () => {
    const w = factory({ open: false })
    // AdminProductCharacteristics child should not be present
    expect(w.findAll('.section-toggle').length).toBe(1)
  })
})
