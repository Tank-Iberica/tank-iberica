/**
 * Tests for app/components/admin/productos/AdminProductoVisibilidad.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminProductoVisibilidad from '../../../app/components/admin/productos/AdminProductoVisibilidad.vue'

describe('AdminProductoVisibilidad', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminProductoVisibilidad, {
      props: {
        isOnline: true,
        ownerName: null,
        ownerContact: null,
        ownerNotes: null,
        ...overrides,
      },
    })

  it('renders section', () => {
    expect(factory().find('.section').exists()).toBe(true)
  })

  it('shows section title', () => {
    expect(factory().text()).toContain('Visibilidad')
  })

  it('renders 2 radio cards', () => {
    expect(factory().findAll('.radio-card')).toHaveLength(2)
  })

  it('marks web radio as active when online', () => {
    const cards = factory().findAll('.radio-card')
    expect(cards[0].classes()).toContain('active')
    expect(cards[1].classes()).not.toContain('active')
  })

  it('marks intermediacion radio as active when offline', () => {
    const cards = factory({ isOnline: false }).findAll('.radio-card')
    expect(cards[0].classes()).not.toContain('active')
    expect(cards[1].classes()).toContain('active')
  })

  it('hides owner fields when online', () => {
    expect(factory().find('.owner-fields').exists()).toBe(false)
  })

  it('shows owner fields when offline', () => {
    expect(factory({ isOnline: false }).find('.owner-fields').exists()).toBe(true)
  })

  it('emits update:isOnline true on web radio change', async () => {
    const w = factory({ isOnline: false })
    const radios = w.findAll('.radio-card input')
    await radios[0].trigger('change')
    expect(w.emitted('update:isOnline')![0]).toEqual([true])
  })

  it('emits update:isOnline false on intermediacion radio change', async () => {
    const w = factory()
    const radios = w.findAll('.radio-card input')
    await radios[1].trigger('change')
    expect(w.emitted('update:isOnline')![0]).toEqual([false])
  })

  it('emits update:ownerName on input', async () => {
    const w = factory({ isOnline: false })
    const inputs = w.findAll('.owner-fields input')
    Object.defineProperty(inputs[0].element, 'value', { value: 'Juan', writable: true })
    await inputs[0].trigger('input')
    expect(w.emitted('update:ownerName')![0]).toEqual(['Juan'])
  })

  it('emits update:ownerContact on input', async () => {
    const w = factory({ isOnline: false })
    const inputs = w.findAll('.owner-fields input')
    Object.defineProperty(inputs[1].element, 'value', { value: '600123', writable: true })
    await inputs[1].trigger('input')
    expect(w.emitted('update:ownerContact')![0]).toEqual(['600123'])
  })

  it('emits update:ownerNotes on input', async () => {
    const w = factory({ isOnline: false })
    const inputs = w.findAll('.owner-fields input')
    Object.defineProperty(inputs[2].element, 'value', { value: 'nota', writable: true })
    await inputs[2].trigger('input')
    expect(w.emitted('update:ownerNotes')![0]).toEqual(['nota'])
  })
})
