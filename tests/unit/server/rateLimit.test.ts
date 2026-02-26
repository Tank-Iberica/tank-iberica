import { describe, it, expect, beforeEach } from 'vitest'
import { checkRateLimit, getRetryAfterSeconds } from '../../../server/utils/rateLimit'
import type { RateLimitConfig } from '../../../server/utils/rateLimit'

describe('rateLimit', () => {
  const config: RateLimitConfig = { windowMs: 60_000, max: 3 }

  beforeEach(() => {
    // Use a unique key per test to avoid cross-contamination
  })

  it('allows requests under the limit', () => {
    const key = `test-under-${Date.now()}`
    expect(checkRateLimit(key, config)).toBe(true)
    expect(checkRateLimit(key, config)).toBe(true)
    expect(checkRateLimit(key, config)).toBe(true)
  })

  it('blocks requests over the limit', () => {
    const key = `test-over-${Date.now()}`
    expect(checkRateLimit(key, config)).toBe(true)
    expect(checkRateLimit(key, config)).toBe(true)
    expect(checkRateLimit(key, config)).toBe(true)
    // 4th request should be blocked
    expect(checkRateLimit(key, config)).toBe(false)
  })

  it('different keys have independent limits', () => {
    const key1 = `test-a-${Date.now()}`
    const key2 = `test-b-${Date.now()}`

    // Fill up key1
    checkRateLimit(key1, config)
    checkRateLimit(key1, config)
    checkRateLimit(key1, config)
    expect(checkRateLimit(key1, config)).toBe(false)

    // key2 should still be allowed
    expect(checkRateLimit(key2, config)).toBe(true)
  })

  it('getRetryAfterSeconds returns positive value when rate limited', () => {
    const key = `test-retry-${Date.now()}`
    checkRateLimit(key, config)
    checkRateLimit(key, config)
    checkRateLimit(key, config)

    const retryAfter = getRetryAfterSeconds(key, config)
    expect(retryAfter).toBeGreaterThan(0)
    expect(retryAfter).toBeLessThanOrEqual(60)
  })

  it('getRetryAfterSeconds returns 0 for unknown keys', () => {
    const retryAfter = getRetryAfterSeconds(`unknown-${Date.now()}`, config)
    expect(retryAfter).toBe(0)
  })
})
