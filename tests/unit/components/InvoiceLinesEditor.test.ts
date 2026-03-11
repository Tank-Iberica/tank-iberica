/**
 * Tests for app/components/dashboard/invoice/InvoiceLinesEditor.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import InvoiceLinesEditor from '../../../app/components/dashboard/invoice/InvoiceLinesEditor.vue'

describe('InvoiceLinesEditor', () => {
  const lines = [
    { id: 1, tipo: 'Venta', concepto: 'Camion Volvo FH16', cantidad: 1, precioUd: 85000, iva: 21 },
    { id: 2, tipo: 'Transporte', concepto: 'Envio a Madrid', cantidad: 1, precioUd: 450, iva: 21 },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(InvoiceLinesEditor, {
      props: {
        lines,
        ...overrides,
      },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders lines table', () => {
    expect(factory().find('.lines-table').exists()).toBe(true)
  })

  it('shows table headers', () => {
    const headers = factory().findAll('thead th')
    expect(headers.length).toBeGreaterThanOrEqual(6)
  })

  it('renders rows per line', () => {
    expect(factory().findAll('tbody tr')).toHaveLength(2)
  })

  it('shows tipo select with 5 options', () => {
    const select = factory().find('tbody select')
    expect(select.findAll('option')).toHaveLength(5)
  })

  it('shows concepto input', () => {
    const inputs = factory().findAll('tbody input[type="text"]')
    expect((inputs[0].element as HTMLInputElement).value).toBe('Camion Volvo FH16')
  })

  it('shows cantidad input', () => {
    const numInputs = factory().findAll('tbody input[type="number"]')
    expect((numInputs[0].element as HTMLInputElement).value).toBe('1')
  })

  it('shows precioUd input', () => {
    const numInputs = factory().findAll('tbody input[type="number"]')
    expect((numInputs[1].element as HTMLInputElement).value).toBe('85000')
  })

  it('shows iva input', () => {
    const numInputs = factory().findAll('tbody input[type="number"]')
    expect((numInputs[2].element as HTMLInputElement).value).toBe('21')
  })

  it('shows calculated subtotal', () => {
    // 1 * 85000 + (85000 * 21 / 100) = 85000 + 17850 = 102850.00
    const total = factory().find('.lines-table__total')
    expect(total.text()).toContain('102850.00')
  })

  it('shows remove buttons per line', () => {
    // Desktop table + mobile cards = 2 remove buttons per line
    expect(factory().findAll('.btn-icon--danger').length).toBeGreaterThanOrEqual(2)
  })

  it('emits remove-line on remove click', async () => {
    const w = factory()
    await w.find('.btn-icon--danger').trigger('click')
    expect(w.emitted('remove-line')?.[0]?.[0]).toBe(1)
  })

  it('shows empty when no lines', () => {
    const w = factory({ lines: [] })
    expect(w.findAll('tbody tr')).toHaveLength(0)
  })
})
