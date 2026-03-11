/**
 * Tests for app/components/admin/productos/AdminProductCharacteristics.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminProductCharacteristics from '../../../app/components/admin/productos/AdminProductCharacteristics.vue'

describe('AdminProductCharacteristics', () => {
  const characteristics = [
    { id: 'c-1', key: 'Motor', value_es: 'Volvo D13', value_en: 'Volvo D13' },
    { id: 'c-2', key: 'Potencia', value_es: '460 CV', value_en: '460 HP' },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminProductCharacteristics, {
      props: {
        characteristics,
        ...overrides,
      },
    })

  it('renders section content', () => {
    expect(factory().find('.section-content').exists()).toBe(true)
  })

  it('renders characteristic rows', () => {
    expect(factory().findAll('.char-row')).toHaveLength(2)
  })

  it('renders 3 inputs per row', () => {
    const row = factory().findAll('.char-row')[0]
    expect(row.findAll('input')).toHaveLength(3)
  })

  it('shows empty message when no characteristics', () => {
    const w = factory({ characteristics: [] })
    expect(w.find('.empty-msg').exists()).toBe(true)
  })

  it('hides empty message when characteristics exist', () => {
    expect(factory().find('.empty-msg').exists()).toBe(false)
  })

  it('renders remove button per row', () => {
    expect(factory().findAll('.btn-x')).toHaveLength(2)
  })

  it('emits remove on button click', async () => {
    const w = factory()
    await w.findAll('.btn-x')[0].trigger('click')
    expect(w.emitted('remove')).toBeTruthy()
    expect(w.emitted('remove')![0]).toEqual(['c-1'])
  })
})
