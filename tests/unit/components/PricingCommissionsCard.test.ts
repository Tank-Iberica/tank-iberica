/**
 * Tests for app/components/admin/config/pricing/PricingCommissionsCard.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import PricingCommissionsCard from '../../../app/components/admin/config/pricing/PricingCommissionsCard.vue'

describe('PricingCommissionsCard', () => {
  const commissionDefinitions = [
    { key: 'transport_pct', labelKey: 'admin.configPricing.transport', type: 'pct' as const },
    { key: 'transfer_fee', labelKey: 'admin.configPricing.transfer', type: 'eur' as const },
  ]
  const commissionRates = { transport_pct: 5, transfer_fee: 150 }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(PricingCommissionsCard, {
      props: {
        commissionDefinitions,
        commissionRates,
        savingCommissions: false,
        successCommissions: false,
        ...overrides,
      },
      global: { mocks: { $t: (key: string) => key } },
    })

  it('renders config-card', () => {
    const w = factory()
    expect(w.find('.config-card').exists()).toBe(true)
  })

  it('shows title', () => {
    const w = factory()
    expect(w.find('.card-title').text()).toBe('admin.configPricing.commissionRatesTitle')
  })

  it('shows description', () => {
    const w = factory()
    expect(w.find('.card-description').text()).toBe('admin.configPricing.commissionRatesDesc')
  })

  it('renders one field per commission definition', () => {
    const w = factory()
    expect(w.findAll('.commission-field')).toHaveLength(2)
  })

  it('shows labels for each commission', () => {
    const w = factory()
    const labels = w.findAll('.commission-label')
    expect(labels[0].text()).toBe('admin.configPricing.transport')
    expect(labels[1].text()).toBe('admin.configPricing.transfer')
  })

  it('shows % suffix for pct type', () => {
    const w = factory()
    const suffixes = w.findAll('.input-suffix')
    expect(suffixes[0].text()).toBe('%')
  })

  it('shows save button', () => {
    const w = factory()
    expect(w.find('.btn-primary').text()).toBe('admin.configPricing.saveCommissions')
  })

  it('shows saving text when saving', () => {
    const w = factory({ savingCommissions: true })
    expect(w.find('.btn-primary').text()).toBe('admin.configPricing.saving')
  })

  it('disables save button when saving', () => {
    const w = factory({ savingCommissions: true })
    expect(w.find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('shows success banner when successCommissions is true', () => {
    const w = factory({ successCommissions: true })
    expect(w.find('.success-banner').exists()).toBe(true)
  })

  it('hides success banner when successCommissions is false', () => {
    const w = factory()
    expect(w.find('.success-banner').exists()).toBe(false)
  })

  it('emits save on button click', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('save')).toBeTruthy()
  })

  it('emits update-rate on input change', async () => {
    const w = factory()
    const input = w.findAll('.commission-input')[0]
    Object.defineProperty(input.element, 'value', { value: '10', writable: true })
    await input.trigger('input')
    expect(w.emitted('update-rate')).toBeTruthy()
    expect(w.emitted('update-rate')![0]).toEqual([{ rateKey: 'transport_pct', value: 10 }])
  })
})
