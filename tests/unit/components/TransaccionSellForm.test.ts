/**
 * Tests for app/components/dashboard/transaccion/TransaccionSellForm.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import TransaccionSellForm from '../../../app/components/dashboard/transaccion/TransaccionSellForm.vue'

describe('TransaccionSellForm', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(TransaccionSellForm, {
      props: {
        saleDate: '2026-03-01',
        buyerName: 'Carlos',
        buyerContact: 'carlos@test.com',
        salePrice: 95000,
        invoiceUrl: '',
        exportacion: false,
        submitting: false,
        vehicleId: 'v1',
        totalCost: 80000,
        estimatedBenefit: 15000,
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

  it('shows warning banner', () => {
    expect(factory().find('.warning-banner').exists()).toBe(true)
  })

  it('renders sale date input', () => {
    expect((factory().find('#sell-date').element as HTMLInputElement).value).toBe('2026-03-01')
  })

  it('renders sale price input', () => {
    expect((factory().find('#sell-price').element as HTMLInputElement).value).toBe('95000')
  })

  it('renders buyer name input', () => {
    expect((factory().find('#sell-buyer').element as HTMLInputElement).value).toBe('Carlos')
  })

  it('renders buyer contact input', () => {
    expect((factory().find('#sell-contact').element as HTMLInputElement).value).toBe('carlos@test.com')
  })

  it('renders invoice URL input', () => {
    expect(factory().find('#sell-invoice').exists()).toBe(true)
  })

  it('renders export checkbox unchecked', () => {
    const cb = factory().find('.checkbox-label input[type="checkbox"]')
    expect((cb.element as HTMLInputElement).checked).toBe(false)
  })

  it('renders export checkbox checked', () => {
    const w = factory({ exportacion: true })
    const cb = w.find('.checkbox-label input[type="checkbox"]')
    expect((cb.element as HTMLInputElement).checked).toBe(true)
  })

  it('shows benefit summary when price > 0', () => {
    expect(factory().find('.benefit-summary').exists()).toBe(true)
  })

  it('hides benefit summary when price is 0', () => {
    const w = factory({ salePrice: 0 })
    expect(w.find('.benefit-summary').exists()).toBe(false)
  })

  it('shows 3 benefit rows', () => {
    expect(factory().findAll('.benefit-row')).toHaveLength(3)
  })

  it('applies positive class to benefit', () => {
    expect(factory().find('.benefit-total .benefit-value').classes()).toContain('positive')
  })

  it('applies negative class for loss', () => {
    const w = factory({ estimatedBenefit: -5000 })
    expect(w.find('.benefit-total .benefit-value').classes()).toContain('negative')
  })

  it('renders cancel link', () => {
    expect(factory().find('.btn-secondary').attributes('to')).toBe('/dashboard/vehiculos/v1')
  })

  it('disables submit when submitting', () => {
    const w = factory({ submitting: true })
    expect(w.find('.btn-danger').attributes('disabled')).toBeDefined()
  })

  it('shows loading text when submitting', () => {
    const w = factory({ submitting: true })
    expect(w.find('.btn-danger').text()).toBe('common.loading')
  })
})
