/**
 * Tests for POST /api/dealer/import-stock
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockServerUser, mockReadBody, mockCallAI, mockCheckRateLimit, mockGetRateLimitKey, mockGetRetryAfterSeconds } = vi.hoisted(() => ({
  mockServerUser: vi.fn(),
  mockReadBody: vi.fn(),
  mockCallAI: vi.fn(),
  mockCheckRateLimit: vi.fn().mockReturnValue(true),
  mockGetRateLimitKey: vi.fn().mockReturnValue('test-ip'),
  mockGetRetryAfterSeconds: vi.fn().mockReturnValue(3600),
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

let mockSupabase: Record<string, unknown>

vi.mock('#supabase/server', () => ({
  serverSupabaseUser: (...a: unknown[]) => mockServerUser(...a),
  serverSupabaseServiceRole: () => mockSupabase,
}))

vi.mock('~~/server/services/aiProvider', () => ({
  callAI: (...a: unknown[]) => mockCallAI(...a),
}))

vi.mock('~~/server/utils/rateLimit', () => ({
  checkRateLimit: (...a: unknown[]) => mockCheckRateLimit(...a),
  getRateLimitKey: (...a: unknown[]) => mockGetRateLimitKey(...a),
  getRetryAfterSeconds: (...a: unknown[]) => mockGetRetryAfterSeconds(...a),
}))

vi.mock('~~/server/utils/safeError', () => ({
  safeError: (_code: number, msg: string) => {
    const err = new Error(msg) as Error & { statusCode: number }
    err.statusCode = _code
    return err
  },
}))

vi.mock('../../../server/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// Mock global fetch for fetchPageHtml
const mockGlobalFetch = vi.fn()
vi.stubGlobal('fetch', mockGlobalFetch)

function makeChain(data: unknown = null, error: unknown = null) {
  const chain: Record<string, unknown> = {}
  const ms = ['select', 'eq', 'maybeSingle', 'single', 'insert']
  for (const m of ms) chain[m] = (..._a: unknown[]) => chain
  chain.then = (r: (v: unknown) => void) => Promise.resolve({ data, error }).then(r)
  chain.catch = (r: (v: unknown) => void) => Promise.resolve({ data, error: null }).catch(r)
  return chain
}

import handler from '../../../server/api/dealer/import-stock.post'

describe('POST /api/dealer/import-stock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCheckRateLimit.mockReturnValue(true)
  })

  it('throws 401 when not authenticated', async () => {
    mockServerUser.mockResolvedValue(null)
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 403 when user is not a dealer', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockSupabase = { from: () => makeChain(null) }
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 429 when rate limited', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockSupabase = { from: () => makeChain({ id: 'd1', company_name: 'Test' }) }
    mockCheckRateLimit.mockReturnValue(false)
    mockReadBody.mockResolvedValue({ url: 'https://mascus.es/dealer', consent: true })
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 429 })
  })

  it('throws 400 when consent not given', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockSupabase = { from: () => makeChain({ id: 'd1', company_name: 'Test' }) }
    mockReadBody.mockResolvedValue({ url: 'https://mascus.es/dealer', consent: false })
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when URL is missing', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockSupabase = { from: () => makeChain({ id: 'd1', company_name: 'Test' }) }
    mockReadBody.mockResolvedValue({ consent: true })
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 for invalid URL format', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockSupabase = { from: () => makeChain({ id: 'd1', company_name: 'Test' }) }
    mockReadBody.mockResolvedValue({ url: 'not-a-url', consent: true })
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 for unsupported domain', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockSupabase = { from: () => makeChain({ id: 'd1', company_name: 'Test' }) }
    mockReadBody.mockResolvedValue({ url: 'https://evil.com/page', consent: true })
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 502 when page fetch fails', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockSupabase = { from: () => makeChain({ id: 'd1', company_name: 'Test' }) }
    mockReadBody.mockResolvedValue({ url: 'https://mascus.es/dealer', consent: true })
    mockGlobalFetch.mockRejectedValue(new Error('Timeout'))
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 502 })
  })

  it('returns 0 imported when AI finds no vehicles', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockSupabase = { from: () => makeChain({ id: 'd1', company_name: 'Test' }) }
    mockReadBody.mockResolvedValue({ url: 'https://mascus.es/dealer', consent: true })
    mockGlobalFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve('<html>empty</html>') })
    mockCallAI.mockResolvedValue({ text: 'No vehicles found' })

    const result = await (handler as Function)({})
    expect(result.success).toBe(true)
    expect(result.imported).toBe(0)
  })

  it('imports vehicles from AI extraction', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockReadBody.mockResolvedValue({ url: 'https://mascus.es/dealer', consent: true })
    mockGlobalFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve('<html><body>vehicles</body></html>') })

    const vehicles = [
      { brand: 'Volvo', model: 'FH', year: 2020, price: 50000, description: 'Truck', imageUrls: [] },
      { brand: 'DAF', model: 'XF', year: 2019, price: 45000, description: 'Truck', imageUrls: [] },
    ]
    mockCallAI.mockResolvedValue({ text: JSON.stringify(vehicles) })

    // Supabase: dealer found + inserts succeed
    mockSupabase = {
      from: (table: string) => {
        if (table === 'dealers') return makeChain({ id: 'd1', company_name: 'Test' })
        if (table === 'vehicles') return makeChain(null) // insert ok (no error)
        return makeChain(null)
      },
    }

    const result = await (handler as Function)({})
    expect(result.success).toBe(true)
    expect(result.imported).toBe(2)
  })

  it('throws 500 when AI extraction fails', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockSupabase = { from: () => makeChain({ id: 'd1', company_name: 'Test' }) }
    mockReadBody.mockResolvedValue({ url: 'https://mascus.es/dealer', consent: true })
    mockGlobalFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve('<html>page</html>') })
    mockCallAI.mockRejectedValue(new Error('AI unavailable'))

    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 500 })
  })

  it('returns empty JSON array result', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockSupabase = { from: () => makeChain({ id: 'd1', company_name: 'Test' }) }
    mockReadBody.mockResolvedValue({ url: 'https://machineryzone.es/dealer', consent: true })
    mockGlobalFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve('<html>page</html>') })
    mockCallAI.mockResolvedValue({ text: '[]' })

    const result = await (handler as Function)({})
    expect(result.success).toBe(true)
    expect(result.imported).toBe(0)
  })
})
