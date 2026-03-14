import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('~~/server/utils/cronLock', () => ({ acquireDbCronLock: vi.fn().mockResolvedValue(true) }))
vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  createError: (opts: { statusCode: number; statusMessage: string }) => {
    const err = new Error(opts.statusMessage) as Error & { statusCode: number }
    err.statusCode = opts.statusCode
    return err
  },
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: () => mockSupabase,
}))

vi.mock('../../../server/utils/verifyCronSecret', () => ({
  verifyCronSecret: vi.fn(),
}))

vi.mock('../../../server/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('../../../server/utils/safeError', () => ({
  safeError: (_code: number, msg: string) => {
    const err = new Error(msg) as Error & { statusCode: number }
    err.statusCode = _code
    return err
  },
}))

vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({}))

// ─── Supabase mock ──────────────────────────────────────────────────────────

let mockSupabase: Record<string, unknown>

function makeChain(data: unknown = [], extra: Record<string, unknown> = {}) {
  const chain: Record<string, unknown> = {}
  const ms = ['select', 'eq', 'gte', 'lte', 'in', 'order', 'limit', 'single']
  for (const m of ms) chain[m] = (..._a: unknown[]) => chain
  chain.then = (r: (v: unknown) => void) => Promise.resolve({ data, error: null, ...extra }).then(r)
  chain.catch = (r: (v: unknown) => void) => Promise.resolve({ data, error: null }).catch(r)
  return chain
}

function stubSupabase(
  opts: {
    alerts?: unknown[]
    deadCount?: number
    vehicleCount?: number
    publishedCount?: number
    newVehicleCount?: number
    dealerCount?: number
    activeDealerCount?: number
    leadsCount?: number
    payments?: unknown[]
    searchCount?: number
    viewCount?: number
    contactCount?: number
    latency?: unknown[]
  } = {},
) {
  let vehicleCall = 0
  let dealerCall = 0
  let analyticsCall = 0
  mockSupabase = {
    from: (table: string) => {
      if (table === 'infra_alerts') return makeChain(opts.alerts || [])
      if (table === 'job_queue') return makeChain([], { count: opts.deadCount ?? 0 })
      if (table === 'vehicles') {
        vehicleCall++
        if (vehicleCall === 1) return makeChain([], { count: opts.vehicleCount ?? 0 })
        if (vehicleCall === 2) return makeChain([], { count: opts.publishedCount ?? 0 })
        return makeChain([], { count: opts.newVehicleCount ?? 0 })
      }
      if (table === 'dealers') {
        dealerCall++
        if (dealerCall === 1) return makeChain([], { count: opts.dealerCount ?? 0 })
        return makeChain([], { count: opts.activeDealerCount ?? 0 })
      }
      if (table === 'leads') return makeChain([], { count: opts.leadsCount ?? 0 })
      if (table === 'payments') return makeChain(opts.payments ?? [])
      if (table === 'analytics_events') {
        analyticsCall++
        if (analyticsCall === 1) return makeChain([], { count: opts.searchCount ?? 0 })
        if (analyticsCall === 2) return makeChain([], { count: opts.viewCount ?? 0 })
        return makeChain([], { count: opts.contactCount ?? 0 })
      }
      if (table === 'infra_metrics') return makeChain(opts.latency ?? [])
      return makeChain([])
    },
  }
}

import handler from '../../../server/api/cron/weekly-report.post'

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('weekly-report cron', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubSupabase()
  })

  it('returns success with metrics on empty data', async () => {
    const result = await (handler as Function)({})
    expect(result.success).toBe(true)
    expect(result.metrics.errorsThisWeek).toBe(0)
    expect(result.metrics.totalVehicles).toBe(0)
    expect(result.report).toContain('Weekly Technical Report')
  })

  it('collects all metrics from supabase', async () => {
    stubSupabase({
      alerts: [{ level: 'error' }, { level: 'error' }, { level: 'warning' }],
      deadCount: 2,
      vehicleCount: 100,
      publishedCount: 80,
      dealerCount: 15,
      searchCount: 500,
      viewCount: 200,
      contactCount: 50,
      latency: [{ metric_value: 142 }],
    })
    const result = await (handler as Function)({})
    expect(result.metrics.errorsThisWeek).toBe(3)
    expect(result.metrics.errorsByLevel.error).toBe(2)
    expect(result.metrics.errorsByLevel.warning).toBe(1)
    expect(result.metrics.deadLetterJobs).toBe(2)
    expect(result.metrics.totalVehicles).toBe(100)
    expect(result.metrics.publishedVehicles).toBe(80)
    expect(result.metrics.totalDealers).toBe(15)
    expect(result.metrics.funnelSearches).toBe(500)
    expect(result.metrics.funnelViews).toBe(200)
    expect(result.metrics.funnelContacts).toBe(50)
    expect(result.metrics.latencyP95).toBe(142)
  })

  it('text report includes conversion rate', async () => {
    stubSupabase({ searchCount: 100, contactCount: 10 })
    const result = await (handler as Function)({})
    expect(result.report).toContain('10.0%')
  })

  it('text report shows N/A when no searches', async () => {
    stubSupabase({ searchCount: 0, contactCount: 0 })
    const result = await (handler as Function)({})
    expect(result.report).toContain('N/A%')
  })

  it('text report warns about dead letter jobs', async () => {
    stubSupabase({ deadCount: 3 })
    const result = await (handler as Function)({})
    expect(result.report).toContain('ACTION REQUIRED')
  })

  it('text report warns about high alert count', async () => {
    stubSupabase({ alerts: Array.from({ length: 6 }, () => ({ level: 'error' })) })
    const result = await (handler as Function)({})
    expect(result.report).toContain('HIGH ALERT COUNT')
  })

  it('text report shows No data when no latency', async () => {
    stubSupabase({ latency: [] })
    const result = await (handler as Function)({})
    expect(result.report).toContain('No data')
  })

  it('sends email via $fetch', async () => {
    const result = await (handler as Function)({})
    expect(result.success).toBe(true)
    expect(vi.mocked(globalThis.$fetch)).toHaveBeenCalledWith(
      '/api/email/send',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('continues when email send fails', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(new Error('SMTP down')))
    const result = await (handler as Function)({})
    expect(result.success).toBe(true)
  })

  it('collects new business KPIs', async () => {
    stubSupabase({
      vehicleCount: 50,
      publishedCount: 40,
      newVehicleCount: 5,
      dealerCount: 10,
      activeDealerCount: 8,
      leadsCount: 25,
      payments: [{ amount_cents: 1500 }, { amount_cents: 2500 }],
    })
    const result = await (handler as Function)({})
    expect(result.metrics.newVehiclesThisWeek).toBe(5)
    expect(result.metrics.activeDealers).toBe(8)
    expect(result.metrics.leadsThisWeek).toBe(25)
    expect(result.metrics.revenueThisWeekCents).toBe(4000)
  })

  it('text report includes BUSINESS section with revenue', async () => {
    stubSupabase({
      leadsCount: 12,
      payments: [{ amount_cents: 9900 }],
    })
    const result = await (handler as Function)({})
    expect(result.report).toContain('BUSINESS')
    expect(result.report).toContain('Leads: 12')
    expect(result.report).toMatch(/Revenue.*99\.00/)
  })

  it('handles zero revenue gracefully', async () => {
    stubSupabase({ payments: [] })
    const result = await (handler as Function)({})
    expect(result.metrics.revenueThisWeekCents).toBe(0)
    expect(result.report).toContain('0.00')
  })

  it('text report shows new vehicles and active dealers', async () => {
    stubSupabase({
      vehicleCount: 200,
      publishedCount: 150,
      newVehicleCount: 12,
      dealerCount: 30,
      activeDealerCount: 22,
    })
    const result = await (handler as Function)({})
    expect(result.report).toContain('New vehicles this week: 12')
    expect(result.report).toContain('200 (150 published)')
    expect(result.report).toContain('30 (22 active)')
  })

  it('throws when collectMetrics fails', async () => {
    mockSupabase = {
      from: () => {
        throw new Error('DB down')
      },
    }
    await expect((handler as Function)({})).rejects.toThrow()
  })
})
