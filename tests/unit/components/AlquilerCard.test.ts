/**
 * Tests for app/components/dashboard/herramientas/alquileres/AlquilerCard.vue
 */
import { vi, describe, it, expect } from 'vitest'
import { computed } from 'vue'

vi.stubGlobal('computed', computed)

import { shallowMount } from '@vue/test-utils'
import AlquilerCard from '../../../app/components/dashboard/herramientas/alquileres/AlquilerCard.vue'

const baseRecord = {
  id: 'r1',
  vehicle_brand: 'Volvo',
  vehicle_model: 'FH16',
  vehicle_year: 2021,
  client_name: 'Transportes García',
  client_contact: '600123456',
  monthly_rent: 2500,
  deposit: 5000,
  start_date: '2026-01-01',
  end_date: '2026-06-30',
  status: 'active' as const,
  notes: 'Entrega en Onzonilla',
}

describe('AlquilerCard', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AlquilerCard, {
      props: {
        record: { ...baseRecord },
        isEndingSoon: () => false,
        daysUntilEnd: () => 30,
        getStatusClass: (s: string) => `status-${s}`,
        fmt: (v: number) => `${v} €`,
        fmtDate: (d: string | null) => d ?? '--',
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders rental card', () => {
    expect(factory().find('.rental-card').exists()).toBe(true)
  })

  it('shows vehicle info', () => {
    expect(factory().find('.card-vehicle').text()).toContain('Volvo')
    expect(factory().find('.card-vehicle').text()).toContain('FH16')
  })

  it('shows vehicle year', () => {
    expect(factory().find('.year-tag').text()).toContain('2021')
  })

  it('shows client name', () => {
    expect(factory().find('.client-name').text()).toBe('Transportes García')
  })

  it('shows client contact', () => {
    expect(factory().find('.client-contact').text()).toBe('600123456')
  })

  it('shows monthly rent', () => {
    expect(factory().html()).toContain('2500 €')
  })

  it('shows deposit', () => {
    expect(factory().html()).toContain('5000 €')
  })

  it('shows notes', () => {
    expect(factory().find('.card-notes').text()).toBe('Entrega en Onzonilla')
  })

  it('hides notes when empty', () => {
    const w = factory({ record: { ...baseRecord, notes: null } })
    expect(w.find('.card-notes').exists()).toBe(false)
  })

  it('shows status badge', () => {
    expect(factory().find('.status-badge').exists()).toBe(true)
  })

  it('applies ending-soon class when ending soon', () => {
    const w = factory({ isEndingSoon: () => true, daysUntilEnd: () => 3 })
    expect(w.find('.rental-card').classes()).toContain('ending-soon')
  })

  it('shows ending badge when ending soon', () => {
    const w = factory({ isEndingSoon: () => true, daysUntilEnd: () => 5 })
    expect(w.find('.ending-badge').text()).toContain('5')
  })

  it('emits edit on edit click', async () => {
    const w = factory()
    const btns = w.findAll('.btn-icon')
    await btns[0].trigger('click')
    expect(w.emitted('edit')).toBeTruthy()
  })

  it('emits delete on delete click', async () => {
    const w = factory()
    await w.find('.btn-icon.delete').trigger('click')
    expect(w.emitted('delete')).toBeTruthy()
  })
})
