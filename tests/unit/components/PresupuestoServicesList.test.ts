/**
 * Tests for app/components/dashboard/herramientas/presupuesto/PresupuestoServicesList.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'

beforeAll(() => {
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: { value: 'es' } }))
})

import PresupuestoServicesList from '../../../app/components/dashboard/herramientas/presupuesto/PresupuestoServicesList.vue'

describe('PresupuestoServicesList', () => {
  const services = [
    { key: 'transport', labelKey: 'services.transport', enabled: true, amount: 500, isQuoteOnly: false },
    { key: 'insurance', labelKey: 'services.insurance', enabled: false, amount: 0, isQuoteOnly: true },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(PresupuestoServicesList, {
      props: { services, ...overrides },
    })

  it('renders form section', () => {
    expect(factory().find('.form-section').exists()).toBe(true)
  })

  it('shows section title', () => {
    expect(factory().find('h2').text()).toBe('dashboard.quote.optionalServices')
  })

  it('renders service rows', () => {
    expect(factory().findAll('.service-row')).toHaveLength(2)
  })

  it('shows service labels', () => {
    const labels = factory().findAll('.service-label')
    expect(labels[0].text()).toBe('services.transport')
    expect(labels[1].text()).toBe('services.insurance')
  })

  it('checkbox reflects enabled state', () => {
    const checkboxes = factory().findAll('input[type="checkbox"]')
    expect((checkboxes[0].element as HTMLInputElement).checked).toBe(true)
    expect((checkboxes[1].element as HTMLInputElement).checked).toBe(false)
  })

  it('shows amount input for non-quote services', () => {
    expect(factory().findAll('.service-amount-input')).toHaveLength(1)
  })

  it('shows quote text for quote-only services', () => {
    expect(factory().find('.service-amount-text').text()).toBe('dashboard.quote.insuranceQuote')
  })

  it('emits toggle on checkbox change', async () => {
    const w = factory()
    const checkbox = w.findAll('input[type="checkbox"]')[0]
    Object.defineProperty(checkbox.element, 'checked', { value: false, writable: true })
    await checkbox.trigger('change')
    expect(w.emitted('toggle')![0]).toEqual(['transport', false])
  })

  it('emits update-amount on input', async () => {
    const w = factory()
    const input = w.find('.input-small')
    Object.defineProperty(input.element, 'value', { value: '750', writable: true })
    await input.trigger('input')
    expect(w.emitted('update-amount')![0]).toEqual(['transport', 750])
  })
})
