import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import KmScoreBadge from '../../app/components/vehicle/KmScoreBadge.vue'
import type { UsageAnalysis } from '../../app/utils/kmScore'

describe('KmScoreBadge', () => {
  const mockAnalysisExcellent: UsageAnalysis = {
    score: 90,
    label: 'Muy fiable',
    labelKey: 'verification.kmScore.veryReliable',
    explanation: 'Progresion consistente sin anomalias.',
    explanationKey: 'verification.kmScore.explanationConsistent',
    dataPoints: [],
    anomalies: [],
    avgPerYear: 50000,
    totalInspections: 5,
  }

  const mockAnalysisWarning: UsageAnalysis = {
    score: 40,
    label: 'Con reservas',
    labelKey: 'verification.kmScore.withReservations',
    explanation: 'Se detectaron incrementos inusualmente altos.',
    explanationKey: 'verification.kmScore.explanationSpike',
    dataPoints: [],
    anomalies: [],
    avgPerYear: 120000,
    totalInspections: 3,
  }

  const mockAnalysisDanger: UsageAnalysis = {
    score: 15,
    label: 'Manipulado',
    labelKey: 'verification.kmScore.tampered',
    explanation: 'Se detectaron km que disminuyen entre inspecciones.',
    explanationKey: 'verification.kmScore.explanationDecrease',
    dataPoints: [],
    anomalies: [
      {
        type: 'decrease',
        fromDate: '2020-01-01',
        toDate: '2021-01-01',
        fromValue: 100000,
        toValue: 80000,
        description: 'km disminuyeron de 100,000 a 80,000',
      },
    ],
    avgPerYear: 50000,
    totalInspections: 4,
  }

  const mockAnalysisWithAnomalies: UsageAnalysis = {
    score: 65,
    label: 'Fiable',
    labelKey: 'verification.kmScore.reliable',
    explanation: 'Progresion mayormente consistente.',
    explanationKey: 'verification.kmScore.explanationGeneral',
    dataPoints: [],
    anomalies: [
      {
        type: 'spike',
        fromDate: '2020-01-01',
        toDate: '2021-01-01',
        fromValue: 50000,
        toValue: 200000,
        description: 'Incremento excesivo: 150,000 km/año',
      },
      {
        type: 'decrease',
        fromDate: '2022-01-01',
        toDate: '2023-01-01',
        fromValue: 250000,
        toValue: 240000,
        description: 'km disminuyeron de 250,000 a 240,000',
      },
    ],
    avgPerYear: 75000,
    totalInspections: 6,
  }

  it('should render the correct score value', () => {
    const wrapper = mount(KmScoreBadge, {
      props: {
        analysis: mockAnalysisExcellent,
      },
      global: {
        mocks: {
          $t: (key: string) => key,
        },
        stubs: {
          // Stub any child components if needed
        },
      },
    })

    expect(wrapper.find('.score-value').text()).toBe('90/100')
  })

  it('should apply green styling for score >= 80', async () => {
    const wrapper = mount(KmScoreBadge, {
      props: {
        analysis: mockAnalysisExcellent,
      },
      global: {
        mocks: {
          $t: (key: string) => key,
        },
      },
    })

    await wrapper.vm.$nextTick()
    // Check the score fill has the correct width percentage
    const scoreFill = wrapper.find('.score-fill')
    expect(scoreFill.attributes('style')).toContain('width: 90%')

    // Check the score value is rendered
    const scoreValue = wrapper.find('.score-value')
    expect(scoreValue.text()).toBe('90/100')
  })

  it('should apply warning styling for score 40-59', async () => {
    const wrapper = mount(KmScoreBadge, {
      props: {
        analysis: mockAnalysisWarning,
      },
      global: {
        mocks: {
          $t: (key: string) => key,
        },
      },
    })

    await wrapper.vm.$nextTick()
    // Check the score fill has the correct width
    const scoreFill = wrapper.find('.score-fill')
    expect(scoreFill.attributes('style')).toContain('width: 40%')

    // Check the score value
    const scoreValue = wrapper.find('.score-value')
    expect(scoreValue.text()).toBe('40/100')
  })

  it('should apply danger styling for score < 20', async () => {
    const wrapper = mount(KmScoreBadge, {
      props: {
        analysis: mockAnalysisDanger,
      },
      global: {
        mocks: {
          $t: (key: string) => key,
        },
      },
    })

    await wrapper.vm.$nextTick()
    // Check the score fill has the correct width
    const scoreFill = wrapper.find('.score-fill')
    expect(scoreFill.attributes('style')).toContain('width: 15%')

    // Check the score value
    const scoreValue = wrapper.find('.score-value')
    expect(scoreValue.text()).toBe('15/100')
  })

  it('should display anomalies when provided', () => {
    const wrapper = mount(KmScoreBadge, {
      props: {
        analysis: mockAnalysisWithAnomalies,
      },
      global: {
        mocks: {
          $t: (key: string) => key,
        },
      },
    })

    const anomalies = wrapper.findAll('.anomaly-tag')
    // Component shows max 2 anomalies (slice(0, 2))
    expect(anomalies).toHaveLength(2)
    expect(anomalies[0]?.classes()).toContain('anomaly-spike')
    expect(anomalies[1]?.classes()).toContain('anomaly-decrease')
  })

  it('should NOT display anomalies section when no anomalies exist', () => {
    const wrapper = mount(KmScoreBadge, {
      props: {
        analysis: mockAnalysisExcellent, // has empty anomalies array
      },
      global: {
        mocks: {
          $t: (key: string) => key,
        },
      },
    })

    expect(wrapper.find('.score-anomalies').exists()).toBe(false)
  })

  it('should show report request CTA when showReportLink prop is true', () => {
    const wrapper = mount(KmScoreBadge, {
      props: {
        analysis: mockAnalysisExcellent,
        showReportLink: true,
      },
      global: {
        mocks: {
          $t: (key: string) => key,
        },
      },
    })

    expect(wrapper.find('.score-report-link').exists()).toBe(true)
    expect(wrapper.find('.report-btn').exists()).toBe(true)
  })

  it('should NOT show report request CTA when showReportLink prop is false', () => {
    const wrapper = mount(KmScoreBadge, {
      props: {
        analysis: mockAnalysisExcellent,
        showReportLink: false,
      },
      global: {
        mocks: {
          $t: (key: string) => key,
        },
      },
    })

    expect(wrapper.find('.score-report-link').exists()).toBe(false)
  })

  it('should NOT show report request CTA when showReportLink is not provided (default)', () => {
    const wrapper = mount(KmScoreBadge, {
      props: {
        analysis: mockAnalysisExcellent,
      },
      global: {
        mocks: {
          $t: (key: string) => key,
        },
      },
    })

    expect(wrapper.find('.score-report-link').exists()).toBe(false)
  })

  it('should emit requestReport when report button is clicked', async () => {
    const wrapper = mount(KmScoreBadge, {
      props: {
        analysis: mockAnalysisExcellent,
        showReportLink: true,
      },
      global: {
        mocks: {
          $t: (key: string) => key,
        },
      },
    })

    await wrapper.find('.report-btn').trigger('click')
    expect(wrapper.emitted('requestReport')).toBeTruthy()
    expect(wrapper.emitted('requestReport')).toHaveLength(1)
  })

  it('should NOT render when analysis is null', () => {
    const wrapper = mount(KmScoreBadge, {
      props: {
        analysis: null,
      },
      global: {
        mocks: {
          $t: (key: string) => key,
        },
      },
    })

    expect(wrapper.find('.km-score-badge').exists()).toBe(false)
  })

  it('should render the score label from analysis', () => {
    const wrapper = mount(KmScoreBadge, {
      props: {
        analysis: mockAnalysisExcellent,
      },
      global: {
        mocks: {
          $t: (key: string) => key,
        },
      },
    })

    expect(wrapper.find('.score-label').text()).toBe('verification.kmScore.veryReliable')
  })

  it('should render the explanation text', () => {
    const wrapper = mount(KmScoreBadge, {
      props: {
        analysis: mockAnalysisExcellent,
      },
      global: {
        mocks: {
          $t: (key: string) => key,
        },
      },
    })

    expect(wrapper.find('.score-explanation').text()).toBe('Progresion consistente sin anomalias.')
  })
})
