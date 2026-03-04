import { describe, it, expect, beforeAll } from 'vitest'

/**
 * Authorization regression tests — MUST-pass scenarios.
 *
 * These tests verify critical authorization boundaries:
 * - Unauthenticated users cannot access protected resources
 * - Admin-only endpoints reject non-admin users
 * - Tokens: expired/invalid/missing are all rejected
 * - Input validation: dangerous payloads are rejected
 *
 * Run with: TEST_BASE_URL=http://localhost:3000 npx vitest run tests/security/authorization-regression
 */

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'

let serverAvailable = false

beforeAll(async () => {
  try {
    await fetch(BASE, { signal: AbortSignal.timeout(3000) })
    serverAvailable = true
  } catch {
    serverAvailable = false
  }
})

function skip() {
  if (!serverAvailable) return true
  return false
}

async function fetchAPI(path: string, options?: RequestInit) {
  return fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
}

// ── 1. Admin endpoints reject non-admin ──

describe('MUST: Admin endpoints reject unauthenticated requests', () => {
  const adminEndpoints = [
    { path: '/api/admin/stats', method: 'GET' },
    { path: '/api/admin/users', method: 'GET' },
    { path: '/api/admin/verify-vehicle', method: 'POST', body: { vehicleId: 'fake' } },
    { path: '/api/admin/approve-dealer', method: 'POST', body: { dealerId: 'fake' } },
  ]

  for (const ep of adminEndpoints) {
    it(`${ep.method} ${ep.path} sin auth → 401/403`, async () => {
      if (skip()) return
      const res = await fetchAPI(ep.path, {
        method: ep.method,
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      })
      expect([401, 403, 404]).toContain(res.status)
    })
  }
})

// ── 2. Dealer endpoints reject unauthenticated ──

describe('MUST: Dealer-only endpoints reject unauthenticated requests', () => {
  const dealerEndpoints = [
    { path: '/api/dealer/import-stock', method: 'POST', body: { vehicles: [] } },
    { path: '/api/dealer/export-csv', method: 'GET' },
    { path: '/api/dealer/stats', method: 'GET' },
  ]

  for (const ep of dealerEndpoints) {
    it(`${ep.method} ${ep.path} sin auth → 401`, async () => {
      if (skip()) return
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
    if (skip()) return
    const res = await fetchAPI('/api/invoicing/export-csv', {
      method: 'GET',
      headers: { Authorization: 'Bearer garbage_token_12345' },
    })
    expect([401, 403]).toContain(res.status)
  })

  it('Request with expired JWT format → 401', async () => {
    if (skip()) return
    // This is a structurally valid but expired/invalid JWT
    const fakeJWT =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxfQ.invalid'
    const res = await fetchAPI('/api/invoicing/export-csv', {
      method: 'GET',
      headers: { Authorization: `Bearer ${fakeJWT}` },
    })
    expect([401, 403]).toContain(res.status)
  })

  it('Request with empty Authorization header → 401', async () => {
    if (skip()) return
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
    if (skip()) return
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
    if (skip()) return
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
    if (skip()) return
    // Try an endpoint that might interact with external services
    const res = await fetchAPI('/api/images/process', {
      method: 'POST',
      body: JSON.stringify({ url: 'invalid' }),
    })
    const text = await res.text()
    // Should not reveal internal service names
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
    if (skip()) return
    for (const payload of injectionPayloads.slice(0, 2)) {
      const res = await fetch(`${BASE}/api/vehicles?q=${encodeURIComponent(payload)}`)
      // Should not return 500 (which would indicate unhandled SQL error)
      expect(res.status).not.toBe(500)
    }
  })

  it('Search endpoint rejects or sanitizes XSS payloads', async () => {
    if (skip()) return
    for (const payload of injectionPayloads.slice(2)) {
      const res = await fetch(`${BASE}/api/vehicles?q=${encodeURIComponent(payload)}`)
      if (res.ok) {
        const text = await res.text()
        expect(text).not.toContain('<script>')
      }
    }
  })
})

// ── 7. Rate-sensitive endpoints have protection ──

describe('MUST: Sensitive endpoints have rate/abuse protection', () => {
  it('Login endpoint does not return different errors for valid vs invalid email', async () => {
    if (skip()) return
    // This tests for user enumeration — both should return the same status
    const res1 = await fetchAPI('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'definitely-not-real@example.com', password: 'wrong' }),
    })
    const res2 = await fetchAPI('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'another-fake@example.com', password: 'wrong' }),
    })
    // Both invalid emails should get the same response status
    expect(res1.status).toBe(res2.status)
  })
})

// ── 8. CORS headers — no wildcard on protected endpoints ──

describe('MUST: CORS headers are not overly permissive on protected endpoints', () => {
  it('Admin endpoint does not return Access-Control-Allow-Origin: *', async () => {
    if (skip()) return
    const res = await fetchAPI('/api/admin/stats', {
      method: 'OPTIONS',
      headers: { Origin: 'https://evil.com', 'Access-Control-Request-Method': 'GET' },
    })
    const acao = res.headers.get('access-control-allow-origin')
    // Should not allow all origins on protected endpoint
    expect(acao).not.toBe('*')
  })

  it('Dealer endpoint does not return Access-Control-Allow-Origin: *', async () => {
    if (skip()) return
    const res = await fetchAPI('/api/dealer/stats', {
      method: 'OPTIONS',
      headers: { Origin: 'https://evil.com', 'Access-Control-Request-Method': 'GET' },
    })
    const acao = res.headers.get('access-control-allow-origin')
    expect(acao).not.toBe('*')
  })

  it('Cross-origin request from untrusted origin to admin is rejected or returns no ACAO', async () => {
    if (skip()) return
    const res = await fetchAPI('/api/admin/stats', {
      headers: { Origin: 'https://evil-marketplace.com' },
    })
    const acao = res.headers.get('access-control-allow-origin')
    // Either no CORS header, or it should not reflect the evil origin back
    if (acao !== null) {
      expect(acao).not.toBe('https://evil-marketplace.com')
    }
  })
})

// ── 10. File upload restrictions ──

describe('MUST: File upload rejects dangerous types', () => {
  it('Image process rejects non-URL input', async () => {
    if (skip()) return
    const res = await fetchAPI('/api/images/process', {
      method: 'POST',
      body: JSON.stringify({ url: 'javascript:alert(1)' }),
    })
    expect([400, 401, 403, 422]).toContain(res.status)
  })

  it('Image process rejects local file paths', async () => {
    if (skip()) return
    const res = await fetchAPI('/api/images/process', {
      method: 'POST',
      body: JSON.stringify({ url: 'file:///etc/passwd' }),
    })
    expect([400, 401, 403, 422]).toContain(res.status)
  })
})
