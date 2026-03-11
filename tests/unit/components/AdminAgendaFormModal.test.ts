/**
 * Tests for app/components/admin/agenda/AdminAgendaFormModal.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminAgenda', () => ({
  CONTACT_TYPES: [
    { value: 'dealer', label: 'Dealer' },
    { value: 'transporter', label: 'Transportista' },
    { value: 'buyer', label: 'Comprador' },
  ],
}))

import AdminAgendaFormModal from '../../../app/components/admin/agenda/AdminAgendaFormModal.vue'

describe('AdminAgendaFormModal', () => {
  const formData = {
    contact_type: 'dealer',
    company: 'Volvo Trucks',
    contact_name: 'Juan García',
    phone: '+34 600 000 000',
    email: 'juan@volvo.com',
    location: 'León',
    products: 'Camiones',
    notes: 'Contacto principal',
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminAgendaFormModal, {
      props: {
        visible: true,
        isEditing: false,
        formData,
        saving: false,
        ...overrides,
      },
      global: {
        stubs: { Teleport: true },
      },
    })

  it('renders modal when visible', () => {
    expect(factory().find('.modal').exists()).toBe(true)
  })

  it('hides modal when not visible', () => {
    expect(factory({ visible: false }).find('.modal').exists()).toBe(false)
  })

  it('shows create title', () => {
    expect(factory().find('h3').text()).toBe('admin.agenda.newContact')
  })

  it('shows edit title when editing', () => {
    expect(factory({ isEditing: true }).find('h3').text()).toBe('admin.agenda.editContact')
  })

  it('renders contact type select with options', () => {
    const options = factory().findAll('select option')
    expect(options).toHaveLength(3)
  })

  it('renders form fields', () => {
    expect(factory().findAll('.form-group')).toHaveLength(8)
  })

  it('shows company input', () => {
    const input = factory().find('input[autocomplete="organization"]')
    expect(input.exists()).toBe(true)
  })

  it('shows contact name input', () => {
    const input = factory().find('input[autocomplete="name"]')
    expect(input.exists()).toBe(true)
  })

  it('shows phone input', () => {
    expect(factory().find('input[type="tel"]').exists()).toBe(true)
  })

  it('shows email input', () => {
    expect(factory().find('input[type="email"]').exists()).toBe(true)
  })

  it('shows notes textarea', () => {
    expect(factory().find('textarea').exists()).toBe(true)
  })

  it('submit button shows Crear for new', () => {
    expect(factory().find('.btn-primary').text()).toBe('Crear')
  })

  it('submit button shows Guardar when editing', () => {
    expect(factory({ isEditing: true }).find('.btn-primary').text()).toBe('Guardar')
  })

  it('submit button shows saving text', () => {
    expect(factory({ saving: true }).find('.btn-primary').text()).toBe('Guardando...')
  })

  it('emits close on cancel click', async () => {
    const w = factory()
    await w.find('.btn-secondary').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on modal-close click', async () => {
    const w = factory()
    await w.find('.modal-close').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits submit on primary click', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('submit')).toBeTruthy()
  })
})
