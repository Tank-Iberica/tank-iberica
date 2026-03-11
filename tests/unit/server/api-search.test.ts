/**
 * Tests for server/api/search.get.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockRpc, mockGetQuery } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockGetQuery: vi.fn().mockReturnValue({}),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  getQuery: (...args: unknown[]) => mockGetQuery(...args),
  setResponseHeader: vi.fn(),
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseClient: vi.fn().mockResolvedValue({ rpc: mockRpc }),
}))

vi.mock('../../../server/utils/safeError', () => ({
  safeError: (code: number, msg: string) => {
    const e = new Error(msg) as Error & { statusCode: number }
    e.statusCode = code
    return e
  },
}))

// Static import after mocks
import handler from '../../../server/api/search.get'

const mockEvent = {} as never

beforeEach(() => {
  vi.clearAllMocks()
  mockRpc.mockResolvedValue({ data: [], error: null })
  mockGetQuery.mockReturnValue({})
})

function setQuery(q: Record<string, string>) {
  mockGetQuery.mockReturnValue(q)
}

describe('GET /api/search', () => {
  it('returns empty results for empty query', async () => {
    const result = await (handler as Function)(mockEvent)
    expect(result.results).toEqual([])
    expect(result.total_estimate).toBe(0)
    expect(result.next_cursor).toBeNull()
  })

  it('passes query to RPC', async () => {
    setQuery({ q: 'volvo fh' })
    mockRpc.mockResolvedValue({
      data: [
        {
          id: 'v1', slug: 'volvo-fh', brand: 'Volvo', model: 'FH',
          year: 2020, price: 45000, location: 'Madrid',
          location_province: 'Madrid', location_country: 'ES',
          category_id: null, dealer_id: 'd1', created_at: '2026-01-01',
          rank: 1.5, total_estimate: 1,
        },
      ],
      error: null,
    })

    const result = await (handler as Function)(mockEvent)
    expect(result.query).toBe('volvo fh')
    expect(result.results).toHaveLength(1)
    expect(result.results[0].brand).toBe('Volvo')
    expect(result.results[0]).not.toHaveProperty('total_estimate')
    expect(mockRpc).toHaveBeenCalledWith('search_vehicles', expect.objectContaining({
      search_query: 'volvo fh',
    }))
  })

  it('passes filters to RPC', async () => {
    setQuery({
      q: 'scania',
      price_min: '10000',
      price_max: '80000',
      year_min: '2018',
      year_max: '2025',
      province: 'Barcelona',
      country: 'ES',
    })

    await (handler as Function)(mockEvent)

    expect(mockRpc).toHaveBeenCalledWith('search_vehicles', expect.objectContaining({
      search_query: 'scania',
      filter_price_min: 10000,
      filter_price_max: 80000,
      filter_year_min: 2018,
      filter_year_max: 2025,
      filter_province: 'Barcelona',
      filter_country: 'ES',
    }))
  })

  it('ignores invalid category_id', async () => {
    setQuery({ category_id: 'not-a-uuid' })
    await (handler as Function)(mockEvent)

    expect(mockRpc).toHaveBeenCalledWith('search_vehicles', expect.objectContaining({
      filter_category_id: null,
    }))
  })

  it('accepts valid UUID for category_id', async () => {
    const uuid = '12345678-1234-1234-1234-123456789012'
    setQuery({ category_id: uuid })
    await (handler as Function)(mockEvent)

    expect(mockRpc).toHaveBeenCalledWith('search_vehicles', expect.objectContaining({
      filter_category_id: uuid,
    }))
  })

  it('clamps limit to max 50', async () => {
    setQuery({ limit: '100' })
    await (handler as Function)(mockEvent)

    expect(mockRpc).toHaveBeenCalledWith('search_vehicles', expect.objectContaining({
      page_limit: 50,
    }))
  })

  it('defaults limit when 0 provided', async () => {
    setQuery({ limit: '0' })
    await (handler as Function)(mockEvent)

    // Number('0') || 20 → 20 (0 is falsy, defaults to 20)
    expect(mockRpc).toHaveBeenCalledWith('search_vehicles', expect.objectContaining({
      page_limit: 20,
    }))
  })

  it('defaults limit to 20', async () => {
    await (handler as Function)(mockEvent)

    expect(mockRpc).toHaveBeenCalledWith('search_vehicles', expect.objectContaining({
      page_limit: 20,
    }))
  })

  it('returns next_cursor when results equal limit', async () => {
    setQuery({ limit: '2' })
    mockRpc.mockResolvedValue({
      data: [
        { id: 'v1', slug: 's1', brand: 'A', model: 'B', year: null, price: null, location: null, location_province: null, location_country: null, category_id: null, dealer_id: null, created_at: '', rank: 1, total_estimate: 5 },
        { id: 'v2', slug: 's2', brand: 'C', model: 'D', year: null, price: null, location: null, location_province: null, location_country: null, category_id: null, dealer_id: null, created_at: '', rank: 0.5, total_estimate: 5 },
      ],
      error: null,
    })

    const result = await (handler as Function)(mockEvent)
    expect(result.next_cursor).toBe('v2')
    expect(result.total_estimate).toBe(5)
  })

  it('returns null next_cursor when results < limit', async () => {
    mockRpc.mockResolvedValue({
      data: [
        { id: 'v1', slug: 's1', brand: 'A', model: 'B', year: null, price: null, location: null, location_province: null, location_country: null, category_id: null, dealer_id: null, created_at: '', rank: 1, total_estimate: 1 },
      ],
      error: null,
    })

    const result = await (handler as Function)(mockEvent)
    expect(result.next_cursor).toBeNull()
  })

  it('throws safeError on RPC error', async () => {
    setQuery({ q: 'test' })
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } })

    await expect((handler as Function)(mockEvent)).rejects.toThrow('Search failed')
  })

  it('throws on invalid price_min', async () => {
    setQuery({ price_min: 'abc' })
    await expect((handler as Function)(mockEvent)).rejects.toThrow('Invalid price_min')
  })

  it('throws on invalid price_max', async () => {
    setQuery({ price_max: 'xyz' })
    await expect((handler as Function)(mockEvent)).rejects.toThrow('Invalid price_max')
  })

  it('passes cursor to RPC', async () => {
    const cursorId = '12345678-1234-1234-1234-123456789012'
    setQuery({ cursor: cursorId })
    await (handler as Function)(mockEvent)

    expect(mockRpc).toHaveBeenCalledWith('search_vehicles', expect.objectContaining({
      cursor_id: cursorId,
    }))
  })

  it('ignores invalid cursor format', async () => {
    setQuery({ cursor: 'bad-cursor' })
    await (handler as Function)(mockEvent)

    expect(mockRpc).toHaveBeenCalledWith('search_vehicles', expect.objectContaining({
      cursor_id: null,
    }))
  })
})
