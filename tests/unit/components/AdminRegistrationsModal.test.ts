/**
 * Tests for app/components/admin/subastas/AdminRegistrationsModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminRegistrationsModal from '../../../app/components/admin/subastas/AdminRegistrationsModal.vue'

describe('AdminRegistrationsModal', () => {
  const registrations = [
    {
      id: 'r1',
      user: { full_name: 'Juan', email: 'juan@test.com' },
      id_type: 'DNI',
      id_number: '12345678A',
      company_name: 'TestCorp',
      deposit_status: 'held',
      status: 'pending',
    },
    {
      id: 'r2',
      user: { full_name: 'Ana', email: 'ana@test.com' },
      id_type: 'CIF',
      id_number: 'B99999999',
      company_name: null,
      deposit_status: 'pending',
      status: 'approved',
    },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminRegistrationsModal, {
      props: {
        show: true,
        auctionTitle: 'Subasta #1',
        registrations,
        loading: false,
        ...overrides,
      },
      global: { stubs: { Teleport: true } },
    })

  it('renders when show is true', () => {
    expect(factory().find('.modal-overlay').exists()).toBe(true)
  })

  it('hides when show is false', () => {
    expect(factory({ show: false }).find('.modal-overlay').exists()).toBe(false)
  })

  it('shows auction title in header', () => {
    expect(factory().find('.modal-header h3').text()).toContain('Subasta #1')
  })

  it('shows loading state', () => {
    const w = factory({ loading: true })
    expect(w.find('.loading-state').exists()).toBe(true)
    expect(w.find('.registrations-table').exists()).toBe(false)
  })

  it('shows empty state when no registrations', () => {
    const w = factory({ registrations: [], loading: false })
    expect(w.find('.empty-state').exists()).toBe(true)
  })

  it('renders table with registrations', () => {
    expect(factory().find('.registrations-table').exists()).toBe(true)
    expect(factory().findAll('tbody tr')).toHaveLength(2)
  })

  it('shows user name and email', () => {
    const row = factory().findAll('tbody tr')[0]
    expect(row.text()).toContain('Juan')
    expect(row.text()).toContain('juan@test.com')
  })

  it('shows id type and number', () => {
    const row = factory().findAll('tbody tr')[0]
    expect(row.text()).toContain('DNI')
    expect(row.text()).toContain('12345678A')
  })

  it('shows company name or dash', () => {
    const rows = factory().findAll('tbody tr')
    expect(rows[0].text()).toContain('TestCorp')
    expect(rows[1].text()).toContain('-')
  })

  it('shows approve/reject buttons for pending registrations', () => {
    const row = factory().findAll('tbody tr')[0]
    expect(row.find('.reg-approve').exists()).toBe(true)
    expect(row.find('.reg-reject').exists()).toBe(true)
  })

  it('hides approve/reject buttons for non-pending registrations', () => {
    const row = factory().findAll('tbody tr')[1]
    expect(row.find('.reg-approve').exists()).toBe(false)
    expect(row.find('.reg-reject').exists()).toBe(false)
  })

  it('emits approve with reg id', async () => {
    const w = factory()
    await w.find('.reg-approve').trigger('click')
    expect(w.emitted('approve')![0]).toEqual(['r1'])
  })

  it('emits reject with reg id', async () => {
    const w = factory()
    await w.find('.reg-reject').trigger('click')
    expect(w.emitted('reject')![0]).toEqual(['r1'])
  })

  it('emits close on close button', async () => {
    const w = factory()
    await w.find('.modal-close').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on footer button', async () => {
    const w = factory()
    await w.find('.btn-secondary').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on overlay click', async () => {
    const w = factory()
    await w.find('.modal-overlay').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
