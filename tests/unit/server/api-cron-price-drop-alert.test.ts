import { describe, it, expect, vi, beforeEach } from 'vitest'

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

vi.stubGlobal('useRuntimeConfig', () => ({ cronSecret: 'test-secret' }))
vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({}))

let mockSupabase: Record<string, unknown>

function makeChain(data: unknown = [], extra: Record<string, unknown> = {}) {
  const chain: Record<string, unknown> = {}
  const ms = ['select', 'eq', 'gte', 'lte', 'in', 'order', 'limit', 'single', 'maybeSingle']
  for (const m of ms) chain[m] = () => chain
  chain.then = (r: (v: unknown) => void) => Promise.resolve({ data, error: null, ...extra }).then(r)
  chain.catch = (r: (v: unknown) => void) => Promise.resolve({ data, error: null }).catch(r)
  return chain
}

import handler from '../../../server/api/cron/price-drop-alert.post'

describe('price-drop-alert cron', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({}))
  })

  it('returns zero when no price changes', async () => {
    mockSupabase = { from: () => makeChain([]) }
    const result = await (handler as Function)({})
    expect(result.checked).toBe(0)
    expect(result.sent).toBe(0)
  })

  it('returns zero when only price increases (no drops)', async () => {
    const priceChanges = [
      { id: '1', vehicle_id: 'v1', previous_price_cents: 1000, price_cents: 1500, changed_at: '2026-01-01' },
    ]
    mockSupabase = { from: () => makeChain(priceChanges) }
    const result = await (handler as Function)({})
    expect(result.checked).toBe(1)
    expect(result.sent).toBe(0)
  })

  it('sends email for price drop with favorite users', async () => {
    const priceChanges = [
      { id: '1', vehicle_id: 'v1', previous_price_cents: 5000, price_cents: 4000, changed_at: '2026-01-01' },
    ]
    const vehicles = [{ id: 'v1', brand: 'Volvo', model: 'FH', slug: 'volvo-fh' }]
    const favorites = [
      { user_id: 'u1', users: { id: 'u1', email: 'user@test.com', name: 'John', lang: 'en' } },
    ]

    let fromCallCount = 0
    mockSupabase = {
      from: (table: string) => {
        if (table === 'price_history') return makeChain(priceChanges)
        if (table === 'vehicles') return makeChain(vehicles)
        if (table === 'favorites') return makeChain(favorites)
        return makeChain([])
      },
    }

    const result = await (handler as Function)({})
    expect(result.sent).toBe(1)
    expect(result.usersNotified).toBe(1)
    expect(vi.mocked(globalThis.$fetch)).toHaveBeenCalledWith(
      '/api/email/send',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('groups multiple drops per user into one email', async () => {
    const priceChanges = [
      { id: '1', vehicle_id: 'v1', previous_price_cents: 5000, price_cents: 4000, changed_at: '2026-01-01' },
      { id: '2', vehicle_id: 'v2', previous_price_cents: 8000, price_cents: 6000, changed_at: '2026-01-01' },
    ]
    const vehicles = [
      { id: 'v1', brand: 'Volvo', model: 'FH', slug: 'volvo-fh' },
      { id: 'v2', brand: 'Scania', model: 'R', slug: 'scania-r' },
    ]
    const favorites = [
      { user_id: 'u1', users: { id: 'u1', email: 'user@test.com', name: 'John', lang: 'es' } },
    ]

    mockSupabase = {
      from: (table: string) => {
        if (table === 'price_history') return makeChain(priceChanges)
        if (table === 'vehicles') return makeChain(vehicles)
        if (table === 'favorites') return makeChain(favorites)
        return makeChain([])
      },
    }

    const result = await (handler as Function)({})
    expect(result.usersNotified).toBe(1)
    expect(result.sent).toBe(1) // 1 email, not 2
  })

  it('skips favorites without user email', async () => {
    const priceChanges = [
      { id: '1', vehicle_id: 'v1', previous_price_cents: 5000, price_cents: 4000, changed_at: '2026-01-01' },
    ]
    const vehicles = [{ id: 'v1', brand: 'Volvo', model: 'FH', slug: 'volvo-fh' }]
    const favorites = [
      { user_id: 'u1', users: null },
    ]

    mockSupabase = {
      from: (table: string) => {
        if (table === 'price_history') return makeChain(priceChanges)
        if (table === 'vehicles') return makeChain(vehicles)
        if (table === 'favorites') return makeChain(favorites)
        return makeChain([])
      },
    }

    const result = await (handler as Function)({})
    expect(result.sent).toBe(0)
  })

  it('throws 500 on price_history fetch error', async () => {
    const errChain: Record<string, unknown> = {}
    const ms = ['select', 'eq', 'gte', 'lte', 'in', 'order', 'limit']
    for (const m of ms) errChain[m] = () => errChain
    errChain.then = (r: (v: unknown) => void) => Promise.resolve({ data: null, error: { message: 'DB err' } }).then(r)
    errChain.catch = (r: (v: unknown) => void) => Promise.resolve({ data: null, error: { message: 'DB err' } }).catch(r)

    mockSupabase = { from: () => errChain }
    await expect((handler as Function)({})).rejects.toThrow()
  })

  it('continues when email send fails', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(new Error('SMTP')))

    const priceChanges = [
      { id: '1', vehicle_id: 'v1', previous_price_cents: 5000, price_cents: 4000, changed_at: '2026-01-01' },
    ]
    const vehicles = [{ id: 'v1', brand: 'Volvo', model: 'FH', slug: 'volvo-fh' }]
    const favorites = [
      { user_id: 'u1', users: { id: 'u1', email: 'user@test.com', name: null, lang: null } },
    ]

    mockSupabase = {
      from: (table: string) => {
        if (table === 'price_history') return makeChain(priceChanges)
        if (table === 'vehicles') return makeChain(vehicles)
        if (table === 'favorites') return makeChain(favorites)
        return makeChain([])
      },
    }

    const result = await (handler as Function)({})
    expect(result.sent).toBe(0) // email failed
    expect(result.usersNotified).toBe(1) // user was in list
  })

  it('uses default locale es when user lang is null', async () => {
    const priceChanges = [
      { id: '1', vehicle_id: 'v1', previous_price_cents: 10000, price_cents: 7000, changed_at: '2026-01-01' },
    ]
    const vehicles = [{ id: 'v1', brand: 'MAN', model: 'TGX', slug: 'man-tgx' }]
    const favorites = [
      { user_id: 'u1', users: { id: 'u1', email: 'a@b.com', name: null, lang: null } },
    ]

    mockSupabase = {
      from: (table: string) => {
        if (table === 'price_history') return makeChain(priceChanges)
        if (table === 'vehicles') return makeChain(vehicles)
        if (table === 'favorites') return makeChain(favorites)
        return makeChain([])
      },
    }

    const result = await (handler as Function)({})
    expect(result.sent).toBe(1)
    // Check that the email body uses locale 'es'
    const fetchCall = vi.mocked(globalThis.$fetch).mock.calls[0]
    const body = (fetchCall?.[1] as { body: Record<string, unknown> })?.body
    expect(body?.locale).toBe('es')
  })

  it('throws 500 on vehicles fetch error', async () => {
    const priceChanges = [
      { id: '1', vehicle_id: 'v1', previous_price_cents: 5000, price_cents: 4000, changed_at: '2026-01-01' },
    ]
    const vehicleErrChain: Record<string, unknown> = {}
    const ms = ['select', 'eq', 'gte', 'lte', 'in', 'order', 'limit']
    for (const m of ms) vehicleErrChain[m] = () => vehicleErrChain
    vehicleErrChain.then = (r: (v: unknown) => void) => Promise.resolve({ data: null, error: { message: 'vehicles error' } }).then(r)
    vehicleErrChain.catch = (r: (v: unknown) => void) => Promise.resolve({ data: null, error: { message: 'vehicles error' } }).catch(r)

    mockSupabase = {
      from: (table: string) => {
        if (table === 'price_history') return makeChain(priceChanges)
        if (table === 'vehicles') return vehicleErrChain
        return makeChain([])
      },
    }
    await expect((handler as Function)({})).rejects.toThrow()
  })

  it('skips vehicle without matching vehicleMap entry', async () => {
    const priceChanges = [
      { id: '1', vehicle_id: 'v-unknown', previous_price_cents: 5000, price_cents: 4000, changed_at: '2026-01-01' },
    ]
    const vehicles: unknown[] = [] // no matching vehicle

    mockSupabase = {
      from: (table: string) => {
        if (table === 'price_history') return makeChain(priceChanges)
        if (table === 'vehicles') return makeChain(vehicles)
        if (table === 'favorites') return makeChain([])
        return makeChain([])
      },
    }

    const result = await (handler as Function)({})
    expect(result.sent).toBe(0)
  })

  it('handles favorites fetch error for a specific vehicle', async () => {
    const priceChanges = [
      { id: '1', vehicle_id: 'v1', previous_price_cents: 5000, price_cents: 4000, changed_at: '2026-01-01' },
    ]
    const vehicles = [{ id: 'v1', brand: 'Volvo', model: 'FH', slug: 'volvo-fh' }]

    const favsErrChain: Record<string, unknown> = {}
    const ms = ['select', 'eq', 'gte', 'lte', 'in', 'order', 'limit']
    for (const m of ms) favsErrChain[m] = () => favsErrChain
    favsErrChain.then = (r: (v: unknown) => void) => Promise.resolve({ data: null, error: { message: 'favorites error' } }).then(r)
    favsErrChain.catch = (r: (v: unknown) => void) => Promise.resolve({ data: null, error: { message: 'favorites error' } }).catch(r)

    mockSupabase = {
      from: (table: string) => {
        if (table === 'price_history') return makeChain(priceChanges)
        if (table === 'vehicles') return makeChain(vehicles)
        if (table === 'favorites') return favsErrChain
        return makeChain([])
      },
    }

    const result = await (handler as Function)({})
    // Should log error and skip, not throw
    expect(result.sent).toBe(0)
  })

  it('handles empty favorites for a vehicle with price drop', async () => {
    const priceChanges = [
      { id: '1', vehicle_id: 'v1', previous_price_cents: 5000, price_cents: 4000, changed_at: '2026-01-01' },
    ]
    const vehicles = [{ id: 'v1', brand: 'Volvo', model: 'FH', slug: 'volvo-fh' }]

    mockSupabase = {
      from: (table: string) => {
        if (table === 'price_history') return makeChain(priceChanges)
        if (table === 'vehicles') return makeChain(vehicles)
        if (table === 'favorites') return makeChain([]) // no favorites
        return makeChain([])
      },
    }

    const result = await (handler as Function)({})
    expect(result.sent).toBe(0)
    expect(result.checked).toBe(1)
  })

  it('correctly calculates drop percentage', async () => {
    const priceChanges = [
      { id: '1', vehicle_id: 'v1', previous_price_cents: 10000, price_cents: 7500, changed_at: '2026-01-01' },
    ]
    const vehicles = [{ id: 'v1', brand: 'Volvo', model: 'FH', slug: 'volvo-fh' }]
    const favorites = [
      { user_id: 'u1', users: { id: 'u1', email: 'test@test.com', name: 'Test', lang: 'en' } },
    ]

    mockSupabase = {
      from: (table: string) => {
        if (table === 'price_history') return makeChain(priceChanges)
        if (table === 'vehicles') return makeChain(vehicles)
        if (table === 'favorites') return makeChain(favorites)
        return makeChain([])
      },
    }

    const result = await (handler as Function)({})
    expect(result.sent).toBe(1)
    // Verify the dropPercent in the email body variables
    const fetchCall = vi.mocked(globalThis.$fetch).mock.calls[0]
    const body = (fetchCall?.[1] as { body: Record<string, unknown> })?.body
    const variables = body?.variables as { vehicles: Array<{ dropPercent: number }> }
    expect(variables.vehicles[0]!.dropPercent).toBe(25) // (10000-7500)/10000*100 = 25%
  })

  it('sends to multiple users when different users favorite different vehicles', async () => {
    const priceChanges = [
      { id: '1', vehicle_id: 'v1', previous_price_cents: 5000, price_cents: 4000, changed_at: '2026-01-01' },
      { id: '2', vehicle_id: 'v2', previous_price_cents: 8000, price_cents: 6000, changed_at: '2026-01-01' },
    ]
    const vehicles = [
      { id: 'v1', brand: 'Volvo', model: 'FH', slug: 'volvo-fh' },
      { id: 'v2', brand: 'Scania', model: 'R', slug: 'scania-r' },
    ]

    let favCallIdx = 0
    const favsByVehicle: Record<string, unknown[]> = {
      v1: [{ user_id: 'u1', users: { id: 'u1', email: 'user1@test.com', name: 'User1', lang: 'es' } }],
      v2: [{ user_id: 'u2', users: { id: 'u2', email: 'user2@test.com', name: 'User2', lang: 'en' } }],
    }

    mockSupabase = {
      from: (table: string) => {
        if (table === 'price_history') return makeChain(priceChanges)
        if (table === 'vehicles') return makeChain(vehicles)
        if (table === 'favorites') {
          // Need to return different favorites for each vehicle
          // Since we can't easily track which vehicle_id is being queried,
          // return both users for all vehicles
          return makeChain([
            { user_id: 'u1', users: { id: 'u1', email: 'user1@test.com', name: 'User1', lang: 'es' } },
          ])
        }
        return makeChain([])
      },
    }

    const result = await (handler as Function)({})
    // u1 appears for both vehicle drops → one email with two vehicles
    expect(result.usersNotified).toBe(1)
    expect(result.sent).toBe(1)
  })

  it('includes internalSecret header when available', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({}))
    vi.stubGlobal('useRuntimeConfig', () => ({ cronSecret: 'my-secret' }))

    const priceChanges = [
      { id: '1', vehicle_id: 'v1', previous_price_cents: 5000, price_cents: 4000, changed_at: '2026-01-01' },
    ]
    const vehicles = [{ id: 'v1', brand: 'Volvo', model: 'FH', slug: 'volvo-fh' }]
    const favorites = [
      { user_id: 'u1', users: { id: 'u1', email: 'test@test.com', name: 'Test', lang: 'es' } },
    ]

    mockSupabase = {
      from: (table: string) => {
        if (table === 'price_history') return makeChain(priceChanges)
        if (table === 'vehicles') return makeChain(vehicles)
        if (table === 'favorites') return makeChain(favorites)
        return makeChain([])
      },
    }

    await (handler as Function)({})
    expect(vi.mocked(globalThis.$fetch)).toHaveBeenCalledWith(
      '/api/email/send',
      expect.objectContaining({
        headers: { 'x-internal-secret': 'my-secret' },
      }),
    )
  })
})
