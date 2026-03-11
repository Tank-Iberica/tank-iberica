/**
 * Tests for app/components/dashboard/herramientas/alquileres/AlquilerFormModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AlquilerFormModal from '../../../app/components/dashboard/herramientas/alquileres/AlquilerFormModal.vue'

describe('AlquilerFormModal', () => {
  const vehicleOptions = [
    { id: 'v-1', brand: 'Volvo', model: 'FH16', year: 2023 },
    { id: 'v-2', brand: 'Scania', model: 'R450', year: null },
  ]

  const form = {
    vehicle_id: 'v-1',
    client_name: 'Pedro López',
    client_contact: '+34 600 000 000',
    start_date: '2026-03-01',
    end_date: '2026-06-01',
    monthly_rent: 1500,
    deposit: 3000,
    status: 'active',
    notes: 'Rental note',
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AlquilerFormModal, {
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
    expect(factory().find('.modal-head span').text()).toBe('dashboard.tools.rentals.createTitle')
  })

  it('shows edit title when editingId set', () => {
    const w = factory({ editingId: 'r-1' })
    expect(w.find('.modal-head span').text()).toBe('dashboard.tools.rentals.editTitle')
  })

  it('shows vehicle select with options', () => {
    const select = factory().find('select')
    // 2 vehicles + 1 disabled placeholder
    expect(select.findAll('option')).toHaveLength(3)
  })

  it('shows vehicle option with year', () => {
    const options = factory().findAll('select option')
    expect(options[1].text()).toContain('Volvo')
    expect(options[1].text()).toContain('(2023)')
  })

  it('shows client name input', () => {
    const inputs = factory().findAll('input[type="text"]')
    expect((inputs[0].element as HTMLInputElement).value).toBe('Pedro López')
  })

  it('shows client contact input', () => {
    const inputs = factory().findAll('input[type="text"]')
    expect((inputs[1].element as HTMLInputElement).value).toBe('+34 600 000 000')
  })

  it('shows start date input', () => {
    const dates = factory().findAll('input[type="date"]')
    expect((dates[0].element as HTMLInputElement).value).toBe('2026-03-01')
  })

  it('shows end date input', () => {
    const dates = factory().findAll('input[type="date"]')
    expect((dates[1].element as HTMLInputElement).value).toBe('2026-06-01')
  })

  it('shows monthly rent input', () => {
    const numbers = factory().findAll('input[type="number"]')
    expect((numbers[0].element as HTMLInputElement).value).toBe('1500')
  })

  it('shows deposit input', () => {
    const numbers = factory().findAll('input[type="number"]')
    expect((numbers[1].element as HTMLInputElement).value).toBe('3000')
  })

  it('shows 3 status radio buttons', () => {
    expect(factory().findAll('.radio-label')).toHaveLength(3)
  })

  it('checks active radio by default', () => {
    const radios = factory().findAll('input[type="radio"]')
    expect((radios[0].element as HTMLInputElement).checked).toBe(true)
  })

  it('shows notes textarea', () => {
    const textarea = factory().find('textarea')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('Rental note')
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

  it('shows spinner when saving', () => {
    const w = factory({ saving: true })
    expect(w.find('.spinner-sm').exists()).toBe(true)
  })

  it('shows save text for new', () => {
    expect(factory().find('.btn-primary').text()).toContain('dashboard.tools.rentals.form.save')
  })

  it('shows update text for edit', () => {
    const w = factory({ editingId: 'r-1' })
    expect(w.find('.btn-primary').text()).toContain('dashboard.tools.rentals.form.update')
  })
})
