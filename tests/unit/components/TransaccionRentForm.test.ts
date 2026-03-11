/**
 * Tests for app/components/dashboard/transaccion/TransaccionRentForm.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import TransaccionRentForm from '../../../app/components/dashboard/transaccion/TransaccionRentForm.vue'

describe('TransaccionRentForm', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(TransaccionRentForm, {
      props: {
        fromDate: '2026-03-01',
        toDate: '2026-03-15',
        clientName: 'Juan',
        clientContact: '+34600111222',
        amount: 1500,
        invoiceUrl: '',
        notes: 'Monthly rental',
        submitting: false,
        vehicleId: 'v1',
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders form', () => {
    expect(factory().find('.transaction-form').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h2').text()).toBeTruthy()
  })

  it('renders from date input', () => {
    expect((factory().find('#rent-from').element as HTMLInputElement).value).toBe('2026-03-01')
  })

  it('renders to date input', () => {
    expect((factory().find('#rent-to').element as HTMLInputElement).value).toBe('2026-03-15')
  })

  it('renders client name input', () => {
    expect((factory().find('#rent-client').element as HTMLInputElement).value).toBe('Juan')
  })

  it('renders client contact input', () => {
    expect((factory().find('#rent-contact').element as HTMLInputElement).value).toBe('+34600111222')
  })

  it('renders amount input', () => {
    expect((factory().find('#rent-amount').element as HTMLInputElement).value).toBe('1500')
  })

  it('shows EUR suffix', () => {
    expect(factory().find('.input-suffix').text()).toBe('EUR')
  })

  it('renders notes textarea', () => {
    expect((factory().find('#rent-notes').element as HTMLTextAreaElement).value).toBe('Monthly rental')
  })

  it('renders cancel link', () => {
    expect(factory().find('.btn-secondary').attributes('to')).toBe('/dashboard/vehiculos/v1')
  })

  it('shows submit button', () => {
    expect(factory().find('.btn-primary').exists()).toBe(true)
  })

  it('disables submit when submitting', () => {
    const w = factory({ submitting: true })
    expect(w.find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('shows loading text when submitting', () => {
    const w = factory({ submitting: true })
    expect(w.find('.btn-primary').text()).toBe('common.loading')
  })
})
