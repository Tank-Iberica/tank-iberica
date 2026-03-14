import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFetchWithRetry, mockResendSend, MockResend, mockLogger } = vi.hoisted(() => {
  const mockResendSend = vi.fn().mockResolvedValue({ data: { id: 'msg_ok' }, error: null })
  const MockResend = vi.fn(function () {
    return { emails: { send: mockResendSend } }
  })
  return {
    mockFetchWithRetry: vi.fn(),
    mockResendSend,
    MockResend,
    mockLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  }
})

vi.mock('~~/server/utils/cronLock', () => ({ acquireDbCronLock: vi.fn().mockResolvedValue(true) }))
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

vi.mock('../../../server/utils/fetchWithRetry', () => ({
  fetchWithRetry: (...a: unknown[]) => mockFetchWithRetry(...a),
}))

vi.mock('../../../server/utils/logger', () => ({ logger: mockLogger }))

vi.mock('../../../server/utils/siteConfig', () => ({
  getSiteUrl: () => 'https://tracciona.com',
  getSiteName: () => 'Tracciona',
  getSiteEmail: () => 'hola@tracciona.com',
}))

vi.mock('resend', () => ({ Resend: MockResend }))

vi.stubGlobal('useRuntimeConfig', () => ({
  supabaseServiceRoleKey: 'test-key',
  resendApiKey: 'test-resend-key',
}))

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
    vi.stubGlobal('useRuntimeConfig', () => ({ supabaseServiceRoleKey: '', resendApiKey: '' }))
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 500 })
    vi.stubGlobal('useRuntimeConfig', () => ({
      supabaseServiceRoleKey: 'test-key',
      resendApiKey: 'test-resend-key',
    }))
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
    expect(result.emailsSent).toBe(0)
  })

  it('sends reminders for stale vehicles', async () => {
    const staleVehicles = [
      {
        id: 'v1',
        title_es: 'Volvo FH',
        dealer_id: 'd1',
        freshness_reminder_count: 0,
        dealer: { email: 'dealer@test.com', locale: 'es' },
      },
    ]
    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes(staleVehicles)) // reminder query
      .mockResolvedValueOnce(jsonRes({}, true)) // PATCH update
      .mockResolvedValueOnce(jsonRes([])) // pause query
      .mockResolvedValueOnce(jsonRes([])) // expire query
    const result = await (handler as Function)({})
    expect(result.reminded).toBe(1)
    expect(result.emailsSent).toBe(1)
    expect(mockResendSend).toHaveBeenCalledOnce()
  })

  it('skips reminder email when dealer has no email', async () => {
    const staleVehicles = [
      {
        id: 'v1',
        title_es: 'Volvo FH',
        dealer_id: 'd1',
        freshness_reminder_count: 0,
        dealer: { email: null, locale: 'es' },
      },
    ]
    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes(staleVehicles))
      .mockResolvedValueOnce(jsonRes({}, true))
      .mockResolvedValueOnce(jsonRes([]))
      .mockResolvedValueOnce(jsonRes([]))
    const result = await (handler as Function)({})
    expect(result.reminded).toBe(1)
    expect(result.emailsSent).toBe(0)
    expect(mockResendSend).not.toHaveBeenCalled()
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
      .mockResolvedValueOnce(jsonRes([]))
      .mockResolvedValueOnce(jsonRes(pauseCandidates)) // will be filtered out
      .mockResolvedValueOnce(jsonRes([]))
    const result = await (handler as Function)({})
    expect(result.paused).toBe(0)
  })

  it('expires very old vehicles (90+ days) and sends expiry email', async () => {
    const expireCandidates = [
      {
        id: 'v1',
        title_es: 'Iveco Daily',
        dealer: { email: 'dealer@test.com', locale: 'es' },
      },
    ]
    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([])) // reminder
      .mockResolvedValueOnce(jsonRes([])) // pause
      .mockResolvedValueOnce(jsonRes(expireCandidates)) // expire query
      .mockResolvedValueOnce(jsonRes({}, true)) // PATCH expire
    const result = await (handler as Function)({})
    expect(result.expired).toBe(1)
    expect(result.emailsSent).toBe(1)
    expect(mockResendSend).toHaveBeenCalledOnce()
  })

  it('skips expiry email when no dealer email', async () => {
    const expireCandidates = [{ id: 'v1', title_es: 'Iveco Daily', dealer: null }]
    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([]))
      .mockResolvedValueOnce(jsonRes([]))
      .mockResolvedValueOnce(jsonRes(expireCandidates))
      .mockResolvedValueOnce(jsonRes({}, true))
    const result = await (handler as Function)({})
    expect(result.expired).toBe(1)
    expect(result.emailsSent).toBe(0)
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
