/**
 * Tests for POST /api/cron/favorite-sold — processor callback logic
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockReadBody, mockVerifyCronSecret } = vi.hoisted(() => ({
  mockReadBody: vi.fn().mockResolvedValue({ secret: 'test-secret' }),
  mockVerifyCronSecret: vi.fn(),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: mockReadBody,
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

let mockSupabase: Record<string, unknown>

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: () => mockSupabase,
}))

vi.mock('../../../server/utils/safeError', () => ({
  safeError: (_code: number, msg: string) => {
    const err = new Error(msg) as Error & { statusCode: number }
    err.statusCode = _code
    return err
  },
}))

vi.mock('../../../server/utils/verifyCronSecret', () => ({
  verifyCronSecret: mockVerifyCronSecret,
}))

vi.mock('../../../server/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const mockFetch = vi.fn().mockResolvedValue({ ok: true })
vi.stubGlobal('$fetch', mockFetch)
vi.stubGlobal('useRuntimeConfig', () => ({ cronSecret: 'test-secret', public: {} }))

function makeChain(data: unknown = null, error: unknown = null) {
  const chain: Record<string, unknown> = {}
  const ms = ['select', 'eq', 'not', 'gte', 'limit']
  for (const m of ms) chain[m] = (..._a: unknown[]) => chain
  chain.then = (r: (v: unknown) => void) => Promise.resolve({ data, error }).then(r)
  chain.catch = (r: (v: unknown) => void) => Promise.resolve({ data, error: null }).catch(r)
  return chain
}

import handler from '../../../server/api/cron/favorite-sold.post'

describe('favorite-sold processor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({ ok: true })
  })

  it('sends emails to users who favorited a sold vehicle', async () => {
    const vehicle = {
      id: 'v1', brand: 'Iveco', model: 'Daily', slug: 'iveco-daily',
      sold_at: new Date().toISOString(), category_id: 'cat-1',
    }

    const favorites = [
      { user_id: 'u1', users: { id: 'u1', email: 'user1@test.com', name: 'Alice', lang: 'en' } },
    ]

    mockSupabase = {
      from: (table: string) => {
        if (table === 'vehicles') return makeChain([vehicle])
        if (table === 'favorites') return makeChain(favorites)
        return makeChain(null)
      },
    }

    const result = await (handler as Function)({})
    expect(result.soldVehicles).toBe(1)
    expect(result.notificationsSent).toBe(1)
    expect(mockFetch).toHaveBeenCalledWith('/api/email/send', expect.objectContaining({
      method: 'POST',
      body: expect.objectContaining({
        templateKey: 'buyer_favorite_sold',
        to: 'user1@test.com',
      }),
    }))
  })

  it('includes category in similarUrl when category_id exists', async () => {
    const vehicle = {
      id: 'v1', brand: 'MAN', model: 'TGX', slug: 'man-tgx',
      sold_at: new Date().toISOString(), category_id: 'cat-trucks',
    }

    const favorites = [
      { user_id: 'u1', users: { id: 'u1', email: 'test@test.com', name: 'Bob', lang: 'es' } },
    ]

    mockSupabase = {
      from: (table: string) => {
        if (table === 'vehicles') return makeChain([vehicle])
        if (table === 'favorites') return makeChain(favorites)
        return makeChain(null)
      },
    }

    await (handler as Function)({})
    expect(mockFetch).toHaveBeenCalledWith('/api/email/send', expect.objectContaining({
      body: expect.objectContaining({
        variables: expect.objectContaining({
          similarUrl: 'https://tracciona.com/catalogo?category=cat-trucks',
        }),
      }),
    }))
  })

  it('uses plain catalog URL when category_id is null', async () => {
    const vehicle = {
      id: 'v1', brand: 'DAF', model: 'XF', slug: 'daf-xf',
      sold_at: new Date().toISOString(), category_id: null,
    }

    const favorites = [
      { user_id: 'u1', users: { id: 'u1', email: 'test@test.com', name: 'Bob', lang: 'es' } },
    ]

    mockSupabase = {
      from: (table: string) => {
        if (table === 'vehicles') return makeChain([vehicle])
        if (table === 'favorites') return makeChain(favorites)
        return makeChain(null)
      },
    }

    await (handler as Function)({})
    expect(mockFetch).toHaveBeenCalledWith('/api/email/send', expect.objectContaining({
      body: expect.objectContaining({
        variables: expect.objectContaining({
          similarUrl: 'https://tracciona.com/catalogo',
        }),
      }),
    }))
  })

  it('skips favorites with no user email', async () => {
    const vehicle = {
      id: 'v1', brand: 'Renault', model: 'T', slug: 'renault-t',
      sold_at: new Date().toISOString(), category_id: null,
    }

    const favorites = [
      { user_id: 'u1', users: null },
      { user_id: 'u2', users: { id: 'u2', email: '', name: null, lang: null } },
    ]

    mockSupabase = {
      from: (table: string) => {
        if (table === 'vehicles') return makeChain([vehicle])
        if (table === 'favorites') return makeChain(favorites)
        return makeChain(null)
      },
    }

    const result = await (handler as Function)({})
    expect(result.notificationsSent).toBe(0)
  })

  it('handles favorites DB error gracefully', async () => {
    const vehicle = {
      id: 'v1', brand: 'Scania', model: 'R', slug: 'scania-r',
      sold_at: new Date().toISOString(), category_id: null,
    }

    mockSupabase = {
      from: (table: string) => {
        if (table === 'vehicles') return makeChain([vehicle])
        if (table === 'favorites') return makeChain(null, { message: 'DB error' })
        return makeChain(null)
      },
    }

    const result = await (handler as Function)({})
    expect(result.notificationsSent).toBe(0)
  })

  it('handles email failure and continues', async () => {
    const vehicle = {
      id: 'v1', brand: 'Volvo', model: 'FH', slug: 'volvo-fh',
      sold_at: new Date().toISOString(), category_id: null,
    }

    const favorites = [
      { user_id: 'u1', users: { id: 'u1', email: 'fail@test.com', name: 'Fail', lang: 'es' } },
      { user_id: 'u2', users: { id: 'u2', email: 'ok@test.com', name: 'Ok', lang: 'es' } },
    ]

    mockFetch.mockRejectedValueOnce(new Error('SMTP fail')).mockResolvedValueOnce({ ok: true })

    mockSupabase = {
      from: (table: string) => {
        if (table === 'vehicles') return makeChain([vehicle])
        if (table === 'favorites') return makeChain(favorites)
        return makeChain(null)
      },
    }

    const result = await (handler as Function)({})
    expect(result.notificationsSent).toBe(1)
  })

  it('uses name fallback to email when name is null', async () => {
    const vehicle = {
      id: 'v1', brand: 'Mercedes', model: 'Actros', slug: 'merc-actros',
      sold_at: new Date().toISOString(), category_id: null,
    }

    const favorites = [
      { user_id: 'u1', users: { id: 'u1', email: 'noname@test.com', name: null, lang: null } },
    ]

    mockSupabase = {
      from: (table: string) => {
        if (table === 'vehicles') return makeChain([vehicle])
        if (table === 'favorites') return makeChain(favorites)
        return makeChain(null)
      },
    }

    await (handler as Function)({})
    expect(mockFetch).toHaveBeenCalledWith('/api/email/send', expect.objectContaining({
      body: expect.objectContaining({
        variables: expect.objectContaining({ name: 'noname@test.com' }),
        locale: 'es',
      }),
    }))
  })
})
