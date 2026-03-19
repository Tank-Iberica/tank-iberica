import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.hoisted(() => {
  ;(globalThis as any).defineEventHandler = (fn: Function) => fn
  ;(globalThis as any).createError = (opts: { statusCode: number; statusMessage: string }) => {
    const err = new Error(opts.statusMessage) as Error & { statusCode: number }
    err.statusCode = opts.statusCode
    return err
  }
})

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: vi.fn(),
  createError: (opts: { statusCode: number; statusMessage: string }) => {
    const err = new Error(opts.statusMessage) as Error & { statusCode: number }
    err.statusCode = opts.statusCode
    return err
  },
}))

const mockInsert = vi.fn()
const mockFrom = vi.fn(() => ({ insert: mockInsert }))
vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: () => ({ from: mockFrom }),
}))

import handler from '../../../server/api/analytics/web-vitals.post'
import { readBody } from 'h3'

const mockEvent = { context: {} } as any

describe('POST /api/analytics/web-vitals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({ error: null })
  })

  it('stores a valid CLS metric', async () => {
    vi.mocked(readBody).mockResolvedValueOnce({
      name: 'CLS',
      value: 0.05,
      id: 'v1-abc',
      route: '/home',
    })
    const result = (await handler(mockEvent)) as any
    expect(result.ok).toBe(true)
    expect(mockFrom).toHaveBeenCalledWith('web_vitals')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        metric_name: 'CLS',
        metric_value: 0.05,
        metric_id: 'v1-abc',
        route: '/home',
      }),
    )
  })

  it('accepts all 5 valid metric names', async () => {
    for (const name of ['CLS', 'INP', 'LCP', 'FCP', 'TTFB']) {
      vi.mocked(readBody).mockResolvedValueOnce({
        name,
        value: 100,
        id: `v-${name}`,
        route: '/test',
      })
      const result = (await handler(mockEvent)) as any
      expect(result.ok).toBe(true)
    }
  })

  it('rejects invalid metric name', async () => {
    vi.mocked(readBody).mockResolvedValueOnce({
      name: 'INVALID',
      value: 100,
      id: 'v1',
      route: '/test',
    })
    await expect(handler(mockEvent)).rejects.toThrow('Invalid metric name')
  })

  it('rejects missing required fields', async () => {
    vi.mocked(readBody).mockResolvedValueOnce({ name: 'CLS' })
    await expect(handler(mockEvent)).rejects.toThrow('Missing required fields')
  })

  it('rejects negative value', async () => {
    vi.mocked(readBody).mockResolvedValueOnce({
      name: 'LCP',
      value: -1,
      id: 'v1',
      route: '/test',
    })
    await expect(handler(mockEvent)).rejects.toThrow('out of range')
  })

  it('rejects value > 60000', async () => {
    vi.mocked(readBody).mockResolvedValueOnce({
      name: 'LCP',
      value: 60001,
      id: 'v1',
      route: '/test',
    })
    await expect(handler(mockEvent)).rejects.toThrow('out of range')
  })

  it('truncates route to 500 chars', async () => {
    const longRoute = '/x'.repeat(400)
    vi.mocked(readBody).mockResolvedValueOnce({
      name: 'FCP',
      value: 100,
      id: 'v1',
      route: longRoute,
    })
    await handler(mockEvent)
    const insertArg = mockInsert.mock.calls[0][0]
    expect(insertArg.route.length).toBeLessThanOrEqual(500)
  })

  it('defaults vertical to tracciona', async () => {
    vi.mocked(readBody).mockResolvedValueOnce({
      name: 'TTFB',
      value: 200,
      id: 'v1',
      route: '/test',
    })
    await handler(mockEvent)
    const insertArg = mockInsert.mock.calls[0][0]
    expect(insertArg.vertical).toBe('tracciona')
  })

  it('uses provided vertical', async () => {
    vi.mocked(readBody).mockResolvedValueOnce({
      name: 'TTFB',
      value: 200,
      id: 'v1',
      route: '/test',
      vertical: 'maquinaria',
    })
    await handler(mockEvent)
    const insertArg = mockInsert.mock.calls[0][0]
    expect(insertArg.vertical).toBe('maquinaria')
  })

  it('returns table_not_found on 42P01 error', async () => {
    vi.mocked(readBody).mockResolvedValueOnce({
      name: 'CLS',
      value: 0.1,
      id: 'v1',
      route: '/test',
    })
    mockInsert.mockResolvedValueOnce({ error: { code: '42P01', message: 'table not found' } })
    const result = (await handler(mockEvent)) as any
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('table_not_found')
  })

  it('throws 500 on other insert errors', async () => {
    vi.mocked(readBody).mockResolvedValueOnce({
      name: 'CLS',
      value: 0.1,
      id: 'v1',
      route: '/test',
    })
    mockInsert.mockResolvedValueOnce({ error: { code: '23505', message: 'duplicate' } })
    await expect(handler(mockEvent)).rejects.toThrow('Failed to store metric')
  })

  it('rejects null body', async () => {
    vi.mocked(readBody).mockResolvedValueOnce(null)
    await expect(handler(mockEvent)).rejects.toThrow('Missing required fields')
  })

  describe('Percentile calculation', () => {
    function percentile(sorted: number[], p: number): number {
      if (sorted.length === 0) return 0
      const idx = Math.ceil((p / 100) * sorted.length) - 1
      return sorted[Math.max(0, idx)]
    }

    it('returns 0 for empty array', () => {
      expect(percentile([], 50)).toBe(0)
    })

    it('returns single value for single element', () => {
      expect(percentile([42], 50)).toBe(42)
      expect(percentile([42], 75)).toBe(42)
    })

    it('calculates p50 correctly', () => {
      const data = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
      expect(percentile(data, 50)).toBe(500)
    })

    it('calculates p75 correctly', () => {
      const data = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
      expect(percentile(data, 75)).toBe(800)
    })

    it('calculates p95 correctly', () => {
      const data = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
      expect(percentile(data, 95)).toBe(1000)
    })
  })
})
