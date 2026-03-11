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
  const ms = ['select', 'eq', 'single', 'insert', 'update', 'maybeSingle']
  for (const m of ms) chain[m] = (..._a: unknown[]) => chain
  chain.then = (r: (v: unknown) => void) => Promise.resolve({ data, error: null, ...extra }).then(r)
  chain.catch = (r: (v: unknown) => void) => Promise.resolve({ data, error: null }).catch(r)
  return chain
}

const VALID_UUID = '12345678-1234-1234-1234-123456789abc'

import handler from '../../../server/api/dgt-report.post'

describe('POST /api/dgt-report', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 401 when not authenticated', async () => {
    mockServerUser.mockResolvedValue(null)
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 403 when not admin', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockSupabase = { from: () => makeChain({ role: 'user' }) }
    mockReadBody.mockResolvedValue({ vehicleId: VALID_UUID, matricula: '1234 BCD' })
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 400 for missing vehicleId', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockSupabase = { from: () => makeChain({ role: 'admin' }) }
    mockReadBody.mockResolvedValue({ matricula: '1234 BCD' })
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 for invalid UUID', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockSupabase = { from: () => makeChain({ role: 'admin' }) }
    mockReadBody.mockResolvedValue({ vehicleId: 'bad', matricula: '1234 BCD' })
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 for missing matricula', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockSupabase = { from: () => makeChain({ role: 'admin' }) }
    mockReadBody.mockResolvedValue({ vehicleId: VALID_UUID })
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 for invalid provider', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockSupabase = { from: () => makeChain({ role: 'admin' }) }
    mockReadBody.mockResolvedValue({ vehicleId: VALID_UUID, matricula: '1234 BCD', provider: 'bad' })
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 404 when vehicle not found', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockReadBody.mockResolvedValue({ vehicleId: VALID_UUID, matricula: '1234 BCD' })

    let fromCall = 0
    mockSupabase = {
      from: (table: string) => {
        if (table === 'users') return makeChain({ role: 'admin' })
        if (table === 'vehicles') {
          const chain: Record<string, unknown> = {}
          const ms = ['select', 'eq', 'single']
          for (const m of ms) chain[m] = () => chain
          chain.then = (r: (v: unknown) => void) => Promise.resolve({ data: null, error: { message: 'not found' } }).then(r)
          chain.catch = (r: (v: unknown) => void) => Promise.resolve({ data: null, error: null }).catch(r)
          return chain
        }
        return makeChain(null)
      },
    }
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 404 })
  })

  it('succeeds and returns report data', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockReadBody.mockResolvedValue({ vehicleId: VALID_UUID, matricula: '1234 BCD' })

    mockSupabase = {
      from: (table: string) => {
        if (table === 'users') return makeChain({ role: 'admin' })
        if (table === 'vehicles') return makeChain({ id: VALID_UUID, brand: 'Volvo', model: 'FH', year: 2020, verification_level: 1 })
        if (table === 'verification_documents') return makeChain({ id: 'doc-1' })
        return makeChain(null)
      },
    }

    const result = await (handler as Function)({})
    expect(result.success).toBe(true)
    expect(result.kmScore).toBe(85)
    expect(result.documentId).toBe('doc-1')
  })

  it('skips vehicle update when verification_level >= 3', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockReadBody.mockResolvedValue({ vehicleId: VALID_UUID, matricula: '1234 BCD' })

    mockSupabase = {
      from: (table: string) => {
        if (table === 'users') return makeChain({ role: 'admin' })
        if (table === 'vehicles') return makeChain({ id: VALID_UUID, brand: 'Volvo', model: 'FH', year: 2020, verification_level: 3 })
        if (table === 'verification_documents') return makeChain({ id: 'doc-2' })
        return makeChain(null)
      },
    }

    const result = await (handler as Function)({})
    expect(result.success).toBe(true)
  })
})
