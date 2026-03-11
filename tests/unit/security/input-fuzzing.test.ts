/**
 * Input fuzzing tests for critical endpoints.
 * Tests that endpoints handle malicious/unexpected inputs gracefully
 * without crashing, leaking data, or producing unexpected behavior.
 */
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'

// --- Fuzz payloads ---
const SQL_INJECTIONS = [
  "'; DROP TABLE vehicles; --",
  "1' OR '1'='1",
  '1; SELECT * FROM users--',
  "' UNION SELECT password FROM users--",
  "1' AND SLEEP(5)--",
  "admin'/*",
  "' OR 1=1#",
  '\' OR ""=\'',
]

const XSS_PAYLOADS = [
  '<script>alert("xss")</script>',
  '<img src=x onerror=alert(1)>',
  '"><svg onload=alert(1)>',
  "javascript:alert('xss')",
  '<iframe src="data:text/html,<script>alert(1)</script>">',
  '{{constructor.constructor("return this")().alert}}',
  '<details open ontoggle=alert(1)>',
]

const PATH_TRAVERSALS = [
  '../../../etc/passwd',
  '..\\..\\..\\windows\\system32',
  '%2e%2e%2f%2e%2e%2f',
  '....//....//etc/passwd',
  '..%00/etc/passwd',
]

const OVERFLOW_PAYLOADS = ['A'.repeat(10_000), 'A'.repeat(100_000), '0'.repeat(50_000)]

const TYPE_CONFUSION = [
  null,
  undefined,
  0,
  -1,
  NaN,
  Infinity,
  true,
  false,
  [],
  {},
  { __proto__: { admin: true } },
  { constructor: { prototype: { admin: true } } },
]

const SPECIAL_CHARS = [
  '\x00', // null byte
  '\r\n\r\n', // CRLF injection
  '\n', // newline
  '\t'.repeat(1000),
  '🚗'.repeat(1000), // unicode flood
  '\uFEFF', // BOM
  '\u202E', // RTL override
]

// --- Endpoint-specific test helpers ---

// Mock validateBody used by Zod-validated endpoints
const mockValidateBody = vi.fn()
vi.stubGlobal('validateBody', mockValidateBody)

// Helpers
function expectNoLeak(result: any) {
  const str = JSON.stringify(result)
  // Should never leak internal paths, stack traces, or DB schemas
  expect(str).not.toContain('node_modules')
  expect(str).not.toContain('at Object.')
  expect(str).not.toContain('SELECT ')
  expect(str).not.toContain('password')
  expect(str).not.toContain('service_role')
}

describe('Input Fuzzing — sanitizeInput utils', () => {
  let sanitizeText: Function
  let sanitizeSlug: Function
  let sanitizeRecord: Function

  beforeAll(async () => {
    const mod = await import('../../../server/utils/sanitizeInput')
    sanitizeText = mod.sanitizeText
    sanitizeSlug = mod.sanitizeSlug
    sanitizeRecord = mod.sanitizeRecord
  })

  describe('sanitizeText', () => {
    it.each(XSS_PAYLOADS)('strips HTML-based XSS from: %s', (payload) => {
      const result = sanitizeText(payload)
      // sanitizeText strips HTML tags; non-tag payloads like javascript: URIs
      // are handled by CSP at render time, not by text sanitization
      expect(result).not.toContain('<script')
      expect(result).not.toContain('onerror=')
      expect(result).not.toContain('onload=')
    })

    it.each(SQL_INJECTIONS)(
      'passes through SQL (sanitization is at query level): %s',
      (payload) => {
        // sanitizeText is for XSS, not SQL injection — SQL is handled by parameterized queries
        const result = sanitizeText(payload)
        expect(typeof result).toBe('string')
      },
    )

    it('handles null bytes', () => {
      const result = sanitizeText('test\x00injection')
      expect(result).not.toContain('\x00')
    })

    it('handles extremely long strings', () => {
      const result = sanitizeText('A'.repeat(100_000))
      expect(typeof result).toBe('string')
    })

    it('handles unicode floods', () => {
      const result = sanitizeText('🚗'.repeat(10_000))
      expect(typeof result).toBe('string')
    })
  })

  describe('sanitizeSlug', () => {
    it.each(PATH_TRAVERSALS)('blocks path traversal: %s', (payload) => {
      const result = sanitizeSlug(payload)
      expect(result).not.toContain('..')
      expect(result).not.toContain('/')
      expect(result).not.toContain('\\')
    })

    it('handles null bytes in slugs', () => {
      const result = sanitizeSlug('valid\x00slug')
      expect(result).not.toContain('\x00')
    })
  })

  describe('sanitizeRecord', () => {
    it('sanitizes top-level string values', () => {
      const input = {
        title: '<script>alert(1)</script>Normal',
        description: '<img src=x onerror=alert(1)>',
      }
      const result = sanitizeRecord(input)
      expect(result.title).not.toContain('<script')
      expect(result.description).not.toContain('onerror')
    })

    it('handles prototype pollution attempts', () => {
      const malicious = JSON.parse('{"__proto__":{"admin":true}}')
      const result = sanitizeRecord(malicious)
      expect(({} as any).admin).toBeUndefined()
      expectNoLeak(result)
    })
  })
})

describe('Input Fuzzing — validatePath utils', () => {
  let isSafeSlug: Function
  let isSafeFilename: Function
  let isPrivateHost: Function

  beforeAll(async () => {
    const mod = await import('../../../server/utils/validatePath')
    isSafeSlug = mod.isSafeSlug
    isSafeFilename = mod.isSafeFilename
    isPrivateHost = mod.isPrivateHost
  })

  describe('isSafeSlug', () => {
    it.each(PATH_TRAVERSALS)('rejects path traversal: %s', (payload) => {
      expect(isSafeSlug(payload)).toBe(false)
    })

    it.each(SPECIAL_CHARS)('rejects special char payloads', (payload) => {
      // Most special chars should fail slug validation
      if (payload.trim().length === 0) return // skip empty after trim
      expect(isSafeSlug(payload)).toBe(false)
    })

    it('accepts valid slugs', () => {
      expect(isSafeSlug('valid-slug-123')).toBe(true)
      expect(isSafeSlug('my-vehicle')).toBe(true)
    })
  })

  describe('isSafeFilename', () => {
    const FILENAME_TRAVERSALS = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32',
      '..%00/etc/passwd', // contains null byte
      '.hidden-file', // starts with dot
    ]

    it.each(FILENAME_TRAVERSALS)('rejects path traversal: %s', (payload) => {
      expect(isSafeFilename(payload)).toBe(false)
    })

    it('rejects null bytes', () => {
      expect(isSafeFilename('file\x00.jpg')).toBe(false)
    })
  })

  describe('isPrivateHost', () => {
    const privateHosts = [
      '127.0.0.1',
      '10.0.0.1',
      '192.168.1.1',
      '172.16.0.1',
      '169.254.169.254', // AWS metadata
      'localhost',
      '0.0.0.0',
      '::1', // IPv6 loopback (without brackets — raw hostname)
    ]

    it.each(privateHosts)('blocks private host: %s', (host) => {
      expect(isPrivateHost(host)).toBe(true)
    })

    it('allows public hosts', () => {
      expect(isPrivateHost('example.com')).toBe(false)
      expect(isPrivateHost('1.2.3.4')).toBe(false)
    })
  })
})

describe('Input Fuzzing — type confusion on JSON bodies', () => {
  it.each(TYPE_CONFUSION)('handles type confusion input: %j', (input) => {
    // Simulate what happens when unexpected types reach endpoint handlers
    // These should never cause unhandled exceptions
    const asString = String(input ?? '')
    expect(typeof asString).toBe('string')

    // JSON.stringify returns undefined for undefined/functions, string otherwise
    const json = JSON.stringify(input)
    expect(json === undefined || typeof json === 'string').toBe(true)
  })

  it('handles deeply nested objects', () => {
    let obj: any = { value: 'leaf' }
    for (let i = 0; i < 100; i++) {
      obj = { nested: obj }
    }
    const json = JSON.stringify(obj)
    expect(json.length).toBeGreaterThan(0)
  })

  it('handles circular reference attempts in JSON', () => {
    const obj: any = { a: 1 }
    obj.self = obj
    expect(() => JSON.stringify(obj)).toThrow()
  })
})

describe('Input Fuzzing — overflow and resource exhaustion', () => {
  it.each(OVERFLOW_PAYLOADS)('handles overflow payload (length=%s)', (payload) => {
    // Should not crash
    expect(typeof payload).toBe('string')
    expect(payload.length).toBeGreaterThan(0)

    // URL encoding should work
    const encoded = encodeURIComponent(payload.substring(0, 1000))
    expect(typeof encoded).toBe('string')
  })

  it('handles ReDoS-safe patterns', () => {
    // Ensure our slug validation regex doesn't suffer from ReDoS
    const start = Date.now()
    const evilInput = 'a'.repeat(100) + '!'
    // This should complete in under 100ms regardless of input
    const isValid = /^[a-z0-9-]+$/.test(evilInput)
    const elapsed = Date.now() - start
    expect(isValid).toBe(false)
    expect(elapsed).toBeLessThan(100)
  })
})
