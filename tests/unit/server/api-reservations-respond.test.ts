import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockServerUser, mockReadBody } = vi.hoisted(() => ({
  mockServerUser: vi.fn(),
  mockReadBody: vi.fn(),
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

vi.mock('../../../server/utils/safeError', () => ({
  safeError: (_code: number, msg: string) => {
    const err = new Error(msg) as Error & { statusCode: number }
    err.statusCode = _code
    return err
  },
}))

let mockSupabase: Record<string, unknown>

function makeChain(data: unknown = null, extra: Record<string, unknown> = {}) {
  const chain: Record<string, unknown> = {}
  const ms = ['select', 'eq', 'single', 'maybeSingle', 'update']
  for (const m of ms) chain[m] = (..._a: unknown[]) => chain
  chain.then = (r: (v: unknown) => void) => Promise.resolve({ data, error: null, ...extra }).then(r)
  chain.catch = (r: (v: unknown) => void) => Promise.resolve({ data, error: null }).catch(r)
  return chain
}

import handler from '../../../server/api/reservations/respond.post'

const VALID_UUID = '12345678-1234-1234-1234-123456789abc'
const LONG_RESPONSE = 'A'.repeat(50) // minimum 50 chars

describe('POST /api/reservations/respond', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 401 when not authenticated', async () => {
    mockServerUser.mockResolvedValue(null)
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 for missing reservationId', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockReadBody.mockResolvedValue({ response: LONG_RESPONSE })
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 for invalid reservationId format', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockReadBody.mockResolvedValue({ reservationId: 'not-uuid', response: LONG_RESPONSE })
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 for short response', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockReadBody.mockResolvedValue({ reservationId: VALID_UUID, response: 'Too short' })
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 404 when reservation not found', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockReadBody.mockResolvedValue({ reservationId: VALID_UUID, response: LONG_RESPONSE })

    const errChain: Record<string, unknown> = {}
    const ms = ['select', 'eq', 'single']
    for (const m of ms) errChain[m] = () => errChain
    errChain.then = (r: (v: unknown) => void) => Promise.resolve({ data: null, error: { message: 'not found' } }).then(r)
    errChain.catch = (r: (v: unknown) => void) => Promise.resolve({ data: null, error: null }).catch(r)
    mockSupabase = { from: () => errChain }

    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 403 when non-seller tries to respond', async () => {
    mockServerUser.mockResolvedValue({ id: 'other-user' })
    mockReadBody.mockResolvedValue({ reservationId: VALID_UUID, response: LONG_RESPONSE })

    let fromCall = 0
    mockSupabase = {
      from: (table: string) => {
        if (table === 'reservations') {
          return makeChain({ id: VALID_UUID, seller_id: 'seller1', status: 'pending' })
        }
        if (table === 'dealers') {
          return makeChain(null) // no dealer found for this user
        }
        return makeChain(null)
      },
    }
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 409 when reservation status is not respondable', async () => {
    mockServerUser.mockResolvedValue({ id: 'seller1' })
    mockReadBody.mockResolvedValue({ reservationId: VALID_UUID, response: LONG_RESPONSE })

    mockSupabase = {
      from: (table: string) => {
        if (table === 'reservations') {
          return makeChain({ id: VALID_UUID, seller_id: 'seller1', status: 'expired' })
        }
        if (table === 'dealers') {
          return makeChain({ user_id: 'seller1' })
        }
        return makeChain(null)
      },
    }
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 409 })
  })

  it('succeeds when seller responds to pending reservation', async () => {
    mockServerUser.mockResolvedValue({ id: 'seller1' })
    mockReadBody.mockResolvedValue({ reservationId: VALID_UUID, response: LONG_RESPONSE })

    mockSupabase = {
      from: (table: string) => {
        if (table === 'reservations') {
          return makeChain({ id: VALID_UUID, seller_id: 'seller1', status: 'pending' })
        }
        if (table === 'dealers') {
          return makeChain({ user_id: 'seller1' })
        }
        return makeChain(null)
      },
    }

    const result = await (handler as Function)({})
    expect(result.success).toBe(true)
  })
})
