/**
 * Tests for app/components/dashboard/crm/CrmDeleteModal.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { computed } from 'vue'

beforeAll(() => {
  vi.stubGlobal('computed', computed)
})

import CrmDeleteModal from '../../../app/components/dashboard/crm/CrmDeleteModal.vue'

describe('CrmDeleteModal', () => {
  const contact = { id: '1', contact_name: 'Juan', company: 'Acme' }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(CrmDeleteModal, {
      props: {
        show: true,
        contact,
        confirmText: '',
        saving: false,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string, params?: Record<string, unknown>) => params ? `${k}:${JSON.stringify(params)}` : k },
        stubs: { Teleport: true },
      },
    })

  it('renders modal when show is true', () => {
    expect(factory().find('.modal-overlay').exists()).toBe(true)
  })

  it('hides modal when show is false', () => {
    expect(factory({ show: false }).find('.modal-overlay').exists()).toBe(false)
  })

  it('shows delete title', () => {
    expect(factory().find('.modal-header h3').text()).toBe('dashboard.crm.deleteTitle')
  })

  it('has danger header', () => {
    expect(factory().find('.modal-header').classes()).toContain('danger')
  })

  it('shows delete confirm text', () => {
    expect(factory().text()).toContain('dashboard.crm.deleteConfirm')
  })

  it('shows company confirm text', () => {
    expect(factory().text()).toContain('dashboard.crm.deleteConfirmCompany')
  })

  it('delete button disabled when confirmText empty', () => {
    expect(factory().find('.btn-danger').attributes('disabled')).toBeDefined()
  })

  it('emits close on cancel', async () => {
    const w = factory()
    await w.find('.btn-secondary').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on X button', async () => {
    const w = factory()
    await w.find('.modal-close').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
