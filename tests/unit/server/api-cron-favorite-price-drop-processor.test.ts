/**
 * Tests for POST /api/cron/favorite-price-drop — processor callback logic
 * (favorites lookup, email sending, error handling inside the batch processor)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockReadBody, mockVerifyCronSecret } = vi.hoisted(() => ({
  mockReadBody: vi.fn().mockResolvedValue({ secret: 'test-secret' }),
  mockVerifyCronSecret: vi.fn(),
}))

vi.mock('~~/server/utils/cronLock', () => ({ acquireDbCronLock: vi.fn().mockResolvedValue(true) }))
vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: mockReadBody,
}))

// Inline processBatch that actually calls the processor
vi.mock('../../../server/utils/batchProcessor', () => ({
  processBatch: async ({
    items,
    processor,
  }: {
    items: unknown[]
    processor: (item: unknown) => Promise<void>
  }) => {
    let processed = 0
    let errors = 0
    for (const item of items) {
      try {
        await processor(item)
        processed++
      } catch {
        errors++
      }
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
  chain.insert = (..._a: unknown[]) => Promise.resolve({ data: null, error: null })
  chain.then = (r: (v: unknown) => void) => Promise.resolve({ data, error }).then(r)
  chain.catch = (r: (v: unknown) => void) => Promise.resolve({ data, error: null }).catch(r)
  return chain
}

import handler from '../../../server/api/cron/favorite-price-drop.post'

describe('favorite-price-drop processor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({ ok: true })
  })

  it('sends emails to users who favorited a price-dropped vehicle', async () => {
    const vehicle = {
      id: 'v1',
      brand: 'DAF',
      model: 'XF',
      slug: 'daf-xf',
      price: 50000,
      previous_price: 60000,
      updated_at: new Date().toISOString(),
      category_id: null,
    }

    const favorites = [
      { user_id: 'u1', users: { id: 'u1', email: 'user1@test.com', name: 'Alice', lang: 'en' } },
      { user_id: 'u2', users: { id: 'u2', email: 'user2@test.com', name: null, lang: null } },
    ]

    mockSupabase = {
      from: (table: string) => {
        if (table === 'vehicles') return makeChain([vehicle])
        if (table === 'favorites') return makeChain(favorites)
        return makeChain(null)
      },
    }

    const result = await (handler as Function)({})
    expect(result.vehiclesChecked).toBe(1)
    expect(result.notificationsSent).toBe(2)
    expect(mockFetch).toHaveBeenCalledTimes(2)
    // Check email template
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/email/send',
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          templateKey: 'buyer_favorite_price_drop',
          to: 'user1@test.com',
        }),
      }),
    )
  })

  it('skips favorites with no user email', async () => {
    const vehicle = {
      id: 'v1',
      brand: 'MAN',
      model: 'TGX',
      slug: 'man-tgx',
      price: 40000,
      previous_price: 50000,
      updated_at: new Date().toISOString(),
      category_id: null,
    }

    const favorites = [
      { user_id: 'u1', users: null },
      { user_id: 'u2', users: { id: 'u2', email: '', name: 'Bob', lang: 'es' } },
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
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('handles favorites DB error gracefully', async () => {
    const vehicle = {
      id: 'v1',
      brand: 'Volvo',
      model: 'FH',
      slug: 'volvo-fh',
      price: 30000,
      previous_price: 40000,
      updated_at: new Date().toISOString(),
      category_id: null,
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

  it('handles no favorites for a vehicle', async () => {
    const vehicle = {
      id: 'v1',
      brand: 'Scania',
      model: 'R500',
      slug: 'scania-r500',
      price: 60000,
      previous_price: 70000,
      updated_at: new Date().toISOString(),
      category_id: null,
    }

    mockSupabase = {
      from: (table: string) => {
        if (table === 'vehicles') return makeChain([vehicle])
        if (table === 'favorites') return makeChain([])
        return makeChain(null)
      },
    }

    const result = await (handler as Function)({})
    expect(result.vehiclesChecked).toBe(1)
    expect(result.notificationsSent).toBe(0)
  })

  it('handles email send failure and continues', async () => {
    const vehicle = {
      id: 'v1',
      brand: 'DAF',
      model: 'CF',
      slug: 'daf-cf',
      price: 35000,
      previous_price: 45000,
      updated_at: new Date().toISOString(),
      category_id: null,
    }

    const favorites = [
      { user_id: 'u1', users: { id: 'u1', email: 'fail@test.com', name: 'Fail', lang: 'es' } },
      { user_id: 'u2', users: { id: 'u2', email: 'ok@test.com', name: 'Ok', lang: 'es' } },
    ]

    mockFetch.mockRejectedValueOnce(new Error('SMTP down')).mockResolvedValueOnce({ ok: true })

    mockSupabase = {
      from: (table: string) => {
        if (table === 'vehicles') return makeChain([vehicle])
        if (table === 'favorites') return makeChain(favorites)
        return makeChain(null)
      },
    }

    const result = await (handler as Function)({})
    // First email fails, second succeeds
    expect(result.notificationsSent).toBe(1)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('uses user lang for locale', async () => {
    const vehicle = {
      id: 'v1',
      brand: 'Iveco',
      model: 'S-Way',
      slug: 'iveco-sway',
      price: 70000,
      previous_price: 80000,
      updated_at: new Date().toISOString(),
      category_id: null,
    }

    const favorites = [
      { user_id: 'u1', users: { id: 'u1', email: 'en@test.com', name: 'John', lang: 'en' } },
    ]

    mockSupabase = {
      from: (table: string) => {
        if (table === 'vehicles') return makeChain([vehicle])
        if (table === 'favorites') return makeChain(favorites)
        return makeChain(null)
      },
    }

    await (handler as Function)({})
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/email/send',
      expect.objectContaining({
        body: expect.objectContaining({ locale: 'en' }),
      }),
    )
  })
})
