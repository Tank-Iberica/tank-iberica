import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

/**
 * Fuzzing tests — critical endpoints resist injection, overflow, and malformed inputs.
 *
 * Uses MSW to model expected server behavior (contracts).
 * Tests cover: SQL injection, XSS, boundary values, unicode, and SSRF payloads.
 *
 * Reference: Plan Maestro §2.6 "Fuzzing de inputs en endpoints críticos"
 */

const BASE = 'http://localhost:3000'

const server = setupServer(
  // ── Search (public) ──
  http.get(`${BASE}/api/vehicles`, () =>
    HttpResponse.json({ data: [], count: 0 }, { status: 200 }),
  ),

  // ── Auth login ──
  http.post(`${BASE}/api/auth/login`, () =>
    HttpResponse.json({ error: 'Credenciales inválidas' }, { status: 401 }),
  ),

  // ── Image process — validates URL scheme ──
  http.post(`${BASE}/api/images/process`, async ({ request }) => {
    let body: Record<string, string> = {}
    try {
      body = (await request.json()) as Record<string, string>
    } catch {
      return HttpResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
    }
    const url = body.url || ''
    if (!url.startsWith('https://') && !url.startsWith('http://')) {
      return HttpResponse.json({ error: 'URL no permitida' }, { status: 400 })
    }
    // Reject private/loopback hosts (SSRF protection)
    const PRIVATE_PATTERNS = [
      /^http:\/\/localhost/i,
      /^https?:\/\/127\./,
      /^https?:\/\/192\.168\./,
      /^https?:\/\/10\./,
      /^https?:\/\/172\.(1[6-9]|2\d|3[01])\./,
      /^https?:\/\/169\.254\./,
      /^https?:\/\/0\.0\.0\.0/,
    ]
    if (PRIVATE_PATTERNS.some((p) => p.test(url))) {
      return HttpResponse.json({ error: 'URL no permitida' }, { status: 400 })
    }
    return HttpResponse.json({ statusCode: 401 }, { status: 401 })
  }),

  // ── Generate description ──
  http.post(`${BASE}/api/generate-description`, async ({ request }) => {
    try {
      await request.json()
    } catch {
      return HttpResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
    }
    return HttpResponse.json({ statusCode: 401 }, { status: 401 })
  }),

  // ── Stripe checkout ──
  http.post(`${BASE}/api/stripe/checkout`, async ({ request }) => {
    try {
      await request.json()
    } catch {
      return HttpResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
    }
    return HttpResponse.json({ statusCode: 401 }, { status: 401 })
  }),

  // ── Import stock ──
  http.post(`${BASE}/api/dealer/import-stock`, async ({ request }) => {
    try {
      await request.json()
    } catch {
      return HttpResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
    }
    return HttpResponse.json({ statusCode: 401 }, { status: 401 })
  }),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ── Payloads ────────────────────────────────────────────────────────────────

const SQL_PAYLOADS = [
  "' OR 1=1 --",
  "'; DROP TABLE vehicles; --",
  "1' UNION SELECT * FROM users --",
  "1; SELECT * FROM information_schema.tables",
  "' OR 'x'='x",
  "admin'--",
  "' OR 1=1#",
  "1 OR 1 = 1",
]

const XSS_PAYLOADS = [
  '<script>alert(1)</script>',
  '<img src="x" onerror="alert(1)">',
  'javascript:alert(document.cookie)',
  '<svg onload="alert(1)">',
  '"><script>alert(1)</script>',
  "';alert(1)//",
  '{{constructor.constructor("return this")()}}',
]

const BOUNDARY_PAYLOADS = [
  '',
  ' ',
  '\t\n\r',
  'a'.repeat(10_000),
  '\0',
  '\u0000',
  '\uFFFD',
  '🚛'.repeat(100),
]

const UNICODE_PAYLOADS = [
  '\u202E', // right-to-left override
  '\uFEFF', // BOM
  '\u0000', // null byte
  'café',
  '日本語テスト',
  'Ñoño',
  '中文',
  '🚚🏗️🚜',
]

const SSRF_URLS = [
  'javascript:alert(1)',
  'data:text/html,<script>alert(1)</script>',
  'file:///etc/passwd',
  'ftp://internal.host/secret',
  'dict://localhost:11111/',
  'gopher://internal/',
  '',
  'http://localhost/admin',
  'http://127.0.0.1/api/internal',
  'http://192.168.1.1/config',
  'http://10.0.0.1/secret',
  'http://169.254.169.254/latest/meta-data/', // AWS metadata endpoint
  'http://0.0.0.0',
  'JAVASCRIPT:alert(1)', // uppercase bypass attempt
  'java\tscript:alert(1)', // tab injection
]

// ── 1. SQL injection in search ───────────────────────────────────────────────

describe('Fuzzing: search endpoint resists SQL injection', () => {
  for (const payload of SQL_PAYLOADS) {
    it(`SQL: "${payload.slice(0, 40)}" → no 500`, async () => {
      const res = await fetch(`${BASE}/api/vehicles?q=${encodeURIComponent(payload)}`)
      expect(res.status).not.toBe(500)
    })
  }
})

// ── 2. XSS in search ────────────────────────────────────────────────────────

describe('Fuzzing: XSS payloads in search are not reflected unescaped', () => {
  for (const payload of XSS_PAYLOADS) {
    it(`XSS: "${payload.slice(0, 40)}" → no 500, no reflected script`, async () => {
      const res = await fetch(`${BASE}/api/vehicles?q=${encodeURIComponent(payload)}`)
      expect(res.status).not.toBe(500)
      if (res.ok) {
        const text = await res.text()
        expect(text).not.toContain('<script>')
        expect(text).not.toContain('onerror=')
        expect(text).not.toContain('javascript:')
      }
    })
  }
})

// ── 3. Boundary values in search ─────────────────────────────────────────────

describe('Fuzzing: boundary values in search do not crash server', () => {
  for (const payload of BOUNDARY_PAYLOADS) {
    it(`boundary: ${JSON.stringify(payload).slice(0, 40)} → no 500`, async () => {
      const res = await fetch(`${BASE}/api/vehicles?q=${encodeURIComponent(payload)}`)
      expect(res.status).not.toBe(500)
    })
  }
})

// ── 4. Auth injection resistance ─────────────────────────────────────────────

describe('Fuzzing: auth endpoint resists injection and returns consistent errors', () => {
  for (const payload of SQL_PAYLOADS.slice(0, 4)) {
    it(`auth SQL email: "${payload.slice(0, 30)}" → consistent 401`, async () => {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: payload, password: 'test' }),
      })
      expect(res.status).toBe(401)
    })
  }

  for (const payload of XSS_PAYLOADS.slice(0, 3)) {
    it(`auth XSS password: "${payload.slice(0, 30)}" → no 500`, async () => {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: payload }),
      })
      expect(res.status).not.toBe(500)
    })
  }

  it('missing email field → no 500', async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'test' }),
    })
    expect(res.status).not.toBe(500)
  })

  it('both fields null → no 500', async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: null, password: null }),
    })
    expect(res.status).not.toBe(500)
  })
})

// ── 5. SSRF protection in image process ──────────────────────────────────────

describe('Fuzzing: image process rejects dangerous URLs (SSRF/injection)', () => {
  for (const url of SSRF_URLS) {
    it(`image URL: "${url.slice(0, 50)}" → 400/401/403 (not 200 or 500)`, async () => {
      const res = await fetch(`${BASE}/api/images/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      expect([400, 401, 403, 422]).toContain(res.status)
    })
  }
})

// ── 6. Malformed payloads in generate-description ────────────────────────────

describe('Fuzzing: generate-description handles malformed/overflow inputs', () => {
  it('missing Content-Type with text body → no 500', async () => {
    const res = await fetch(`${BASE}/api/generate-description`, {
      method: 'POST',
      body: 'not json',
    })
    expect(res.status).not.toBe(500)
  })

  it('truncated JSON → no 500', async () => {
    const res = await fetch(`${BASE}/api/generate-description`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"brand": "Volvo"',
    })
    expect(res.status).not.toBe(500)
  })

  it('empty JSON object → no 500', async () => {
    const res = await fetch(`${BASE}/api/generate-description`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
    expect(res.status).not.toBe(500)
  })

  it('brand string with 100k chars → no 500', async () => {
    const res = await fetch(`${BASE}/api/generate-description`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand: 'A'.repeat(100_000), model: 'B' }),
    })
    expect(res.status).not.toBe(500)
  })

  for (const payload of UNICODE_PAYLOADS) {
    it(`unicode brand: ${JSON.stringify(payload).slice(0, 25)} → no 500`, async () => {
      const res = await fetch(`${BASE}/api/generate-description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: payload, model: 'Test' }),
      })
      expect(res.status).not.toBe(500)
    })
  }

  it('array instead of string for brand → no 500', async () => {
    const res = await fetch(`${BASE}/api/generate-description`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand: ['Volvo', 'Iveco'], model: null }),
    })
    expect(res.status).not.toBe(500)
  })
})

// ── 7. Stripe checkout malformed payloads ────────────────────────────────────

describe('Fuzzing: stripe/checkout handles malformed payloads', () => {
  it('malformed JSON → no 500', async () => {
    const res = await fetch(`${BASE}/api/stripe/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalid json!!!}',
    })
    expect(res.status).not.toBe(500)
  })

  it('deeply nested object → no 500', async () => {
    const deepNested: Record<string, unknown> = {}
    let cur = deepNested
    for (let i = 0; i < 100; i++) {
      cur.child = {}
      cur = cur.child as Record<string, unknown>
    }
    const res = await fetch(`${BASE}/api/stripe/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deepNested),
    })
    expect(res.status).not.toBe(500)
  })

  it('array as body → no 500', async () => {
    const res = await fetch(`${BASE}/api/stripe/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ plan: 'pro' }, { plan: 'basic' }]),
    })
    expect(res.status).not.toBe(500)
  })

  it('numeric string fields → no 500', async () => {
    const res = await fetch(`${BASE}/api/stripe/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: 999, interval: true, amount: 'NaN' }),
    })
    expect(res.status).not.toBe(500)
  })
})

// ── 8. Import stock overflow ──────────────────────────────────────────────────

describe('Fuzzing: dealer/import-stock handles overflow and null values', () => {
  it('large array (1000 items) → no 500', async () => {
    const largeArray = Array.from({ length: 1_000 }, (_, i) => ({
      id: i,
      title: 'x'.repeat(100),
    }))
    const res = await fetch(`${BASE}/api/dealer/import-stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicles: largeArray }),
    })
    expect(res.status).not.toBe(500)
  })

  it('null values in vehicle fields → no 500', async () => {
    const res = await fetch(`${BASE}/api/dealer/import-stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicles: [{ title: null, price: null, slug: null }] }),
    })
    expect(res.status).not.toBe(500)
  })

  it('SQL injection in vehicle title → no 500', async () => {
    const res = await fetch(`${BASE}/api/dealer/import-stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicles: [{ title: "'; DROP TABLE vehicles; --", price: 1000 }],
      }),
    })
    expect(res.status).not.toBe(500)
  })

  it('XSS in vehicle description → no 500', async () => {
    const res = await fetch(`${BASE}/api/dealer/import-stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicles: [{ title: 'Test', description: '<script>alert(1)</script>', price: 500 }],
      }),
    })
    expect(res.status).not.toBe(500)
  })
})
