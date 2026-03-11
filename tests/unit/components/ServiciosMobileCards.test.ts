/**
 * Tests for app/components/admin/servicios/ServiciosMobileCards.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import ServiciosMobileCards from '../../../app/components/admin/servicios/ServiciosMobileCards.vue'

const requests = [
  {
    id: 'r1',
    type: 'transport',
    status: 'pending',
    created_at: '2026-01-15T10:00:00Z',
    user_id: 'abcdef12-3456-7890-abcd-ef1234567890',
    vehicles: { title: 'Scania R450' },
    partner_notified_at: null,
    details: { origin: 'Madrid', destination: 'Barcelona' },
  },
  {
    id: 'r2',
    type: 'inspection',
    status: 'completed',
    created_at: '2026-01-10T08:00:00Z',
    user_id: 'bbbbbbbb-1111-2222-3333-444444444444',
    vehicles: { title: 'Volvo FH' },
    partner_notified_at: '2026-01-11T09:00:00Z',
    details: {},
  },
]

describe('ServiciosMobileCards', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ServiciosMobileCards, {
      props: {
        requests,
        expandedId: null,
        updatingStatus: null,
        notifyingPartner: null,
        statusOptions: ['pending', 'in_progress', 'completed', 'cancelled'],
        getTypeIcon: (t: string) => t === 'transport' ? '🚚' : '🔍',
        getTypeLabel: (t: string) => t,
        getStatusClass: (s: string) => `status-${s}`,
        getStatusLabel: (s: string) => s,
        formatDate: (d: string | null) => d || '-',
        formatDetailValue: (v: unknown) => String(v),
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders card list', () => {
    expect(factory().find('.card-list').exists()).toBe(true)
  })

  it('renders mobile-only class', () => {
    expect(factory().find('.mobile-only').exists()).toBe(true)
  })

  it('renders a card per request', () => {
    expect(factory().findAll('.request-card')).toHaveLength(2)
  })

  it('shows vehicle titles from nested vehicles object', () => {
    const html = factory().html()
    expect(html).toContain('Scania R450')
    expect(html).toContain('Volvo FH')
  })

  it('shows type icons via getTypeIcon prop', () => {
    expect(factory().html()).toContain('🚚')
  })

  it('shows type labels via getTypeLabel prop', () => {
    expect(factory().html()).toContain('transport')
    expect(factory().html()).toContain('inspection')
  })

  it('shows status labels via getStatusLabel prop', () => {
    expect(factory().html()).toContain('pending')
    expect(factory().html()).toContain('completed')
  })

  it('applies status class via getStatusClass prop', () => {
    expect(factory().find('.status-pending').exists()).toBe(true)
  })

  it('emits toggleExpand on card header click', async () => {
    const w = factory()
    await w.findAll('.card-header')[0].trigger('click')
    expect(w.emitted('toggleExpand')?.[0]).toEqual(['r1'])
  })

  it('shows expanded section when expandedId matches', () => {
    const w = factory({ expandedId: 'r1' })
    expect(w.find('.card-expanded').exists()).toBe(true)
  })

  it('hides expanded section when expandedId null', () => {
    expect(factory().find('.card-expanded').exists()).toBe(false)
  })

  it('shows status select in expanded', () => {
    const w = factory({ expandedId: 'r1' })
    const options = w.findAll('.card-expanded select option')
    expect(options).toHaveLength(4)
  })

  it('shows notify button when not notified', () => {
    const w = factory({ expandedId: 'r1' })
    expect(w.find('.btn-notify').exists()).toBe(true)
  })

  it('hides notify button when already notified', () => {
    const w = factory({ expandedId: 'r2' })
    expect(w.find('.btn-notify').exists()).toBe(false)
  })

  it('emits notifyPartner on notify click', async () => {
    const w = factory({ expandedId: 'r1' })
    await w.find('.btn-notify').trigger('click')
    expect(w.emitted('notifyPartner')?.[0]).toEqual(['r1'])
  })

  it('shows details grid when details present', () => {
    const w = factory({ expandedId: 'r1' })
    expect(w.find('.expanded-details').exists()).toBe(true)
    expect(w.findAll('.detail-item')).toHaveLength(2)
  })

  it('hides details grid when details empty', () => {
    const w = factory({ expandedId: 'r2' })
    expect(w.find('.expanded-details').exists()).toBe(false)
  })

  it('shows dash for missing vehicle title', () => {
    const noVehicle = [{ ...requests[0], vehicles: null }]
    const w = factory({ requests: noVehicle })
    expect(w.find('.detail-value').text()).toBe('-')
  })

  it('emits updateStatus on status select change', async () => {
    const w = factory({ expandedId: 'r1' })
    const sel = w.find('.status-select')
    if (sel.exists()) {
      Object.defineProperty(sel.element, 'value', { value: 'completed', writable: true })
      await sel.trigger('change')
      expect(w.emitted('updateStatus')).toBeTruthy()
    }
  })
})
