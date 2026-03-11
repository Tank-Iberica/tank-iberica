import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAnalyticsTracking } from '../../app/composables/useAnalyticsTracking'

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

// ─── trackVehicleDuration — 3s minimum filter ────────────────────────────────
// Even though trackEvent is a no-op in test env, trackVehicleDuration has its
// own early exit for durations < 3s, which can be verified indirectly.

describe('trackVehicleDuration', () => {
  it('does not throw with very short duration (< 3s)', () => {
    const c = useAnalyticsTracking()
    expect(() => c.trackVehicleDuration('vehicle-1', Date.now() - 1000)).not.toThrow()
  })

  it('does not throw with long duration (> 3s)', () => {
    const c = useAnalyticsTracking()
    expect(() => c.trackVehicleDuration('vehicle-1', Date.now() - 10000)).not.toThrow()
  })

  it('does not throw with duration of exactly 0ms', () => {
    const c = useAnalyticsTracking()
    expect(() => c.trackVehicleDuration('vehicle-1', Date.now())).not.toThrow()
  })

  it('does not throw with metadata options', () => {
    const c = useAnalyticsTracking()
    expect(() =>
      c.trackVehicleView('vehicle-1', { source: 'catalog', position: 3 }),
    ).not.toThrow()
  })
})
