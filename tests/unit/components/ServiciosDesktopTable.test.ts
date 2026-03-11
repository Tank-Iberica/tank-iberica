/**
 * Tests for app/components/admin/servicios/ServiciosDesktopTable.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import ServiciosDesktopTable from '../../../app/components/admin/servicios/ServiciosDesktopTable.vue'

describe('ServiciosDesktopTable', () => {
  const requests = [
    {
      id: 'srv-1',
      type: 'transport',
      vehicles: { title: 'Volvo FH 500' },
      user_id: 'abcdefgh-1234',
      status: 'pending',
      created_at: '2026-03-01',
      partner_notified_at: null,
      details: { origin: 'Madrid', destination: 'Barcelona' },
    },
    {
      id: 'srv-2',
      type: 'verification',
      vehicles: null,
      user_id: '12345678-abcd',
      status: 'completed',
      created_at: '2026-02-15',
      partner_notified_at: '2026-02-16',
      details: null,
    },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ServiciosDesktopTable, {
      props: {
        requests,
        expandedId: null,
        updatingStatus: null,
        notifyingPartner: null,
        statusOptions: ['pending', 'in_progress', 'completed', 'cancelled'],
        getTypeIcon: (t: string) => (t === 'transport' ? '🚚' : '✅'),
        getTypeLabel: (t: string) => t.toUpperCase(),
        getStatusClass: (s: string) => `status-${s}`,
        getStatusLabel: (s: string) => s.toUpperCase(),
        formatDate: (d: string | null) => d || '—',
        formatDetailValue: (v: unknown) => String(v),
        ...overrides,
      },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders table wrapper', () => {
    expect(factory().find('.table-wrapper').exists()).toBe(true)
  })

  it('renders 7 headers', () => {
    expect(factory().findAll('th')).toHaveLength(7)
  })

  it('renders rows for each request', () => {
    expect(factory().findAll('.table-row')).toHaveLength(2)
  })

  it('shows type icon and label', () => {
    expect(factory().find('.type-icon').text()).toBe('🚚')
    expect(factory().find('.type-label').text()).toBe('TRANSPORT')
  })

  it('shows vehicle title', () => {
    expect(factory().find('.cell-vehicle').text()).toBe('Volvo FH 500')
  })

  it('shows dash for missing vehicle', () => {
    const cells = factory().findAll('.cell-vehicle')
    expect(cells[1].text()).toBe('-')
  })

  it('shows truncated user id', () => {
    expect(factory().find('.cell-requester').text()).toBe('abcdefgh...')
  })

  it('shows status badge with class', () => {
    const badge = factory().find('.status-badge')
    expect(badge.classes()).toContain('status-pending')
    expect(badge.text()).toBe('PENDING')
  })

  it('shows partner pending for non-notified', () => {
    expect(factory().find('.partner-pending').exists()).toBe(true)
  })

  it('shows partner notified date', () => {
    const rows = factory().findAll('.table-row')
    expect(rows[1].find('.partner-notified').text()).toBe('2026-02-16')
  })

  it('shows notify button for non-notified requests', () => {
    expect(factory().find('.btn-notify').exists()).toBe(true)
  })

  it('hides notify button for already-notified requests', () => {
    const rows = factory().findAll('.table-row')
    expect(rows[1].find('.btn-notify').exists()).toBe(false)
  })

  it('shows status select with options', () => {
    expect(factory().findAll('.status-select option')).toHaveLength(8) // 4 options × 2 rows
  })

  it('emits toggleExpand on row click', async () => {
    const w = factory()
    await w.find('.table-row').trigger('click')
    expect(w.emitted('toggleExpand')?.[0]?.[0]).toBe('srv-1')
  })

  it('shows expanded row with details', () => {
    const w = factory({ expandedId: 'srv-1' })
    expect(w.find('.expanded-row').exists()).toBe(true)
    expect(w.find('.details-grid').exists()).toBe(true)
  })

  it('shows no-details message when details empty', () => {
    const w = factory({ expandedId: 'srv-2' })
    expect(w.find('.no-details').exists()).toBe(true)
  })

  it('emits notifyPartner on notify click', async () => {
    const w = factory()
    await w.find('.btn-notify').trigger('click')
    expect(w.emitted('notifyPartner')?.[0]?.[0]).toBe('srv-1')
  })

  it('applies expanded class on expanded row', () => {
    const w = factory({ expandedId: 'srv-1' })
    expect(w.find('.table-row').classes()).toContain('expanded')
  })

  it('emits updateStatus on status select change', async () => {
    const w = factory()
    const sel = w.find('.status-select')
    Object.defineProperty(sel.element, 'value', { value: 'completed', writable: true })
    await sel.trigger('change')
    expect(w.emitted('updateStatus')).toBeTruthy()
  })
})
