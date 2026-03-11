/**
 * Tests for app/components/vehicle/KmScoreBadge.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { computed, ref } from 'vue'

beforeAll(() => {
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('ref', ref)
})

import KmScoreBadge from '../../../app/components/vehicle/KmScoreBadge.vue'

const makeAnalysis = (overrides = {}) => ({
  score: 85,
  labelKey: 'verification.kmScore.excellent',
  explanation: 'Consistent mileage growth',
  anomalies: [] as { type: string; description: string }[],
  ...overrides,
})

describe('KmScoreBadge', () => {
  const factory = (analysis: ReturnType<typeof makeAnalysis> | null = makeAnalysis(), showReportLink = false) =>
    shallowMount(KmScoreBadge, {
      props: { analysis, showReportLink },
      global: { mocks: { $t: (key: string) => key } },
    })

  it('renders badge when analysis is provided', () => {
    const w = factory()
    expect(w.find('.km-score-badge').exists()).toBe(true)
  })

  it('does not render when analysis is null', () => {
    const w = factory(null)
    expect(w.find('.km-score-badge').exists()).toBe(false)
  })

  it('shows score title', () => {
    const w = factory()
    expect(w.find('.score-title').text()).toBe('verification.kmScore.title')
  })

  it('shows score value', () => {
    const w = factory()
    expect(w.find('.score-value').text()).toBe('85/100')
  })

  it('shows score label', () => {
    const w = factory()
    expect(w.find('.score-label').text()).toBe('verification.kmScore.excellent')
  })

  it('shows explanation text', () => {
    const w = factory()
    expect(w.find('.score-explanation').text()).toBe('Consistent mileage growth')
  })

  it('applies score-excellent class for score >= 80', () => {
    const w = factory(makeAnalysis({ score: 85 }))
    expect(w.find('.km-score-badge').classes()).toContain('score-excellent')
  })

  it('applies score-good class for score 60-79', () => {
    const w = factory(makeAnalysis({ score: 65 }))
    expect(w.find('.km-score-badge').classes()).toContain('score-good')
  })

  it('applies score-moderate class for score 40-59', () => {
    const w = factory(makeAnalysis({ score: 50 }))
    expect(w.find('.km-score-badge').classes()).toContain('score-moderate')
  })

  it('applies score-warning class for score 20-39', () => {
    const w = factory(makeAnalysis({ score: 25 }))
    expect(w.find('.km-score-badge').classes()).toContain('score-warning')
  })

  it('applies score-danger class for score < 20', () => {
    const w = factory(makeAnalysis({ score: 10 }))
    expect(w.find('.km-score-badge').classes()).toContain('score-danger')
  })

  it('sets score-fill width from score', () => {
    const w = factory(makeAnalysis({ score: 72 }))
    expect(w.find('.score-fill').attributes('style')).toContain('width: 72%')
  })

  it('shows anomaly tags when anomalies exist', () => {
    const analysis = makeAnalysis({
      anomalies: [
        { type: 'decrease', description: 'KM decrease detected' },
        { type: 'spike', description: 'Unusual spike' },
      ],
    })
    const w = factory(analysis)
    expect(w.findAll('.anomaly-tag')).toHaveLength(2)
  })

  it('limits anomaly display to 2', () => {
    const analysis = makeAnalysis({
      anomalies: [
        { type: 'decrease', description: 'A' },
        { type: 'spike', description: 'B' },
        { type: 'decrease', description: 'C' },
      ],
    })
    const w = factory(analysis)
    expect(w.findAll('.anomaly-tag')).toHaveLength(2)
  })

  it('applies correct anomaly type class', () => {
    const analysis = makeAnalysis({
      anomalies: [{ type: 'decrease', description: 'KM decrease' }],
    })
    const w = factory(analysis)
    expect(w.find('.anomaly-tag').classes()).toContain('anomaly-decrease')
  })

  it('hides anomalies section when empty', () => {
    const w = factory(makeAnalysis({ anomalies: [] }))
    expect(w.find('.score-anomalies').exists()).toBe(false)
  })

  it('shows report link when showReportLink is true', () => {
    const w = factory(makeAnalysis(), true)
    expect(w.find('.score-report-link').exists()).toBe(true)
  })

  it('hides report link by default', () => {
    const w = factory(makeAnalysis(), false)
    expect(w.find('.score-report-link').exists()).toBe(false)
  })

  it('emits requestReport on report button click', async () => {
    const w = factory(makeAnalysis(), true)
    await w.find('.report-btn').trigger('click')
    expect(w.emitted('requestReport')).toHaveLength(1)
  })
})
