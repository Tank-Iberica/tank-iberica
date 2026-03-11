/**
 * Tests for app/components/precios/PreciosPlanCard.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import PreciosPlanCard from '../../../app/components/precios/PreciosPlanCard.vue'

const baseCard = {
  plan: 'basic' as const,
  name: 'Básico',
  price: '29',
  suffix: 'mes',
  highlighted: false,
  founding: false,
  features: ['10 anuncios', 'Estadísticas básicas'],
}

describe('PreciosPlanCard', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(PreciosPlanCard, {
      props: {
        card: { ...baseCard },
        isTrialEligible: false,
        loading: false,
        ...overrides,
      },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders plan card', () => {
    expect(factory().find('.plan-card').exists()).toBe(true)
  })

  it('shows plan name', () => {
    expect(factory().find('.plan-name').text()).toBe('Básico')
  })

  it('shows price', () => {
    expect(factory().find('.price-amount').text()).toContain('29')
  })

  it('shows price suffix', () => {
    expect(factory().find('.price-suffix').text()).toContain('mes')
  })

  it('renders features', () => {
    expect(factory().findAll('.plan-feature')).toHaveLength(2)
    expect(factory().findAll('.plan-feature')[0].text()).toContain('10 anuncios')
  })

  it('shows popular badge when highlighted', () => {
    const w = factory({ card: { ...baseCard, highlighted: true } })
    expect(w.find('.popular-badge').exists()).toBe(true)
    expect(w.find('.plan-card').classes()).toContain('plan-card--popular')
  })

  it('hides popular badge when not highlighted', () => {
    expect(factory().find('.popular-badge').exists()).toBe(false)
  })

  it('shows founding label when founding', () => {
    const w = factory({ card: { ...baseCard, founding: true } })
    expect(w.find('.founding-label').exists()).toBe(true)
    expect(w.find('.plan-card').classes()).toContain('plan-card--founding')
  })

  it('shows trial badge when eligible and basic/premium', () => {
    const w = factory({ isTrialEligible: true })
    expect(w.find('.trial-badge').exists()).toBe(true)
  })

  it('hides trial badge for free plan', () => {
    const w = factory({ card: { ...baseCard, plan: 'free' }, isTrialEligible: true })
    expect(w.find('.trial-badge').exists()).toBe(false)
  })

  it('emits cta with plan on button click', async () => {
    const w = factory()
    await w.find('.plan-cta').trigger('click')
    expect(w.emitted('cta')?.[0]).toEqual(['basic'])
  })

  it('disables button when loading', () => {
    const w = factory({ loading: true })
    expect(w.find('.plan-cta').attributes('disabled')).toBeDefined()
  })

  it('shows subscribe text for paid plans', () => {
    expect(factory().find('.plan-cta').text()).toBe('pricing.subscribe')
  })

  it('shows startFree for free plan', () => {
    const w = factory({ card: { ...baseCard, plan: 'free' } })
    expect(w.find('.plan-cta').text()).toBe('pricing.startFree')
  })

  it('shows requestSlot for founding plan', () => {
    const w = factory({ card: { ...baseCard, founding: true } })
    expect(w.find('.plan-cta').text()).toBe('pricing.requestSlot')
  })

  it('hides suffix when not provided', () => {
    const w = factory({ card: { ...baseCard, suffix: '' } })
    expect(w.find('.price-suffix').exists()).toBe(false)
  })
})
