import { describe, it, expect } from 'vitest'
import {
  analyzeUsageReliability,
  analyzeKmReliability,
  getScoreLabels,
  type InspectionRecord,
} from '~/utils/kmScore'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeHistory(entries: Array<{ date: string; value: number }>): InspectionRecord[] {
  return entries.map((e) => ({ date: e.date, value: e.value }))
}

// ─── Insufficient data ────────────────────────────────────────────────────────

describe('analyzeUsageReliability — insufficient data', () => {
  it('returns score 50 with 0 records', () => {
    const result = analyzeUsageReliability([])
    expect(result.score).toBe(50)
    expect(result.labelKey).toBe('verification.kmScore.insufficientData')
    expect(result.anomalies).toHaveLength(0)
    expect(result.totalInspections).toBe(0)
    expect(result.avgPerYear).toBe(0)
  })

  it('returns score 50 with 1 record', () => {
    const result = analyzeUsageReliability(makeHistory([{ date: '2022-01-01', value: 50000 }]))
    expect(result.score).toBe(50)
    expect(result.totalInspections).toBe(1)
    expect(result.dataPoints).toHaveLength(1)
    expect(result.dataPoints[0]?.deltaFromPrevious).toBeNull()
  })
})

// ─── Normal clean progression ─────────────────────────────────────────────────

describe('analyzeUsageReliability — clean progression', () => {
  it('scores 100 for consistent moderate usage (km)', () => {
    const history = makeHistory([
      { date: '2020-01-01', value: 0 },
      { date: '2021-01-01', value: 30000 },
      { date: '2022-01-01', value: 60000 },
      { date: '2023-01-01', value: 90000 },
    ])
    const result = analyzeUsageReliability(history, 'km')
    expect(result.score).toBe(100)
    expect(result.anomalies).toHaveLength(0)
    expect(result.label).toBe('Muy fiable')
    expect(result.labelKey).toBe('verification.kmScore.veryReliable')
    expect(result.avgPerYear).toBeCloseTo(30000, -2)
  })

  it('sorts records by date ascending regardless of input order', () => {
    const history = makeHistory([
      { date: '2023-01-01', value: 90000 },
      { date: '2020-01-01', value: 0 },
      { date: '2021-01-01', value: 30000 },
    ])
    const result = analyzeUsageReliability(history, 'km')
    expect(result.dataPoints[0]?.date).toBe('2020-01-01')
    expect(result.dataPoints[2]?.date).toBe('2023-01-01')
  })

  it('dataPoints include delta and ratePerYear for non-first entries', () => {
    const history = makeHistory([
      { date: '2020-01-01', value: 0 },
      { date: '2021-01-01', value: 40000 },
    ])
    const result = analyzeUsageReliability(history, 'km')
    expect(result.dataPoints[0]?.deltaFromPrevious).toBeNull()
    expect(result.dataPoints[1]?.deltaFromPrevious).toBeCloseTo(40000, 0)
    // yearsBetween uses 365.25 days/year so rate ≈ 40000 ± ~100
    expect(result.dataPoints[1]?.ratePerYear).toBeGreaterThan(39800)
    expect(result.dataPoints[1]?.ratePerYear).toBeLessThan(40200)
  })
})

// ─── Anomaly: decrease (fraud indicator) ─────────────────────────────────────

describe('analyzeUsageReliability — decrease anomaly', () => {
  it('detects single decrease and penalizes -40', () => {
    const history = makeHistory([
      { date: '2020-01-01', value: 100000 },
      { date: '2021-01-01', value: 80000 }, // decrease
    ])
    const result = analyzeUsageReliability(history, 'km')
    expect(result.anomalies).toHaveLength(1)
    expect(result.anomalies[0]?.type).toBe('decrease')
    expect(result.score).toBeLessThanOrEqual(60)
    expect(result.labelKey).not.toBe('verification.kmScore.veryReliable')
  })

  it('detects two decreases and penalizes -80 (score ≤ 20)', () => {
    const history = makeHistory([
      { date: '2020-01-01', value: 100000 },
      { date: '2021-01-01', value: 80000 }, // -40
      { date: '2022-01-01', value: 60000 }, // -40
    ])
    const result = analyzeUsageReliability(history, 'km')
    const decreases = result.anomalies.filter((a) => a.type === 'decrease')
    expect(decreases).toHaveLength(2)
    // 100 - 2×40 = 20 → "Sospechoso" (threshold < 20 for "Manipulado")
    expect(result.score).toBe(20)
    expect(result.labelKey).toBe('verification.kmScore.suspicious')
  })

  it('anomaly description mentions the decrease values', () => {
    const history = makeHistory([
      { date: '2020-01-01', value: 100000 },
      { date: '2021-01-01', value: 90000 },
    ])
    const result = analyzeUsageReliability(history, 'km')
    expect(result.anomalies[0]?.description).toContain('100')
    expect(result.anomalies[0]?.description).toContain('90')
  })

  it('sets explanation key for decrease anomaly', () => {
    const history = makeHistory([
      { date: '2020-01-01', value: 50000 },
      { date: '2021-01-01', value: 30000 },
    ])
    const result = analyzeUsageReliability(history, 'km')
    expect(result.explanationKey).toBe('verification.kmScore.explanationDecrease')
  })

  it('score never goes below 0', () => {
    // 3 decreases → 3 × -40 = -120, clamped to 0
    const history = makeHistory([
      { date: '2019-01-01', value: 200000 },
      { date: '2020-01-01', value: 150000 },
      { date: '2021-01-01', value: 100000 },
      { date: '2022-01-01', value: 50000 },
    ])
    const result = analyzeUsageReliability(history, 'km')
    expect(result.score).toBe(0)
  })
})

// ─── Anomaly: spike ───────────────────────────────────────────────────────────

describe('analyzeUsageReliability — spike anomaly', () => {
  it('detects spike when rate exceeds maxReasonablePerYear for km (150000)', () => {
    const history = makeHistory([
      { date: '2020-01-01', value: 0 },
      { date: '2021-01-01', value: 200000 }, // 200k/year > 150k limit
    ])
    const result = analyzeUsageReliability(history, 'km')
    const spikes = result.anomalies.filter((a) => a.type === 'spike')
    expect(spikes).toHaveLength(1)
    expect(result.score).toBeLessThan(100)
  })

  it('does not flag spike when rate is within limit', () => {
    const history = makeHistory([
      { date: '2020-01-01', value: 0 },
      { date: '2021-01-01', value: 100000 }, // 100k/year < 150k limit
    ])
    const result = analyzeUsageReliability(history, 'km')
    const spikes = result.anomalies.filter((a) => a.type === 'spike')
    expect(spikes).toHaveLength(0)
  })

  it('uses correct maxReasonablePerYear for hours unit (5000)', () => {
    const history = makeHistory([
      { date: '2020-01-01', value: 0 },
      { date: '2021-01-01', value: 8000 }, // 8000h/year > 5000h limit
    ])
    const result = analyzeUsageReliability(history, 'hours')
    const spikes = result.anomalies.filter((a) => a.type === 'spike')
    expect(spikes).toHaveLength(1)
  })

  it('uses correct maxReasonablePerYear for cycles unit (10000)', () => {
    const history = makeHistory([
      { date: '2020-01-01', value: 0 },
      { date: '2021-01-01', value: 7000 }, // 7000 < 10000, no spike
    ])
    const result = analyzeUsageReliability(history, 'cycles')
    const spikes = result.anomalies.filter((a) => a.type === 'spike')
    expect(spikes).toHaveLength(0)
  })
})

// ─── Score levels ─────────────────────────────────────────────────────────────

describe('analyzeUsageReliability — score label levels', () => {
  it('label is "Muy fiable" for score >= 80', () => {
    const history = makeHistory([
      { date: '2020-01-01', value: 0 },
      { date: '2021-01-01', value: 30000 },
      { date: '2022-01-01', value: 60000 },
    ])
    const result = analyzeUsageReliability(history)
    expect(result.score).toBeGreaterThanOrEqual(80)
    expect(result.label).toBe('Muy fiable')
  })

  it('label is "Sospechoso" when score is 20-39', () => {
    // 1 decrease (-40) + maybe some other penalty → score 40-60 range
    // For exactly 20-39, need 2 decreases (-80) but some variation...
    // Actually with 1 decrease on 2-point history: score = 100 - 40 = 60 (but high avg usage may apply)
    // Let's use a spike (-20) on a short history → score ~80 (no, only -20)
    // 2 decreases → 100 - 80 = 20 → "Sospechoso" exactly at boundary
    const history = makeHistory([
      { date: '2020-01-01', value: 100000 },
      { date: '2021-01-01', value: 80000 },
      { date: '2022-01-01', value: 60000 },
    ])
    const result = analyzeUsageReliability(history)
    expect(result.score).toBe(20)
    expect(result.label).toBe('Sospechoso')
    expect(result.labelKey).toBe('verification.kmScore.suspicious')
  })

  it('label is "Manipulado" for score < 20 (3 decreases)', () => {
    const history = makeHistory([
      { date: '2019-01-01', value: 200000 },
      { date: '2020-01-01', value: 150000 },
      { date: '2021-01-01', value: 100000 },
      { date: '2022-01-01', value: 50000 },
    ])
    const result = analyzeUsageReliability(history)
    expect(result.score).toBe(0)
    expect(result.label).toBe('Manipulado')
    expect(result.labelKey).toBe('verification.kmScore.tampered')
  })
})

// ─── High average usage penalty ──────────────────────────────────────────────

describe('analyzeUsageReliability — high average penalty', () => {
  it('applies -10 penalty when avgRate > 80% of maxReasonablePerYear', () => {
    // 80% of 150000 = 120000. Use 130000/year average
    const history = makeHistory([
      { date: '2020-01-01', value: 0 },
      { date: '2021-01-01', value: 130000 },
    ])
    const result = analyzeUsageReliability(history, 'km')
    // No decrease, no spike (130k < 150k), but > 80% → -10
    expect(result.score).toBe(90)
  })

  it('does not apply high-avg penalty when rate is below 80%', () => {
    const history = makeHistory([
      { date: '2020-01-01', value: 0 },
      { date: '2021-01-01', value: 100000 }, // 100k < 120k (80% of 150k)
    ])
    const result = analyzeUsageReliability(history, 'km')
    expect(result.score).toBe(100)
  })
})

// ─── Consistency (coefficient of variation) ──────────────────────────────────

describe('analyzeUsageReliability — consistency penalty', () => {
  it('applies -15 penalty for highly inconsistent rates (cv > 1)', () => {
    // One year: 10000 km, next year: 100000 km — very inconsistent
    const history = makeHistory([
      { date: '2020-01-01', value: 0 },
      { date: '2021-01-01', value: 10000 },
      { date: '2022-01-01', value: 110000 }, // 100000 in one year
    ])
    const result = analyzeUsageReliability(history, 'km')
    // spike on second interval (100k/yr < 150k limit, no spike)
    // rates = [10000, 100000], mean = 55000, std = 45000, cv = 0.818 → -5
    expect(result.score).toBeLessThan(100)
  })

  it('no consistency penalty for stable rates', () => {
    const history = makeHistory([
      { date: '2020-01-01', value: 0 },
      { date: '2021-01-01', value: 30000 },
      { date: '2022-01-01', value: 60000 },
      { date: '2023-01-01', value: 90000 },
    ])
    const result = analyzeUsageReliability(history, 'km')
    expect(result.score).toBe(100)
  })
})

// ─── Con reservas label (score 40–59) ────────────────────────────────────────

describe('analyzeUsageReliability — Con reservas label', () => {
  it('label is "Con reservas" for score 40–59 (decrease + cv>1 penalty)', () => {
    // rates ≈ [+30000, -10000]: 1 decrease (-40) + cv>1 (-15) = score 45
    const history = makeHistory([
      { date: '2020-01-01', value: 0 },
      { date: '2021-01-01', value: 30000 },
      { date: '2022-01-01', value: 20000 }, // decrease
    ])
    const result = analyzeUsageReliability(history)
    expect(result.score).toBe(45)
    expect(result.label).toBe('Con reservas')
    expect(result.labelKey).toBe('verification.kmScore.withReservations')
  })
})

// ─── analyzeKmReliability convenience wrapper ─────────────────────────────────

describe('analyzeKmReliability', () => {
  it('delegates to analyzeUsageReliability with km unit', () => {
    const history = makeHistory([
      { date: '2021-01-01', value: 0 },
      { date: '2022-01-01', value: 50000 },
    ])
    const km = analyzeKmReliability(history)
    const explicit = analyzeUsageReliability(history, 'km')
    expect(km.score).toBe(explicit.score)
    expect(km.labelKey).toBe(explicit.labelKey)
    expect(km.anomalies).toHaveLength(explicit.anomalies.length)
  })
})

// ─── Return structure completeness ───────────────────────────────────────────

describe('analyzeUsageReliability — return structure', () => {
  it('always returns all required fields', () => {
    const result = analyzeUsageReliability(
      makeHistory([
        { date: '2021-01-01', value: 0 },
        { date: '2022-01-01', value: 20000 },
      ]),
    )
    expect(result).toHaveProperty('score')
    expect(result).toHaveProperty('label')
    expect(result).toHaveProperty('labelKey')
    expect(result).toHaveProperty('explanation')
    expect(result).toHaveProperty('explanationKey')
    expect(result).toHaveProperty('dataPoints')
    expect(result).toHaveProperty('anomalies')
    expect(result).toHaveProperty('avgPerYear')
    expect(result).toHaveProperty('totalInspections')
  })

  it('score is always in 0-100 range', () => {
    const cases: InspectionRecord[][] = [
      [],
      makeHistory([{ date: '2020-01-01', value: 0 }]),
      makeHistory([
        { date: '2020-01-01', value: 100000 },
        { date: '2021-01-01', value: 0 },
        { date: '2022-01-01', value: 0 },
        { date: '2023-01-01', value: 0 },
      ]),
    ]
    for (const c of cases) {
      const { score } = analyzeUsageReliability(c)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    }
  })

  it('avgPerYear is rounded integer', () => {
    const result = analyzeUsageReliability(
      makeHistory([
        { date: '2020-01-01', value: 0 },
        { date: '2021-06-01', value: 45000 },
      ]),
    )
    expect(Number.isInteger(result.avgPerYear)).toBe(true)
  })
})

// ─── getScoreLabels — general explanation fallback ──────────────────────────

describe('getScoreLabels — general explanation (no anomalies, score < 80)', () => {
  it('returns explanationGeneral when no anomalies and score < 80', () => {
    const result = getScoreLabels(
      50, // score < 80
      5, // inspections
      '2019-01-01',
      '2023-01-01',
      25000,
      'km',
      [], // no anomalies
    )
    expect(result.explanationKey).toBe('verification.kmScore.explanationGeneral')
    expect(result.explanation).toContain('5 inspecciones analizadas')
    expect(result.explanation).toContain('2019')
    expect(result.explanation).toContain('2023')
  })

  it('returns correct label for score < 80 with no anomalies', () => {
    const result = getScoreLabels(70, 3, '2020-01-01', '2022-01-01', 40000, 'km', [])
    expect(result.labelKey).toBe('verification.kmScore.reliable')
    expect(result.explanationKey).toBe('verification.kmScore.explanationGeneral')
  })
})
