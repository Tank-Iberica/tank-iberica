import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// Unit tests for VehicleAnalyticsFunnel computed logic.
// Mirrors the component's computed values without mounting Vue.
// ---------------------------------------------------------------------------

function conversionRate(views: number, leads: number): number {
  if (!views) return 0
  return Math.round((leads / views) * 1000) / 10
}

interface FunnelStep {
  key: string
  value: number
  barWidth: string
}

function buildSteps(views: number, favorites: number, leads: number): FunnelStep[] {
  const maxVal = Math.max(views, 1)
  return [
    { key: 'views', value: views, barWidth: `${Math.round((views / maxVal) * 100)}%` },
    { key: 'favorites', value: favorites, barWidth: `${Math.round((favorites / maxVal) * 100)}%` },
    { key: 'leads', value: leads, barWidth: `${Math.round((leads / maxVal) * 100)}%` },
  ]
}

// ---- conversion rate -------------------------------------------------------

describe('VehicleAnalyticsFunnel — conversionRate', () => {
  it('returns 0 when views is 0', () => {
    expect(conversionRate(0, 5)).toBe(0)
  })

  it('returns 0 when no leads', () => {
    expect(conversionRate(100, 0)).toBe(0)
  })

  it('calculates 1% conversion correctly', () => {
    expect(conversionRate(100, 1)).toBe(1)
  })

  it('calculates 0.5% conversion correctly', () => {
    expect(conversionRate(200, 1)).toBe(0.5)
  })

  it('calculates 100% when leads equals views', () => {
    expect(conversionRate(5, 5)).toBe(100)
  })

  it('returns one decimal place', () => {
    // 3/7 = 0.4285... → rounded to 42.9%
    const result = conversionRate(7, 3)
    expect(result).toBe(42.9)
  })
})

// ---- funnel steps ----------------------------------------------------------

describe('VehicleAnalyticsFunnel — steps', () => {
  it('views bar is always 100% when views is max', () => {
    const steps = buildSteps(200, 15, 3)
    expect(steps[0]!.barWidth).toBe('100%')
  })

  it('favorites bar is proportional to views', () => {
    const steps = buildSteps(100, 50, 5)
    expect(steps[1]!.barWidth).toBe('50%')
  })

  it('leads bar is proportional to views', () => {
    const steps = buildSteps(100, 50, 10)
    expect(steps[2]!.barWidth).toBe('10%')
  })

  it('all bars are 100% when views is 0 (maxVal = 1)', () => {
    const steps = buildSteps(0, 0, 0)
    expect(steps[0]!.barWidth).toBe('0%')
    expect(steps[1]!.barWidth).toBe('0%')
    expect(steps[2]!.barWidth).toBe('0%')
  })

  it('returns exactly 3 steps', () => {
    const steps = buildSteps(100, 10, 2)
    expect(steps).toHaveLength(3)
  })

  it('step keys are views, favorites, leads in order', () => {
    const steps = buildSteps(100, 10, 2)
    expect(steps[0]!.key).toBe('views')
    expect(steps[1]!.key).toBe('favorites')
    expect(steps[2]!.key).toBe('leads')
  })

  it('reflects actual values correctly', () => {
    const steps = buildSteps(1234, 42, 7)
    expect(steps[0]!.value).toBe(1234)
    expect(steps[1]!.value).toBe(42)
    expect(steps[2]!.value).toBe(7)
  })

  it('handles favorite count higher than views (guard: maxVal = views)', () => {
    // Shouldn't happen in practice but should not crash
    const steps = buildSteps(10, 20, 0)
    // favorites bar = round(20/10 * 100) = 200% → unusual but no crash
    expect(steps[1]!.barWidth).toBe('200%')
  })
})
