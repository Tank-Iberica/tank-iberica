/**
 * Tests for app/components/admin/productos/AdminProductoHeader.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminProductoHeader from '../../../app/components/admin/productos/AdminProductoHeader.vue'

describe('AdminProductoHeader', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminProductoHeader, {
      props: {
        vehicle: { brand: 'DAF', model: 'XF' },
        featured: false,
        saving: false,
        isValid: true,
        driveConnected: false,
        driveLoading: false,
        fileNamingData: {},
        driveSection: 'Vehiculos' as const,
        ...overrides,
      },
    })

  it('renders header', () => {
    expect(factory().find('.pf-header').exists()).toBe(true)
  })

  it('shows vehicle brand and model', () => {
    expect(factory().find('h1').text()).toContain('DAF')
    expect(factory().find('h1').text()).toContain('XF')
  })

  it('shows star when featured', () => {
    expect(factory({ featured: true }).find('.star').exists()).toBe(true)
  })

  it('hides star when not featured', () => {
    expect(factory().find('.star').exists()).toBe(false)
  })

  it('emits back on back button click', async () => {
    const w = factory()
    await w.find('.btn-icon').trigger('click')
    expect(w.emitted('back')).toBeTruthy()
  })

  it('emits sell on sell button click', async () => {
    const w = factory()
    await w.find('.btn-sell').trigger('click')
    expect(w.emitted('sell')).toBeTruthy()
  })

  it('emits delete on delete button click', async () => {
    const w = factory()
    await w.find('.btn-danger-outline').trigger('click')
    expect(w.emitted('delete')).toBeTruthy()
  })

  it('emits save on save button click', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('save')).toBeTruthy()
  })

  it('disables save when saving', () => {
    const btn = factory({ saving: true }).find('.btn-primary')
    expect((btn.element as HTMLButtonElement).disabled).toBe(true)
    expect(btn.text()).toContain('Guardando')
  })

  it('disables save when not valid', () => {
    const btn = factory({ isValid: false }).find('.btn-primary')
    expect((btn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('enables save when valid and not saving', () => {
    const btn = factory().find('.btn-primary')
    expect((btn.element as HTMLButtonElement).disabled).toBe(false)
  })

  it('shows Drive connected state', () => {
    const w = factory({ driveConnected: true })
    expect(w.find('.btn-drive-on').exists()).toBe(true)
  })
})
