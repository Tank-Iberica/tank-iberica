/**
 * Tests for app/components/admin/subastas/AdminBiddersTable.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminBiddersTable from '../../../app/components/admin/subastas/AdminBiddersTable.vue'

describe('AdminBiddersTable', () => {
  const registrations = [
    {
      id: 'r1',
      user_id: 'user-1234-abcd-efgh',
      id_type: 'dni',
      id_number: '12345678A',
      company_name: 'TestCorp',
      deposit_status: 'held',
      status: 'pending',
      registered_at: '2026-01-01',
      id_document_url: null,
    },
    {
      id: 'r2',
      user_id: 'user-5678-ijkl-mnop',
      id_type: null,
      id_number: null,
      company_name: null,
      deposit_status: 'pending',
      status: 'approved',
      registered_at: '2026-01-02',
      id_document_url: 'https://example.com/doc.pdf',
    },
  ]

  const formatDateShort = (d: string | null) => d || '--'
  const getRegStatusClass = (s: string) => `reg-${s}`
  const getRegStatusLabel = (s: string) => s.toUpperCase()
  const getDepositStatusClass = (s: string) => `deposit-${s}`
  const getDepositStatusLabel = (s: string) => s.toUpperCase()

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminBiddersTable, {
      props: {
        registrations,
        actionLoading: false,
        formatDateShort,
        getRegStatusClass,
        getRegStatusLabel,
        getDepositStatusClass,
        getDepositStatusLabel,
        ...overrides,
      },
    })

  it('renders section', () => {
    expect(factory().find('.section').exists()).toBe(true)
  })

  it('shows count badge', () => {
    expect(factory().find('.count-badge-sm').text()).toBe('2')
  })

  it('shows empty message when no registrations', () => {
    const w = factory({ registrations: [] })
    expect(w.find('.empty-msg').exists()).toBe(true)
    expect(w.find('.table-container').exists()).toBe(false)
  })

  it('renders table with registrations', () => {
    expect(factory().find('.data-table').exists()).toBe(true)
    expect(factory().findAll('tbody tr')).toHaveLength(2)
  })

  it('truncates user_id', () => {
    const row = factory().findAll('tbody tr')[0]
    expect(row.findAll('td')[0].text()).toBe('user-123...')
  })

  it('shows id type uppercased', () => {
    const row = factory().findAll('tbody tr')[0]
    expect(row.findAll('td')[1].text()).toBe('DNI')
  })

  it('shows dash for missing values', () => {
    const row = factory().findAll('tbody tr')[1]
    expect(row.findAll('td')[1].text()).toBe('-')
    expect(row.findAll('td')[2].text()).toBe('-')
    expect(row.findAll('td')[3].text()).toBe('-')
  })

  it('calls status label functions', () => {
    const row = factory().findAll('tbody tr')[0]
    expect(row.find('.deposit-badge').text()).toBe('HELD')
    expect(row.find('.reg-badge').text()).toBe('PENDING')
  })

  it('shows approve/reject for pending registrations', () => {
    const row = factory().findAll('tbody tr')[0]
    expect(row.find('.action-approve').exists()).toBe(true)
    expect(row.find('.action-reject').exists()).toBe(true)
  })

  it('hides approve/reject for non-pending', () => {
    const row = factory().findAll('tbody tr')[1]
    expect(row.find('.action-approve').exists()).toBe(false)
  })

  it('shows doc link when url exists', () => {
    const row = factory().findAll('tbody tr')[1]
    expect(row.find('a.action-btn').exists()).toBe(true)
  })

  it('emits approve with id', async () => {
    const w = factory()
    await w.find('.action-approve').trigger('click')
    expect(w.emitted('approve')![0]).toEqual(['r1'])
  })

  it('emits reject with id', async () => {
    const w = factory()
    await w.find('.action-reject').trigger('click')
    expect(w.emitted('reject')![0]).toEqual(['r1'])
  })

  it('disables actions when loading', () => {
    const w = factory({ actionLoading: true })
    expect((w.find('.action-approve').element as HTMLButtonElement).disabled).toBe(true)
    expect((w.find('.action-reject').element as HTMLButtonElement).disabled).toBe(true)
  })
})
