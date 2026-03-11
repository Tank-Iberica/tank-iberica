/**
 * Tests for POST /api/cron/founding-expiry
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockReadBody, mockVerifyCronSecret, mockFetchWithRetry, mockLogger } = vi.hoisted(() => ({
  mockReadBody: vi.fn().mockResolvedValue({ secret: 'test-secret' }),
  mockVerifyCronSecret: vi.fn(),
  mockFetchWithRetry: vi.fn(),
  mockLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: mockReadBody,
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

vi.mock('../../../server/utils/fetchWithRetry', () => ({
  fetchWithRetry: (...a: unknown[]) => mockFetchWithRetry(...a),
}))
vi.mock('~~/server/utils/fetchWithRetry', () => ({
  fetchWithRetry: (...a: unknown[]) => mockFetchWithRetry(...a),
}))

// Inline processBatch that calls processor
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

vi.mock('../../../server/utils/logger', () => ({
  logger: mockLogger,
}))

vi.stubGlobal('useRuntimeConfig', () => ({
  supabaseServiceRoleKey: 'sb-key',
  cronSecret: 'test-secret',
  public: {},
}))

const mockFetch = vi.fn().mockResolvedValue({ ok: true })
vi.stubGlobal('$fetch', mockFetch)

process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb-key'

function jsonRes(data: unknown, ok = true) {
  return { ok, json: () => Promise.resolve(data), status: ok ? 200 : 500, text: () => Promise.resolve('') }
}

import handler from '../../../server/api/cron/founding-expiry.post'

describe('POST /api/cron/founding-expiry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // mockReset clears mockResolvedValueOnce queue (clearAllMocks only clears history)
    mockFetchWithRetry.mockReset()
    // Restore default implementations after reset
    mockReadBody.mockResolvedValue({ secret: 'test-secret' })
    mockFetch.mockResolvedValue({ ok: true })
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb-key'
    vi.stubGlobal('useRuntimeConfig', () => ({
      supabaseServiceRoleKey: 'sb-key',
      cronSecret: 'test-secret',
      public: {},
    }))
  })

  // ── Basic handler tests ────────────────────────────────────────────────────

  it('throws 500 when service not configured', async () => {
    process.env.SUPABASE_URL = ''
    vi.stubGlobal('useRuntimeConfig', () => ({
      supabaseServiceRoleKey: '',
      cronSecret: 'test-secret',
      public: {},
    }))
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 500 })
  })

  it('throws 500 when SUPABASE_SERVICE_ROLE_KEY is missing', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = ''
    vi.stubGlobal('useRuntimeConfig', () => ({
      supabaseServiceRoleKey: '',
      cronSecret: 'test-secret',
      public: {},
    }))
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 500 })
  })

  it('returns zeros when no founding subscriptions', async () => {
    mockFetchWithRetry.mockResolvedValue(jsonRes([]))
    const result = await (handler as Function)({})
    expect(result).toMatchObject({ notified_30d: 0, notified_7d: 0, expired: 0, vehicles_paused: 0 })
  })

  it('returns zeros when subscriptions array is not an array', async () => {
    mockFetchWithRetry.mockResolvedValue(jsonRes('not-an-array'))
    const result = await (handler as Function)({})
    expect(result).toMatchObject({ notified_30d: 0, notified_7d: 0, expired: 0, vehicles_paused: 0 })
  })

  it('throws 500 when subscription fetch fails', async () => {
    mockFetchWithRetry.mockResolvedValue(jsonRes(null, false))
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 500 })
  })

  it('handles readBody failure gracefully', async () => {
    mockReadBody.mockRejectedValueOnce(new Error('parse error'))
    mockFetchWithRetry.mockResolvedValue(jsonRes([]))
    const result = await (handler as Function)({})
    expect(result).toMatchObject({ notified_30d: 0, notified_7d: 0, expired: 0, vehicles_paused: 0 })
  })

  // ── 30-day reminder tests ─────────────────────────────────────────────────

  it('sends 30d reminder for subscription expiring in 20 days', async () => {
    const expiresAt = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub])) // subscriptions
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { es: 'Test' }, email: 'test@test.com', locale: 'es', badge: 'founding' }])) // dealer
      .mockResolvedValueOnce(jsonRes([])) // email_logs (not sent yet)

    const result = await (handler as Function)({})
    expect(result.notified_30d).toBe(1)
    expect(mockFetch).toHaveBeenCalled()
  })

  it('skips 30d reminder if already sent', async () => {
    const expiresAt = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { es: 'Test' }, email: 'test@test.com', locale: 'es', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes([{ id: 'log-1', template_key: 'founding_expiring_30d', recipient_email: 'test@test.com', created_at: new Date().toISOString() }]))

    const result = await (handler as Function)({})
    expect(result.notified_30d).toBe(0)
  })

  it('does not send 30d reminder if expiry is more than 30 days away', async () => {
    const expiresAt = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { es: 'Test' }, email: 'test@test.com', locale: 'es', badge: 'founding' }]))

    const result = await (handler as Function)({})
    expect(result.notified_30d).toBe(0)
    expect(result.notified_7d).toBe(0)
  })

  // ── 7-day reminder tests ──────────────────────────────────────────────────

  it('sends 7d reminder for subscription expiring in 5 days', async () => {
    const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    // sendReminder7d: 1 fetchWithRetry for hasAlreadySentEmail
    // sendReminder30d returns false immediately (daysUntilExpiry <= 7), no fetch
    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub])) // subscriptions
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: 'Test Dealer', email: 'test@test.com', locale: null, badge: 'founding' }])) // dealer
      .mockResolvedValueOnce(jsonRes([])) // 7d email_logs check

    const result = await (handler as Function)({})
    expect(result.notified_7d).toBe(1)
  })

  it('skips 7d reminder if already sent within 7 days', async () => {
    const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { es: 'Test' }, email: 'test@test.com', locale: 'es', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes([{ id: 'log-7d', template_key: 'founding_expiring_7d', recipient_email: 'test@test.com', created_at: new Date().toISOString() }])) // already sent

    const result = await (handler as Function)({})
    expect(result.notified_7d).toBe(0)
  })

  it('does not send 30d reminder in 7d window (daysUntilExpiry <= 7)', async () => {
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { es: 'Test' }, email: 'test@test.com', locale: 'es', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes([])) // 7d check - not sent

    const result = await (handler as Function)({})
    expect(result.notified_7d).toBe(1)
    // 30d should NOT be sent because daysUntilExpiry <= 7 → sendReminder30d returns false
    expect(result.notified_30d).toBe(0)
  })

  // ── Expiry/downgrade tests ────────────────────────────────────────────────

  it('downgrades expired subscription', async () => {
    const expiresAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub])) // subscriptions
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { es: 'Expired' }, email: 'test@test.com', locale: 'es', badge: 'founding' }])) // dealer
      .mockResolvedValueOnce(jsonRes(null, true)) // downgrade subscription PATCH
      .mockResolvedValueOnce(jsonRes(null, true)) // update dealer PATCH
      .mockResolvedValueOnce(jsonRes([])) // vehicles (none to pause)

    const result = await (handler as Function)({})
    expect(result.expired).toBe(1)
    expect(result.vehicles_paused).toBe(0)
  })

  it('does not downgrade when subscription PATCH fails', async () => {
    const expiresAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { es: 'Test' }, email: 'test@test.com', locale: 'es', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes(null, false)) // downgrade sub FAILS

    const result = await (handler as Function)({})
    // The expired counter is still incremented in processSubscription (line 305)
    // even when downgrade fails, because we entered the daysUntilExpiry <= 0 branch.
    // But vehiclesPaused should be 0 since handleFoundingExpiry returned 0.
    expect(result.expired).toBe(1)
    expect(result.vehicles_paused).toBe(0)
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to downgrade subscription s1'),
    )
  })

  it('logs error but continues when dealer PATCH fails after subscription downgrade', async () => {
    const expiresAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { es: 'Test' }, email: 'test@test.com', locale: 'es', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes(null, true)) // downgrade sub OK
      .mockResolvedValueOnce(jsonRes(null, false)) // update dealer FAILS
      .mockResolvedValueOnce(jsonRes([])) // vehicles

    const result = await (handler as Function)({})
    // subscription was still downgraded, so expired should be 1
    expect(result.expired).toBe(1)
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to update dealer d1 after expiry'),
    )
  })

  // ── Vehicle pausing tests ─────────────────────────────────────────────────

  it('does not pause vehicles if 3 or fewer', async () => {
    const expiresAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: 'Small', email: 'test@test.com', locale: 'es', badge: null }]))
      .mockResolvedValueOnce(jsonRes(null, true)) // downgrade sub
      .mockResolvedValueOnce(jsonRes(null, true)) // update dealer
      .mockResolvedValueOnce(jsonRes([ // only 2 vehicles
        { id: 'v1', status: 'published', created_at: '2024-01-01' },
        { id: 'v2', status: 'published', created_at: '2024-01-02' },
      ]))

    const result = await (handler as Function)({})
    expect(result.vehicles_paused).toBe(0)
  })

  it('pauses excess vehicles beyond the 3-vehicle free limit', async () => {
    const expiresAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub])) // subscriptions
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { es: 'Big Dealer' }, email: 'test@test.com', locale: 'es', badge: 'founding' }])) // dealer
      .mockResolvedValueOnce(jsonRes(null, true)) // downgrade sub
      .mockResolvedValueOnce(jsonRes(null, true)) // update dealer
      .mockResolvedValueOnce(jsonRes([ // 5 vehicles - 2 over the limit
        { id: 'v1', status: 'published', created_at: '2024-01-01' },
        { id: 'v2', status: 'published', created_at: '2024-01-02' },
        { id: 'v3', status: 'published', created_at: '2024-01-03' },
        { id: 'v4', status: 'published', created_at: '2024-01-04' },
        { id: 'v5', status: 'published', created_at: '2024-01-05' },
      ])) // vehicles
      .mockResolvedValueOnce(jsonRes(null, true)) // pause v4
      .mockResolvedValueOnce(jsonRes(null, true)) // pause v5

    const result = await (handler as Function)({})
    expect(result.expired).toBe(1)
    expect(result.vehicles_paused).toBe(2)
  })

  it('logs error when a vehicle pause PATCH fails', async () => {
    const expiresAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { es: 'Dealer' }, email: 'test@test.com', locale: 'es', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes(null, true)) // downgrade sub
      .mockResolvedValueOnce(jsonRes(null, true)) // update dealer
      .mockResolvedValueOnce(jsonRes([
        { id: 'v1', status: 'published', created_at: '2024-01-01' },
        { id: 'v2', status: 'published', created_at: '2024-01-02' },
        { id: 'v3', status: 'published', created_at: '2024-01-03' },
        { id: 'v4', status: 'published', created_at: '2024-01-04' },
      ]))
      .mockResolvedValueOnce(jsonRes(null, false)) // pause v4 FAILS

    const result = await (handler as Function)({})
    expect(result.vehicles_paused).toBe(0) // none paused successfully
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to pause vehicle v4'),
    )
  })

  it('counts only successfully paused vehicles', async () => {
    const expiresAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { es: 'Dealer' }, email: 'test@test.com', locale: 'es', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes(null, true)) // downgrade sub
      .mockResolvedValueOnce(jsonRes(null, true)) // update dealer
      .mockResolvedValueOnce(jsonRes([
        { id: 'v1', status: 'published', created_at: '2024-01-01' },
        { id: 'v2', status: 'published', created_at: '2024-01-02' },
        { id: 'v3', status: 'published', created_at: '2024-01-03' },
        { id: 'v4', status: 'published', created_at: '2024-01-04' },
        { id: 'v5', status: 'published', created_at: '2024-01-05' },
      ]))
      .mockResolvedValueOnce(jsonRes(null, true))  // pause v4 OK
      .mockResolvedValueOnce(jsonRes(null, false)) // pause v5 FAILS

    const result = await (handler as Function)({})
    expect(result.vehicles_paused).toBe(1) // only v4 paused
  })

  it('returns 0 paused when vehicle fetch fails', async () => {
    const expiresAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { es: 'Dealer' }, email: 'test@test.com', locale: 'es', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes(null, true)) // downgrade sub
      .mockResolvedValueOnce(jsonRes(null, true)) // update dealer
      .mockResolvedValueOnce(jsonRes(null, false)) // vehicles fetch FAILS

    const result = await (handler as Function)({})
    expect(result.expired).toBe(1)
    expect(result.vehicles_paused).toBe(0)
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to fetch vehicles for dealer d1'),
    )
  })

  it('returns 0 paused when vehicles response is not an array', async () => {
    const expiresAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { es: 'Dealer' }, email: 'test@test.com', locale: 'es', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes(null, true)) // downgrade sub
      .mockResolvedValueOnce(jsonRes(null, true)) // update dealer
      .mockResolvedValueOnce(jsonRes('not-an-array')) // vehicles is not array

    const result = await (handler as Function)({})
    expect(result.vehicles_paused).toBe(0)
  })

  // ── Dealer lookup edge cases ──────────────────────────────────────────────

  it('skips dealer without email', async () => {
    const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: 'No Email', email: null, locale: null, badge: null }]))

    const result = await (handler as Function)({})
    expect(result.notified_30d).toBe(0)
  })

  it('skips when dealer fetch fails', async () => {
    const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes(null, false)) // dealer fetch fails

    const result = await (handler as Function)({})
    expect(result.notified_30d).toBe(0)
  })

  it('skips when dealer list is empty', async () => {
    const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([])) // no dealers found

    const result = await (handler as Function)({})
    expect(result.notified_30d).toBe(0)
  })

  it('skips subscription with no expires_at', async () => {
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: null, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))

    const result = await (handler as Function)({})
    expect(result.notified_30d).toBe(0)
    expect(result.notified_7d).toBe(0)
    expect(result.expired).toBe(0)
  })

  // ── resolveDealerName edge cases ──────────────────────────────────────────

  it('resolves dealer name from multilingual object with correct locale', async () => {
    const expiresAt = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { es: 'Empresa', en: 'Company' }, email: 'test@test.com', locale: 'en', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes([])) // email_logs

    await (handler as Function)({})
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/email/send',
      expect.objectContaining({
        body: expect.objectContaining({
          variables: expect.objectContaining({ dealerName: 'Company' }),
        }),
      }),
    )
  })

  it('resolves dealer name from string type', async () => {
    const expiresAt = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: 'Simple Name', email: 'test@test.com', locale: 'es', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes([])) // email_logs

    await (handler as Function)({})
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/email/send',
      expect.objectContaining({
        body: expect.objectContaining({
          variables: expect.objectContaining({ dealerName: 'Simple Name' }),
        }),
      }),
    )
  })

  it('falls back to "es" locale in company_name when requested locale is missing', async () => {
    const expiresAt = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { es: 'Nombre ES', de: 'Name DE' }, email: 'test@test.com', locale: 'fr', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes([])) // email_logs

    await (handler as Function)({})
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/email/send',
      expect.objectContaining({
        body: expect.objectContaining({
          variables: expect.objectContaining({ dealerName: 'Nombre ES' }),
        }),
      }),
    )
  })

  it('falls back to any truthy value when locale and "es" are both missing', async () => {
    const expiresAt = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { de: 'German Name' }, email: 'test@test.com', locale: 'fr', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes([])) // email_logs

    await (handler as Function)({})
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/email/send',
      expect.objectContaining({
        body: expect.objectContaining({
          variables: expect.objectContaining({ dealerName: 'German Name' }),
        }),
      }),
    )
  })

  it('uses empty string from company_name when locale value is empty (nullish coalescing)', async () => {
    // The ?? operator treats '' as non-nullish, so companyName['es'] = '' resolves to ''
    const expiresAt = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { es: '', en: '' }, email: 'test@test.com', locale: 'es', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes([])) // email_logs

    await (handler as Function)({})
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/email/send',
      expect.objectContaining({
        body: expect.objectContaining({
          variables: expect.objectContaining({ dealerName: '' }),
        }),
      }),
    )
  })

  it('falls back to "Dealer" when company_name object has only undefined values', async () => {
    // Only undefined/null values fall through ?? chains to the 'Dealer' fallback
    const expiresAt = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { fr: undefined }, email: 'test@test.com', locale: 'es', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes([])) // email_logs

    await (handler as Function)({})
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/email/send',
      expect.objectContaining({
        body: expect.objectContaining({
          variables: expect.objectContaining({ dealerName: 'Dealer' }),
        }),
      }),
    )
  })

  it('falls back to "Dealer" when company_name is null', async () => {
    const expiresAt = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: null, email: 'test@test.com', locale: 'es', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes([])) // email_logs

    await (handler as Function)({})
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/email/send',
      expect.objectContaining({
        body: expect.objectContaining({
          variables: expect.objectContaining({ dealerName: 'Dealer' }),
        }),
      }),
    )
  })

  // ── Email failure handling ────────────────────────────────────────────────

  it('logs error when 30d email $fetch fails', async () => {
    const expiresAt = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { es: 'Test' }, email: 'test@test.com', locale: 'es', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes([])) // email_logs - not sent

    mockFetch.mockRejectedValueOnce(new Error('email service down'))

    const result = await (handler as Function)({})
    // sendReminder30d still returns true (it caught the error)
    expect(result.notified_30d).toBe(1)
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('30d email failed for dealer d1'),
    )
  })

  it('logs error when 7d email $fetch fails', async () => {
    const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { es: 'Test' }, email: 'test@test.com', locale: 'es', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes([])) // 7d email_logs

    mockFetch.mockRejectedValueOnce(new Error('email service down'))

    const result = await (handler as Function)({})
    expect(result.notified_7d).toBe(1)
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('7d email failed for dealer d1'),
    )
  })

  it('logs error when expiry email $fetch fails with non-Error', async () => {
    const expiresAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { es: 'Test' }, email: 'test@test.com', locale: 'es', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes(null, true)) // downgrade sub
      .mockResolvedValueOnce(jsonRes(null, true)) // update dealer
      .mockResolvedValueOnce(jsonRes([])) // vehicles (none)

    mockFetch.mockRejectedValueOnce('string error')

    const result = await (handler as Function)({})
    expect(result.expired).toBe(1)
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Expiry email failed for dealer d1'),
    )
  })

  it('logs error when 30d email $fetch fails with non-Error', async () => {
    const expiresAt = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { es: 'Test' }, email: 'test@test.com', locale: 'es', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes([])) // email_logs

    mockFetch.mockRejectedValueOnce('string error')

    const result = await (handler as Function)({})
    expect(result.notified_30d).toBe(1)
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('30d email failed for dealer d1'),
    )
  })

  // ── hasAlreadySentEmail edge cases ────────────────────────────────────────

  it('returns false for hasAlreadySentEmail when fetch returns non-ok', async () => {
    const expiresAt = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { es: 'Test' }, email: 'test@test.com', locale: 'es', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes(null, false)) // email_logs check fails

    const result = await (handler as Function)({})
    // When hasAlreadySentEmail fails, it returns false → so the 30d email is sent
    expect(result.notified_30d).toBe(1)
  })

  // ── Locale and formatting tests ───────────────────────────────────────────

  it('uses "es" locale when dealer locale is null', async () => {
    const expiresAt = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: 'Test Dealer', email: 'test@test.com', locale: null, badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes([]))

    await (handler as Function)({})
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/email/send',
      expect.objectContaining({
        body: expect.objectContaining({
          locale: 'es',
        }),
      }),
    )
  })

  it('uses "en" locale when dealer locale is "en"', async () => {
    const expiresAt = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { en: 'English Dealer' }, email: 'test@test.com', locale: 'en', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes([]))

    await (handler as Function)({})
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/email/send',
      expect.objectContaining({
        body: expect.objectContaining({
          locale: 'en',
        }),
      }),
    )
  })

  // ── Internal secret header tests ──────────────────────────────────────────

  it('sends x-internal-secret header when cronSecret is set', async () => {
    const expiresAt = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { es: 'Test' }, email: 'test@test.com', locale: 'es', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes([]))

    await (handler as Function)({})
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/email/send',
      expect.objectContaining({
        headers: { 'x-internal-secret': 'test-secret' },
      }),
    )
  })

  it('sends empty headers when cronSecret is falsy', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      supabaseServiceRoleKey: 'sb-key',
      cronSecret: '',
      public: {},
    }))
    const origCronSecret = process.env.CRON_SECRET
    delete process.env.CRON_SECRET

    const expiresAt = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { es: 'Test' }, email: 'test@test.com', locale: 'es', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes([]))

    await (handler as Function)({})
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/email/send',
      expect.objectContaining({
        headers: {},
      }),
    )

    // Restore
    if (origCronSecret !== undefined) process.env.CRON_SECRET = origCronSecret
  })

  // ── Multiple subscriptions test ───────────────────────────────────────────

  it('processes multiple subscriptions with different lifecycle stages', async () => {
    const sub30d = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), vertical: 'tracciona' }
    const sub7d = { id: 's2', user_id: 'u2', plan: 'founding', status: 'active', expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), vertical: 'tracciona' }
    const subExpired = { id: 's3', user_id: 'u3', plan: 'founding', status: 'active', expires_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), vertical: 'tracciona' }

    mockFetchWithRetry
      // All subs
      .mockResolvedValueOnce(jsonRes([sub30d, sub7d, subExpired]))
      // sub30d: dealer + email_logs
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { es: 'Dealer1' }, email: 'd1@test.com', locale: 'es', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes([]))
      // sub7d: dealer + 7d email_logs
      .mockResolvedValueOnce(jsonRes([{ id: 'd2', company_name: { es: 'Dealer2' }, email: 'd2@test.com', locale: 'es', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes([]))
      // subExpired: dealer + downgrade + update dealer + vehicles
      .mockResolvedValueOnce(jsonRes([{ id: 'd3', company_name: { es: 'Dealer3' }, email: 'd3@test.com', locale: 'es', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes(null, true)) // downgrade
      .mockResolvedValueOnce(jsonRes(null, true)) // update dealer
      .mockResolvedValueOnce(jsonRes([])) // no vehicles

    const result = await (handler as Function)({})
    expect(result.notified_30d).toBe(1)
    expect(result.notified_7d).toBe(1)
    expect(result.expired).toBe(1)
  })

  // ── upgradeUrl test ───────────────────────────────────────────────────────

  it('includes correct upgradeUrl in email variables', async () => {
    const origSiteUrl = process.env.NUXT_PUBLIC_SITE_URL
    process.env.NUXT_PUBLIC_SITE_URL = 'https://custom.tracciona.com'

    const expiresAt = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { es: 'Test' }, email: 'test@test.com', locale: 'es', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes([]))

    await (handler as Function)({})
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/email/send',
      expect.objectContaining({
        body: expect.objectContaining({
          variables: expect.objectContaining({
            upgradeUrl: 'https://custom.tracciona.com/dashboard/suscripcion',
          }),
        }),
      }),
    )

    // Restore
    if (origSiteUrl !== undefined) process.env.NUXT_PUBLIC_SITE_URL = origSiteUrl
    else delete process.env.NUXT_PUBLIC_SITE_URL
  })

  // ── 7d reminder includes daysLeft ─────────────────────────────────────────

  it('includes daysLeft in 7d reminder email variables', async () => {
    const expiresAt = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { es: 'Test' }, email: 'test@test.com', locale: 'es', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes([])) // 7d email_logs

    await (handler as Function)({})
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/email/send',
      expect.objectContaining({
        body: expect.objectContaining({
          templateKey: 'founding_expiring_7d',
          variables: expect.objectContaining({
            daysLeft: expect.stringMatching(/^\d+$/),
          }),
        }),
      }),
    )
  })

  // ── Expiry email uses founding_expired template ───────────────────────────

  it('sends founding_expired template on expiry', async () => {
    const expiresAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    const sub = { id: 's1', user_id: 'u1', plan: 'founding', status: 'active', expires_at: expiresAt, vertical: 'tracciona' }

    mockFetchWithRetry
      .mockResolvedValueOnce(jsonRes([sub]))
      .mockResolvedValueOnce(jsonRes([{ id: 'd1', company_name: { es: 'Test' }, email: 'test@test.com', locale: 'es', badge: 'founding' }]))
      .mockResolvedValueOnce(jsonRes(null, true)) // downgrade sub
      .mockResolvedValueOnce(jsonRes(null, true)) // update dealer
      .mockResolvedValueOnce(jsonRes([])) // vehicles

    await (handler as Function)({})
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/email/send',
      expect.objectContaining({
        body: expect.objectContaining({
          templateKey: 'founding_expired',
        }),
      }),
    )
  })

  // ── Timestamp in response ─────────────────────────────────────────────────

  it('includes ISO timestamp in response', async () => {
    mockFetchWithRetry.mockResolvedValue(jsonRes([]))
    const result = await (handler as Function)({})
    expect(result.timestamp).toBeDefined()
    // Should be a valid ISO date
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp)
  })
})
