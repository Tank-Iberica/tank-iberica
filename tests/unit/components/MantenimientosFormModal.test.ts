/**
 * Tests for app/components/dashboard/herramientas/mantenimientos/MantenimientosFormModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import MantenimientosFormModal from '../../../app/components/dashboard/herramientas/mantenimientos/MantenimientosFormModal.vue'

describe('MantenimientosFormModal', () => {
  const vehicleOptions = [
    { id: 'v-1', brand: 'Volvo', model: 'FH16', year: 2023 },
    { id: 'v-2', brand: 'Scania', model: 'R450', year: null },
  ]

  const form = {
    vehicle_id: 'v-1',
    date: '2026-03-01',
    type: 'preventivo',
    description: 'Oil change',
    cost: 250,
    km: 150000,
    workshop: 'Taller Central',
    invoice_url: 'https://example.com/invoice.pdf',
    notes: 'Maintenance note',
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(MantenimientosFormModal, {
      props: {
        show: true,
        editingId: null,
        form,
        vehicleOptions,
        isFormValid: true,
        saving: false,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
        stubs: { Teleport: true },
      },
    })

  it('renders modal when show is true', () => {
    expect(factory().find('.modal-bg').exists()).toBe(true)
  })

  it('hides modal when show is false', () => {
    expect(factory({ show: false }).find('.modal-bg').exists()).toBe(false)
  })

  it('shows create title when no editingId', () => {
    expect(factory().find('.modal-head span').text()).toBe('dashboard.tools.maintenance.createTitle')
  })

  it('shows edit title when editingId set', () => {
    const w = factory({ editingId: 'm-1' })
    expect(w.find('.modal-head span').text()).toBe('dashboard.tools.maintenance.editTitle')
  })

  it('shows vehicle select with options', () => {
    const select = factory().find('select')
    expect(select.findAll('option')).toHaveLength(3)
  })

  it('shows date input', () => {
    const input = factory().find('input[type="date"]')
    expect((input.element as HTMLInputElement).value).toBe('2026-03-01')
  })

  it('shows 3 type radio buttons', () => {
    expect(factory().findAll('.radio-label')).toHaveLength(3)
  })

  it('checks preventivo radio by default', () => {
    const radios = factory().findAll('input[type="radio"]')
    expect((radios[0].element as HTMLInputElement).checked).toBe(true)
  })

  it('shows description textarea', () => {
    const textarea = factory().find('textarea')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('Oil change')
  })

  it('shows cost input', () => {
    const numbers = factory().findAll('input[type="number"]')
    expect((numbers[0].element as HTMLInputElement).value).toBe('250')
  })

  it('shows km input', () => {
    const numbers = factory().findAll('input[type="number"]')
    expect((numbers[1].element as HTMLInputElement).value).toBe('150000')
  })

  it('emits close on close button click', async () => {
    const w = factory()
    await w.find('.modal-head button').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on overlay click', async () => {
    const w = factory()
    await w.find('.modal-bg').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits save on save button click', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('save')).toBeTruthy()
  })

  it('disables save when not valid', () => {
    const w = factory({ isFormValid: false })
    expect((w.find('.btn-primary').element as HTMLButtonElement).disabled).toBe(true)
  })

  it('disables save when saving', () => {
    const w = factory({ saving: true })
    expect((w.find('.btn-primary').element as HTMLButtonElement).disabled).toBe(true)
  })
})
