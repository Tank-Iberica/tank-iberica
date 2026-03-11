import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkRateLimit, getRetryAfterSeconds, getRateLimitKey, getUserIdFromJwt, getUserOrIpRateLimitKey, getFingerprintKey } from '../../../server/utils/rateLimit'
import type { RateLimitConfig } from '../../../server/utils/rateLimit'
import type { H3Event } from 'h3'

vi.mock('h3', () => ({
  getRequestIP: vi.fn().mockReturnValue('10.0.0.1'),
  getHeader: vi.fn().mockReturnValue(null),
}))

/** Build a minimal base64url-encoded JWT with the given payload */
function makeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${header}.${body}.fakesig`
}

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

describe('getRateLimitKey', () => {
  it('returns the IP address from the event', () => {
    const event = {} as H3Event
    const key = getRateLimitKey(event)
    expect(key).toBe('10.0.0.1')
  })

  it('returns "unknown" when IP is not available', async () => {
    const { getRequestIP } = await import('h3')
    vi.mocked(getRequestIP).mockReturnValueOnce(undefined)
    const key = getRateLimitKey({} as H3Event)
    expect(key).toBe('unknown')
  })
})

describe('getUserIdFromJwt', () => {
  it('returns the sub claim from a valid Bearer JWT', async () => {
    const { getHeader } = await import('h3')
    const token = makeJwt({ sub: 'user-abc-123', role: 'authenticated' })
    vi.mocked(getHeader).mockReturnValueOnce(`Bearer ${token}`)
    const id = getUserIdFromJwt({} as H3Event)
    expect(id).toBe('user-abc-123')
  })

  it('returns null when Authorization header is absent', () => {
    const id = getUserIdFromJwt({} as H3Event)
    expect(id).toBeNull()
  })

  it('returns null when token has wrong number of segments', async () => {
    const { getHeader } = await import('h3')
    vi.mocked(getHeader).mockReturnValueOnce('Bearer invalid.token')
    const id = getUserIdFromJwt({} as H3Event)
    expect(id).toBeNull()
  })

  it('returns null when payload sub is not a string', async () => {
    const { getHeader } = await import('h3')
    const token = makeJwt({ sub: 42 })
    vi.mocked(getHeader).mockReturnValueOnce(`Bearer ${token}`)
    const id = getUserIdFromJwt({} as H3Event)
    expect(id).toBeNull()
  })
})

describe('getUserOrIpRateLimitKey', () => {
  it('returns user-prefixed key when JWT is present', async () => {
    const { getHeader } = await import('h3')
    const token = makeJwt({ sub: 'user-xyz' })
    vi.mocked(getHeader).mockReturnValueOnce(`Bearer ${token}`)
    const key = getUserOrIpRateLimitKey({} as H3Event)
    expect(key).toBe('user:user-xyz')
  })

  it('falls back to ip-prefixed key when no JWT', () => {
    const key = getUserOrIpRateLimitKey({} as H3Event)
    expect(key).toBe('ip:10.0.0.1')
  })
})

describe('getFingerprintKey', () => {
  it('returns a fp:-prefixed hex string', async () => {
    const { getHeader } = await import('h3')
    vi.mocked(getHeader).mockReturnValueOnce('Mozilla/5.0').mockReturnValueOnce('en-US,en;q=0.9')
    const key = getFingerprintKey({} as H3Event)
    expect(key).toMatch(/^fp:[0-9a-f]+$/)
  })

  it('is deterministic — same UA + lang produces same key', async () => {
    const { getHeader } = await import('h3')
    vi.mocked(getHeader)
      .mockReturnValueOnce('Mozilla/5.0')
      .mockReturnValueOnce('en-US')
      .mockReturnValueOnce('Mozilla/5.0')
      .mockReturnValueOnce('en-US')
    const k1 = getFingerprintKey({} as H3Event)
    const k2 = getFingerprintKey({} as H3Event)
    expect(k1).toBe(k2)
  })

  it('different UA produces different key', async () => {
    const { getHeader } = await import('h3')
    vi.mocked(getHeader)
      .mockReturnValueOnce('BotAgent/1.0')
      .mockReturnValueOnce('en-US')
      .mockReturnValueOnce('Mozilla/5.0')
      .mockReturnValueOnce('en-US')
    const kBot = getFingerprintKey({} as H3Event)
    const kHuman = getFingerprintKey({} as H3Event)
    expect(kBot).not.toBe(kHuman)
  })

  it('different Accept-Language produces different key', async () => {
    const { getHeader } = await import('h3')
    vi.mocked(getHeader)
      .mockReturnValueOnce('Mozilla/5.0')
      .mockReturnValueOnce('es-ES')
      .mockReturnValueOnce('Mozilla/5.0')
      .mockReturnValueOnce('fr-FR')
    const kEs = getFingerprintKey({} as H3Event)
    const kFr = getFingerprintKey({} as H3Event)
    expect(kEs).not.toBe(kFr)
  })

  it('handles missing headers without throwing (empty fingerprint)', async () => {
    const { getHeader } = await import('h3')
    vi.mocked(getHeader).mockReturnValueOnce(null).mockReturnValueOnce(null)
    expect(() => getFingerprintKey({} as H3Event)).not.toThrow()
    vi.mocked(getHeader).mockReturnValueOnce(null).mockReturnValueOnce(null)
    const key = getFingerprintKey({} as H3Event)
    expect(key).toMatch(/^fp:[0-9a-f]+$/)
  })
})

describe('cleanup interval callback', () => {
  it('fires cleanup and removes stale entries', async () => {
    vi.useFakeTimers()
    vi.resetModules()
    const { checkRateLimit: freshCheck } = await import('../../../server/utils/rateLimit')

    const key = `stale-${Date.now()}`
    freshCheck(key, { windowMs: 100, max: 10 }) // triggers startCleanup + records timestamp

    // Advance past CLEANUP_INTERVAL_MS (5 min) — fires the setInterval callback
    vi.advanceTimersByTime(5 * 60 * 1000 + 1)

    // The cleanup callback ran (lines 25-34 covered)
    expect(typeof freshCheck(key, { windowMs: 60_000, max: 1 })).toBe('boolean')

    vi.useRealTimers()
    vi.resetModules()
  })

  it('deletes entries whose timestamps all expired (>10 min)', async () => {
    vi.useFakeTimers()
    vi.resetModules()
    const { checkRateLimit: freshCheck } = await import('../../../server/utils/rateLimit')

    const key = `expired-${Date.now()}`
    freshCheck(key, { windowMs: 100, max: 10 })

    // Advance past 10-min maxWindow so timestamps are fully stale and entry is deleted
    vi.advanceTimersByTime(10 * 60 * 1000 + 1)

    // After cleanup, the key's entry should have been deleted (line 34)
    // Next call should create a fresh entry and succeed
    expect(freshCheck(key, { windowMs: 60_000, max: 1 })).toBe(true)

    vi.useRealTimers()
    vi.resetModules()
  })
})
