/**
 * Tests for app/components/dashboard/herramientas/visitas/VisitasBookingsTable.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import VisitasBookingsTable from '../../../app/components/dashboard/herramientas/visitas/VisitasBookingsTable.vue'

const bookings = [
  {
    id: 'b1',
    visit_date: '2026-03-10',
    visit_time: '10:00',
    vehicle_brand: 'Scania',
    vehicle_model: 'R450',
    buyer_name: 'Juan García',
    buyer_email: 'juan@test.com',
    status: 'pending' as const,
    notes: 'Interesado en financiación',
  },
  {
    id: 'b2',
    visit_date: '2026-03-12',
    visit_time: '15:30',
    vehicle_brand: null,
    vehicle_model: null,
    buyer_name: 'María López',
    buyer_email: null,
    status: 'confirmed' as const,
    notes: null,
  },
]

describe('VisitasBookingsTable', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(VisitasBookingsTable, {
      props: {
        bookings,
        saving: false,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders section', () => {
    expect(factory().find('.section-card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.section-title').text()).toBeTruthy()
  })

  it('shows empty state when no bookings', () => {
    const w = factory({ bookings: [] })
    expect(w.find('.empty-state').exists()).toBe(true)
  })

  it('renders table with 7 headers', () => {
    expect(factory().findAll('.data-table th')).toHaveLength(7)
  })

  it('renders 2 data rows', () => {
    expect(factory().findAll('.data-table tbody tr')).toHaveLength(2)
  })

  it('shows vehicle brand and model', () => {
    expect(factory().html()).toContain('Scania')
    expect(factory().html()).toContain('R450')
  })

  it('shows double dash for missing vehicle', () => {
    const cells = factory().findAll('.data-table tbody tr')[1].findAll('td')
    expect(cells[2].text()).toBe('--')
  })

  it('shows buyer name', () => {
    expect(factory().html()).toContain('Juan García')
  })

  it('shows buyer email', () => {
    expect(factory().find('.buyer-email').text()).toBe('juan@test.com')
  })

  it('shows status badge with class', () => {
    const badges = factory().findAll('.status-badge')
    expect(badges[0].classes()).toContain('status-pending')
    expect(badges[1].classes()).toContain('status-confirmed')
  })

  it('shows confirm/cancel for pending booking', () => {
    const firstRow = factory().findAll('.data-table tbody tr')[0]
    expect(firstRow.find('.btn-confirm').exists()).toBe(true)
    expect(firstRow.find('.btn-cancel').exists()).toBe(true)
  })

  it('shows only cancel for confirmed booking', () => {
    const secondRow = factory().findAll('.data-table tbody tr')[1]
    expect(secondRow.find('.btn-confirm').exists()).toBe(false)
    expect(secondRow.find('.btn-cancel').exists()).toBe(true)
  })

  it('emits update-status on confirm click', async () => {
    const w = factory()
    await w.find('.btn-confirm').trigger('click')
    expect(w.emitted('update-status')?.[0]).toEqual(['b1', 'confirmed'])
  })

  it('emits update-status on cancel click', async () => {
    const w = factory()
    await w.findAll('.btn-cancel')[0].trigger('click')
    expect(w.emitted('update-status')?.[0]).toEqual(['b1', 'cancelled'])
  })

  it('disables buttons when saving', () => {
    const w = factory({ saving: true })
    expect(w.find('.btn-confirm').attributes('disabled')).toBeDefined()
  })
})
