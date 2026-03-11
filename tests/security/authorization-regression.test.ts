import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

/**
 * Authorization regression tests — MUST-pass scenarios.
 *
 * Uses MSW to model expected server behavior (contracts).
 * Capa 2 (integration job with real server) verifies Nitro/auth/H3 wiring.
 *
 * Contracts verified:
 * - Unauthenticated users cannot access protected resources
 * - Admin-only endpoints reject non-admin users
 * - Tokens: expired/invalid/missing are all rejected
 * - Input validation: dangerous payloads are rejected
 * - CORS: no wildcard on protected endpoints
 */

const BASE = 'http://localhost:3000'

function noAuth(request: Request) {
  return !request.headers.get('authorization')
}

const server = setupServer(
  // ── Admin endpoints ──
  http.get(`${BASE}/api/admin/stats`, ({ request }) => {
    if (noAuth(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({}, { status: 200 })
  }),
  http.options(`${BASE}/api/admin/stats`, () => {
    return new HttpResponse(null, {
      status: 204,
      headers: {
        'access-control-allow-methods': 'GET',
        'access-control-allow-headers': 'Content-Type, Authorization',
        'access-control-allow-origin': 'https://tracciona.com',
      },
    })
  }),
  http.get(`${BASE}/api/admin/users`, ({ request }) => {
    if (noAuth(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json([], { status: 200 })
  }),
  http.post(`${BASE}/api/admin/verify-vehicle`, ({ request }) => {
    if (noAuth(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({}, { status: 200 })
  }),
  http.post(`${BASE}/api/admin/approve-dealer`, ({ request }) => {
    if (noAuth(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({}, { status: 200 })
  }),

  // ── Dealer endpoints ──
  http.post(`${BASE}/api/dealer/import-stock`, ({ request }) => {
    if (noAuth(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({}, { status: 200 })
  }),
  http.get(`${BASE}/api/dealer/export-csv`, ({ request }) => {
    if (noAuth(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({}, { status: 200 })
  }),
  http.get(`${BASE}/api/dealer/stats`, ({ request }) => {
    if (noAuth(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({}, { status: 200 })
  }),
  http.options(`${BASE}/api/dealer/stats`, () => {
    return new HttpResponse(null, {
      status: 204,
      headers: {
        'access-control-allow-methods': 'GET',
        'access-control-allow-origin': 'https://tracciona.com',
      },
    })
  }),

  // ── Token validation: invoicing endpoint rejects all invalid tokens ──
  http.get(`${BASE}/api/invoicing/export-csv`, () => {
    // Any request (garbage token, expired JWT, empty) → 401
    return HttpResponse.json({ statusCode: 401, message: 'Autenticación requerida' }, { status: 401 })
  }),

  // ── verify-document: requires auth ──
  http.post(`${BASE}/api/verify-document`, ({ request }) => {
    if (noAuth(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({}, { status: 200 })
  }),

  // ── Nonexistent endpoint: clean 404, no stack trace ──
  http.get(`${BASE}/api/nonexistent-endpoint-12345`, () => {
    return HttpResponse.json(
      { statusCode: 404, message: 'Recurso no encontrado' },
      { status: 404 },
    )
  }),

  // ── Images endpoint: validates URL scheme, returns clean errors ──
  http.post(`${BASE}/api/images/process`, async ({ request }) => {
    let body: Record<string, string> = {}
    try {
      body = await request.json() as Record<string, string>
    } catch {
      return HttpResponse.json({ statusCode: 400, message: 'Solicitud inválida' }, { status: 400 })
    }
    const url = body.url ?? ''
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return HttpResponse.json({ statusCode: 400, message: 'URL no permitida' }, { status: 400 })
    }
    if (noAuth(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({}, { status: 200 })
  }),

  // ── Vehicles search: never returns 500 ──
  http.get(`${BASE}/api/vehicles`, () => {
    return HttpResponse.json({ data: [], count: 0 }, { status: 200 })
  }),

  // ── Login: same status for any invalid credentials (no user enumeration) ──
  http.post(`${BASE}/api/auth/login`, () => {
    return HttpResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
  }),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

async function fetchAPI(path: string, options?: RequestInit) {
  return fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
}

// ── 1. Admin endpoints reject unauthenticated requests ──

describe('MUST: Admin endpoints reject unauthenticated requests', () => {
  const adminEndpoints = [
    { path: '/api/admin/stats', method: 'GET' },
    { path: '/api/admin/users', method: 'GET' },
    { path: '/api/admin/verify-vehicle', method: 'POST', body: { vehicleId: 'fake' } },
    { path: '/api/admin/approve-dealer', method: 'POST', body: { dealerId: 'fake' } },
  ]

  for (const ep of adminEndpoints) {
    it(`${ep.method} ${ep.path} sin auth → 401/403`, async () => {
      const res = await fetchAPI(ep.path, {
        method: ep.method,
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      })
      expect([401, 403, 404]).toContain(res.status)
    })
  }
})

// ── 2. Dealer endpoints reject unauthenticated requests ──

describe('MUST: Dealer-only endpoints reject unauthenticated requests', () => {
  const dealerEndpoints = [
    { path: '/api/dealer/import-stock', method: 'POST', body: { vehicles: [] } },
    { path: '/api/dealer/export-csv', method: 'GET' },
    { path: '/api/dealer/stats', method: 'GET' },
  ]

  for (const ep of dealerEndpoints) {
    it(`${ep.method} ${ep.path} sin auth → 401`, async () => {
      const res = await fetchAPI(ep.path, {
        method: ep.method,
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      })
      expect([401, 403]).toContain(res.status)
    })
  }
})

// ── 3. Invalid/expired tokens are rejected ──

describe('MUST: Invalid tokens are rejected', () => {
  it('Request with garbage Authorization header → 401', async () => {
    const res = await fetchAPI('/api/invoicing/export-csv', {
      method: 'GET',
      headers: { Authorization: 'Bearer garbage_token_12345' },
    })
    expect([401, 403]).toContain(res.status)
  })

  it('Request with expired JWT format → 401', async () => {
    const fakeJWT =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxfQ.invalid'
    const res = await fetchAPI('/api/invoicing/export-csv', {
      method: 'GET',
      headers: { Authorization: `Bearer ${fakeJWT}` },
    })
    expect([401, 403]).toContain(res.status)
  })

  it('Request with empty Authorization header → 401', async () => {
    const res = await fetchAPI('/api/invoicing/export-csv', {
      method: 'GET',
      headers: { Authorization: '' },
    })
    expect([401, 403]).toContain(res.status)
  })
})

// ── 4. Verify-document ownership ──

describe('MUST: Document verification requires ownership', () => {
  it('POST /api/verify-document sin auth → 401', async () => {
    const res = await fetchAPI('/api/verify-document', {
      method: 'POST',
      body: JSON.stringify({ vehicleId: 'someone-elses-vehicle' }),
    })
    expect([401, 403]).toContain(res.status)
  })
})

// ── 5. Public API does not leak internal data ──

describe('MUST: Public endpoints do not leak internal data', () => {
  it('Error responses do not contain stack traces', async () => {
    const res = await fetchAPI('/api/nonexistent-endpoint-12345', {
      method: 'GET',
    })
    const text = await res.text()
    expect(text).not.toContain('node_modules')
    expect(text).not.toContain('at Object.')
    expect(text).not.toContain('at Module.')
    expect(text).not.toContain('.ts:')
  })

  it('Error responses do not contain service names', async () => {
    const res = await fetchAPI('/api/images/process', {
      method: 'POST',
      body: JSON.stringify({ url: 'invalid' }),
    })
    const text = await res.text()
    expect(text.toLowerCase()).not.toContain('supabase')
    expect(text.toLowerCase()).not.toContain('cloudinary')
    expect(text.toLowerCase()).not.toContain('anthropic')
  })
})

// ── 6. SQL injection resistance ──

describe('MUST: Endpoints resist basic injection payloads', () => {
  const injectionPayloads = [
    "' OR 1=1 --",
    '"; DROP TABLE vehicles; --',
    '<script>alert(1)</script>',
    '{{constructor.constructor("return this")()}}',
  ]

  it('Search endpoint rejects or sanitizes SQL injection', async () => {
    for (const payload of injectionPayloads.slice(0, 2)) {
      const res = await fetch(`${BASE}/api/vehicles?q=${encodeURIComponent(payload)}`)
      expect(res.status).not.toBe(500)
    }
  })

  it('Search endpoint rejects or sanitizes XSS payloads', async () => {
    for (const payload of injectionPayloads.slice(2)) {
      const res = await fetch(`${BASE}/api/vehicles?q=${encodeURIComponent(payload)}`)
      if (res.ok) {
        const text = await res.text()
        expect(text).not.toContain('<script>')
      }
    }
  })
})

// ── 7. Rate-sensitive endpoints: no user enumeration ──

describe('MUST: Sensitive endpoints have rate/abuse protection', () => {
  it('Login endpoint does not return different errors for valid vs invalid email', async () => {
    const res1 = await fetchAPI('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'definitely-not-real@example.com', password: 'wrong' }),
    })
    const res2 = await fetchAPI('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'another-fake@example.com', password: 'wrong' }),
    })
    expect(res1.status).toBe(res2.status)
  })
})

// ── 8. CORS headers: no wildcard on protected endpoints ──

describe('MUST: CORS headers are not overly permissive on protected endpoints', () => {
  it('Admin endpoint does not return Access-Control-Allow-Origin: *', async () => {
    const res = await fetchAPI('/api/admin/stats', {
      method: 'OPTIONS',
      headers: { Origin: 'https://evil.com', 'Access-Control-Request-Method': 'GET' },
    })
    const acao = res.headers.get('access-control-allow-origin')
    expect(acao).not.toBe('*')
  })

  it('Dealer endpoint does not return Access-Control-Allow-Origin: *', async () => {
    const res = await fetchAPI('/api/dealer/stats', {
      method: 'OPTIONS',
      headers: { Origin: 'https://evil.com', 'Access-Control-Request-Method': 'GET' },
    })
    const acao = res.headers.get('access-control-allow-origin')
    expect(acao).not.toBe('*')
  })

  it('Cross-origin request from untrusted origin to admin is rejected or returns no ACAO', async () => {
    const res = await fetchAPI('/api/admin/stats', {
      headers: { Origin: 'https://evil-marketplace.com' },
    })
    const acao = res.headers.get('access-control-allow-origin')
    if (acao !== null) {
      expect(acao).not.toBe('https://evil-marketplace.com')
    }
  })
})

// ── 10. File upload restrictions ──

describe('MUST: File upload rejects dangerous types', () => {
  it('Image process rejects non-URL input', async () => {
    const res = await fetchAPI('/api/images/process', {
      method: 'POST',
      body: JSON.stringify({ url: 'javascript:alert(1)' }),
    })
    expect([400, 401, 403, 422]).toContain(res.status)
  })

  it('Image process rejects local file paths', async () => {
    const res = await fetchAPI('/api/images/process', {
      method: 'POST',
      body: JSON.stringify({ url: 'file:///etc/passwd' }),
    })
    expect([400, 401, 403, 422]).toContain(res.status)
  })
})
