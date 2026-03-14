import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const { mockCheckRateLimit, mockGetRateLimitKey, mockGetRetryAfterSeconds, mockCreateError } =
  vi.hoisted(() => ({
    mockCheckRateLimit: vi.fn().mockReturnValue(true),
    mockGetRateLimitKey: vi.fn().mockReturnValue('127.0.0.1'),
    mockGetRetryAfterSeconds: vi.fn().mockReturnValue(30),
    mockCreateError: vi.fn(
      (opts: { statusCode: number; statusMessage: string; data?: unknown }) => {
        const err = new Error(opts.statusMessage)
        ;(err as any).statusCode = opts.statusCode
        return err
      },
    ),
  }))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  createError: mockCreateError,
  getResponseStatus: vi.fn().mockReturnValue(200),
}))

vi.mock('../../../server/utils/rateLimit', () => ({
  checkRateLimit: mockCheckRateLimit,
  getRateLimitKey: mockGetRateLimitKey,
  getRetryAfterSeconds: mockGetRetryAfterSeconds,
  getUserOrIpRateLimitKey: vi.fn().mockReturnValue('127.0.0.1'),
  getFingerprintKey: vi.fn().mockReturnValue(null),
  isIpBanned: vi.fn().mockReturnValue(null),
  record4xxError: vi.fn().mockReturnValue(false),
}))

vi.mock('../../../server/utils/securityEvents', () => ({
  recordSecurityEvent: vi.fn(),
}))

import handler from '../../../server/middleware/rate-limit'

function makeEvent(path: string, method = 'GET') {
  return {
    path,
    method,
    node: {
      res: {
        on: vi.fn(),
        statusCode: 200,
      },
      req: { headers: {} },
    },
  } as any
}

describe('rate-limit middleware', () => {
  const origEnv = process.env.ENABLE_MEMORY_RATE_LIMIT

  beforeEach(() => {
    vi.clearAllMocks()
    mockCheckRateLimit.mockReturnValue(true)
    mockGetRateLimitKey.mockReturnValue('127.0.0.1')
    mockGetRetryAfterSeconds.mockReturnValue(30)
  })

  afterEach(() => {
    if (origEnv !== undefined) process.env.ENABLE_MEMORY_RATE_LIMIT = origEnv
    else delete process.env.ENABLE_MEMORY_RATE_LIMIT
  })

  it('returns without checking when rate limiting disabled', () => {
    delete process.env.ENABLE_MEMORY_RATE_LIMIT
    handler(makeEvent('/api/email/send', 'POST'))
    expect(mockCheckRateLimit).not.toHaveBeenCalled()
  })

  it('returns without checking for non-API routes', () => {
    process.env.ENABLE_MEMORY_RATE_LIMIT = 'true'
    handler(makeEvent('/about', 'GET'))
    expect(mockCheckRateLimit).not.toHaveBeenCalled()
  })

  it('checks rate limit for API routes when enabled', () => {
    process.env.ENABLE_MEMORY_RATE_LIMIT = 'true'
    handler(makeEvent('/api/vehicles', 'GET'))
    expect(mockCheckRateLimit).toHaveBeenCalled()
  })

  it('throws 429 when rate limit exceeded (default rule)', () => {
    process.env.ENABLE_MEMORY_RATE_LIMIT = 'true'
    mockCheckRateLimit.mockReturnValue(false)
    expect(() => handler(makeEvent('/api/vehicles', 'GET'))).toThrow()
    expect(mockCreateError).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 429 }))
  })

  it('throws 429 when rate limit exceeded on specific rule', () => {
    process.env.ENABLE_MEMORY_RATE_LIMIT = 'true'
    mockCheckRateLimit.mockReturnValue(false)
    expect(() => handler(makeEvent('/api/email/send', 'POST'))).toThrow()
    expect(mockGetRetryAfterSeconds).toHaveBeenCalled()
    expect(mockCreateError).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 429,
        data: expect.objectContaining({ retryAfter: 30 }),
      }),
    )
  })

  it('applies email/send rule with max=10', () => {
    process.env.ENABLE_MEMORY_RATE_LIMIT = 'true'
    handler(makeEvent('/api/email/send', 'POST'))
    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      expect.stringContaining('127.0.0.1'),
      expect.objectContaining({ max: 10 }),
    )
  })

  it('applies stripe rule with max=20', () => {
    process.env.ENABLE_MEMORY_RATE_LIMIT = 'true'
    handler(makeEvent('/api/stripe/checkout', 'POST'))
    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      expect.stringContaining('127.0.0.1'),
      expect.objectContaining({ max: 20 }),
    )
  })

  it('applies account/delete rule with max=2', () => {
    process.env.ENABLE_MEMORY_RATE_LIMIT = 'true'
    handler(makeEvent('/api/account/delete', 'POST'))
    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      expect.stringContaining('127.0.0.1'),
      expect.objectContaining({ max: 2 }),
    )
  })

  it('applies default write limit (max=30) for unmatched POST', () => {
    process.env.ENABLE_MEMORY_RATE_LIMIT = 'true'
    handler(makeEvent('/api/some-endpoint', 'POST'))
    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      expect.stringContaining('api:write'),
      expect.objectContaining({ max: 30 }),
    )
  })

  it('applies default read limit (max=200) for GET', () => {
    process.env.ENABLE_MEMORY_RATE_LIMIT = 'true'
    handler(makeEvent('/api/some-endpoint', 'GET'))
    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      expect.stringContaining('api:read'),
      expect.objectContaining({ max: 200 }),
    )
  })

  it('skips lead rule for GET method (method restriction)', () => {
    process.env.ENABLE_MEMORY_RATE_LIMIT = 'true'
    handler(makeEvent('/api/lead', 'GET'))
    // Should fall through to default read limit, not the lead rule
    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      expect.stringContaining('api:read'),
      expect.objectContaining({ max: 200 }),
    )
  })
})
