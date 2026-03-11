/**
 * Tests for GET /api/market-report
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockServerUser, mockGetQuery, mockGenerateReport, mockSetHeader } = vi.hoisted(() => {
  const mockServerUser = vi.fn()
  const mockGetQuery = vi.fn()
  const mockGenerateReport = vi.fn()
  const mockSetHeader = vi.fn()

  return { mockServerUser, mockGetQuery, mockGenerateReport, mockSetHeader }
})

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  getQuery: (...a: unknown[]) => mockGetQuery(...a),
  setHeader: (...a: unknown[]) => mockSetHeader(...a),
}))

let mockSupabase: Record<string, unknown>

vi.mock('#supabase/server', () => ({
  serverSupabaseUser: (...a: unknown[]) => mockServerUser(...a),
  serverSupabaseServiceRole: () => mockSupabase,
}))

vi.mock('../../../server/services/marketReport', () => ({
  generateMarketReport: (...a: unknown[]) => mockGenerateReport(...a),
}))

vi.mock('../../../server/utils/safeError', () => ({
  safeError: (_code: number, msg: string) => {
    const err = new Error(msg) as Error & { statusCode: number }
    err.statusCode = _code
    return err
  },
}))

function makeChain(data: unknown = null, error: unknown = null) {
  const chain: Record<string, unknown> = {}
  const ms = ['select', 'eq', 'single']
  for (const m of ms) chain[m] = (..._a: unknown[]) => chain
  chain.then = (r: (v: unknown) => void) => Promise.resolve({ data, error }).then(r)
  chain.catch = (r: (v: unknown) => void) => Promise.resolve({ data, error: null }).catch(r)
  return chain
}

import handler from '../../../server/api/market-report.get'

describe('GET /api/market-report', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 401 for non-public request without auth', async () => {
    mockGetQuery.mockReturnValue({})
    mockServerUser.mockResolvedValue(null)
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 500 when user profile lookup fails', async () => {
    mockGetQuery.mockReturnValue({})
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockSupabase = { from: () => makeChain(null, { message: 'DB error' }) }
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 500 })
  })

  it('throws 403 when non-admin tries full report', async () => {
    mockGetQuery.mockReturnValue({})
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockSupabase = { from: () => makeChain({ role: 'dealer' }) }
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 403 })
  })

  it('returns HTML for admin full report', async () => {
    mockGetQuery.mockReturnValue({})
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockSupabase = { from: () => makeChain({ role: 'admin' }) }
    mockGenerateReport.mockResolvedValue({ html: '<html>Full Report</html>' })

    const result = await (handler as Function)({})
    expect(result).toBe('<html>Full Report</html>')
    expect(mockSetHeader).toHaveBeenCalledWith(expect.anything(), 'Cache-Control', 'private, no-store')
  })

  it('returns public summary without auth', async () => {
    mockGetQuery.mockReturnValue({ public: 'true' })
    mockSupabase = { from: () => makeChain(null) }
    mockGenerateReport.mockResolvedValue({ html: '<html>Public Summary</html>' })

    const result = await (handler as Function)({})
    expect(result).toBe('<html>Public Summary</html>')
    expect(mockGenerateReport).toHaveBeenCalledWith(mockSupabase, expect.objectContaining({ isPublic: true }))
  })

  it('sets public cache headers for public report', async () => {
    mockGetQuery.mockReturnValue({ public: 'true' })
    mockSupabase = { from: () => makeChain(null) }
    mockGenerateReport.mockResolvedValue({ html: '<html>Public</html>' })

    await (handler as Function)({})
    expect(mockSetHeader).toHaveBeenCalledWith(
      expect.anything(), 'Cache-Control',
      expect.stringContaining('public'),
    )
  })

  it('throws 500 when report generation fails', async () => {
    mockGetQuery.mockReturnValue({ public: 'true' })
    mockSupabase = { from: () => makeChain(null) }
    mockGenerateReport.mockRejectedValue(new Error('Report gen failed'))

    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 500 })
  })

  it('passes locale=en to generateMarketReport when query has locale=en', async () => {
    mockGetQuery.mockReturnValue({ public: 'true', locale: 'en' })
    mockSupabase = { from: () => makeChain(null) }
    mockGenerateReport.mockResolvedValue({ html: '<html>EN Report</html>' })

    await (handler as Function)({})
    expect(mockGenerateReport).toHaveBeenCalledWith(
      mockSupabase,
      expect.objectContaining({ locale: 'en' }),
    )
  })

  it('defaults to locale=es when no locale in query', async () => {
    mockGetQuery.mockReturnValue({ public: 'true' })
    mockSupabase = { from: () => makeChain(null) }
    mockGenerateReport.mockResolvedValue({ html: '<html>ES Report</html>' })

    await (handler as Function)({})
    expect(mockGenerateReport).toHaveBeenCalledWith(
      mockSupabase,
      expect.objectContaining({ locale: 'es' }),
    )
  })

  it('ignores invalid locale values (not es/en)', async () => {
    mockGetQuery.mockReturnValue({ public: 'true', locale: 'fr' })
    mockSupabase = { from: () => makeChain(null) }
    mockGenerateReport.mockResolvedValue({ html: '<html>Report</html>' })

    await (handler as Function)({})
    expect(mockGenerateReport).toHaveBeenCalledWith(
      mockSupabase,
      expect.objectContaining({ locale: 'es' }),
    )
  })
})
