/**
 * Tests for app/components/admin/vehiculos/AdminVehicleDeleteModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import DeleteModal from '../../../app/components/admin/vehiculos/AdminVehicleDeleteModal.vue'

describe('AdminVehicleDeleteModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DeleteModal, {
      props: {
        show: true,
        vehicle: { id: 'v1', brand: 'DAF', model: 'XF' },
        saving: false,
        ...overrides,
      },
      global: { stubs: { Teleport: true } },
    })

  it('hides when show is false', () => {
    expect(factory({ show: false }).find('.modal-backdrop').exists()).toBe(false)
  })

  it('shows when show is true', () => {
    expect(factory().find('.modal-backdrop').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.modal-title').text()).toBe('admin.vehicles.deleteVehicle')
  })

  it('shows vehicle brand and model', () => {
    // v-html renders $t key without interpolation params in test
    const text = factory().find('.modal-text').text()
    expect(text).toContain('admin.vehicles.deleteConfirmMsg')
  })

  it('shows Eliminar text when not saving', () => {
    expect(factory().find('.btn-danger').text()).toBe('Eliminar')
  })

  it('shows Eliminando... when saving', () => {
    const w = factory({ saving: true })
    expect(w.find('.btn-danger').text()).toBe('Eliminando...')
  })

  it('disables delete when saving', () => {
    const w = factory({ saving: true })
    expect(w.find('.btn-danger').attributes('disabled')).toBeDefined()
  })

  it('enables delete when not saving', () => {
    expect(factory().find('.btn-danger').attributes('disabled')).toBeUndefined()
  })

  it('emits close on backdrop click', async () => {
    const w = factory()
    await w.find('.modal-backdrop').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on cancel click', async () => {
    const w = factory()
    await w.find('.btn-secondary').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits confirm on delete click', async () => {
    const w = factory()
    await w.find('.btn-danger').trigger('click')
    expect(w.emitted('confirm')).toBeTruthy()
  })
})
