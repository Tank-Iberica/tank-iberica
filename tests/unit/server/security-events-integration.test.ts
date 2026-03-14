/**
 * Tests for securityEvents.ts integration across middleware and utils.
 *
 * Verifies that each security pillar correctly emits events into the
 * centralized security store via recordSecurityEvent().
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// ── Shared mock for securityEvents ────────────────────────────────────────────
vi.mock('~~/server/utils/securityEvents', () => ({
  recordSecurityEvent: vi.fn(),
  setSecurityAlertHandler: vi.fn(),
  clearSecurityEvents: vi.fn(),
  getRecentEventsForIp: vi.fn(() => []),
  getTotalEventCount: vi.fn(() => 0),
}))

import { recordSecurityEvent, setSecurityAlertHandler } from '~~/server/utils/securityEvents'

// ── Global stubs needed by middleware/plugins ─────────────────────────────────
vi.stubGlobal('defineEventHandler', (fn: Function) => fn)
vi.stubGlobal('defineNitroPlugin', (fn: Function) => fn)
vi.stubGlobal('createError', (opts: { statusCode?: number; statusMessage?: string }) => {
  const err = new Error(opts.statusMessage ?? 'Error')
  ;(err as any).statusCode = opts.statusCode
  return err
})
vi.stubGlobal(
  'getResponseStatus',
  vi.fn(() => 200),
)

// ── Pillar 1 — Rate limit / auto-ban integration ──────────────────────────────

vi.mock('~~/server/utils/rateLimit', async (importOriginal) => {
  const original = await importOriginal<typeof import('~~/server/utils/rateLimit')>()
  return {
    ...original,
    isIpBanned: vi.fn(() => 0),
    checkRateLimit: vi.fn(() => true),
    record4xxError: vi.fn(() => false),
    getRateLimitKey: vi.fn(() => '1.2.3.4'),
    getUserOrIpRateLimitKey: vi.fn(() => 'ip:1.2.3.4'),
    getFingerprintKey: vi.fn(() => 'fp:abc123'),
    getRetryAfterSeconds: vi.fn(() => 60),
  }
})

import * as rateLimitUtils from '~~/server/utils/rateLimit'

describe('rate-limit middleware → securityEvents', () => {
  const origEnv = process.env.ENABLE_MEMORY_RATE_LIMIT

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ENABLE_MEMORY_RATE_LIMIT = 'true'
  })

  afterEach(() => {
    if (origEnv !== undefined) process.env.ENABLE_MEMORY_RATE_LIMIT = origEnv
    else delete process.env.ENABLE_MEMORY_RATE_LIMIT
  })

  it('emits ip_banned when isIpBanned returns a ban expiry', async () => {
    vi.mocked(rateLimitUtils.isIpBanned).mockReturnValue(Date.now() + 60_000)

    const { default: handler } = await import('~~/server/middleware/rate-limit')

    const event = {
      path: '/api/stripe/checkout',
      method: 'POST',
      node: { req: {}, res: { on: vi.fn() } },
    } as unknown as Parameters<typeof handler>[0]

    expect(() => handler(event)).toThrow()
    expect(recordSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ip_banned',
        ip: '1.2.3.4',
        path: '/api/stripe/checkout',
      }),
    )
  })

  it('emits rate_limit_exceeded when checkRateLimit returns false', async () => {
    vi.mocked(rateLimitUtils.isIpBanned).mockReturnValue(0)
    vi.mocked(rateLimitUtils.checkRateLimit).mockReturnValue(false)

    const { default: handler } = await import('~~/server/middleware/rate-limit')

    const event = {
      path: '/api/email/send',
      method: 'POST',
      node: { req: {}, res: { on: vi.fn() } },
    } as unknown as Parameters<typeof handler>[0]

    expect(() => handler(event)).toThrow()
    expect(recordSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'rate_limit_exceeded',
        ip: '1.2.3.4',
        path: '/api/email/send',
      }),
    )
  })

  it('emits ip_banned via res.on("finish") when record4xxError returns true', async () => {
    vi.mocked(rateLimitUtils.isIpBanned).mockReturnValue(0)
    vi.mocked(rateLimitUtils.checkRateLimit).mockReturnValue(true)

    let onFinishCallback: (() => void) | null = null
    const mockRes = {
      on: vi.fn((evtName: string, cb: () => void) => {
        if (evtName === 'finish') onFinishCallback = cb
      }),
      statusCode: 404,
    }

    const event = {
      path: '/api/search',
      method: 'GET',
      node: { req: {}, res: mockRes },
    } as unknown as Parameters<(typeof import('~~/server/middleware/rate-limit'))['default']>[0]

    // Override getResponseStatus globally to return 404
    vi.stubGlobal(
      'getResponseStatus',
      vi.fn(() => 404),
    )

    vi.mocked(rateLimitUtils.record4xxError).mockReturnValue(true)

    vi.resetModules()
    const { default: handler } = await import('~~/server/middleware/rate-limit')
    handler(event)

    // Simulate request completion
    onFinishCallback?.()

    expect(recordSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'ip_banned', ip: '1.2.3.4' }),
    )
  })

  it('does NOT emit when request is allowed', async () => {
    vi.mocked(rateLimitUtils.isIpBanned).mockReturnValue(0)
    vi.mocked(rateLimitUtils.checkRateLimit).mockReturnValue(true)

    const mockRes = { on: vi.fn() }
    const event = {
      path: '/api/health',
      method: 'GET',
      node: { req: {}, res: mockRes },
    } as unknown as Parameters<(typeof import('~~/server/middleware/rate-limit'))['default']>[0]

    const { default: handler } = await import('~~/server/middleware/rate-limit')
    handler(event) // should not throw

    expect(recordSecurityEvent).not.toHaveBeenCalled()
  })
})

// ── Pillar 2 — Bot detection integration ─────────────────────────────────────

vi.mock('~~/server/utils/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

describe('bot-detection middleware → securityEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function makeEvent(ua: string, ip = '9.9.9.9', url = '/api/search') {
    return {
      node: { req: { url } },
      method: 'GET',
      _headers: { 'user-agent': ua, 'x-forwarded-for': ip },
    } as unknown as Parameters<(typeof import('~~/server/middleware/bot-detection'))['default']>[0]
  }

  const getHeaderMock = vi.fn((event: unknown, header: string) => {
    const e = event as { _headers: Record<string, string> }
    return e._headers[header] ?? null
  })

  beforeEach(() => {
    vi.doMock('h3', async (importOriginal) => {
      const original = await importOriginal()
      return { ...original, getHeader: getHeaderMock, setResponseStatus: vi.fn() }
    })
  })

  it('emits bot_detected for sqlmap user-agent', async () => {
    const { default: handler } = await import('~~/server/middleware/bot-detection')
    handler(makeEvent('sqlmap/1.4.7#stable (https://sqlmap.org)'))

    expect(recordSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'bot_detected',
        ip: '9.9.9.9',
        path: '/api/search',
      }),
    )
    expect(recordSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.stringContaining('sqlmap'),
      }),
    )
  })

  it('emits bot_detected for nikto user-agent', async () => {
    const { default: handler } = await import('~~/server/middleware/bot-detection')
    handler(makeEvent('Mozilla/5.0 (nikto/2.1.6)'))

    expect(recordSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'bot_detected' }),
    )
  })

  it('does NOT emit for legitimate browser user-agent', async () => {
    const { default: handler } = await import('~~/server/middleware/bot-detection')
    handler(makeEvent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0'))

    expect(recordSecurityEvent).not.toHaveBeenCalled()
  })

  it('does NOT emit for missing user-agent (only logs warning)', async () => {
    const { default: handler } = await import('~~/server/middleware/bot-detection')
    handler(makeEvent(''))

    expect(recordSecurityEvent).not.toHaveBeenCalled()
  })

  it('does NOT emit for non-API paths', async () => {
    const { default: handler } = await import('~~/server/middleware/bot-detection')
    handler(makeEvent('sqlmap/1.4.7', '1.2.3.4', '/catalogo/vehiculos'))

    expect(recordSecurityEvent).not.toHaveBeenCalled()
  })
})

// ── Pillar 4 — Session binding integration ────────────────────────────────────

describe('sessionBinding → securityEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset module to clear sessionStore between tests
  })

  it('emits session_anomaly when both IP and UA change', async () => {
    const { checkSessionBinding, clearSessionBindingStore } =
      await import('~~/server/utils/sessionBinding')
    clearSessionBindingStore()

    // First request — bind fingerprint
    checkSessionBinding('session-abc', '1.2.3.4', 'Mozilla/Firefox 120')
    // Second request — both IP and UA changed
    const result = checkSessionBinding('session-abc', '5.6.7.8', 'curl/7.80')

    expect(result).toBe('suspicious')
    expect(recordSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'session_anomaly',
        ip: '5.6.7.8',
        detail: expect.stringContaining('session-'),
      }),
    )
  })

  it('does NOT emit when only IP changes (legitimate: mobile/VPN)', async () => {
    const { checkSessionBinding, clearSessionBindingStore } =
      await import('~~/server/utils/sessionBinding')
    clearSessionBindingStore()

    checkSessionBinding('session-xyz', '1.2.3.4', 'Mozilla/Firefox 120')
    const result = checkSessionBinding('session-xyz', '9.9.9.9', 'Mozilla/Firefox 120')

    expect(result).toBe('ok')
    expect(recordSecurityEvent).not.toHaveBeenCalled()
  })

  it('does NOT emit when only UA changes (legitimate: browser update)', async () => {
    const { checkSessionBinding, clearSessionBindingStore } =
      await import('~~/server/utils/sessionBinding')
    clearSessionBindingStore()

    checkSessionBinding('session-uvw', '1.2.3.4', 'Mozilla/Firefox 120')
    const result = checkSessionBinding('session-uvw', '1.2.3.4', 'Mozilla/Firefox 121')

    expect(result).toBe('ok')
    expect(recordSecurityEvent).not.toHaveBeenCalled()
  })

  it('does NOT emit on first request (no previous fingerprint)', async () => {
    const { checkSessionBinding, clearSessionBindingStore } =
      await import('~~/server/utils/sessionBinding')
    clearSessionBindingStore()

    const result = checkSessionBinding('session-new', '1.2.3.4', 'Mozilla/Firefox 120')

    expect(result).toBe('ok')
    expect(recordSecurityEvent).not.toHaveBeenCalled()
  })
})

// ── Pillar 3 — CSP report integration ────────────────────────────────────────

describe('csp-report endpoint → securityEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function makeCSPEvent(
    report: Record<string, unknown>,
    ip = '2.3.4.5',
  ): Parameters<(typeof import('~~/server/api/infra/csp-report.post'))['default']>[0] {
    return {
      node: { res: {} },
      _ip: ip,
    } as unknown as Parameters<(typeof import('~~/server/api/infra/csp-report.post'))['default']>[0]
  }

  it('emits csp_violation when alert threshold is reached', async () => {
    vi.doMock('h3', async (importOriginal) => {
      const original = await importOriginal()
      return {
        ...original,
        getHeader: (event: { _ip?: string }, header: string) => {
          if (header === 'x-forwarded-for') return event._ip ?? null
          return null
        },
        readBody: vi.fn().mockResolvedValue({
          'csp-report': {
            'violated-directive': 'script-src',
            'blocked-uri': 'https://evil.com/payload.js',
            'document-uri': 'https://tracciona.es/catalogo',
          },
        }),
        defineEventHandler: (fn: (e: unknown) => unknown) => fn,
      }
    })

    const { default: handler } = await import('~~/server/api/infra/csp-report.post')

    // Send 5 violations (ALERT_THRESHOLD) for same directive
    for (let i = 0; i < 5; i++) {
      await (handler as (e: unknown) => Promise<unknown>)(makeCSPEvent({}, '2.3.4.5'))
    }

    expect(recordSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'csp_violation',
        ip: '2.3.4.5',
        detail: 'script-src',
      }),
    )
  })
})

// ── security-alerts plugin ────────────────────────────────────────────────────

describe('security-alerts Nitro plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registers an alert handler on plugin init', async () => {
    vi.resetModules()
    // Evaluate the plugin — defineNitroPlugin is globally stubbed to (fn) => fn
    const { default: plugin } = await import('~~/server/plugins/security-alerts')
    if (typeof plugin === 'function') plugin()

    expect(setSecurityAlertHandler).toHaveBeenCalledWith(expect.any(Function))
  })

  it('alert handler logs error with ip, count, and types', async () => {
    const { logger } = await import('~~/server/utils/logger')

    // Capture the handler that was registered
    let capturedHandler: ((ip: string, events: unknown[]) => void) | null = null
    vi.mocked(setSecurityAlertHandler).mockImplementation((fn) => {
      capturedHandler = fn
    })

    vi.resetModules()
    const { default: plugin } = await import('~~/server/plugins/security-alerts')
    if (typeof plugin === 'function') plugin()

    // Invoke the plugin init (trigger handler registration)
    expect(capturedHandler).not.toBeNull()

    capturedHandler!('1.2.3.4', [
      { type: 'rate_limit_exceeded', ip: '1.2.3.4', timestamp: 1000 },
      { type: 'bot_detected', ip: '1.2.3.4', timestamp: 2000 },
      { type: 'rate_limit_exceeded', ip: '1.2.3.4', timestamp: 3000 },
    ])

    expect(logger.error).toHaveBeenCalledWith(
      '[SECURITY-ALERT] IP exceeded threat threshold',
      expect.objectContaining({
        ip: '1.2.3.4',
        count: 3,
        types: expect.arrayContaining(['rate_limit_exceeded', 'bot_detected']),
      }),
    )
  })
})
