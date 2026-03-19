import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

// ── Mocks ──────────────────────────────────────────────────────────────────

// Mock rateLimit utility (avoids needing to mock h3 getRequestIP/getHeader)
const mockGetUserIdFromJwt = vi.fn<[H3Event], string | null>(() => null)
const mockGetRateLimitKey = vi.fn<[H3Event], string>(() => '192.168.1.1')
vi.mock('../../../server/utils/rateLimit', () => ({
  getUserIdFromJwt: (...args: unknown[]) => mockGetUserIdFromJwt(args[0] as H3Event),
  getRateLimitKey: (...args: unknown[]) => mockGetRateLimitKey(args[0] as H3Event),
}))

// Mock h3 createError
vi.mock('h3', async () => {
  const actual = await vi.importActual<typeof import('h3')>('h3')
  return {
    ...actual,
    createError: (opts: { statusCode: number; statusMessage: string; data?: unknown }) => {
      const err = new Error(opts.statusMessage) as Error & { statusCode: number; data?: unknown }
      err.statusCode = opts.statusCode
      err.data = opts.data
      return err
    },
  }
})

// Mock Supabase
const mockRpc = vi.fn()
vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: () => ({ rpc: mockRpc }),
}))

import { checkDbRateLimit, cleanupRateLimitEntries } from '../../../server/utils/dbRateLimit'

// ── Structural Tests (Migration SQL) ───────────────────────────────────────

describe('DB-backed Rate Limiting (N29)', () => {
  // Structural migration tests removed — those are file content audits
  // covered by Fase 5 (ESLint/CI scripts).

  describe('checkDbRateLimit', () => {
    const event = {} as H3Event

    beforeEach(() => {
      vi.clearAllMocks()
      mockGetUserIdFromJwt.mockReturnValue(null)
      mockGetRateLimitKey.mockReturnValue('192.168.1.1')
    })

    it('returns true when RPC allows the request', async () => {
      mockRpc.mockResolvedValueOnce({ data: true, error: null })

      const result = await checkDbRateLimit(event, 'login')
      expect(result).toBe(true)
      expect(mockRpc).toHaveBeenCalledWith('check_rate_limit', {
        p_key: 'db:ip:192.168.1.1:login',
        p_window_seconds: 3600,
        p_max_requests: 10,
      })
    })

    it('throws 429 when RPC returns false (rate limited)', async () => {
      mockRpc.mockResolvedValueOnce({ data: false, error: null })

      try {
        await checkDbRateLimit(event, 'submit')
        expect.unreachable('Should have thrown')
      } catch (err: any) {
        expect(err.statusCode).toBe(429)
        expect(err.message).toBe('Too Many Requests')
      }
    })

    it('returns true (fail-open) when DB is unreachable', async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'DB down' } })

      const result = await checkDbRateLimit(event, 'search')
      expect(result).toBe(true)
    })

    it('uses custom config when provided', async () => {
      mockRpc.mockResolvedValueOnce({ data: true, error: null })

      await checkDbRateLimit(event, 'api-call', { windowSeconds: 60, maxRequests: 5 })
      expect(mockRpc).toHaveBeenCalledWith('check_rate_limit', {
        p_key: 'db:ip:192.168.1.1:api-call',
        p_window_seconds: 60,
        p_max_requests: 5,
      })
    })

    it('uses user-based key when userId is available', async () => {
      mockGetUserIdFromJwt.mockReturnValue('user-42')
      mockRpc.mockResolvedValueOnce({ data: true, error: null })

      await checkDbRateLimit(event, 'action')
      expect(mockRpc).toHaveBeenCalledWith('check_rate_limit', {
        p_key: 'db:user:user-42:action',
        p_window_seconds: 3600,
        p_max_requests: 10,
      })
    })

    it('falls back to IP key when no userId', async () => {
      mockGetUserIdFromJwt.mockReturnValue(null)
      mockGetRateLimitKey.mockReturnValue('10.0.0.5')
      mockRpc.mockResolvedValueOnce({ data: true, error: null })

      await checkDbRateLimit(event, 'browse')
      expect(mockRpc).toHaveBeenCalledWith('check_rate_limit', {
        p_key: 'db:ip:10.0.0.5:browse',
        p_window_seconds: 3600,
        p_max_requests: 10,
      })
    })
  })

  describe('cleanupRateLimitEntries', () => {
    const event = {} as H3Event

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('returns count of deleted entries on success', async () => {
      mockRpc.mockResolvedValueOnce({ data: 42, error: null })

      const result = await cleanupRateLimitEntries(event, 3600)
      expect(result).toBe(42)
      expect(mockRpc).toHaveBeenCalledWith('cleanup_rate_limit_entries', {
        p_max_age_seconds: 3600,
      })
    })

    it('returns 0 on error', async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'fail' } })

      const result = await cleanupRateLimitEntries(event)
      expect(result).toBe(0)
    })

    it('defaults to 7200 seconds max age', async () => {
      mockRpc.mockResolvedValueOnce({ data: 0, error: null })

      await cleanupRateLimitEntries(event)
      expect(mockRpc).toHaveBeenCalledWith('cleanup_rate_limit_entries', {
        p_max_age_seconds: 7200,
      })
    })
  })
})
