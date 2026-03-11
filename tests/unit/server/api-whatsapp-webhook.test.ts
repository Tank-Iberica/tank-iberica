import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockGetQuery, mockSafeError } = vi.hoisted(() => ({
  mockGetQuery: vi.fn(),
  mockSafeError: vi.fn((status: number, msg: string) => {
    const err = new Error(msg)
    ;(err as any).statusCode = status
    return err
  }),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  getQuery: mockGetQuery,
}))

vi.mock('../../../server/utils/safeError', () => ({
  safeError: mockSafeError,
}))

import handler from '../../../server/api/whatsapp/webhook.get'

describe('GET /api/whatsapp/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('useRuntimeConfig', () => ({
      whatsappVerifyToken: 'secret-token',
      public: {},
    }))
  })

  it('returns challenge when mode=subscribe and token matches', () => {
    mockGetQuery.mockReturnValue({
      'hub.mode': 'subscribe',
      'hub.verify_token': 'secret-token',
      'hub.challenge': 'abc123',
    })
    const result = handler({})
    expect(result).toBe('abc123')
  })

  it('throws 403 when verify token does not match', () => {
    mockGetQuery.mockReturnValue({
      'hub.mode': 'subscribe',
      'hub.verify_token': 'wrong-token',
      'hub.challenge': 'abc123',
    })
    expect(() => handler({})).toThrow()
    expect(mockSafeError).toHaveBeenCalledWith(403, expect.any(String))
  })

  it('throws 403 when mode is not subscribe', () => {
    mockGetQuery.mockReturnValue({
      'hub.mode': 'unsubscribe',
      'hub.verify_token': 'secret-token',
      'hub.challenge': 'abc123',
    })
    expect(() => handler({})).toThrow()
    expect(mockSafeError).toHaveBeenCalledWith(403, expect.any(String))
  })

  it('throws 403 when no query params', () => {
    mockGetQuery.mockReturnValue({})
    expect(() => handler({})).toThrow()
    expect(mockSafeError).toHaveBeenCalledWith(403, expect.any(String))
  })
})
