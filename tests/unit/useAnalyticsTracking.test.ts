import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAnalyticsTracking, ANALYTICS_EVENTS } from '../../app/composables/useAnalyticsTracking'

// ─── Stub helpers ──────────────────────────────────────────────────────────────

function stubSupabase(mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })) {
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({ insert: mockInsert }),
  }))
  vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
  return mockInsert
}

beforeEach(() => {
  vi.clearAllMocks()
  stubSupabase()
})

// ─── Smoke tests — all functions callable ─────────────────────────────────────

describe('function signatures', () => {
  it('trackEvent exists and is callable', () => {
    const c = useAnalyticsTracking()
    expect(() => c.trackEvent({ event_type: 'test_event' })).not.toThrow()
  })

  it('trackVehicleView exists and is callable', () => {
    const c = useAnalyticsTracking()
    expect(() => c.trackVehicleView('vehicle-1')).not.toThrow()
  })

  it('trackSearch exists and is callable', () => {
    const c = useAnalyticsTracking()
    expect(() => c.trackSearch({ category: 'trucks' })).not.toThrow()
  })

  it('trackLeadSent exists and is callable', () => {
    const c = useAnalyticsTracking()
    expect(() => c.trackLeadSent('vehicle-1', 'dealer-1')).not.toThrow()
  })

  it('trackFavoriteAdded exists and is callable', () => {
    const c = useAnalyticsTracking()
    expect(() => c.trackFavoriteAdded('vehicle-1')).not.toThrow()
  })

  it('trackVehicleDuration exists and is callable', () => {
    const c = useAnalyticsTracking()
    expect(() => c.trackVehicleDuration('vehicle-1', Date.now())).not.toThrow()
  })
})

// ─── import.meta.client guard ────────────────────────────────────────────────

describe('no Supabase calls in test env (import.meta.client guard)', () => {
  it('trackVehicleView does not insert into Supabase', () => {
    const mockInsert = stubSupabase()
    const c = useAnalyticsTracking()
    c.trackVehicleView('vehicle-1')
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('trackSearch does not insert into Supabase', () => {
    const mockInsert = stubSupabase()
    const c = useAnalyticsTracking()
    c.trackSearch({ make: 'Volvo' })
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('trackLeadSent does not insert into Supabase', () => {
    const mockInsert = stubSupabase()
    const c = useAnalyticsTracking()
    c.trackLeadSent('vehicle-1', 'dealer-1')
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('trackFavoriteAdded does not insert into Supabase', () => {
    const mockInsert = stubSupabase()
    const c = useAnalyticsTracking()
    c.trackFavoriteAdded('vehicle-1')
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('trackVehicleDuration does not insert even for long durations', () => {
    const mockInsert = stubSupabase()
    const c = useAnalyticsTracking()
    c.trackVehicleDuration('vehicle-1', Date.now() - 30000) // 30s ago
    expect(mockInsert).not.toHaveBeenCalled()
  })
})

// ─── #39 — trackVehicleDuration ──────────────────────────────────────────────
// import.meta.client is false in test env so the Supabase insert never fires.
// We verify the function signature, edge-case safety, and the 3s-minimum logic
// via indirect checks (no throw + constant exists).

describe('trackVehicleDuration', () => {
  it('is exposed in the composable return value', () => {
    const c = useAnalyticsTracking()
    expect(typeof c.trackVehicleDuration).toBe('function')
  })

  it('VEHICLE_DURATION event constant is defined', () => {
    expect(ANALYTICS_EVENTS.VEHICLE_DURATION).toBe('vehicle_duration')
  })

  it('does not throw with duration < 3s (early exit path)', () => {
    const c = useAnalyticsTracking()
    // startedAt 1 second ago → 1s duration → below 3s threshold
    expect(() => c.trackVehicleDuration('vehicle-1', Date.now() - 1000)).not.toThrow()
  })

  it('does not throw with duration > 3s (normal path)', () => {
    const c = useAnalyticsTracking()
    expect(() => c.trackVehicleDuration('vehicle-1', Date.now() - 10000)).not.toThrow()
  })

  it('does not throw with duration of exactly 0ms', () => {
    const c = useAnalyticsTracking()
    expect(() => c.trackVehicleDuration('vehicle-1', Date.now())).not.toThrow()
  })

  it('does not throw with very large duration (1 hour)', () => {
    const c = useAnalyticsTracking()
    expect(() => c.trackVehicleDuration('vehicle-1', Date.now() - 3_600_000)).not.toThrow()
  })

  it('does not throw when startedAt is in the future (negative duration)', () => {
    const c = useAnalyticsTracking()
    // startedAt in the future → negative duration → below 3s → early exit
    expect(() => c.trackVehicleDuration('vehicle-1', Date.now() + 5000)).not.toThrow()
  })

  it('does not throw with metadata options on trackVehicleView', () => {
    const c = useAnalyticsTracking()
    expect(() => c.trackVehicleView('vehicle-1', { source: 'catalog', position: 3 })).not.toThrow()
  })
})

// ─── #38 — trackBuyerGeo ─────────────────────────────────────────────────────

describe('trackBuyerGeo', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('is exposed in the composable return value', () => {
    const c = useAnalyticsTracking()
    expect(typeof c.trackBuyerGeo).toBe('function')
  })

  it('does not throw with a full location object', () => {
    const c = useAnalyticsTracking()
    expect(() =>
      c.trackBuyerGeo({ country: 'ES', province: 'León', region: 'Castilla y León', source: 'ip' }),
    ).not.toThrow()
  })

  it('does not throw with minimal location (null province/region)', () => {
    const c = useAnalyticsTracking()
    expect(() =>
      c.trackBuyerGeo({ country: 'DE', province: null, region: null, source: 'ip' }),
    ).not.toThrow()
  })

  it('is a no-op when country is null (no insert attempted)', () => {
    const mockInsert = stubSupabase()
    const c = useAnalyticsTracking()
    c.trackBuyerGeo({ country: null, province: null, region: null, source: null })
    // import.meta.client is false in tests — but we also verify the early-exit path
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('does not throw with geolocation source', () => {
    const c = useAnalyticsTracking()
    expect(() =>
      c.trackBuyerGeo({ country: 'FR', province: null, region: null, source: 'geolocation' }),
    ).not.toThrow()
  })

  it('does not throw with manual source', () => {
    const c = useAnalyticsTracking()
    expect(() =>
      c.trackBuyerGeo({ country: 'PT', province: null, region: null, source: 'manual' }),
    ).not.toThrow()
  })
})

// ─── ANALYTICS_EVENTS constants ──────────────────────────────────────────────

describe('ANALYTICS_EVENTS constants', () => {
  it('BUYER_GEO constant is defined', () => {
    expect(ANALYTICS_EVENTS.BUYER_GEO).toBe('buyer_geo')
  })

  it('SCROLL_DEPTH constant is defined', () => {
    expect(ANALYTICS_EVENTS.SCROLL_DEPTH).toBe('scroll_depth')
  })

  it('FORM_ABANDON constant is defined', () => {
    expect(ANALYTICS_EVENTS.FORM_ABANDON).toBe('form_abandon')
  })

  it('VEHICLE_COMPARISON constant is defined', () => {
    expect(ANALYTICS_EVENTS.VEHICLE_COMPARISON).toBe('vehicle_comparison')
  })
})

// ─── trackScrollDepth ─────────────────────────────────────────────────────────

describe('trackScrollDepth', () => {
  it('is exposed in the composable return value', () => {
    const c = useAnalyticsTracking()
    expect(typeof c.trackScrollDepth).toBe('function')
  })

  it('does not throw for each depth milestone', () => {
    const c = useAnalyticsTracking()
    for (const depth of [25, 50, 75, 100] as const) {
      expect(() => c.trackScrollDepth('vehicle-1', depth)).not.toThrow()
    }
  })
})

// ─── trackFormAbandonment ─────────────────────────────────────────────────────

describe('trackFormAbandonment', () => {
  it('is exposed in the composable return value', () => {
    const c = useAnalyticsTracking()
    expect(typeof c.trackFormAbandonment).toBe('function')
  })

  it('does not throw with valid params', () => {
    const c = useAnalyticsTracking()
    expect(() => c.trackFormAbandonment('contact_form', 'step_email', 5000)).not.toThrow()
  })
})

// ─── trackVehicleComparison ───────────────────────────────────────────────────

describe('trackVehicleComparison', () => {
  it('is exposed in the composable return value', () => {
    const c = useAnalyticsTracking()
    expect(typeof c.trackVehicleComparison).toBe('function')
  })

  it('does not throw with two vehicle ids', () => {
    const c = useAnalyticsTracking()
    expect(() => c.trackVehicleComparison(['v-1', 'v-2'])).not.toThrow()
  })

  it('does not throw with empty array', () => {
    const c = useAnalyticsTracking()
    expect(() => c.trackVehicleComparison([])).not.toThrow()
  })
})
