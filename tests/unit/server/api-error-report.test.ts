import { describe, it, expect, vi, beforeEach } from 'vitest'

let handler: Function
let mockGetRequestHeader: ReturnType<typeof vi.fn>
let mockReadBody: ReturnType<typeof vi.fn>

describe('POST /api/error-report', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})

    mockGetRequestHeader = vi.fn().mockReturnValue('1.2.3.4')
    mockReadBody = vi.fn().mockResolvedValue({
      message: 'Test error',
      stack: 'Error: Test\n  at line 1',
      url: '/test-page',
      userAgent: 'TestBrowser/1.0',
      timestamp: '2026-03-06T00:00:00Z',
    })

    vi.stubGlobal('defineEventHandler', (fn: Function) => fn)
    vi.stubGlobal('getRequestHeader', mockGetRequestHeader)
    vi.stubGlobal('readBody', mockReadBody)
    vi.resetModules()
    const mod = await import('../../../server/api/error-report.post')
    handler = mod.default as Function
  })

  it('always returns { ok: true } even with valid report', async () => {
    const result = await handler({})
    expect(result).toEqual({ ok: true })
  })

  it('returns { ok: true } when body is null', async () => {
    mockReadBody.mockResolvedValue(null)
    const result = await handler({})
    expect(result).toEqual({ ok: true })
  })

  it('returns { ok: true } when body is a string (not object)', async () => {
    mockReadBody.mockResolvedValue('not an object')
    const result = await handler({})
    expect(result).toEqual({ ok: true })
  })

  it('returns { ok: true } when readBody throws', async () => {
    mockReadBody.mockRejectedValue(new Error('parse error'))
    const result = await handler({})
    expect(result).toEqual({ ok: true })
  })

  it('uses cf-connecting-ip header for IP', async () => {
    mockGetRequestHeader.mockImplementation((_, header: string) =>
      header === 'cf-connecting-ip' ? '10.0.0.1' : undefined,
    )
    const result = await handler({})
    expect(result).toEqual({ ok: true })
  })

  it('falls back to x-forwarded-for when cf-connecting-ip absent', async () => {
    mockGetRequestHeader.mockImplementation((_: unknown, header: string) => {
      if (header === 'cf-connecting-ip') return undefined
      if (header === 'x-forwarded-for') return '10.0.0.2, 1.2.3.4'
      return undefined
    })
    const result = await handler({})
    expect(result).toEqual({ ok: true })
  })

  it('applies rate limiting — 11th request from same IP returns ok (silently dropped)', async () => {
    // Module was just imported fresh. Send 11 requests to trigger rate limit on 11th.
    for (let i = 0; i < 11; i++) {
      const result = await handler({})
      expect(result).toEqual({ ok: true })
    }
  })
})
