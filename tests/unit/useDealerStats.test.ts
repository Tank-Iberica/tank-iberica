import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDealerStats } from '../../app/composables/useDealerStats'

// ─── Stub helper ──────────────────────────────────────────────────────────────

function stubSupabaseStats(
  rows: Record<string, unknown>[] = [],
  queryError: unknown = null,
) {
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          gte: () => ({
            order: () => Promise.resolve({ data: rows, error: queryError }),
          }),
        }),
      }),
    }),
  }))
}

beforeEach(() => {
  vi.clearAllMocks()
  stubSupabaseStats() // default: empty data
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('dailyStats starts as empty array', () => {
    const c = useDealerStats()
    expect(c.dailyStats.value).toHaveLength(0)
  })

  it('monthlyStats starts as empty array', () => {
    const c = useDealerStats()
    expect(c.monthlyStats.value).toHaveLength(0)
  })

  it('loading starts as false', () => {
    const c = useDealerStats()
    expect(c.loading.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useDealerStats()
    expect(c.error.value).toBeNull()
  })

  it('totalViews starts as 0', () => {
    const c = useDealerStats()
    expect(c.totalViews.value).toBe(0)
  })

  it('totalLeads starts as 0', () => {
    const c = useDealerStats()
    expect(c.totalLeads.value).toBe(0)
  })

  it('avgConversionRate starts as null', () => {
    const c = useDealerStats()
    expect(c.avgConversionRate.value).toBeNull()
  })

  it('bestPerformingVehicle is always null', () => {
    const c = useDealerStats()
    expect(c.bestPerformingVehicle.value).toBeNull()
  })
})

// ─── canAccessMetric ──────────────────────────────────────────────────────────

describe('canAccessMetric', () => {
  it('free plan can access total_views', () => {
    const c = useDealerStats()
    expect(c.canAccessMetric('free', 'total_views')).toBe(true)
  })

  it('free plan can access total_leads', () => {
    const c = useDealerStats()
    expect(c.canAccessMetric('free', 'total_leads')).toBe(true)
  })

  it('free plan cannot access per_vehicle_views', () => {
    const c = useDealerStats()
    expect(c.canAccessMetric('free', 'per_vehicle_views')).toBe(false)
  })

  it('free plan cannot access monthly_chart', () => {
    const c = useDealerStats()
    expect(c.canAccessMetric('free', 'monthly_chart')).toBe(false)
  })

  it('free plan cannot access conversion_rate', () => {
    const c = useDealerStats()
    expect(c.canAccessMetric('free', 'conversion_rate')).toBe(false)
  })

  it('basic plan can access monthly_chart', () => {
    const c = useDealerStats()
    expect(c.canAccessMetric('basic', 'monthly_chart')).toBe(true)
  })

  it('basic plan cannot access conversion_rate', () => {
    const c = useDealerStats()
    expect(c.canAccessMetric('basic', 'conversion_rate')).toBe(false)
  })

  it('premium plan can access all metrics', () => {
    const c = useDealerStats()
    const metrics = [
      'total_views',
      'total_leads',
      'per_vehicle_views',
      'per_vehicle_leads',
      'monthly_chart',
      'conversion_rate',
      'sector_comparison',
      'demand_matching',
    ]
    expect(metrics.every((m) => c.canAccessMetric('premium', m))).toBe(true)
  })

  it('founding plan can access all metrics', () => {
    const c = useDealerStats()
    expect(c.canAccessMetric('founding', 'demand_matching')).toBe(true)
  })

  it('returns false for unknown metric', () => {
    const c = useDealerStats()
    expect(c.canAccessMetric('premium', 'nonexistent_metric')).toBe(false)
  })
})

// ─── loadDailyStats ───────────────────────────────────────────────────────────

describe('loadDailyStats', () => {
  it('sets error when dealerId is empty', async () => {
    const c = useDealerStats()
    await c.loadDailyStats('')
    expect(c.error.value).toBeTruthy()
  })

  it('does not set loading when dealerId is empty (early return)', async () => {
    const c = useDealerStats()
    await c.loadDailyStats('')
    expect(c.loading.value).toBe(false)
  })

  it('sets dailyStats to returned rows', async () => {
    const rows = [
      {
        dealer_id: 'd1',
        period_date: '2026-03-01',
        vehicle_views: 10,
        profile_views: 5,
        leads_received: 2,
        leads_responded: 1,
        favorites_added: 3,
        avg_response_minutes: null,
        conversion_rate: null,
      },
    ]
    stubSupabaseStats(rows)
    const c = useDealerStats()
    await c.loadDailyStats('dealer-1')
    expect(c.dailyStats.value).toHaveLength(1)
    expect((c.dailyStats.value[0] as Record<string, unknown>).vehicle_views).toBe(10)
  })

  it('sets loading to false after success', async () => {
    const c = useDealerStats()
    await c.loadDailyStats('dealer-1')
    expect(c.loading.value).toBe(false)
  })

  it('sets dailyStats to empty on success with no rows', async () => {
    const c = useDealerStats()
    await c.loadDailyStats('dealer-1')
    expect(c.dailyStats.value).toHaveLength(0)
  })

  it('sets error on supabase error', async () => {
    stubSupabaseStats([], { message: 'DB error' })
    const c = useDealerStats()
    await c.loadDailyStats('dealer-1')
    expect(c.error.value).toBeTruthy()
  })

  it('sets dailyStats to empty on supabase error', async () => {
    stubSupabaseStats([], { message: 'DB error' })
    const c = useDealerStats()
    await c.loadDailyStats('dealer-1')
    expect(c.dailyStats.value).toHaveLength(0)
  })

  it('sets loading to false after error', async () => {
    stubSupabaseStats([], { message: 'DB error' })
    const c = useDealerStats()
    await c.loadDailyStats('dealer-1')
    expect(c.loading.value).toBe(false)
  })

  it('clears error before fetching on retry', async () => {
    // Use a mock that returns error first, then success
    const mockOrder = vi.fn()
      .mockResolvedValueOnce({ data: [], error: { message: 'first error' } })
      .mockResolvedValueOnce({ data: [], error: null })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({ eq: () => ({ gte: () => ({ order: mockOrder }) }) }),
      }),
    }))
    const c = useDealerStats()
    await c.loadDailyStats('dealer-1') // fails
    expect(c.error.value).toBeTruthy()
    await c.loadDailyStats('dealer-1') // succeeds → error cleared
    expect(c.error.value).toBeNull()
  })
})

// ─── loadMonthlyStats ─────────────────────────────────────────────────────────

describe('loadMonthlyStats', () => {
  it('sets error when dealerId is empty', async () => {
    const c = useDealerStats()
    await c.loadMonthlyStats('')
    expect(c.error.value).toBeTruthy()
  })

  it('sets monthlyStats to empty when no rows', async () => {
    const c = useDealerStats()
    await c.loadMonthlyStats('dealer-1')
    expect(c.monthlyStats.value).toHaveLength(0)
  })

  it('aggregates rows from same month', async () => {
    const rows = [
      {
        period_date: '2026-01-10',
        vehicle_views: 10,
        profile_views: 5,
        leads_received: 2,
        leads_responded: 1,
        favorites_added: 1,
        avg_response_minutes: null,
        conversion_rate: null,
      },
      {
        period_date: '2026-01-20',
        vehicle_views: 8,
        profile_views: 3,
        leads_received: 1,
        leads_responded: 1,
        favorites_added: 2,
        avg_response_minutes: null,
        conversion_rate: null,
      },
    ]
    stubSupabaseStats(rows)
    const c = useDealerStats()
    await c.loadMonthlyStats('dealer-1')
    expect(c.monthlyStats.value).toHaveLength(1)
    expect(c.monthlyStats.value[0]!.vehicle_views).toBe(18)
    expect(c.monthlyStats.value[0]!.leads_received).toBe(3)
  })

  it('creates separate entries for different months', async () => {
    const rows = [
      {
        period_date: '2026-01-10',
        vehicle_views: 10,
        profile_views: 0,
        leads_received: 1,
        leads_responded: 0,
        favorites_added: 0,
        avg_response_minutes: null,
        conversion_rate: null,
      },
      {
        period_date: '2026-02-10',
        vehicle_views: 5,
        profile_views: 0,
        leads_received: 2,
        leads_responded: 1,
        favorites_added: 0,
        avg_response_minutes: null,
        conversion_rate: null,
      },
    ]
    stubSupabaseStats(rows)
    const c = useDealerStats()
    await c.loadMonthlyStats('dealer-1')
    expect(c.monthlyStats.value).toHaveLength(2)
  })

  it('sorts monthly results by month', async () => {
    const rows = [
      {
        period_date: '2026-03-01',
        vehicle_views: 1,
        profile_views: 0,
        leads_received: 0,
        leads_responded: 0,
        favorites_added: 0,
        avg_response_minutes: null,
        conversion_rate: null,
      },
      {
        period_date: '2026-01-01',
        vehicle_views: 1,
        profile_views: 0,
        leads_received: 0,
        leads_responded: 0,
        favorites_added: 0,
        avg_response_minutes: null,
        conversion_rate: null,
      },
    ]
    stubSupabaseStats(rows)
    const c = useDealerStats()
    await c.loadMonthlyStats('dealer-1')
    expect(c.monthlyStats.value[0]!.month).toBe('2026-01')
    expect(c.monthlyStats.value[1]!.month).toBe('2026-03')
  })

  it('calculates conversion_rate for month with leads', async () => {
    const rows = [
      {
        period_date: '2026-01-01',
        vehicle_views: 0,
        profile_views: 0,
        leads_received: 4,
        leads_responded: 2,
        favorites_added: 0,
        avg_response_minutes: null,
        conversion_rate: null,
      },
    ]
    stubSupabaseStats(rows)
    const c = useDealerStats()
    await c.loadMonthlyStats('dealer-1')
    expect(c.monthlyStats.value[0]!.conversion_rate).toBe(50)
  })

  it('leaves conversion_rate as null when no leads received', async () => {
    const rows = [
      {
        period_date: '2026-01-01',
        vehicle_views: 10,
        profile_views: 0,
        leads_received: 0,
        leads_responded: 0,
        favorites_added: 0,
        avg_response_minutes: null,
        conversion_rate: null,
      },
    ]
    stubSupabaseStats(rows)
    const c = useDealerStats()
    await c.loadMonthlyStats('dealer-1')
    expect(c.monthlyStats.value[0]!.conversion_rate).toBeNull()
  })

  it('sets error on supabase error', async () => {
    stubSupabaseStats([], { message: 'DB error' })
    const c = useDealerStats()
    await c.loadMonthlyStats('dealer-1')
    expect(c.error.value).toBeTruthy()
  })

  it('sets loading to false after error', async () => {
    stubSupabaseStats([], { message: 'DB error' })
    const c = useDealerStats()
    await c.loadMonthlyStats('dealer-1')
    expect(c.loading.value).toBe(false)
  })
})
