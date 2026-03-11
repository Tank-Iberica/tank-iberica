/**
 * Tests for app/components/dashboard/crm/CrmFormModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import CrmFormModal from '../../../app/components/dashboard/crm/CrmFormModal.vue'

describe('CrmFormModal', () => {
  const contactTypes = [
    { value: 'lead', labelKey: 'dashboard.crm.typeLead' },
    { value: 'client', labelKey: 'dashboard.crm.typeClient' },
    { value: 'partner', labelKey: 'dashboard.crm.typePartner' },
  ]

  const form = {
    contact_type: 'lead',
    company: 'Acme Corp',
    contact_name: 'Juan López',
    phone: '+34 600 000 000',
    email: 'juan@acme.com',
    location: 'Madrid',
    vertical: 'vehiculos',
    last_contact_date: '2026-03-01',
    notes: 'Test note',
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(CrmFormModal, {
      props: {
        show: true,
        isEditing: false,
        form,
        contactTypes,
        saving: false,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
        stubs: { Teleport: true },
      },
    })

  it('renders modal when show is true', () => {
    expect(factory().find('.modal-overlay').exists()).toBe(true)
  })

  it('hides modal when show is false', () => {
    expect(factory({ show: false }).find('.modal-overlay').exists()).toBe(false)
  })

  it('shows create title when not editing', () => {
    expect(factory().find('.modal-header h3').text()).toBe('dashboard.crm.createContact')
  })

  it('shows edit title when editing', () => {
    expect(factory({ isEditing: true }).find('.modal-header h3').text()).toBe('dashboard.crm.editContact')
  })

  it('shows contact type select with options', () => {
    const select = factory().find('select')
    expect(select.findAll('option')).toHaveLength(3)
  })

  it('shows company input with value', () => {
    const inputs = factory().findAll('input[type="text"]')
    expect((inputs[0].element as HTMLInputElement).value).toBe('Acme Corp')
  })

  it('shows contact name input with value', () => {
    const inputs = factory().findAll('input[type="text"]')
    expect((inputs[1].element as HTMLInputElement).value).toBe('Juan López')
  })

  it('shows phone input', () => {
    const input = factory().find('input[type="tel"]')
    expect((input.element as HTMLInputElement).value).toBe('+34 600 000 000')
  })

  it('shows email input', () => {
    const input = factory().find('input[type="email"]')
    expect((input.element as HTMLInputElement).value).toBe('juan@acme.com')
  })

  it('shows location input', () => {
    const textInputs = factory().findAll('input[type="text"]')
    expect((textInputs[2].element as HTMLInputElement).value).toBe('Madrid')
  })

  it('shows date input', () => {
    const input = factory().find('input[type="date"]')
    expect((input.element as HTMLInputElement).value).toBe('2026-03-01')
  })

  it('shows notes textarea', () => {
    const textarea = factory().find('textarea')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('Test note')
  })

  it('emits close on close button click', async () => {
    const w = factory()
    await w.find('.modal-close').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on overlay click', async () => {
    const w = factory()
    await w.find('.modal-overlay').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on cancel button click', async () => {
    const w = factory()
    await w.find('.btn-secondary').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits save on save button click', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('save')).toBeTruthy()
  })

  it('shows create button text when not editing', () => {
    expect(factory().find('.btn-primary').text()).toBe('dashboard.crm.create')
  })

  it('shows save button text when editing', () => {
    expect(factory({ isEditing: true }).find('.btn-primary').text()).toBe('dashboard.crm.save')
  })

  it('shows saving text when saving', () => {
    expect(factory({ saving: true }).find('.btn-primary').text()).toBe('dashboard.crm.saving')
  })

  it('disables save button when saving', () => {
    expect((factory({ saving: true }).find('.btn-primary').element as HTMLButtonElement).disabled).toBe(true)
  })
})
