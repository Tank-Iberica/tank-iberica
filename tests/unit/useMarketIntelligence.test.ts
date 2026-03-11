import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useMarketIntelligence } from '../../app/composables/useMarketIntelligence'

// ─── Stubs ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({
    dealerId: 'dealer-1',
    totalVehicles: 5,
    insights: [],
    summary: { belowMarket: 2, atMarket: 2, aboveMarket: 1, averageDeviation: 5.2 },
  }))
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('report starts as null', () => {
    const c = useMarketIntelligence()
    expect(c.report.value).toBeNull()
  })

  it('loading starts as false', () => {
    const c = useMarketIntelligence()
    expect(c.loading.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useMarketIntelligence()
    expect(c.error.value).toBeNull()
  })
})

// ─── positionColor ────────────────────────────────────────────────────────────

describe('positionColor', () => {
  it('returns green for below', () => {
    const c = useMarketIntelligence()
    expect(c.positionColor('below')).toBe('#16a34a')
  })

  it('returns amber for average', () => {
    const c = useMarketIntelligence()
    expect(c.positionColor('average')).toBe('#f59e0b')
  })

  it('returns red for above', () => {
    const c = useMarketIntelligence()
    expect(c.positionColor('above')).toBe('#dc2626')
  })
})

// ─── positionLabel ────────────────────────────────────────────────────────────

describe('positionLabel', () => {
  it('returns label for below', () => {
    const c = useMarketIntelligence()
    expect(c.positionLabel('below')).toContain('debajo')
  })

  it('returns label for average', () => {
    const c = useMarketIntelligence()
    expect(c.positionLabel('average')).toContain('línea')
  })

  it('returns label for above', () => {
    const c = useMarketIntelligence()
    expect(c.positionLabel('above')).toContain('encima')
  })
})

// ─── fetchIntelligence ────────────────────────────────────────────────────────

describe('fetchIntelligence', () => {
  it('sets report from API', async () => {
    const c = useMarketIntelligence()
    await c.fetchIntelligence('dealer-1')
    expect(c.report.value).not.toBeNull()
    expect(c.report.value?.dealerId).toBe('dealer-1')
  })

  it('sets loading to false after success', async () => {
    const c = useMarketIntelligence()
    await c.fetchIntelligence('dealer-1')
    expect(c.loading.value).toBe(false)
  })

  it('sets error on API failure', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const c = useMarketIntelligence()
    await c.fetchIntelligence('dealer-1')
    expect(c.error.value).toBeTruthy()
    expect(c.loading.value).toBe(false)
  })

  it('sets generic error for non-Error exceptions', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue('string error'))
    const c = useMarketIntelligence()
    await c.fetchIntelligence('dealer-1')
    expect(c.error.value).toBe('Error loading intelligence data')
    expect(c.loading.value).toBe(false)
  })

  it('populates report with insights array', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({
      dealerId: 'dealer-1',
      totalVehicles: 2,
      insights: [
        { vehicleId: 'v1', brand: 'Volvo', model: 'FH', dealerPrice: 50000, marketAvg: 55000, marketMin: 40000, marketMax: 70000, pricePosition: 'below', priceDeviationPercent: -9.1, suggestion: 'Buen precio' },
      ],
      summary: { belowMarket: 1, atMarket: 0, aboveMarket: 1, averageDeviation: 3.5 },
    }))
    const c = useMarketIntelligence()
    await c.fetchIntelligence('dealer-1')
    expect(c.report.value!.insights).toHaveLength(1)
    expect(c.report.value!.totalVehicles).toBe(2)
    expect(c.report.value!.summary.averageDeviation).toBe(3.5)
  })
})
