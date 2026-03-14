import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────

const { mockWarn, mockError } = vi.hoisted(() => ({
  mockWarn: vi.fn(),
  mockError: vi.fn(),
}))

vi.mock('../../../server/utils/logger', () => ({
  logger: { warn: mockWarn, error: mockError },
}))

// Mock h3 — readBody is called with the event
const mockReadBody = vi.fn()
vi.mock('h3', () => ({
  defineEventHandler: (fn: unknown) => fn,
  readBody: (...args: unknown[]) => mockReadBody(...args),
  getHeader: vi.fn().mockReturnValue(undefined),
}))

// Mock useSupabaseRestHeaders and $fetch — used for optional DB write
vi.stubGlobal('useSupabaseRestHeaders', () => null) // returns null → DB write skipped
vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({}))

// ── Import handler ────────────────────────────────────────────────────────────

// We import AFTER mocking so the module-level rate limit counters start fresh
// Each test that needs isolated rate limits should re-import or reset manually.
import cspReportHandler from '../../../server/api/infra/csp-report.post'

// The handler is the defineEventHandler callback
const handler = cspReportHandler as (event: never) => Promise<{ status: string }>
const mockEvent = {} as never

function makeCspBody(
  overrides: Partial<{
    'document-uri': string
    'violated-directive': string
    'blocked-uri': string
    'source-file': string
    'line-number': number
    disposition: string
  }> = {},
) {
  return {
    'csp-report': {
      'document-uri': 'https://tracciona.com/vehiculos',
      'violated-directive': 'script-src',
      'blocked-uri': 'https://evil.com/script.js',
      'source-file': 'inline',
      'line-number': 42,
      disposition: 'enforce',
      ...overrides,
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── 1. Valid report ───────────────────────────────────────────────────────────

describe('CSP Report endpoint — valid reports', () => {
  it('returns { status: "received" } for a valid CSP report', async () => {
    mockReadBody.mockResolvedValue(makeCspBody())
    const result = await handler(mockEvent)
    expect(result.status).toBe('received')
  })

  it('logs the violation with warn', async () => {
    mockReadBody.mockResolvedValue(
      makeCspBody({ 'violated-directive': 'img-src', 'blocked-uri': 'https://evil.com/img.png' }),
    )
    await handler(mockEvent)
    expect(mockWarn).toHaveBeenCalledWith(
      '[CSP-Violation]',
      expect.objectContaining({
        violatedDirective: 'img-src',
        blockedUri: 'https://evil.com/img.png',
      }),
    )
  })

  it('includes timestamp in log entry', async () => {
    mockReadBody.mockResolvedValue(makeCspBody())
    await handler(mockEvent)
    expect(mockWarn).toHaveBeenCalledWith(
      '[CSP-Violation]',
      expect.objectContaining({ timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}/) }),
    )
  })

  it('logs document-uri in violation entry', async () => {
    mockReadBody.mockResolvedValue(
      makeCspBody({ 'document-uri': 'https://tracciona.com/admin/vehicles' }),
    )
    await handler(mockEvent)
    expect(mockWarn).toHaveBeenCalledWith(
      '[CSP-Violation]',
      expect.objectContaining({ documentUri: 'https://tracciona.com/admin/vehicles' }),
    )
  })
})

// ── 2. Invalid / malformed body ───────────────────────────────────────────────

describe('CSP Report endpoint — malformed inputs', () => {
  it('returns { status: "invalid" } when readBody throws', async () => {
    mockReadBody.mockRejectedValue(new Error('parse error'))
    const result = await handler(mockEvent)
    expect(result.status).toBe('invalid')
  })

  it('returns { status: "no_report" } when csp-report field is missing', async () => {
    mockReadBody.mockResolvedValue({})
    const result = await handler(mockEvent)
    expect(result.status).toBe('no_report')
  })

  it('returns { status: "no_report" } when body is null', async () => {
    mockReadBody.mockResolvedValue(null)
    const result = await handler(mockEvent)
    expect(result.status).toBe('no_report')
  })

  it('returns { status: "no_report" } when csp-report is null', async () => {
    mockReadBody.mockResolvedValue({ 'csp-report': null })
    const result = await handler(mockEvent)
    expect(result.status).toBe('no_report')
  })

  it('does not log when report is missing', async () => {
    mockReadBody.mockResolvedValue({})
    await handler(mockEvent)
    expect(mockWarn).not.toHaveBeenCalled()
  })
})

// ── 3. Known noise filtering ──────────────────────────────────────────────────

describe('CSP Report endpoint — noise filtering', () => {
  const noisePrefixes = [
    'chrome-extension://abc123/script.js',
    'moz-extension://xyz/content.js',
    'safari-extension://test/inject.js',
    'about:blank',
    'data:text/javascript,alert(1)',
    'blob:https://example.com/uuid',
  ]

  for (const blockedUri of noisePrefixes) {
    it(`filters known noise: "${blockedUri.slice(0, 40)}" → filtered`, async () => {
      mockReadBody.mockResolvedValue(makeCspBody({ 'blocked-uri': blockedUri }))
      const result = await handler(mockEvent)
      expect(result.status).toBe('filtered')
    })
  }

  it('does NOT filter legitimate external script violations', async () => {
    mockReadBody.mockResolvedValue(makeCspBody({ 'blocked-uri': 'https://evil.com/script.js' }))
    const result = await handler(mockEvent)
    expect(result.status).toBe('received')
  })
})

// ── 4. Threshold alerting ─────────────────────────────────────────────────────

describe('CSP Report endpoint — threshold alerting', () => {
  it('logs an error alert when same directive fires ≥5 times per minute', async () => {
    const violatedDirective = 'connect-src-threshold-test'

    // Fire 5 reports with the same directive (threshold = 5)
    for (let i = 0; i < 5; i++) {
      mockReadBody.mockResolvedValue(
        makeCspBody({
          'violated-directive': violatedDirective,
          'blocked-uri': `https://external${i}.com`,
        }),
      )
      await handler(mockEvent)
    }

    // On the 5th hit, an alert error should be logged
    expect(mockError).toHaveBeenCalledWith(
      '[CSP-ALERT] Repeated violation — possible XSS or misconfiguration',
      expect.objectContaining({
        violatedDirective,
        count: 5,
      }),
    )
  })

  it('does not fire alert before threshold (4 times)', async () => {
    const violatedDirective = 'img-src-below-threshold'

    for (let i = 0; i < 4; i++) {
      mockReadBody.mockResolvedValue(makeCspBody({ 'violated-directive': violatedDirective }))
      await handler(mockEvent)
    }

    expect(mockError).not.toHaveBeenCalled()
  })
})

// ── 5. Disposition field ──────────────────────────────────────────────────────

describe('CSP Report endpoint — disposition handling', () => {
  it('includes disposition in log entry', async () => {
    mockReadBody.mockResolvedValue(makeCspBody({ disposition: 'report' }))
    await handler(mockEvent)
    expect(mockWarn).toHaveBeenCalledWith(
      '[CSP-Violation]',
      expect.objectContaining({ disposition: 'report' }),
    )
  })
})
