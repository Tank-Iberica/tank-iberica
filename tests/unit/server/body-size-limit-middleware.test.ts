import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetRequestHeader = vi.fn()

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  createError: (opts: { statusCode: number; statusMessage: string; data?: unknown }) => {
    const err = new Error(opts.statusMessage) as Error & Record<string, unknown>
    err.statusCode = opts.statusCode
    err.data = opts.data
    return err
  },
  getRequestHeader: (...args: unknown[]) => mockGetRequestHeader(...args),
}))

import handler from '../../../server/middleware/body-size-limit'

const MB = 1024 * 1024

function makeEvent(method: string, path: string) {
  return { method, path }
}

describe('body-size-limit middleware', () => {
  beforeEach(() => vi.clearAllMocks())

  it('skips GET requests', () => {
    expect((handler as Function)(makeEvent('GET', '/api/test'))).toBeUndefined()
  })

  it('skips DELETE requests', () => {
    expect((handler as Function)(makeEvent('delete', '/api/test'))).toBeUndefined()
  })

  it('skips non-API paths', () => {
    expect((handler as Function)(makeEvent('POST', '/something'))).toBeUndefined()
  })

  it('skips stripe webhook route', () => {
    expect((handler as Function)(makeEvent('POST', '/api/stripe/webhook'))).toBeUndefined()
  })

  it('skips cron routes', () => {
    expect((handler as Function)(makeEvent('POST', '/api/cron/process-jobs'))).toBeUndefined()
  })

  it('skips when no Content-Length header', () => {
    mockGetRequestHeader.mockReturnValue(undefined)
    expect((handler as Function)(makeEvent('POST', '/api/test'))).toBeUndefined()
  })

  it('skips when Content-Length is NaN', () => {
    mockGetRequestHeader.mockReturnValue('abc')
    expect((handler as Function)(makeEvent('POST', '/api/test'))).toBeUndefined()
  })

  it('allows requests under default 1MB', () => {
    mockGetRequestHeader.mockReturnValue('1024')
    expect((handler as Function)(makeEvent('POST', '/api/test'))).toBeUndefined()
  })

  it('throws 413 for POST exceeding 1MB', () => {
    mockGetRequestHeader.mockReturnValue(String(2 * MB))
    try {
      ;(handler as Function)(makeEvent('POST', '/api/test'))
      expect.fail('Should have thrown')
    } catch (err: unknown) {
      const e = err as { statusCode: number; data: { error: string } }
      expect(e.statusCode).toBe(413)
      expect(e.data.error).toContain('1.0 MB')
    }
  })

  it('throws 413 for PUT exceeding 1MB', () => {
    mockGetRequestHeader.mockReturnValue(String(2 * MB))
    expect(() => (handler as Function)(makeEvent('PUT', '/api/test'))).toThrow()
  })

  it('throws 413 for PATCH exceeding 1MB', () => {
    mockGetRequestHeader.mockReturnValue(String(2 * MB))
    expect(() => (handler as Function)(makeEvent('PATCH', '/api/test'))).toThrow()
  })

  it('allows 5MB for image process route', () => {
    mockGetRequestHeader.mockReturnValue(String(5 * MB))
    expect((handler as Function)(makeEvent('POST', '/api/images/process'))).toBeUndefined()
  })

  it('throws for images over 10MB', () => {
    mockGetRequestHeader.mockReturnValue(String(11 * MB))
    expect(() => (handler as Function)(makeEvent('POST', '/api/images/process'))).toThrow()
  })

  it('allows 3MB for import-stock', () => {
    mockGetRequestHeader.mockReturnValue(String(3 * MB))
    expect((handler as Function)(makeEvent('POST', '/api/dealer/import-stock'))).toBeUndefined()
  })

  it('throws for import-stock over 5MB', () => {
    mockGetRequestHeader.mockReturnValue(String(6 * MB))
    expect(() => (handler as Function)(makeEvent('POST', '/api/dealer/import-stock'))).toThrow()
  })

  it('handles empty path', () => {
    const event = { method: 'POST', path: '' }
    expect((handler as Function)(event)).toBeUndefined()
  })
})
