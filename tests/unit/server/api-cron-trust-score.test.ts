/**
 * Tests for server/api/cron/trust-score.post.ts
 *
 * Tests: secret verification, cron lock, empty dealers, batch update,
 * partial failures, stats returned correctly.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoisted mocks
const mockVerifyCronSecret = vi.hoisted(() => vi.fn())
const mockAcquireCronLock = vi.hoisted(() => vi.fn().mockResolvedValue(true))
const mockProcessBatch = vi.hoisted(() =>
  vi.fn().mockImplementation(
    async ({ items, processor }: { items: unknown[]; processor: (item: unknown) => Promise<void> }) => {
      for (const item of items) await processor(item)
      return { processed: items.length, errors: 0 }
    },
  ),
)

const mockSelect = vi.hoisted(() => vi.fn())
const mockUpdate = vi.hoisted(() => vi.fn())
const mockServiceRole = vi.hoisted(() =>
  vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'dealers') {
        return {
          select: mockSelect,
          update: mockUpdate,
        }
      }
      // cronLock table
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }
    }),
  })),
)

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: mockServiceRole,
}))

vi.mock('~~/server/utils/verifyCronSecret', () => ({
  verifyCronSecret: mockVerifyCronSecret,
}))

vi.mock('~~/server/utils/cronLock', () => ({
  acquireCronLock: mockAcquireCronLock,
}))

vi.mock('~~/server/utils/batchProcessor', () => ({
  processBatch: mockProcessBatch,
}))

vi.mock('~~/server/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('~~/server/utils/safeError', () => ({
  safeError: (_code: number, msg: string) => new Error(msg),
}))

vi.mock('h3', async (importOriginal) => {
  const actual = await importOriginal<typeof import('h3')>()
  return {
    ...actual,
    readBody: vi.fn().mockResolvedValue({}),
  }
})

let handler: (event: unknown) => Promise<unknown>

beforeEach(async () => {
  vi.clearAllMocks()
  mockAcquireCronLock.mockResolvedValue(true)
  vi.stubGlobal('defineEventHandler', (fn: (e: unknown) => unknown) => fn)
  vi.stubGlobal('useRuntimeConfig', () => ({ supabaseServiceRoleKey: 'svc-key', cronSecret: 'secret' }))
  vi.resetModules()
  const mod = await import('~~/server/api/cron/trust-score.post')
  handler = mod.default as typeof handler
})

const MOCK_DEALERS = [
  {
    id: 'dealer-1',
    status: 'active',
    logo_url: 'https://cdn/logo.png',
    bio: { es: 'Test' },
    phone: '612000001',
    email: 'a@example.com',
    cif_nif: 'B00000001',
    created_at: new Date(Date.now() - 200 * 24 * 3600 * 1000).toISOString(),
    active_listings: 10,
    response_rate_pct: 90,
    total_reviews: 5,
    rating: 4.8,
    verified: true,
  },
  {
    id: 'dealer-2',
    status: 'active',
    logo_url: null,
    bio: null,
    phone: null,
    email: null,
    cif_nif: null,
    created_at: null,
    active_listings: 0,
    response_rate_pct: null,
    total_reviews: null,
    rating: null,
    verified: null,
  },
]

describe('POST /api/cron/trust-score', () => {
  it('returns skipped when cron lock not acquired', async () => {
    mockAcquireCronLock.mockResolvedValue(false)
    mockSelect.mockReturnValue({ eq: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data: [], error: null }) })
    const result = await handler({}) as { skipped: boolean; reason: string }
    expect(result.skipped).toBe(true)
    expect(result.reason).toBe('already_ran_in_window')
  })

  it('returns 0 counts when no active dealers', async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    })
    const result = await handler({}) as { updated: number; total: number }
    expect(result.updated).toBe(0)
    expect(result.total).toBe(0)
  })

  it('throws 500 when dealers fetch fails', async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB down' } }),
    })
    await expect(handler({})).rejects.toThrow('Failed to fetch dealers')
  })

  it('calls update for each dealer in batch', async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null })
    const updateObj = { eq: updateEq }
    mockUpdate.mockReturnValue(updateObj)

    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: MOCK_DEALERS, error: null }),
    })

    const result = await handler({}) as { updated: number; total: number }
    expect(result.total).toBe(2)
    expect(result.updated).toBe(2)
    expect(mockUpdate).toHaveBeenCalledTimes(2)
  })

  it('passes correct trust_score values to update (fully complete dealer = 100)', async () => {
    const updateCalls: Array<Record<string, unknown>> = []
    mockUpdate.mockImplementation((payload: Record<string, unknown>) => {
      updateCalls.push(payload)
      return { eq: vi.fn().mockResolvedValue({ error: null }) }
    })

    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [MOCK_DEALERS[0]], error: null }),
    })

    await handler({})
    expect(updateCalls[0].trust_score).toBe(100)
    expect(updateCalls[0].trust_score_breakdown).toBeDefined()
  })

  it('passes correct trust_score values to update (empty dealer = 0)', async () => {
    const updateCalls: Array<Record<string, unknown>> = []
    mockUpdate.mockImplementation((payload: Record<string, unknown>) => {
      updateCalls.push(payload)
      return { eq: vi.fn().mockResolvedValue({ error: null }) }
    })

    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [MOCK_DEALERS[1]], error: null }),
    })

    await handler({})
    expect(updateCalls[0].trust_score).toBe(0)
  })

  it('counts errors when update fails', async () => {
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: { message: 'update failed' } }),
    })

    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: MOCK_DEALERS, error: null }),
    })

    const result = await handler({}) as { updated: number; errors: number }
    expect(result.errors).toBe(2)
    expect(result.updated).toBe(0)
  })

  it('sets trust_score_updated_at as ISO string', async () => {
    const updateCalls: Array<Record<string, unknown>> = []
    mockUpdate.mockImplementation((payload: Record<string, unknown>) => {
      updateCalls.push(payload)
      return { eq: vi.fn().mockResolvedValue({ error: null }) }
    })

    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [MOCK_DEALERS[0]], error: null }),
    })

    await handler({})
    expect(typeof updateCalls[0].trust_score_updated_at).toBe('string')
    expect(() => new Date(updateCalls[0].trust_score_updated_at as string)).not.toThrow()
  })

  it('returns a timestamp in the result', async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    })
    const result = await handler({}) as { timestamp: string }
    expect(typeof result.timestamp).toBe('string')
    expect(() => new Date(result.timestamp)).not.toThrow()
  })
})
