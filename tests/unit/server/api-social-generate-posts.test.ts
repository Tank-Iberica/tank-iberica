import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockServerUser, mockReadBody, mockCallAI } = vi.hoisted(() => ({
  mockServerUser: vi.fn(),
  mockReadBody: vi.fn(),
  mockCallAI: vi.fn(),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: (...a: unknown[]) => mockReadBody(...a),
  createError: (opts: { statusCode?: number; statusMessage?: string; data?: unknown }) => {
    const err = new Error(opts.statusMessage ?? 'Error')
    ;(err as any).statusCode = opts.statusCode
    return err
  },
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseUser: (...a: unknown[]) => mockServerUser(...a),
  serverSupabaseServiceRole: () => mockSupabase,
}))

vi.mock('~~/server/utils/safeError', () => ({
  safeError: (_code: number, msg: string) => {
    const err = new Error(msg) as Error & { statusCode: number }
    err.statusCode = _code
    return err
  },
}))

vi.mock('~~/server/services/aiProvider', () => ({
  callAI: (...a: unknown[]) => mockCallAI(...a),
}))

vi.mock('~~/server/utils/siteConfig', () => ({
  getSiteUrl: () => 'https://tracciona.com',
}))

vi.mock('../../../server/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

let mockSupabase: Record<string, unknown>

function makeChain(data: unknown = null, extra: Record<string, unknown> = {}) {
  const chain: Record<string, unknown> = {}
  const ms = ['select', 'eq', 'single', 'order', 'insert']
  for (const m of ms) chain[m] = (..._a: unknown[]) => chain
  chain.then = (r: (v: unknown) => void) => Promise.resolve({ data, error: null, ...extra }).then(r)
  chain.catch = (r: (v: unknown) => void) => Promise.resolve({ data, error: null }).catch(r)
  return chain
}

const VALID_UUID = '12345678-1234-1234-1234-123456789abc'

import handler from '../../../server/api/social/generate-posts.post'

describe('POST /api/social/generate-posts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCallAI.mockRejectedValue(new Error('AI disabled')) // fallback to templates
  })

  it('throws 401 when not authenticated', async () => {
    mockServerUser.mockResolvedValue(null)
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when vehicleId is missing', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockReadBody.mockResolvedValue({})
    mockSupabase = { from: () => makeChain() }
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 for invalid UUID', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockReadBody.mockResolvedValue({ vehicleId: 'not-a-uuid' })
    mockSupabase = { from: () => makeChain() }
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 404 when vehicle not found', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockReadBody.mockResolvedValue({ vehicleId: VALID_UUID })

    const errChain: Record<string, unknown> = {}
    const ms = ['select', 'eq', 'order', 'single']
    for (const m of ms) errChain[m] = () => errChain
    errChain.then = (r: (v: unknown) => void) => Promise.resolve({ data: null, error: { message: 'not found' } }).then(r)
    errChain.catch = (r: (v: unknown) => void) => Promise.resolve({ data: null, error: null }).catch(r)
    mockSupabase = { from: () => errChain }

    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 404 })
  })

  it('creates 4 social posts with template fallback', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockReadBody.mockResolvedValue({ vehicleId: VALID_UUID })

    const vehicle = {
      id: VALID_UUID, brand: 'Volvo', model: 'FH', year: 2020, price: 5000000,
      location: 'Madrid', slug: 'volvo-fh', dealer_id: 'd1',
      subcategories: { name: { es: 'Tractora', en: 'Tractor' } },
      vehicle_images: [{ url: 'https://img.com/1.jpg', position: 0 }],
    }
    const insertedPosts = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }, { id: 'p4' }]

    mockSupabase = {
      from: (table: string) => {
        if (table === 'vehicles') return makeChain(vehicle)
        if (table === 'dealers') return makeChain({ id: 'd1' })
        if (table === 'social_posts') return makeChain(insertedPosts)
        return makeChain(null)
      },
    }

    const result = await (handler as Function)({})
    expect(result.count).toBe(4)
    expect(result.postIds).toHaveLength(4)
  })

  it('throws 403 when non-owner non-admin tries', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockReadBody.mockResolvedValue({ vehicleId: VALID_UUID })

    const vehicle = {
      id: VALID_UUID, brand: 'Volvo', model: 'FH', year: null, price: null,
      location: null, slug: 'volvo-fh', dealer_id: 'other-dealer',
      subcategories: null, vehicle_images: [],
    }

    mockSupabase = {
      from: (table: string) => {
        if (table === 'vehicles') return makeChain(vehicle)
        if (table === 'dealers') {
          // user has no dealer
          const chain: Record<string, unknown> = {}
          const ms = ['select', 'eq', 'single']
          for (const m of ms) chain[m] = () => chain
          chain.then = (r: (v: unknown) => void) => Promise.resolve({ data: null, error: { message: 'none' } }).then(r)
          chain.catch = (r: (v: unknown) => void) => Promise.resolve({ data: null, error: null }).catch(r)
          return chain
        }
        if (table === 'users') {
          return makeChain({ role: 'user' }) // not admin
        }
        return makeChain(null)
      },
    }

    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 403 })
  })

  it('allows admin to generate posts for any vehicle', async () => {
    mockServerUser.mockResolvedValue({ id: 'admin1' })
    mockReadBody.mockResolvedValue({ vehicleId: VALID_UUID })

    const vehicle = {
      id: VALID_UUID, brand: 'MAN', model: 'TGX', year: 2019, price: null,
      location: null, slug: 'man-tgx', dealer_id: 'other-dealer',
      subcategories: null, vehicle_images: [],
    }
    const insertedPosts = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }, { id: 'p4' }]

    let dealerCallCount = 0
    mockSupabase = {
      from: (table: string) => {
        if (table === 'vehicles') return makeChain(vehicle)
        if (table === 'dealers') {
          dealerCallCount++
          // first call: user is not a dealer
          const chain: Record<string, unknown> = {}
          const ms = ['select', 'eq', 'single']
          for (const m of ms) chain[m] = () => chain
          chain.then = (r: (v: unknown) => void) => Promise.resolve({ data: null, error: { message: 'none' } }).then(r)
          chain.catch = (r: (v: unknown) => void) => Promise.resolve({ data: null, error: null }).catch(r)
          return chain
        }
        if (table === 'users') return makeChain({ role: 'admin' })
        if (table === 'social_posts') return makeChain(insertedPosts)
        return makeChain(null)
      },
    }

    const result = await (handler as Function)({})
    expect(result.count).toBe(4)
  })
})
