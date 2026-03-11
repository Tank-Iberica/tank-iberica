/**
 * Tests for app/components/admin/productos/nuevo/NuevoVisibility.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import NuevoVisibility from '../../../app/components/admin/productos/nuevo/NuevoVisibility.vue'

describe('NuevoVisibility', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(NuevoVisibility, {
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

  it('shows title', () => {
    expect(factory().find('.section-title').text()).toBe('Visibilidad')
  })

  it('shows 2 radio cards', () => {
    expect(factory().findAll('.radio-card')).toHaveLength(2)
  })

  it('marks web card as active when online', () => {
    expect(factory().findAll('.radio-card')[0].classes()).toContain('active')
  })

  it('marks internal card as active when offline', () => {
    const w = factory({ isOnline: false })
    expect(w.findAll('.radio-card')[1].classes()).toContain('active')
  })

  it('hides owner fields when online', () => {
    expect(factory().find('.owner-fields').exists()).toBe(false)
  })

  it('shows owner fields when offline', () => {
    const w = factory({ isOnline: false })
    expect(w.find('.owner-fields').exists()).toBe(true)
  })

  it('shows owner name input when offline', () => {
    const w = factory({ isOnline: false, ownerName: 'Juan' })
    const inputs = w.findAll('.owner-fields input')
    expect((inputs[0].element as HTMLInputElement).value).toBe('Juan')
  })

  it('shows owner contact input when offline', () => {
    const w = factory({ isOnline: false, ownerContact: '+34 600' })
    const inputs = w.findAll('.owner-fields input')
    expect((inputs[1].element as HTMLInputElement).value).toBe('+34 600')
  })

  it('shows owner notes input when offline', () => {
    const w = factory({ isOnline: false, ownerNotes: 'Note' })
    const inputs = w.findAll('.owner-fields input')
    expect((inputs[2].element as HTMLInputElement).value).toBe('Note')
  })

  it('emits update:isOnline true on web click', async () => {
    const w = factory({ isOnline: false })
    await w.findAll('.radio-card input')[0].trigger('change')
    expect(w.emitted('update:isOnline')?.[0]?.[0]).toBe(true)
  })

  it('emits update:isOnline false on internal click', async () => {
    const w = factory()
    await w.findAll('.radio-card input')[1].trigger('change')
    expect(w.emitted('update:isOnline')?.[0]?.[0]).toBe(false)
  })

  it('emits update:ownerName on input', async () => {
    const w = factory({ isOnline: false })
    await w.findAll('.owner-fields input')[0].trigger('input')
    expect(w.emitted('update:ownerName')).toBeTruthy()
  })
})
