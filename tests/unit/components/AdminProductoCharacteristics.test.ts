/**
 * Tests for app/components/admin/productos/AdminProductoCharacteristics.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminProductoCharacteristics from '../../../app/components/admin/productos/AdminProductoCharacteristics.vue'

describe('AdminProductoCharacteristics', () => {
  const characteristics = [
    { id: 'c1', key: 'Motor', value_es: 'Diesel', value_en: 'Diesel' },
    { id: 'c2', key: 'Ejes', value_es: '3', value_en: '3' },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminProductoCharacteristics, {
      props: {
        open: true,
        characteristics,
        ...overrides,
      },
    })

  it('renders collapsible section', () => {
    expect(factory().find('.section.collapsible').exists()).toBe(true)
  })

  it('shows section toggle button', () => {
    expect(factory().find('.section-toggle').text()).toContain('Características adicionales')
  })

  it('shows section content when open', () => {
    expect(factory().find('.section-content').exists()).toBe(true)
  })

  it('hides section content when closed', () => {
    const w = factory({ open: false })
    expect(w.find('.section-content').exists()).toBe(false)
  })

  it('shows toggle indicator − when open', () => {
    expect(factory().find('.toggle-actions').text()).toContain('−')
  })

  it('shows toggle indicator + when closed', () => {
    const w = factory({ open: false })
    expect(w.find('.toggle-actions').text()).toContain('+')
  })

  it('renders characteristic rows', () => {
    expect(factory().findAll('.char-row')).toHaveLength(2)
  })

  it('renders 3 inputs per row (key, value_es, value_en)', () => {
    const row = factory().findAll('.char-row')[0]
    expect(row.findAll('input')).toHaveLength(3)
  })

  it('renders remove button per row', () => {
    expect(factory().findAll('.btn-x')).toHaveLength(2)
  })

  it('shows add button', () => {
    expect(factory().find('.btn-add').text()).toBe('+ Añadir')
  })

  it('emits update:open on toggle click', async () => {
    const w = factory()
    await w.find('.section-toggle').trigger('click')
    expect(w.emitted('update:open')?.[0]?.[0]).toBe(false)
  })

  it('emits add on add button click', async () => {
    const w = factory()
    await w.find('.btn-add').trigger('click')
    expect(w.emitted('add')).toBeTruthy()
  })

  it('emits remove on remove button click', async () => {
    const w = factory()
    await w.find('.btn-x').trigger('click')
    expect(w.emitted('remove')?.[0]?.[0]).toBe('c1')
  })

  it('shows empty message when no characteristics', () => {
    const w = factory({ characteristics: [] })
    expect(w.find('.empty-msg').text()).toContain('Sin características adicionales')
  })
})
