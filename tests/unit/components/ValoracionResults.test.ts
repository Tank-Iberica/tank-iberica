/**
 * Tests for app/components/valoracion/ValoracionResults.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ValoracionResults from '../../../app/components/valoracion/ValoracionResults.vue'

const baseResult = {
  median: 35000,
  min: 28000,
  max: 42000,
  trend: 'stable',
  trendPct: 0,
  daysToSell: 45,
  sampleSize: 12,
  confidence: 'high',
}

const helpers = {
  formatPrice: (v: number) => `${v.toLocaleString('es-ES')} €`,
  priceBarPosition: () => 50,
  confidenceColor: () => '#10b981',
  trendIcon: () => '→',
  trendLabel: () => 'Estable',
  confidenceLabel: () => 'Alta',
}

describe('ValoracionResults', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ValoracionResults, {
      props: {
        result: { ...baseResult },
        noData: false,
        vehicleBrand: 'Volvo',
        vehicleModel: 'FH 500',
        vehicleYear: 2022,
        ...helpers,
        ...overrides,
      },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders result card when result present', () => {
    expect(factory().find('.result-card').exists()).toBe(true)
  })

  it('shows vehicle info', () => {
    expect(factory().find('.result-vehicle').text()).toContain('Volvo')
    expect(factory().find('.result-vehicle').text()).toContain('FH 500')
  })

  it('shows no-data card when noData=true', () => {
    const w = factory({ noData: true, result: null })
    expect(w.find('.no-data-card').exists()).toBe(true)
    expect(w.find('.result-card').exists()).toBe(false)
  })

  it('emits reset on new valuation click (no data)', async () => {
    const w = factory({ noData: true, result: null })
    await w.find('.submit-btn').trigger('click')
    expect(w.emitted('reset')).toBeTruthy()
  })

  it('renders stats grid with 5 stat cards', () => {
    expect(factory().findAll('.stat-card')).toHaveLength(5)
  })

  it('shows price range labels', () => {
    const labels = factory().findAll('.price-label-value')
    expect(labels[0].text()).toContain('28')
    expect(labels[1].text()).toContain('42')
  })

  it('shows disclaimer', () => {
    expect(factory().find('.disclaimer').text()).toBe('valuation.disclaimer')
  })

  it('emits reset on outline button click', async () => {
    const w = factory()
    await w.find('.submit-btn--outline').trigger('click')
    expect(w.emitted('reset')).toBeTruthy()
  })

  it('shows detailed report overlay', () => {
    expect(factory().find('.overlay-title').text()).toBe('valuation.detailedReport')
  })

  it('renders nothing when result=null and noData=false', () => {
    const w = factory({ result: null })
    expect(w.find('.result-card').exists()).toBe(false)
    expect(w.find('.no-data-card').exists()).toBe(false)
  })
})
