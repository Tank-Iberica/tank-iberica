/**
 * Tests for app/components/dashboard/herramientas/alquileres/AlquilerDeleteModal.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'

beforeAll(() => {
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'es' } }))
})

import AlquilerDeleteModal from '../../../app/components/dashboard/herramientas/alquileres/AlquilerDeleteModal.vue'

describe('AlquilerDeleteModal', () => {
  const deleteTarget = {
    id: '1',
    vehicle_brand: 'Iveco',
    vehicle_model: 'Daily',
    client_name: 'Juan',
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AlquilerDeleteModal, {
      props: { show: true, deleteTarget, saving: false, ...overrides },
      global: { stubs: { Teleport: true } },
    })

  it('renders modal when show=true', () => {
    expect(factory().find('.modal-bg').exists()).toBe(true)
  })

  it('hides modal when show=false', () => {
    expect(factory({ show: false }).find('.modal-bg').exists()).toBe(false)
  })

  it('shows title text', () => {
    expect(factory().find('.modal-head span').text()).toBe('dashboard.tools.rentals.deleteTitle')
  })

  it('shows vehicle info', () => {
    const info = factory().find('.delete-info')
    expect(info.text()).toContain('Iveco')
    expect(info.text()).toContain('Daily')
  })

  it('shows client name', () => {
    expect(factory().find('.delete-info').text()).toContain('Juan')
  })

  it('hides delete-info when no target', () => {
    expect(factory({ deleteTarget: null }).find('.delete-info').exists()).toBe(false)
  })

  it('confirm button is not disabled by default', () => {
    expect(factory().find('.btn-danger').attributes('disabled')).toBeUndefined()
  })

  it('confirm button is disabled when saving', () => {
    expect(factory({ saving: true }).find('.btn-danger').attributes('disabled')).toBeDefined()
  })

  it('emits confirm on danger button click', async () => {
    const w = factory()
    await w.find('.btn-danger').trigger('click')
    expect(w.emitted('confirm')).toBeTruthy()
  })

  it('emits close on close button click', async () => {
    const w = factory()
    await w.find('.modal-head button').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on cancel button click', async () => {
    const w = factory()
    const buttons = w.findAll('.modal-foot .btn')
    await buttons[0].trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on overlay click', async () => {
    const w = factory()
    await w.find('.modal-bg').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
