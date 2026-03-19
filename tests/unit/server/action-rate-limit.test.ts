import { describe, it, expect, vi, beforeEach } from 'vitest'

// Need to mock rateLimit before importing actionRateLimit
vi.mock('../../../server/utils/rateLimit', () => ({
  checkRateLimit: vi.fn(() => true),
  getRetryAfterSeconds: vi.fn(() => 60),
  getUserIdFromJwt: vi.fn(() => null),
}))

import {
  checkActionRateLimit,
  getActionLimits,
  ACTION_LIMITS,
} from '../../../server/utils/actionRateLimit'
import { checkRateLimit, getUserIdFromJwt } from '../../../server/utils/rateLimit'

vi.mock('h3', () => ({
  createError: (opts: { statusCode: number; data?: unknown }) => {
    const err = new Error('rate limited') as Error & { statusCode: number; data: unknown }
    err.statusCode = opts.statusCode
    err.data = opts.data
    return err
  },
}))

describe('Action Rate Limiting (#259 — per-user per-action limits)', () => {
  const mockEvent = { context: { clientAddress: '127.0.0.1' } } as never

  beforeEach(() => {
    vi.mocked(checkRateLimit).mockReturnValue(true)
    vi.mocked(getUserIdFromJwt).mockReturnValue(null)
  })

  describe('ACTION_LIMITS configuration', () => {
    it('defines limits for publish, message, unlock actions', () => {
      expect(ACTION_LIMITS.publish).toBeDefined()
      expect(ACTION_LIMITS.message).toBeDefined()
      expect(ACTION_LIMITS.unlock).toBeDefined()
    })

    it('publish is limited to 10/hour', () => {
      expect(ACTION_LIMITS.publish.max).toBe(10)
      expect(ACTION_LIMITS.publish.windowMs).toBe(3600000)
    })

    it('message is limited to 30/hour', () => {
      expect(ACTION_LIMITS.message.max).toBe(30)
    })

    it('unlock is limited to 5/hour', () => {
      expect(ACTION_LIMITS.unlock.max).toBe(5)
    })

    it('all actions have windowMs and max defined', () => {
      for (const [_action, config] of Object.entries(ACTION_LIMITS)) {
        expect(config.windowMs).toBeGreaterThan(0)
        expect(config.max).toBeGreaterThan(0)
      }
    })
  })

  describe('checkActionRateLimit', () => {
    it('allows requests under the limit', () => {
      vi.mocked(checkRateLimit).mockReturnValue(true)
      const result = checkActionRateLimit(mockEvent, 'publish')
      expect(result).toBeNull() // no user ID for anonymous
      expect(checkRateLimit).toHaveBeenCalled()
    })

    it('throws 429 when rate limit exceeded', () => {
      vi.mocked(checkRateLimit).mockReturnValue(false)

      expect(() => checkActionRateLimit(mockEvent, 'publish')).toThrow()
      try {
        checkActionRateLimit(mockEvent, 'publish')
      } catch (err: unknown) {
        expect((err as { statusCode: number }).statusCode).toBe(429)
        expect((err as { data: { action: string } }).data.action).toBe('publish')
      }
    })

    it('uses user ID for authenticated users', () => {
      vi.mocked(checkRateLimit).mockReset()
      vi.mocked(getUserIdFromJwt).mockReset()
      vi.mocked(getUserIdFromJwt).mockReturnValue('user-123')
      vi.mocked(checkRateLimit).mockReturnValue(true)

      const userId = checkActionRateLimit(mockEvent, 'message')
      expect(userId).toBe('user-123')

      // Key should include user ID
      const callArgs = vi.mocked(checkRateLimit).mock.calls[0]
      expect(callArgs[0]).toContain('user:user-123')
      expect(callArgs[0]).toContain('message')
    })

    it('anonymous users get stricter limits (50%)', () => {
      vi.mocked(checkRateLimit).mockReset()
      vi.mocked(getUserIdFromJwt).mockReset()
      vi.mocked(getUserIdFromJwt).mockReturnValue(null)
      vi.mocked(checkRateLimit).mockReturnValue(true)

      checkActionRateLimit(mockEvent, 'publish')

      // The config passed to checkRateLimit should have max=5 (50% of 10)
      const callArgs = vi.mocked(checkRateLimit).mock.calls[0]
      expect(callArgs[1].max).toBe(5) // 50% of publish limit (10)
    })

    it('handles unknown action gracefully', () => {
      vi.mocked(getUserIdFromJwt).mockReturnValue('user-123')
      const result = checkActionRateLimit(mockEvent, 'unknown_action')
      expect(result).toBe('user-123')
    })
  })

  describe('getActionLimits', () => {
    it('returns copy of all configured limits', () => {
      const limits = getActionLimits()
      expect(Object.keys(limits).length).toBeGreaterThanOrEqual(5)
      expect(limits.publish).toEqual(ACTION_LIMITS.publish)
    })
  })
})
