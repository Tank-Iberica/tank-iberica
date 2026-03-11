/**
 * Tests for app/components/valoracion/ValoracionHistory.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ValoracionHistory from '../../../app/components/valoracion/ValoracionHistory.vue'

const baseHistory = [
  { id: 'h1', brand: 'Volvo', model: 'FH 500', year: 2022, estimated_min: 28000, estimated_max: 42000, confidence: 'high', created_at: '2026-03-01' },
  { id: 'h2', brand: 'Scania', model: 'R450', year: 2021, estimated_min: 25000, estimated_max: 38000, confidence: 'medium', created_at: '2026-02-15' },
]

describe('ValoracionHistory', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ValoracionHistory, {
      props: {
        history: [...baseHistory],
        showResults: true,
        formatPrice: (v: number) => `${v.toLocaleString('es-ES')} €`,
        formatDate: (d: string) => d,
        confidenceColor: () => '#10b981',
        ...overrides,
      },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders history section', () => {
    expect(factory().find('.history-section').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.history-title').text()).toBe('valuation.history')
  })

  it('renders history items', () => {
    expect(factory().findAll('.history-item')).toHaveLength(2)
  })

  it('shows vehicle info', () => {
    expect(factory().findAll('.history-vehicle')[0].text()).toContain('Volvo')
  })

  it('shows date', () => {
    expect(factory().findAll('.history-date')[0].text()).toBe('2026-03-01')
  })

  it('shows price range', () => {
    expect(factory().findAll('.history-range')[0].text()).toContain('28')
  })

  it('shows confidence dot', () => {
    expect(factory().findAll('.confidence-dot')).toHaveLength(2)
  })

  it('shows no-history when empty and showResults=true', () => {
    const w = factory({ history: [] })
    expect(w.find('.no-history').text()).toBe('valuation.noHistory')
  })

  it('hides section when empty and showResults=false', () => {
    const w = factory({ history: [], showResults: false })
    expect(w.find('.history-section').exists()).toBe(false)
  })
})
