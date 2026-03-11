/**
 * Tests for app/components/dashboard/herramientas/mantenimientos/MantenimientosDeleteModal.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'

beforeAll(() => {
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'es' } }))
})

import MantenimientosDeleteModal from '../../../app/components/dashboard/herramientas/mantenimientos/MantenimientosDeleteModal.vue'

describe('MantenimientosDeleteModal', () => {
  const target = {
    id: '1',
    vehicle_brand: 'Volvo',
    vehicle_model: 'FH16',
    date: '2026-01-15',
    cost: 1500,
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(MantenimientosDeleteModal, {
      props: {
        show: true,
        deleteTarget: target,
        saving: false,
        fmt: (v: number) => `${v} €`,
        fmtDate: (d: string) => d,
        ...overrides,
      },
      global: { stubs: { Teleport: true } },
    })

  it('renders modal when show=true', () => {
    expect(factory().find('.modal-bg').exists()).toBe(true)
  })

  it('hides modal when show=false', () => {
    expect(factory({ show: false }).find('.modal-bg').exists()).toBe(false)
  })

  it('shows title', () => {
    expect(factory().find('.modal-head span').text()).toBe('dashboard.tools.maintenance.deleteTitle')
  })

  it('shows vehicle info', () => {
    const info = factory().find('.delete-info')
    expect(info.text()).toContain('Volvo')
    expect(info.text()).toContain('FH16')
  })

  it('shows formatted cost', () => {
    expect(factory().find('.delete-info').text()).toContain('1500 €')
  })

  it('shows formatted date', () => {
    expect(factory().find('.delete-info').text()).toContain('2026-01-15')
  })

  it('hides info when no target', () => {
    expect(factory({ deleteTarget: null }).find('.delete-info').exists()).toBe(false)
  })

  it('disables confirm when saving', () => {
    expect(factory({ saving: true }).find('.btn-danger').attributes('disabled')).toBeDefined()
  })

  it('emits confirm on danger click', async () => {
    const w = factory()
    await w.find('.btn-danger').trigger('click')
    expect(w.emitted('confirm')).toBeTruthy()
  })

  it('emits close on close button', async () => {
    const w = factory()
    await w.find('.modal-head button').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on cancel button', async () => {
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
