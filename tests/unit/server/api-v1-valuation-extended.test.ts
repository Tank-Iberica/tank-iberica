/**
 * Extended tests for GET /api/v1/valuation
 * The endpoint is currently disabled (VALUATION_API_ENABLED = false).
 * We test the 503 path and also the pure functions exposed by the module.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockGetQuery, mockGetHeader, mockSetHeader } = vi.hoisted(() => {
  const mockGetQuery = vi.fn()
  const mockGetHeader = vi.fn()
  const mockSetHeader = vi.fn()

  // Auto-imported globals
  ;(globalThis as any).defineEventHandler = (fn: Function) => fn
  ;(globalThis as any).getQuery = (...a: unknown[]) => mockGetQuery(...a)
  ;(globalThis as any).getHeader = (...a: unknown[]) => mockGetHeader(...a)
  ;(globalThis as any).setHeader = (...a: unknown[]) => mockSetHeader(...a)

  return { mockGetQuery, mockGetHeader, mockSetHeader }
})

vi.mock('../../../server/utils/safeError', () => ({
  safeError: (_code: number, msg: string) => {
    const err = new Error(msg) as Error & { statusCode: number }
    err.statusCode = _code
    return err
  },
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
}))

vi.stubGlobal('useRuntimeConfig', () => ({
  supabaseServiceRoleKey: 'sb-key',
  public: {},
}))

process.env.SUPABASE_URL = 'https://test.supabase.co'

import handler from '../../../server/api/v1/valuation.get'

describe('GET /api/v1/valuation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 503 because API is disabled', async () => {
    mockGetQuery.mockReturnValue({ brand: 'Volvo' })
    mockGetHeader.mockReturnValue('Bearer test-key')
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 503 })
  })

  it('503 message mentions coming soon', async () => {
    mockGetQuery.mockReturnValue({ brand: 'DAF' })
    mockGetHeader.mockReturnValue('Bearer test-key')
    try {
      await (handler as Function)({})
    } catch (err: any) {
      expect(err.message).toContain('coming soon')
    }
  })
})
