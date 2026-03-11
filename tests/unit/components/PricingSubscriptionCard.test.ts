/**
 * Tests for app/components/admin/config/pricing/PricingSubscriptionCard.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import PricingSubscriptionCard from '../../../app/components/admin/config/pricing/PricingSubscriptionCard.vue'

describe('PricingSubscriptionCard', () => {
  const planDefinitions = [
    { key: 'free', labelKey: 'admin.configPricing.free', readonly: true },
    { key: 'basic', labelKey: 'admin.configPricing.basic', readonly: false },
    { key: 'premium', labelKey: 'admin.configPricing.premium', readonly: false },
  ]
  const subscriptionPrices = {
    basic: { monthly: 29, annual: 290 },
    premium: { monthly: 79, annual: 790 },
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(PricingSubscriptionCard, {
      props: { planDefinitions, subscriptionPrices, savingPrices: false, successPrices: false, ...overrides },
      global: { mocks: { $t: (key: string) => key } },
    })

  it('renders config-card', () => {
    expect(factory().find('.config-card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.card-title').text()).toBe('admin.configPricing.subscriptionPricesTitle')
  })

  it('renders pricing table with 3 rows', () => {
    expect(factory().findAll('tbody tr')).toHaveLength(3)
  })

  it('shows readonly row for free plan', () => {
    expect(factory().find('.row-readonly').exists()).toBe(true)
  })

  it('shows free tag for readonly plans', () => {
    expect(factory().find('.plan-free-tag').text()).toBe('admin.configPricing.alwaysFree')
  })

  it('shows price inputs for non-readonly plans', () => {
    const inputs = factory().findAll('.price-input')
    expect(inputs.length).toBeGreaterThanOrEqual(2)
  })

  it('shows save button', () => {
    expect(factory().find('.btn-primary').text()).toBe('admin.configPricing.savePrices')
  })

  it('shows saving text when saving', () => {
    expect(factory({ savingPrices: true }).find('.btn-primary').text()).toBe('admin.configPricing.saving')
  })

  it('shows success banner when successPrices is true', () => {
    expect(factory({ successPrices: true }).find('.success-banner').exists()).toBe(true)
  })

  it('emits save on button click', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('save')).toBeTruthy()
  })
})
