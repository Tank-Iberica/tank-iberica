import { describe, it, expect, vi, beforeAll } from 'vitest'
import { checkIdempotency, storeIdempotencyResponse, getIdempotencyKey } from '../../../server/utils/idempotency'

describe('Idempotency Utils', () => {
  const mockSupabase = {
    from: vi.fn(),
  }

  beforeAll(() => {
    vi.clearAllMocks()
  })

  describe('getIdempotencyKey', () => {
    it('extracts Idempotency-Key from headers (lowercase)', () => {
      const headers = { 'idempotency-key': 'key-123' }
      expect(getIdempotencyKey(headers)).toBe('key-123')
    })

    it('extracts Idempotency-Key from headers (mixed case)', () => {
      const headers = { 'Idempotency-Key': 'key-456' }
      expect(getIdempotencyKey(headers)).toBe('key-456')
    })

    it('handles array header values', () => {
      const headers = { 'idempotency-key': ['key-789', 'other'] }
      expect(getIdempotencyKey(headers)).toBe('key-789')
    })

    it('returns null when key not present', () => {
      const headers = { authorization: 'Bearer token' }
      expect(getIdempotencyKey(headers)).toBeNull()
    })

    it('returns null when key is empty array', () => {
      const headers = { 'idempotency-key': [] }
      expect(getIdempotencyKey(headers)).toBeNull()
    })
  })

  describe('checkIdempotency', () => {
    it('returns cached response if key exists and not expired', async () => {
      const futureDate = new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString()
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { response: { cached: true }, expires_at: futureDate },
          error: null,
        }),
      })

      const result = await checkIdempotency(mockSupabase as any, 'key-123')
      expect(result).toEqual({ cached: true })
    })

    it('returns null if key not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })

      const result = await checkIdempotency(mockSupabase as any, 'key-nonexistent')
      expect(result).toBeNull()
    })

    it('returns null if key expired', async () => {
      const pastDate = new Date(Date.now() - 1000).toISOString()
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { response: { cached: true }, expires_at: pastDate },
          error: null,
        }),
      })

      const result = await checkIdempotency(mockSupabase as any, 'key-expired')
      expect(result).toBeNull()
    })

    it('returns null on query error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Query failed'),
        }),
      })

      const result = await checkIdempotency(mockSupabase as any, 'key-error')
      expect(result).toBeNull()
    })
  })

  describe('storeIdempotencyResponse', () => {
    it('stores response with 24h expiry', async () => {
      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null })
      mockSupabase.from.mockReturnValue({
        insert: insertMock,
      })

      const response = { test: 'data' }
      await storeIdempotencyResponse(mockSupabase as any, 'key-123', 'endpoint', response)

      expect(insertMock).toHaveBeenCalledOnce()
      const call = insertMock.mock.calls[0][0]
      expect(call.key).toBe('key-123')
      expect(call.endpoint).toBe('endpoint')
      expect(call.response).toEqual(response)
      expect(call.expires_at).toBeDefined()

      // Verify expiry is approximately 24 hours from now
      const expiryTime = new Date(call.expires_at).getTime()
      const expectedTime = Date.now() + 24 * 60 * 60 * 1000
      expect(Math.abs(expiryTime - expectedTime)).toBeLessThan(1000) // within 1 second
    })
  })
})
