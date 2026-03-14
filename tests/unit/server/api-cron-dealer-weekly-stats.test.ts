import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('~~/server/utils/cronLock', () => ({ acquireDbCronLock: vi.fn().mockResolvedValue(true) }))
vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: vi.fn().mockResolvedValue({}),
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

vi.mock('../../../server/utils/batchProcessor', () => ({
  processBatch: async ({ items, processor }: { items: unknown[]; processor: (item: unknown) => Promise<void> }) => {
    let processed = 0
    let errors = 0
    for (const item of items) {
      try { await processor(item); processed++ } catch { errors++ }
    }
    return { processed, errors }
  },
}))

vi.stubGlobal('useRuntimeConfig', () => ({ cronSecret: 'test-secret' }))
vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({}))

let mockSupabase: Record<string, unknown>

function makeChain(data: unknown = [], extra: Record<string, unknown> = {}) {
  const chain: Record<string, unknown> = {}
  const ms = ['select', 'eq', 'gte', 'lte', 'in', 'order', 'limit', 'single', 'maybeSingle', 'ilike', 'update', 'insert']
  for (const m of ms) chain[m] = (..._a: unknown[]) => chain
  chain.then = (r: (v: unknown) => void) => Promise.resolve({ data, error: null, count: (extra.count ?? null), ...extra }).then(r)
  chain.catch = (r: (v: unknown) => void) => Promise.resolve({ data, error: null }).catch(r)
  return chain
}

import handler from '../../../server/api/cron/dealer-weekly-stats.post'

describe('dealer-weekly-stats cron', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({}))
  })

  it('returns zero when no active dealers', async () => {
    mockSupabase = { from: () => makeChain([]) }
    const result = await (handler as Function)({})
    expect(result.emailsSent).toBe(0)
    expect(result.dealersProcessed).toBe(0)
  })

  it('throws 500 on dealers fetch error', async () => {
    const errChain: Record<string, unknown> = {}
    const ms = ['select', 'eq', 'limit']
    for (const m of ms) errChain[m] = () => errChain
    errChain.then = (r: (v: unknown) => void) => Promise.resolve({ data: null, error: { message: 'DB' } }).then(r)
    errChain.catch = (r: (v: unknown) => void) => Promise.resolve({ data: null, error: { message: 'DB' } }).catch(r)
    mockSupabase = { from: () => errChain }
    await expect((handler as Function)({})).rejects.toThrow()
  })

  it('sends email for dealer with vehicles and linked user', async () => {
    const dealers = [{
      id: 'd1', user_id: 'u1', company_name: { es: 'Trucks SA', en: 'Trucks Ltd' },
      email: 'dealer@test.com', locale: 'es', status: 'active',
    }]
    const vehicleIds = [{ id: 'v1' }, { id: 'v2' }]
    const user = { id: 'u1', email: 'owner@test.com', lang: 'en' }

    mockSupabase = {
      from: (table: string) => {
        if (table === 'dealers') return makeChain(dealers)
        if (table === 'vehicles') return makeChain(vehicleIds)
        if (table === 'leads') return makeChain([], { count: 5 })
        if (table === 'favorites') return makeChain([], { count: 3 })
        if (table === 'ad_events') return makeChain([], { count: 100 })
        if (table === 'users') return makeChain(user)
        return makeChain([])
      },
    }

    const result = await (handler as Function)({})
    expect(result.dealersProcessed).toBe(1)
    expect(result.emailsSent).toBe(1)
    expect(vi.mocked(globalThis.$fetch)).toHaveBeenCalledWith(
      '/api/email/send',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('skips dealer with no vehicles', async () => {
    const dealers = [{
      id: 'd1', user_id: null, company_name: { es: 'Empty' },
      email: 'empty@test.com', locale: 'es', status: 'active',
    }]

    mockSupabase = {
      from: (table: string) => {
        if (table === 'dealers') return makeChain(dealers)
        if (table === 'vehicles') return makeChain([]) // no vehicles
        return makeChain([])
      },
    }

    const result = await (handler as Function)({})
    expect(result.dealersProcessed).toBe(1)
    expect(result.emailsSent).toBe(0)
  })

  it('skips dealer with no email and no linked user', async () => {
    const dealers = [{
      id: 'd1', user_id: null, company_name: { es: 'NoEmail' },
      email: null, locale: null, status: 'active',
    }]

    mockSupabase = {
      from: (table: string) => {
        if (table === 'dealers') return makeChain(dealers)
        if (table === 'vehicles') return makeChain([{ id: 'v1' }])
        if (table === 'leads') return makeChain([], { count: 0 })
        if (table === 'favorites') return makeChain([], { count: 0 })
        if (table === 'ad_events') return makeChain([], { count: 0 })
        return makeChain([])
      },
    }

    const result = await (handler as Function)({})
    expect(result.dealersProcessed).toBe(1)
    expect(result.emailsSent).toBe(0)
  })

  it('uses dealer email when no linked user', async () => {
    const dealers = [{
      id: 'd1', user_id: null, company_name: 'Simple Dealer',
      email: 'contact@dealer.com', locale: 'es', status: 'active',
    }]

    mockSupabase = {
      from: (table: string) => {
        if (table === 'dealers') return makeChain(dealers)
        if (table === 'vehicles') return makeChain([{ id: 'v1' }])
        if (table === 'leads') return makeChain([], { count: 2 })
        if (table === 'favorites') return makeChain([], { count: 0 })
        if (table === 'ad_events') return makeChain([], { count: 0 })
        return makeChain([])
      },
    }

    const result = await (handler as Function)({})
    expect(result.emailsSent).toBe(1)
  })

  it('falls back to vehicleIds.length when no view data', async () => {
    const dealers = [{
      id: 'd1', user_id: null, company_name: { es: 'Views' },
      email: 'v@test.com', locale: 'es', status: 'active',
    }]

    mockSupabase = {
      from: (table: string) => {
        if (table === 'dealers') return makeChain(dealers)
        if (table === 'vehicles') return makeChain([{ id: 'v1' }, { id: 'v2' }])
        if (table === 'leads') return makeChain([], { count: 0 })
        if (table === 'favorites') return makeChain([], { count: 0 })
        if (table === 'ad_events') return makeChain([], { count: 0 })
        return makeChain([])
      },
    }

    const result = await (handler as Function)({})
    expect(result.emailsSent).toBe(1)
    // email body should have total_views = 2 (vehicleIds.length fallback)
    const fetchCall = vi.mocked(globalThis.$fetch).mock.calls[0]
    const body = (fetchCall?.[1] as { body: Record<string, unknown> })?.body as Record<string, unknown>
    const vars = body?.variables as Record<string, string>
    expect(vars?.total_views).toBe('2')
  })

  it('continues when email sending fails', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(new Error('SMTP')))
    const dealers = [{
      id: 'd1', user_id: null, company_name: { es: 'Fail' },
      email: 'fail@test.com', locale: 'es', status: 'active',
    }]

    mockSupabase = {
      from: (table: string) => {
        if (table === 'dealers') return makeChain(dealers)
        if (table === 'vehicles') return makeChain([{ id: 'v1' }])
        if (table === 'leads') return makeChain([], { count: 0 })
        if (table === 'favorites') return makeChain([], { count: 0 })
        if (table === 'ad_events') return makeChain([], { count: 0 })
        return makeChain([])
      },
    }

    const result = await (handler as Function)({})
    expect(result.dealersProcessed).toBe(1)
    expect(result.emailsSent).toBe(0)
  })
})
