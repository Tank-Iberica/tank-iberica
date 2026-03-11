import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminAdDashboard } from '../../app/composables/admin/useAdminAdDashboard'

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('dateRange starts as "30d"', () => {
    const c = useAdminAdDashboard()
    expect(c.dateRange.value).toBe('30d')
  })

  it('loading starts as false', () => {
    const c = useAdminAdDashboard()
    expect(c.loading.value).toBe(false)
  })

  it('error starts as empty string', () => {
    const c = useAdminAdDashboard()
    expect(c.error.value).toBe('')
  })

  it('customFrom starts as empty string', () => {
    const c = useAdminAdDashboard()
    expect(c.customFrom.value).toBe('')
  })

  it('customTo starts as empty string', () => {
    const c = useAdminAdDashboard()
    expect(c.customTo.value).toBe('')
  })

  it('summary.totalImpressions starts as 0', () => {
    const c = useAdminAdDashboard()
    expect(c.summary.value.totalImpressions).toBe(0)
  })

  it('summary.totalClicks starts as 0', () => {
    const c = useAdminAdDashboard()
    expect(c.summary.value.totalClicks).toBe(0)
  })

  it('summary.avgCTR starts as "0.0%"', () => {
    const c = useAdminAdDashboard()
    expect(c.summary.value.avgCTR).toBe('0.0%')
  })

  it('summary.activeAds starts as 0', () => {
    const c = useAdminAdDashboard()
    expect(c.summary.value.activeAds).toBe(0)
  })

  it('revenueBySource starts as empty array', () => {
    const c = useAdminAdDashboard()
    expect(c.revenueBySource.value).toEqual([])
  })

  it('performanceByPosition starts as empty array', () => {
    const c = useAdminAdDashboard()
    expect(c.performanceByPosition.value).toEqual([])
  })

  it('ctrByFormat starts as empty array', () => {
    const c = useAdminAdDashboard()
    expect(c.ctrByFormat.value).toEqual([])
  })

  it('topAds starts as empty array', () => {
    const c = useAdminAdDashboard()
    expect(c.topAds.value).toEqual([])
  })

  it('audienceBreakdown starts as empty array', () => {
    const c = useAdminAdDashboard()
    expect(c.audienceBreakdown.value).toEqual([])
  })
})

// ─── calcCTR (returned by composable) ─────────────────────────────────────

describe('calcCTR', () => {
  it('returns "0.0%" when impressions is 0', () => {
    const c = useAdminAdDashboard()
    expect(c.calcCTR(0, 5)).toBe('0.0%')
  })

  it('calculates CTR with 1 decimal', () => {
    const c = useAdminAdDashboard()
    expect(c.calcCTR(1000, 50)).toBe('5.0%')
  })

  it('returns "2.5%" for 25/1000', () => {
    const c = useAdminAdDashboard()
    expect(c.calcCTR(1000, 25)).toBe('2.5%')
  })

  it('returns "0.0%" when clicks is 0', () => {
    const c = useAdminAdDashboard()
    expect(c.calcCTR(500, 0)).toBe('0.0%')
  })

  it('returns "100.0%" for equal impressions and clicks', () => {
    const c = useAdminAdDashboard()
    expect(c.calcCTR(10, 10)).toBe('100.0%')
  })
})

// ─── fetchDashboard ────────────────────────────────────────────────────────

describe('fetchDashboard', () => {
  it('sets loading to false after completion', async () => {
    const c = useAdminAdDashboard()
    await c.fetchDashboard()
    expect(c.loading.value).toBe(false)
  })

  it('does not set error on empty data', async () => {
    const c = useAdminAdDashboard()
    await c.fetchDashboard()
    expect(c.error.value).toBe('')
  })

  it('keeps summary.totalImpressions at 0 when no events', async () => {
    const c = useAdminAdDashboard()
    await c.fetchDashboard()
    expect(c.summary.value.totalImpressions).toBe(0)
  })

  it('sets error when supabase throws', async () => {
    vi.stubGlobal('useSupabaseClient', () => {
      return {
        from: () => {
          throw new Error('Network failure')
        },
      }
    })
    const c = useAdminAdDashboard()
    await c.fetchDashboard()
    expect(c.error.value).toBe('Network failure')
    expect(c.loading.value).toBe(false)
  })
})

// ─── fetchDashboard with data ────────────────────────────────────────────────

describe('fetchDashboard with data', () => {
  function makeTableChain(data: unknown, extra: Record<string, unknown> = {}) {
    const chain: Record<string, unknown> = {}
    const ms = ['select', 'eq', 'gte', 'lte', 'in', 'order', 'single']
    for (const m of ms) chain[m] = () => chain
    chain.then = (r: (v: unknown) => void) => Promise.resolve({ data, error: null, ...extra }).then(r)
    chain.catch = (r: (v: unknown) => void) => Promise.resolve({ data, error: null }).catch(r)
    return chain
  }

  function stubDashboard(opts: {
    events?: unknown[]
    revenue?: unknown[]
    activeCount?: number
    audience?: unknown[]
    adInfo?: unknown[]
  }) {
    let adsCallCount = 0
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        if (table === 'ad_events') return makeTableChain(opts.events || [])
        if (table === 'ad_revenue_log') return makeTableChain(opts.revenue || [])
        if (table === 'ads') {
          adsCallCount++
          if (adsCallCount === 1) return makeTableChain([], { count: opts.activeCount || 0 })
          return makeTableChain(opts.adInfo || [])
        }
        if (table === 'user_ad_profiles') return makeTableChain(opts.audience || [])
        return makeTableChain([])
      },
    }))
  }

  it('computes summary from events and revenue', async () => {
    stubDashboard({
      events: [
        { ad_id: 'a1', event_type: 'impression', source: 'google', metadata: { position: 'header' } },
        { ad_id: 'a1', event_type: 'impression', source: 'google', metadata: { position: 'header' } },
        { ad_id: 'a1', event_type: 'click', source: 'google', metadata: { position: 'header' } },
        { ad_id: 'a1', event_type: 'viewable_impression', source: null, metadata: { position: 'header' } },
      ],
      revenue: [{ position: 'header', source: 'google', bidder: null, cpm_cents: 200 }],
      activeCount: 3,
    })
    const c = useAdminAdDashboard()
    await c.fetchDashboard()
    expect(c.summary.value.totalImpressions).toBe(2)
    expect(c.summary.value.totalClicks).toBe(1)
    expect(c.summary.value.avgCTR).toBe('50.0%')
    expect(c.summary.value.activeAds).toBe(3)
    expect(c.summary.value.estimatedRevenue).toBe(200)
    expect(c.summary.value.viewabilityRate).toBe('50.0%')
  })

  it('builds audience breakdown sorted by count', async () => {
    stubDashboard({
      audience: [
        { segments: ['auto', 'transport'] },
        { segments: ['auto', 'logistics'] },
        { segments: ['construction'] },
      ],
    })
    const c = useAdminAdDashboard()
    await c.fetchDashboard()
    expect(c.audienceBreakdown.value.length).toBe(4)
    expect(c.audienceBreakdown.value[0]).toEqual({ segment: 'auto', userCount: 2 })
  })

  it('handles null segments in audience', async () => {
    stubDashboard({ audience: [{ segments: null }] })
    const c = useAdminAdDashboard()
    await c.fetchDashboard()
    expect(c.audienceBreakdown.value).toHaveLength(0)
  })

  it('builds revenue by source with null source as direct', async () => {
    stubDashboard({
      events: [
        { ad_id: 'a1', event_type: 'impression', source: 'google', metadata: {} },
        { ad_id: 'a1', event_type: 'impression', source: null, metadata: {} },
      ],
      revenue: [{ position: 'h', source: 'google', bidder: null, cpm_cents: 300 }],
    })
    const c = useAdminAdDashboard()
    await c.fetchDashboard()
    const google = c.revenueBySource.value.find(s => s.source === 'google')
    expect(google!.impressions).toBe(1)
    expect(google!.revenue).toBe(300)
    const direct = c.revenueBySource.value.find(s => s.source === 'direct')
    expect(direct!.impressions).toBe(1)
    expect(direct!.revenue).toBe(0)
  })

  it('builds performance by position with null metadata', async () => {
    stubDashboard({
      events: [
        { ad_id: 'a1', event_type: 'impression', source: 'g', metadata: { position: 'header' } },
        { ad_id: 'a1', event_type: 'click', source: 'g', metadata: { position: 'header' } },
        { ad_id: 'a1', event_type: 'viewable_impression', source: 'g', metadata: { position: 'header' } },
        { ad_id: 'a2', event_type: 'impression', source: null, metadata: null },
      ],
      revenue: [{ position: 'header', source: 'g', bidder: null, cpm_cents: 500 }],
    })
    const c = useAdminAdDashboard()
    await c.fetchDashboard()
    const header = c.performanceByPosition.value.find(p => p.position === 'header')
    expect(header!.impressions).toBe(1)
    expect(header!.clicks).toBe(1)
    expect(header!.viewableImpressions).toBe(1)
    expect(header!.ctr).toBe('100.0%')
    expect(header!.revenue).toBe(500)
    const unknown = c.performanceByPosition.value.find(p => p.position === 'unknown')
    expect(unknown!.impressions).toBe(1)
  })

  it('builds top ads and CTR by format', async () => {
    const events = [
      { ad_id: 'a1', event_type: 'impression', source: 'g', metadata: {} },
      { ad_id: 'a1', event_type: 'click', source: 'g', metadata: {} },
      { ad_id: 'a2', event_type: 'impression', source: null, metadata: {} },
    ]
    let adsCall = 0
    vi.stubGlobal('useSupabaseClient', () => ({
      from: (table: string) => {
        const chain: Record<string, unknown> = {}
        const ms = ['select', 'eq', 'gte', 'lte', 'in', 'order', 'single']
        for (const m of ms) chain[m] = () => chain
        chain.catch = (r: (v: unknown) => void) => Promise.resolve({ data: [], error: null }).catch(r)
        if (table === 'ad_events') {
          chain.then = (r: (v: unknown) => void) => Promise.resolve({ data: events, error: null }).then(r)
        } else if (table === 'ad_revenue_log') {
          chain.then = (r: (v: unknown) => void) => Promise.resolve({ data: [], error: null }).then(r)
        } else if (table === 'ads') {
          adsCall++
          if (adsCall === 1) {
            chain.then = (r: (v: unknown) => void) => Promise.resolve({ data: [], count: 0, error: null }).then(r)
          } else {
            chain.then = (r: (v: unknown) => void) => Promise.resolve({
              data: [{ id: 'a1', title: 'Banner', format: 'leaderboard', advertiser: { company_name: 'ACME' } }],
              error: null,
            }).then(r)
          }
        } else {
          chain.then = (r: (v: unknown) => void) => Promise.resolve({ data: [], error: null }).then(r)
        }
        return chain
      },
    }))
    const c = useAdminAdDashboard()
    await c.fetchDashboard()
    expect(c.topAds.value.length).toBeGreaterThanOrEqual(1)
    const ad1 = c.topAds.value.find(a => a.adId === 'a1')
    expect(ad1!.title).toBe('Banner')
    expect(ad1!.advertiser).toBe('ACME')
    // a2 has no info → fallback
    const ad2 = c.topAds.value.find(a => a.adId === 'a2')
    expect(ad2!.advertiser).toBe('-')
    // CTR by format: only a1 has known format
    expect(c.ctrByFormat.value.length).toBe(1)
    expect(c.ctrByFormat.value[0].format).toBe('leaderboard')
  })

  it('handles custom date range', async () => {
    stubDashboard({})
    const c = useAdminAdDashboard()
    c.dateRange.value = 'custom' as '7d' | '30d' | '90d' | 'custom'
    c.customFrom.value = '2026-01-01'
    c.customTo.value = '2026-02-01'
    await c.fetchDashboard()
    expect(c.error.value).toBe('')
  })

  it('handles 7d date range', async () => {
    stubDashboard({})
    const c = useAdminAdDashboard()
    c.dateRange.value = '7d'
    await c.fetchDashboard()
    expect(c.loading.value).toBe(false)
  })
})
