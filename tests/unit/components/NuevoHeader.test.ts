/**
 * Tests for app/components/admin/productos/nuevo/NuevoHeader.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import NuevoHeader from '../../../app/components/admin/productos/nuevo/NuevoHeader.vue'

describe('NuevoHeader', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(NuevoHeader, {
      props: {
        saving: false,
        uploadingImages: false,
        isValid: true,
        ...overrides,
      },
    })

  it('renders header', () => {
    expect(factory().find('.pf-header').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h1').text()).toBe('Nuevo Vehiculo')
  })

  it('shows back button', () => {
    expect(factory().find('.btn-icon').exists()).toBe(true)
  })

  it('emits cancel on back button click', async () => {
    const w = factory()
    await w.find('.btn-icon').trigger('click')
    expect(w.emitted('cancel')).toBeTruthy()
  })

  it('emits cancel on cancel button click', async () => {
    const w = factory()
    await w.find('.btn').trigger('click')
    expect(w.emitted('cancel')).toBeTruthy()
  })

  it('shows Guardar text by default', () => {
    expect(factory().find('.btn-primary').text()).toBe('Guardar')
  })

  it('shows Guardando when saving', () => {
    expect(factory({ saving: true }).find('.btn-primary').text()).toBe('Guardando...')
  })

  it('shows Subiendo imagenes when uploading', () => {
    expect(factory({ uploadingImages: true }).find('.btn-primary').text()).toBe('Subiendo imagenes...')
  })

  it('disables save when saving', () => {
    expect(factory({ saving: true }).find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('disables save when uploading images', () => {
    expect(factory({ uploadingImages: true }).find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('disables save when not valid', () => {
    expect(factory({ isValid: false }).find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('enables save when valid and not saving', () => {
    expect(factory().find('.btn-primary').attributes('disabled')).toBeUndefined()
  })

  it('emits save on save button click', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('save')).toBeTruthy()
  })
})
