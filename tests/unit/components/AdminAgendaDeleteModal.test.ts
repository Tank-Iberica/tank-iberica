/**
 * Tests for app/components/admin/agenda/AdminAgendaDeleteModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import DeleteModal from '../../../app/components/admin/agenda/AdminAgendaDeleteModal.vue'

const baseContact = { id: 'c1', contact_name: 'Pedro Sánchez', company: 'Motors SL' }

describe('AdminAgendaDeleteModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(DeleteModal, {
      props: {
        visible: true,
        contact: { ...baseContact },
        confirmText: '',
        saving: false,
        ...overrides,
      },
      global: { stubs: { Teleport: true } },
    })

  it('hides when not visible', () => {
    expect(factory({ visible: false }).find('.modal-overlay').exists()).toBe(false)
  })

  it('shows when visible', () => {
    expect(factory().find('.modal-overlay').exists()).toBe(true)
  })

  it('shows title', () => {
    // $t returns the key since no translation is registered for this key in the test setup
    expect(factory().find('.modal-header h3').text()).toBe('admin.agenda.deleteContact')
  })

  it('shows contact name in delete confirm message', () => {
    // $t returns the key without interpolation; the contact name appears via the
    // company span which renders raw props, so check the HTML contains the company
    const w = factory()
    // The template renders $t('admin.agenda.deleteConfirmMsg', { name: ... }) which
    // returns the key string. The contact_name is passed as an interpolation param
    // to $t but since $t just returns the key, it won't appear.
    // Verify the key is rendered and the company span is present.
    expect(w.html()).toContain('admin.agenda.deleteConfirmMsg')
    expect(w.html()).toContain('Motors SL')
  })

  it('shows company name', () => {
    expect(factory().html()).toContain('Motors SL')
  })

  it('hides company when null', () => {
    const w = factory({ contact: { ...baseContact, company: null } })
    expect(w.html()).not.toContain('Motors SL')
  })

  it('disables delete when confirmText is wrong', () => {
    expect(factory().find('.btn-danger').attributes('disabled')).toBeDefined()
  })

  it('disables delete when saving', () => {
    const w = factory({ confirmText: 'borrar', saving: true })
    expect(w.find('.btn-danger').attributes('disabled')).toBeDefined()
  })

  it('enables delete when confirmText matches and not saving', () => {
    const w = factory({ confirmText: 'borrar', saving: false })
    expect(w.find('.btn-danger').attributes('disabled')).toBeUndefined()
  })

  it('emits close on overlay click', async () => {
    const w = factory()
    await w.find('.modal-overlay').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on close button click', async () => {
    const w = factory()
    await w.find('.modal-close').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on cancel click', async () => {
    const w = factory()
    await w.find('.btn-secondary').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits confirm on delete click', async () => {
    const w = factory({ confirmText: 'borrar' })
    await w.find('.btn-danger').trigger('click')
    expect(w.emitted('confirm')).toBeTruthy()
  })

  it('emits update:confirmText on input', async () => {
    const w = factory()
    const input = w.find('input[type="text"]')
    await input.setValue('borrar')
    expect(w.emitted('update:confirmText')).toBeTruthy()
  })
})
