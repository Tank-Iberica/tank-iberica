import { describe, it, expect } from 'vitest'
import { canAccessMetric, METRIC_ACCESS } from '../../../app/utils/dealerStats.helpers'

describe('dealerStats.helpers — canAccessMetric', () => {
  it('free plan can access total_views', () => {
    expect(canAccessMetric('free', 'total_views')).toBe(true)
  })

  it('free plan cannot access per_vehicle_views', () => {
    expect(canAccessMetric('free', 'per_vehicle_views')).toBe(false)
  })

  it('basic plan can access monthly_chart', () => {
    expect(canAccessMetric('basic', 'monthly_chart')).toBe(true)
  })

  it('basic plan cannot access conversion_rate', () => {
    expect(canAccessMetric('basic', 'conversion_rate')).toBe(false)
  })

  it('premium plan can access all metrics', () => {
    for (const metric of Object.keys(METRIC_ACCESS)) {
      expect(canAccessMetric('premium', metric)).toBe(true)
    }
  })

  it('founding plan can access all metrics', () => {
    for (const metric of Object.keys(METRIC_ACCESS)) {
      expect(canAccessMetric('founding', metric)).toBe(true)
    }
  })

  it('returns false for unknown metric', () => {
    expect(canAccessMetric('premium', 'unknown_metric')).toBe(false)
  })

  it('returns false for unknown plan', () => {
    expect(canAccessMetric('enterprise', 'total_views')).toBe(false)
  })
})
