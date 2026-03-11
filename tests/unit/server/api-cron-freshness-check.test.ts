import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFetchWithRetry } = vi.hoisted(() => ({
  mockFetchWithRetry: vi.fn(),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: vi.fn().mockResolvedValue({}),
}))

vi.mock('../../../server/utils/verifyCronSecret', () => ({
  verifyCronSecret: vi.fn(),
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

vi.mock('../../../server/utils/fetchWithRetry', () => ({
  fetchWithRetry: (...a: unknown[]) => mockFetchWithRetry(...a),
}))

vi.stubGlobal('useRuntimeConfig', () => ({ supabaseServiceRoleKey: 'test-key' }))

import handler from '../../../server/api/cron/freshness-check.post'

function jsonRes(data: unknown, ok = true) {
  return { ok, json: () => Promise.resolve(data), status: ok ? 200 : 500 }
}

describe('freshness-check cron', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
  })

  it('throws 500 when service not configured', async () => {
    process.env.SUPABASE_URL = ''
    process.env.SUPABASE_SERVICE_ROLE_KEY = ''
    vi.stubGlobal('useRuntimeConfig', () => ({ supabaseServiceRoleKey: '' }))
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 500 })
    vi.stubGlobal('useRuntimeConfig', () => ({ supabaseServiceRoleKey: 'test-key' }))
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
  })

  it('returns zero counts when no stale vehicles', async () => {
    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([])) // reminder query
      .mockResolvedValueOnce(jsonRes([])) // pause query
      .mockResolvedValueOnce(jsonRes([])) // expire query
    const result = await (handler as Function)({})
    expect(result.reminded).toBe(0)
    expect(result.paused).toBe(0)
    expect(result.expired).toBe(0)
  })

  it('sends reminders for stale vehicles', async () => {
    const staleVehicles = [
      { id: 'v1', title: 'Volvo FH', dealer_id: 'd1', freshness_reminder_count: 0 },
    ]
    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes(staleVehicles)) // reminder query
      .mockResolvedValueOnce(jsonRes({}, true)) // PATCH update
      .mockResolvedValueOnce(jsonRes([])) // pause query
      .mockResolvedValueOnce(jsonRes([])) // expire query
    const result = await (handler as Function)({})
    expect(result.reminded).toBe(1)
  })

  it('pauses vehicles that are overdue after reminders', async () => {
    const pauseCandidates = [
      { id: 'v1', updated_at: '2025-01-01', freshness_reminded_at: '2025-06-01' },
    ]
    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([])) // reminder query
      .mockResolvedValueOnce(jsonRes(pauseCandidates)) // pause candidates
      .mockResolvedValueOnce(jsonRes({}, true)) // PATCH pause
      .mockResolvedValueOnce(jsonRes([])) // expire query
    const result = await (handler as Function)({})
    expect(result.paused).toBe(1)
  })

  it('does not pause if updated_at > freshness_reminded_at', async () => {
    const pauseCandidates = [
      { id: 'v1', updated_at: '2026-06-01', freshness_reminded_at: '2025-01-01' },
    ]
    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([])) // reminder
      .mockResolvedValueOnce(jsonRes(pauseCandidates)) // pause candidates (will be filtered out)
      .mockResolvedValueOnce(jsonRes([])) // expire
    const result = await (handler as Function)({})
    expect(result.paused).toBe(0)
  })

  it('expires very old vehicles (90+ days)', async () => {
    const expireCandidates = [{ id: 'v1' }]
    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([])) // reminder
      .mockResolvedValueOnce(jsonRes([])) // pause
      .mockResolvedValueOnce(jsonRes(expireCandidates)) // expire query
      .mockResolvedValueOnce(jsonRes({}, true)) // PATCH expire
    const result = await (handler as Function)({})
    expect(result.expired).toBe(1)
  })

  it('handles non-array responses gracefully', async () => {
    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes({ error: 'bad' })) // not array
      .mockResolvedValueOnce(jsonRes({ error: 'bad' }))
      .mockResolvedValueOnce(jsonRes({ error: 'bad' }))
    const result = await (handler as Function)({})
    expect(result.reminded).toBe(0)
    expect(result.paused).toBe(0)
    expect(result.expired).toBe(0)
  })
})
