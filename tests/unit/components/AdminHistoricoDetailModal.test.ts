/**
 * Tests for app/components/admin/historico/HistoricoDetailModal.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/admin/useAdminHistorico', () => ({
  SALE_CATEGORIES: {
    directa: 'Venta Directa',
    subasta: 'Subasta',
    broker: 'Broker',
  },
}))

import HistoricoDetailModal from '../../../app/components/admin/historico/HistoricoDetailModal.vue'

const baseEntry = {
  brand: 'Volvo',
  model: 'FH 500',
  year: 2022,
  sale_date: '2026-01-15',
  sale_category: 'directa',
  buyer_name: 'Juan García',
  buyer_contact: '+34 600 123 456',
  original_price: 85000,
  sale_price: 80000,
  purchase_cost: 70000,
}

describe('AdminHistoricoDetailModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(HistoricoDetailModal, {
      props: {
        visible: true,
        entry: { ...baseEntry },
        fmt: (v: number | null | undefined) => (v != null ? `${v} €` : '—'),
        fmtDate: (d: string) => d,
        ...overrides,
      },
      global: {
        stubs: { Teleport: true },
      },
    })

  it('renders modal when visible and entry exists', () => {
    expect(factory().find('.modal-bg').exists()).toBe(true)
  })

  it('does not render when not visible', () => {
    const w = factory({ visible: false })
    expect(w.find('.modal-bg').exists()).toBe(false)
  })

  it('does not render when entry is null', () => {
    const w = factory({ entry: null })
    expect(w.find('.modal-bg').exists()).toBe(false)
  })

  it('shows vehicle info in header', () => {
    const head = factory().find('.modal-head')
    expect(head.text()).toContain('Volvo')
    expect(head.text()).toContain('FH 500')
    expect(head.text()).toContain('2022')
  })

  it('shows sale date', () => {
    const body = factory().find('.modal-body')
    expect(body.text()).toContain('2026-01-15')
  })

  it('shows sale category', () => {
    expect(factory().find('.modal-body').text()).toContain('Venta Directa')
  })

  it('shows buyer name', () => {
    expect(factory().find('.modal-body').text()).toContain('Juan García')
  })

  it('shows buyer contact', () => {
    expect(factory().find('.modal-body').text()).toContain('+34 600 123 456')
  })

  it('shows dash for missing buyer', () => {
    const w = factory({ entry: { ...baseEntry, buyer_name: null } })
    expect(w.find('.modal-body').text()).toContain('—')
  })

  it('emits close on close button click', async () => {
    const w = factory()
    await w.find('.modal-head button').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
