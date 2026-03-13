/**
 * Tests for GDPR endpoints:
 *   GET  /api/account/export  — Right to Data Portability
 *   POST /api/account/delete  — Right to Erasure
 *
 * Both are agent-c domain (security/trust/legal).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Shared Supabase mock ───────────────────────────────────────────────────────

const mockUser = { id: 'user-123', email: 'test@example.com' }
const mockProfile = {
  id: 'user-123',
  name: 'Test',
  apellidos: 'User',
  pseudonimo: null,
  phone: null,
  email: 'test@example.com',
  role: 'user',
  avatar_url: null,
  created_at: '2025-01-01T00:00:00Z',
}
const mockDealer = { id: 'dealer-456', user_id: 'user-123', company_name: 'Test Dealer' }

function makeMockSupabase(overrides: Record<string, unknown> = {}) {
  const fromImpl = (table: string) => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: table === 'dealers' ? mockDealer : null }),
      single: vi.fn().mockResolvedValue({ data: mockProfile }),
      delete: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      ...overrides,
    }
    return chain
  }

  return {
    from: vi.fn((table: string) => fromImpl(table)),
    auth: {
      admin: {
        deleteUser: vi.fn().mockResolvedValue({ error: null }),
      },
    },
  }
}

vi.mock('#supabase/server', () => ({
  serverSupabaseUser: vi.fn().mockResolvedValue(mockUser),
  serverSupabaseServiceRole: vi.fn(),
}))

vi.mock('~/server/utils/safeError', () => ({
  safeError: (code: number, msg: string) => Object.assign(new Error(msg), { statusCode: code }),
}))

vi.mock('~/server/utils/verifyCsrf', () => ({
  verifyCsrf: vi.fn(),
}))

vi.mock('~/server/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

// ── export.get.ts ──────────────────────────────────────────────────────────────

describe('GET /api/account/export', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function makeExportEvent() {
    const headers: Record<string, string> = {}
    return {
      node: {
        req: { headers: { 'user-agent': 'Mozilla/5.0' } },
        res: {
          setHeader: (k: string, v: string) => {
            headers[k.toLowerCase()] = v
          },
        },
      },
      _responseHeaders: headers,
    } as unknown as Parameters<
      (typeof import('~/server/api/account/export.get'))['default']
    >[0]
  }

  it('returns 401 when not authenticated', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValueOnce(null)
    const { default: handler } = await import('~/server/api/account/export.get')
    await expect(handler(makeExportEvent())).rejects.toThrow()
  })

  it('returns export data with correct structure', async () => {
    const supabase = makeMockSupabase()
    // Simulate vehicles for dealer
    const vehiclesFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [{ id: 'v1', brand: 'Iveco' }] }),
    })
    supabase.from = vi.fn((table: string) => {
      if (table === 'vehicles') return vehiclesFrom(table) as ReturnType<typeof vehiclesFrom>
      return makeMockSupabase().from(table)
    })

    vi.mocked(serverSupabaseServiceRole).mockReturnValue(
      supabase as unknown as ReturnType<typeof serverSupabaseServiceRole>,
    )

    const { default: handler } = await import('~/server/api/account/export.get')
    const result = await handler(makeExportEvent())

    expect(result).toMatchObject({
      exportDate: expect.any(String),
      platform: 'Tracciona',
      userId: 'user-123',
      profile: expect.objectContaining({ id: 'user-123' }),
    })
  })

  it('returns null dealer when user has no dealer profile', async () => {
    const supabase = makeMockSupabase()
    supabase.from = vi.fn((table: string) => {
      const chain = makeMockSupabase().from(table)
      if (table === 'dealers') {
        chain.maybeSingle = vi.fn().mockResolvedValue({ data: null })
      }
      return chain
    })

    vi.mocked(serverSupabaseServiceRole).mockReturnValue(
      supabase as unknown as ReturnType<typeof serverSupabaseServiceRole>,
    )

    const { default: handler } = await import('~/server/api/account/export.get')
    const result = await handler(makeExportEvent())

    expect(result.dealer).toBeNull()
    expect(result.vehicles).toEqual([])
  })

  it('sets Content-Disposition header for download', async () => {
    const supabase = makeMockSupabase()
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(
      supabase as unknown as ReturnType<typeof serverSupabaseServiceRole>,
    )

    const { default: handler } = await import('~/server/api/account/export.get')
    const event = makeExportEvent()
    await handler(event)

    const disposition = (event as { _responseHeaders: Record<string, string> })._responseHeaders[
      'content-disposition'
    ]
    expect(disposition).toContain('attachment')
    expect(disposition).toContain('tracciona-data-export')
    expect(disposition).toContain('.json')
  })

  it('includes cache-control: no-store for privacy', async () => {
    const supabase = makeMockSupabase()
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(
      supabase as unknown as ReturnType<typeof serverSupabaseServiceRole>,
    )

    const { default: handler } = await import('~/server/api/account/export.get')
    const event = makeExportEvent()
    await handler(event)

    const cacheControl = (event as { _responseHeaders: Record<string, string> })._responseHeaders[
      'cache-control'
    ]
    expect(cacheControl).toContain('no-store')
  })
})

// ── delete.post.ts ─────────────────────────────────────────────────────────────

describe('POST /api/account/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function makeDeleteEvent() {
    return {
      node: {
        req: { headers: { 'user-agent': 'Mozilla/5.0' } },
        res: {},
      },
      method: 'POST',
    } as unknown as Parameters<
      (typeof import('~/server/api/account/delete.post'))['default']
    >[0]
  }

  it('returns 401 when not authenticated', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValueOnce(null)
    const { default: handler } = await import('~/server/api/account/delete.post')
    await expect(handler(makeDeleteEvent())).rejects.toThrow()
  })

  it('returns success: true on successful deletion', async () => {
    const supabase = makeMockSupabase()
    supabase.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }), // no dealer
    })

    vi.mocked(serverSupabaseServiceRole).mockReturnValue(
      supabase as unknown as ReturnType<typeof serverSupabaseServiceRole>,
    )

    const { default: handler } = await import('~/server/api/account/delete.post')
    const result = await handler(makeDeleteEvent())

    expect(result).toEqual({ success: true })
  })

  it('deletes auth user via Supabase Admin API', async () => {
    const supabase = makeMockSupabase()
    supabase.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    })
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(
      supabase as unknown as ReturnType<typeof serverSupabaseServiceRole>,
    )

    const { default: handler } = await import('~/server/api/account/delete.post')
    await handler(makeDeleteEvent())

    expect(supabase.auth.admin.deleteUser).toHaveBeenCalledWith('user-123')
  })

  it('succeeds even if auth deletion fails (data already anonymized)', async () => {
    const supabase = makeMockSupabase()
    supabase.auth.admin.deleteUser = vi.fn().mockResolvedValue({
      error: { message: 'User not found' },
    })
    supabase.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    })
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(
      supabase as unknown as ReturnType<typeof serverSupabaseServiceRole>,
    )

    const { default: handler } = await import('~/server/api/account/delete.post')
    const result = await handler(makeDeleteEvent())

    // Should still succeed — deletion already happened
    expect(result).toEqual({ success: true })
  })

  it('anonymizes dealer profile when user has dealer', async () => {
    const supabase = makeMockSupabase()
    const updateMock = vi.fn().mockReturnThis()
    const fromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      update: updateMock,
      delete: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: mockDealer }), // HAS dealer
    })
    supabase.from = fromMock
    vi.mocked(serverSupabaseServiceRole).mockReturnValue(
      supabase as unknown as ReturnType<typeof serverSupabaseServiceRole>,
    )

    const { default: handler } = await import('~/server/api/account/delete.post')
    await handler(makeDeleteEvent())

    // update was called (for dealer anonymization + user anonymization)
    expect(updateMock).toHaveBeenCalled()
  })
})
