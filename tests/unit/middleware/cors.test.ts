/**
 * Tests for server/middleware/cors.ts
 * CORS — origin allowlist, no wildcards, Vary header, preflight.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetHeader = vi.fn()
const mockSetResponseHeaders = vi.fn()
const mockGetSiteUrl = vi.fn().mockReturnValue('https://tracciona.com')

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  getHeader: (...args: unknown[]) => mockGetHeader(...args),
  setResponseHeaders: (...args: unknown[]) => mockSetResponseHeaders(...args),
}))

vi.mock('~~/server/utils/siteConfig', () => ({
  getSiteUrl: () => mockGetSiteUrl(),
}))

import handler from '../../../server/middleware/cors'

function makeEvent(path: string, method = 'GET') {
  return {
    path,
    method,
    node: { res: { statusCode: 200, end: vi.fn() } },
  }
}

describe('CORS middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSiteUrl.mockReturnValue('https://tracciona.com')
    process.env.SUPABASE_URL = 'https://xyz.supabase.co'
  })

  it('does not add CORS headers for non-API routes', () => {
    mockGetHeader.mockReturnValue('https://tracciona.com')
    handler(makeEvent('/about') as any)
    expect(mockSetResponseHeaders).not.toHaveBeenCalled()
  })

  it('does not add CORS headers when no origin header', () => {
    mockGetHeader.mockReturnValue(undefined)
    handler(makeEvent('/api/test') as any)
    expect(mockSetResponseHeaders).not.toHaveBeenCalled()
  })

  it('allows requests from own site URL', () => {
    mockGetHeader.mockReturnValue('https://tracciona.com')
    handler(makeEvent('/api/test') as any)
    expect(mockSetResponseHeaders).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        'Access-Control-Allow-Origin': 'https://tracciona.com',
      }),
    )
  })

  it('allows requests from Supabase URL', () => {
    mockGetHeader.mockReturnValue('https://xyz.supabase.co')
    handler(makeEvent('/api/test') as any)
    expect(mockSetResponseHeaders).toHaveBeenCalled()
  })

  it('allows requests from Stripe JS SDK', () => {
    mockGetHeader.mockReturnValue('https://js.stripe.com')
    handler(makeEvent('/api/test') as any)
    expect(mockSetResponseHeaders).toHaveBeenCalled()
  })

  it('allows requests from Cloudflare Turnstile', () => {
    mockGetHeader.mockReturnValue('https://challenges.cloudflare.com')
    handler(makeEvent('/api/test') as any)
    expect(mockSetResponseHeaders).toHaveBeenCalled()
  })

  it('rejects unknown origins (no wildcard)', () => {
    mockGetHeader.mockReturnValue('https://evil.com')
    handler(makeEvent('/api/test') as any)
    expect(mockSetResponseHeaders).not.toHaveBeenCalled()
  })

  it('rejects similar-looking origins', () => {
    mockGetHeader.mockReturnValue('https://tracciona.com.evil.com')
    handler(makeEvent('/api/test') as any)
    expect(mockSetResponseHeaders).not.toHaveBeenCalled()
  })

  it('includes Vary: Origin header', () => {
    mockGetHeader.mockReturnValue('https://tracciona.com')
    handler(makeEvent('/api/test') as any)
    expect(mockSetResponseHeaders).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        'Vary': 'Origin',
      }),
    )
  })

  it('includes credentials support', () => {
    mockGetHeader.mockReturnValue('https://tracciona.com')
    handler(makeEvent('/api/test') as any)
    expect(mockSetResponseHeaders).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        'Access-Control-Allow-Credentials': 'true',
      }),
    )
  })

  it('handles OPTIONS preflight with 204', () => {
    mockGetHeader.mockReturnValue('https://tracciona.com')
    const event = makeEvent('/api/test', 'OPTIONS')
    handler(event as any)
    expect(event.node.res.statusCode).toBe(204)
    expect(event.node.res.end).toHaveBeenCalled()
  })

  it('normalizes trailing slashes in origin', () => {
    mockGetHeader.mockReturnValue('https://tracciona.com/')
    handler(makeEvent('/api/test') as any)
    expect(mockSetResponseHeaders).toHaveBeenCalled()
  })

  it('includes X-Requested-With in allowed headers', () => {
    mockGetHeader.mockReturnValue('https://tracciona.com')
    handler(makeEvent('/api/test') as any)
    expect(mockSetResponseHeaders).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        'Access-Control-Allow-Headers': expect.stringContaining('X-Requested-With'),
      }),
    )
  })
})
