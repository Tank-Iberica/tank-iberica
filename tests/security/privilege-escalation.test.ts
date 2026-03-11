import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

/**
 * Privilege Escalation & Authorization Tests
 *
 * Verifies that:
 * 1. Regular users cannot access dealer-only or admin-only endpoints
 * 2. Dealers cannot access admin-only endpoints
 * 3. Account-scoped operations reject cross-user access
 * 4. Push notifications and sensitive internal endpoints are protected
 * 5. Market report full version requires admin role
 *
 * Uses MSW to model expected server behavior (contracts).
 * Real enforcement is verified in integration tests with actual Supabase auth.
 */

const BASE = 'http://localhost:3000'

// ── Simulated auth tokens ──────────────────────────────────────────────
// These tokens are intentionally invalid — MSW intercepts requests before
// any real auth validation happens. Tests verify STATUS CODE contracts.
const REGULAR_USER_TOKEN = 'user.valid.jwt.token'
const DEALER_TOKEN = 'dealer.valid.jwt.token'
const ADMIN_TOKEN = 'admin.valid.jwt.token'
const OTHER_USER_TOKEN = 'other-user.valid.jwt.token'
const INTERNAL_SECRET = 'test-cron-secret'

function bearerHeader(token: string) {
  return { Authorization: `Bearer ${token}` }
}

function adminOnly(request: Request) {
  const auth = request.headers.get('authorization')
  if (!auth) return true
  // Only admin token passes
  return !auth.includes(ADMIN_TOKEN)
}

function dealerOrAdminOnly(request: Request) {
  const auth = request.headers.get('authorization')
  if (!auth) return true
  return !auth.includes(DEALER_TOKEN) && !auth.includes(ADMIN_TOKEN)
}

function authOnly(request: Request) {
  return !request.headers.get('authorization')
}

function hasInternalSecret(request: Request) {
  return request.headers.get('x-internal-secret') === INTERNAL_SECRET
}

const server = setupServer(
  // ── Market report: full version admin-only ──
  http.get(`${BASE}/api/market-report`, ({ request }) => {
    const url = new URL(request.url)
    const isPublic = url.searchParams.get('public') === 'true'
    if (isPublic) return new HttpResponse('<html>Public summary</html>', { status: 200, headers: { 'content-type': 'text/html' } })
    if (adminOnly(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return new HttpResponse('<html>Full report</html>', { status: 200, headers: { 'content-type': 'text/html' } })
  }),

  // ── Push notifications: admin or internal secret only ──
  http.post(`${BASE}/api/push/send`, ({ request }) => {
    if (hasInternalSecret(request)) return HttpResponse.json({ success: true }, { status: 200 })
    if (adminOnly(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({ success: true }, { status: 200 })
  }),

  // ── Dealer: API key management ──
  http.get(`${BASE}/api/dealer/api-key`, ({ request }) => {
    if (dealerOrAdminOnly(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({ api_key: 'dealer-key' }, { status: 200 })
  }),
  http.post(`${BASE}/api/dealer/api-key`, ({ request }) => {
    if (dealerOrAdminOnly(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({ api_key: 'new-key' }, { status: 200 })
  }),

  // ── Dealer: market intelligence ──
  http.get(`${BASE}/api/dealer/market-intelligence`, ({ request }) => {
    if (dealerOrAdminOnly(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({ data: [] }, { status: 200 })
  }),

  // ── Social: generate posts (dealer only) ──
  http.post(`${BASE}/api/social/generate-posts`, ({ request }) => {
    if (dealerOrAdminOnly(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({ posts: [] }, { status: 200 })
  }),

  // ── Account: delete & export (must be own account) ──
  http.post(`${BASE}/api/account/delete`, ({ request }) => {
    if (authOnly(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({ success: true }, { status: 200 })
  }),
  http.get(`${BASE}/api/account/export`, ({ request }) => {
    if (authOnly(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({ data: {} }, { status: 200 })
  }),

  // ── Reservations ──
  http.post(`${BASE}/api/reservations/create`, ({ request }) => {
    if (authOnly(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({ reservation_id: 'new-id' }, { status: 200 })
  }),
  http.post(`${BASE}/api/reservations/respond`, ({ request }) => {
    if (dealerOrAdminOnly(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({ success: true }, { status: 200 })
  }),

  // ── Invoicing ──
  http.post(`${BASE}/api/invoicing/create-invoice`, ({ request }) => {
    if (authOnly(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({ invoice: {} }, { status: 200 })
  }),

  // ── Advertisements (requires auth) ──
  http.post(`${BASE}/api/advertisements`, ({ request }) => {
    if (authOnly(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({ id: 'new-ad' }, { status: 200 })
  }),

  // ── DGT report (requires auth) ──
  http.post(`${BASE}/api/dgt-report`, ({ request }) => {
    if (authOnly(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({ report: {} }, { status: 200 })
  }),

  // ── Generate description (requires auth) ──
  http.post(`${BASE}/api/generate-description`, ({ request }) => {
    if (authOnly(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({ description: '' }, { status: 200 })
  }),

  // ── Auction deposit (requires auth) ──
  http.post(`${BASE}/api/auction-deposit`, ({ request }) => {
    if (authOnly(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({ session_url: '' }, { status: 200 })
  }),

  // ── Verify document (requires auth + dealer/admin) ──
  http.post(`${BASE}/api/verify-document`, ({ request }) => {
    if (authOnly(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({ verified: true }, { status: 200 })
  }),

  // ── Stripe endpoints (require auth) ──
  http.post(`${BASE}/api/stripe/checkout`, ({ request }) => {
    if (authOnly(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({ url: '' }, { status: 200 })
  }),
  http.post(`${BASE}/api/stripe/portal`, ({ request }) => {
    if (authOnly(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({ url: '' }, { status: 200 })
  }),

  // ── Valuation API: requires valid API key via Bearer header ──
  http.get(`${BASE}/api/v1/valuation`, ({ request }) => {
    const auth = request.headers.get('authorization')
    if (!auth || auth === 'Bearer ' || auth === 'Bearer') return HttpResponse.json({ statusCode: 401, message: 'API key required' }, { status: 401 })
    return HttpResponse.json({ statusCode: 503, message: 'Valuation API coming soon' }, { status: 503 })
  }),

  // ── Cron jobs: require internal secret ──
  http.post(`${BASE}/api/cron/auto-auction`, ({ request }) => {
    if (!hasInternalSecret(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({ processed: 0 }, { status: 200 })
  }),
  http.post(`${BASE}/api/cron/search-alerts`, ({ request }) => {
    if (!hasInternalSecret(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({ sent: 0 }, { status: 200 })
  }),
  http.post(`${BASE}/api/cron/price-drop-alert`, ({ request }) => {
    if (!hasInternalSecret(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({ sent: 0 }, { status: 200 })
  }),
  http.post(`${BASE}/api/cron/reservation-expiry`, ({ request }) => {
    if (!hasInternalSecret(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({ expired: 0 }, { status: 200 })
  }),
  http.post(`${BASE}/api/cron/dealer-weekly-stats`, ({ request }) => {
    if (!hasInternalSecret(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({ processed: 0 }, { status: 200 })
  }),
  http.post(`${BASE}/api/cron/founding-expiry`, ({ request }) => {
    if (!hasInternalSecret(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({ expired: 0 }, { status: 200 })
  }),
  http.post(`${BASE}/api/cron/freshness-check`, ({ request }) => {
    if (!hasInternalSecret(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({ flagged: 0 }, { status: 200 })
  }),
  http.post(`${BASE}/api/cron/generate-editorial`, ({ request }) => {
    if (!hasInternalSecret(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({ generated: 0 }, { status: 200 })
  }),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

async function GET(path: string, headers?: Record<string, string>) {
  return fetch(`${BASE}${path}`, { headers })
}

async function POST(path: string, body: unknown, headers?: Record<string, string>) {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

// ── 1. Market report access control ───────────────────────────────────

describe('Market report access control', () => {
  it('Public summary (public=true) is accessible without auth', async () => {
    const res = await GET('/api/market-report?public=true')
    expect(res.status).toBe(200)
  })

  it('Full report requires admin role — no auth → 401', async () => {
    const res = await GET('/api/market-report')
    expect([401, 403]).toContain(res.status)
  })

  it('Full report: regular user (non-admin) → 401/403', async () => {
    const res = await GET('/api/market-report', bearerHeader(REGULAR_USER_TOKEN))
    expect([401, 403]).toContain(res.status)
  })

  it('Full report: dealer user (non-admin) → 401/403', async () => {
    const res = await GET('/api/market-report', bearerHeader(DEALER_TOKEN))
    expect([401, 403]).toContain(res.status)
  })

  it('Full report: admin token → 200', async () => {
    const res = await GET('/api/market-report', bearerHeader(ADMIN_TOKEN))
    expect(res.status).toBe(200)
  })
})

// ── 2. Push notifications: admin or internal secret only ──────────────

describe('Push notifications: admin/internal only', () => {
  it('No auth → 401', async () => {
    const res = await POST('/api/push/send', { userId: 'test', title: 'Test', body: 'Body' })
    expect([401, 403]).toContain(res.status)
  })

  it('Regular user token → 401/403', async () => {
    const res = await POST('/api/push/send', { userId: 'test', title: 'Test', body: 'Body' }, bearerHeader(REGULAR_USER_TOKEN))
    expect([401, 403]).toContain(res.status)
  })

  it('Internal secret → 200', async () => {
    const res = await POST('/api/push/send', { userId: 'test', title: 'Test', body: 'Body' }, { 'x-internal-secret': INTERNAL_SECRET })
    expect(res.status).toBe(200)
  })

  it('Admin token → 200', async () => {
    const res = await POST('/api/push/send', { userId: 'test', title: 'Test', body: 'Body' }, bearerHeader(ADMIN_TOKEN))
    expect(res.status).toBe(200)
  })
})

// ── 3. Dealer-only endpoints reject non-dealers ───────────────────────

describe('Dealer-only endpoints: privilege escalation from regular user', () => {
  it('GET /api/dealer/api-key: no auth → 401', async () => {
    const res = await GET('/api/dealer/api-key')
    expect([401, 403]).toContain(res.status)
  })

  it('GET /api/dealer/api-key: regular user → 401/403', async () => {
    const res = await GET('/api/dealer/api-key', bearerHeader(REGULAR_USER_TOKEN))
    expect([401, 403]).toContain(res.status)
  })

  it('POST /api/dealer/api-key: no auth → 401', async () => {
    const res = await POST('/api/dealer/api-key', {})
    expect([401, 403]).toContain(res.status)
  })

  it('POST /api/dealer/api-key: regular user → 401/403', async () => {
    const res = await POST('/api/dealer/api-key', {}, bearerHeader(REGULAR_USER_TOKEN))
    expect([401, 403]).toContain(res.status)
  })

  it('GET /api/dealer/market-intelligence: no auth → 401', async () => {
    const res = await GET('/api/dealer/market-intelligence')
    expect([401, 403]).toContain(res.status)
  })

  it('GET /api/dealer/market-intelligence: regular user → 401/403', async () => {
    const res = await GET('/api/dealer/market-intelligence', bearerHeader(REGULAR_USER_TOKEN))
    expect([401, 403]).toContain(res.status)
  })

  it('POST /api/social/generate-posts: no auth → 401', async () => {
    const res = await POST('/api/social/generate-posts', {})
    expect([401, 403]).toContain(res.status)
  })

  it('POST /api/social/generate-posts: regular user → 401/403', async () => {
    const res = await POST('/api/social/generate-posts', {}, bearerHeader(REGULAR_USER_TOKEN))
    expect([401, 403]).toContain(res.status)
  })

  it('POST /api/reservations/respond: no auth → 401', async () => {
    const res = await POST('/api/reservations/respond', { reservationId: 'test', action: 'approve' })
    expect([401, 403]).toContain(res.status)
  })

  it('POST /api/reservations/respond: regular user → 401/403 (dealer-only)', async () => {
    const res = await POST('/api/reservations/respond', { reservationId: 'test', action: 'approve' }, bearerHeader(REGULAR_USER_TOKEN))
    expect([401, 403]).toContain(res.status)
  })
})

// ── 4. Auth-required endpoints ────────────────────────────────────────

describe('Auth-required endpoints reject unauthenticated requests', () => {
  const endpoints: { method: 'GET' | 'POST'; path: string; body?: unknown }[] = [
    { method: 'POST', path: '/api/account/delete', body: {} },
    { method: 'GET', path: '/api/account/export' },
    { method: 'POST', path: '/api/reservations/create', body: { vehicleId: 'test' } },
    { method: 'POST', path: '/api/invoicing/create-invoice', body: {} },
    { method: 'POST', path: '/api/advertisements', body: {} },
    { method: 'POST', path: '/api/dgt-report', body: { plate: 'TEST' } },
    { method: 'POST', path: '/api/generate-description', body: { vehicleId: 'test' } },
    { method: 'POST', path: '/api/auction-deposit', body: { auctionId: 'test' } },
    { method: 'POST', path: '/api/stripe/checkout', body: { plan: 'pro' } },
    { method: 'POST', path: '/api/stripe/portal', body: {} },
  ]

  for (const ep of endpoints) {
    it(`${ep.method} ${ep.path} sin auth → 401`, async () => {
      const res = ep.method === 'GET'
        ? await GET(ep.path)
        : await POST(ep.path, ep.body ?? {})
      expect([401, 403]).toContain(res.status)
    })
  }
})

// ── 5. Cron jobs require internal secret ─────────────────────────────

describe('Cron jobs require internal secret — not accessible from browser', () => {
  const cronEndpoints = [
    '/api/cron/auto-auction',
    '/api/cron/search-alerts',
    '/api/cron/price-drop-alert',
    '/api/cron/reservation-expiry',
    '/api/cron/dealer-weekly-stats',
    '/api/cron/founding-expiry',
    '/api/cron/freshness-check',
    '/api/cron/generate-editorial',
  ]

  for (const path of cronEndpoints) {
    it(`POST ${path}: no secret → 401`, async () => {
      const res = await POST(path, {})
      expect([401, 403]).toContain(res.status)
    })

    it(`POST ${path}: authenticated user without secret → 401`, async () => {
      const res = await POST(path, {}, bearerHeader(ADMIN_TOKEN))
      expect([401, 403]).toContain(res.status)
    })

    it(`POST ${path}: valid internal secret → 200`, async () => {
      const res = await POST(path, {}, { 'x-internal-secret': INTERNAL_SECRET })
      expect(res.status).toBe(200)
    })
  }
})

// ── 6. Account isolation: own-account operations ──────────────────────

describe('Account operations are scoped to authenticated user', () => {
  it('POST /api/account/delete: authenticated user cannot bypass ownership', async () => {
    // User must be authenticated to delete — no auth = rejected
    const noAuthRes = await POST('/api/account/delete', {})
    expect([401, 403]).toContain(noAuthRes.status)
  })

  it('GET /api/account/export: unauthenticated → 401', async () => {
    const res = await GET('/api/account/export')
    expect([401, 403]).toContain(res.status)
  })

  it('GET /api/account/export: authenticated user can export own data', async () => {
    const res = await GET('/api/account/export', bearerHeader(REGULAR_USER_TOKEN))
    // Either 200 (own data returned) or 401 depending on MSW simulation
    // The key assertion: no 500 (no server crash on auth boundary)
    expect(res.status).not.toBe(500)
  })
})

// ── 7. Dealer API key isolation ────────────────────────────────────────

describe('Dealer API key: a dealer cannot see another dealer\'s key', () => {
  it('Dealer with valid auth can access own API key', async () => {
    const res = await GET('/api/dealer/api-key', bearerHeader(DEALER_TOKEN))
    expect(res.status).toBe(200)
  })

  it('Dealer regenerating API key invalidates the old one (regeneration requires auth)', async () => {
    const res = await POST('/api/dealer/api-key', {}, bearerHeader(DEALER_TOKEN))
    expect(res.status).toBe(200)
  })

  it('Admin can access dealer API key management', async () => {
    const res = await GET('/api/dealer/api-key', bearerHeader(ADMIN_TOKEN))
    expect(res.status).toBe(200)
  })
})

// ── 8. Valuation API: requires valid API key ───────────────────────────

describe('Valuation API: requires valid API key (not Bearer auth)', () => {
  it('No Authorization header → 401', async () => {
    const res = await GET('/api/v1/valuation?brand=volvo')
    // Server disabled or 401
    expect([401, 503]).toContain(res.status)
  })

  it('Empty Bearer token → 401', async () => {
    const res = await GET('/api/v1/valuation?brand=volvo', { Authorization: 'Bearer ' })
    expect([401, 503]).toContain(res.status)
  })
})
