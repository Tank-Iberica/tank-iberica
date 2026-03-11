import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockGetHeader, mockSetResponseHeaders } = vi.hoisted(() => ({
  mockGetHeader: vi.fn(),
  mockSetResponseHeaders: vi.fn(),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  getHeader: mockGetHeader,
  setResponseHeaders: mockSetResponseHeaders,
}))

vi.mock('~~/server/utils/siteConfig', () => ({
  getSiteUrl: () => 'https://test.tracciona.com',
}))

import handler from '../../../server/middleware/cors'

function makeEvent(path: string, method = 'GET') {
  return {
    path,
    method,
    node: {
      res: {
        statusCode: 200,
        end: vi.fn(),
      },
    },
  } as any
}

describe('cors middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetHeader.mockReturnValue(undefined)
  })

  it('skips non-API routes', () => {
    mockGetHeader.mockReturnValue('https://test.tracciona.com')
    handler(makeEvent('/about'))
    expect(mockSetResponseHeaders).not.toHaveBeenCalled()
  })

  it('skips when no origin header', () => {
    mockGetHeader.mockReturnValue(undefined)
    handler(makeEvent('/api/vehicles'))
    expect(mockSetResponseHeaders).not.toHaveBeenCalled()
  })

  it('sets CORS headers for site URL origin', () => {
    const event = makeEvent('/api/vehicles')
    mockGetHeader.mockReturnValue('https://test.tracciona.com')
    handler(event)
    expect(mockSetResponseHeaders).toHaveBeenCalledWith(
      event,
      expect.objectContaining({
        'Access-Control-Allow-Origin': 'https://test.tracciona.com',
        'Access-Control-Allow-Methods': expect.stringContaining('GET'),
        'Access-Control-Allow-Credentials': 'true',
      }),
    )
  })

  it('rejects disallowed origin', () => {
    mockGetHeader.mockReturnValue('https://evil.com')
    handler(makeEvent('/api/vehicles'))
    expect(mockSetResponseHeaders).not.toHaveBeenCalled()
  })

  it('allows stripe origin', () => {
    mockGetHeader.mockReturnValue('https://js.stripe.com')
    handler(makeEvent('/api/stripe/webhook'))
    expect(mockSetResponseHeaders).toHaveBeenCalled()
  })

  it('allows cloudflare turnstile origin', () => {
    mockGetHeader.mockReturnValue('https://challenges.cloudflare.com')
    handler(makeEvent('/api/verify'))
    expect(mockSetResponseHeaders).toHaveBeenCalled()
  })

  it('handles OPTIONS preflight with 204', () => {
    const event = makeEvent('/api/vehicles', 'OPTIONS')
    mockGetHeader.mockReturnValue('https://test.tracciona.com')
    handler(event)
    expect(event.node.res.statusCode).toBe(204)
    expect(event.node.res.end).toHaveBeenCalled()
  })

  it('normalizes trailing slash in origin', () => {
    mockGetHeader.mockReturnValue('https://test.tracciona.com/')
    handler(makeEvent('/api/vehicles'))
    expect(mockSetResponseHeaders).toHaveBeenCalled()
  })

  it('includes x-internal-secret in allowed headers', () => {
    const event = makeEvent('/api/vehicles')
    mockGetHeader.mockReturnValue('https://test.tracciona.com')
    handler(event)
    const headers = mockSetResponseHeaders.mock.calls[0][1]
    expect(headers['Access-Control-Allow-Headers']).toContain('x-internal-secret')
  })
})
