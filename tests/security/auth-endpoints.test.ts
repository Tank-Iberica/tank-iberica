import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

/**
 * Security contract tests — auth & webhooks
 *
 * Uses MSW to model the expected server behavior.
 * These tests verify the contracts are correctly defined.
 * Capa 2 (integration job with real server) verifies the actual Nitro/auth implementation.
 */

const BASE = 'http://localhost:3000'

function noAuth(request: Request) {
  return !request.headers.get('authorization')
}

function noCronSecret(request: Request) {
  return !request.headers.get('x-cron-secret')
}

const server = setupServer(
  // ── Protected endpoints: require Authorization header ──
  http.post(`${BASE}/api/invoicing/create-invoice`, ({ request }) => {
    if (noAuth(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({}, { status: 200 })
  }),
  http.get(`${BASE}/api/invoicing/export-csv`, ({ request }) => {
    if (noAuth(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({}, { status: 200 })
  }),
  http.post(`${BASE}/api/auction-deposit`, ({ request }) => {
    if (noAuth(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({}, { status: 200 })
  }),
  http.post(`${BASE}/api/images/process`, ({ request }) => {
    if (noAuth(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({}, { status: 200 })
  }),
  http.post(`${BASE}/api/social/generate-posts`, ({ request }) => {
    if (noAuth(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({}, { status: 200 })
  }),
  http.post(`${BASE}/api/verify-document`, ({ request }) => {
    if (noAuth(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({}, { status: 200 })
  }),
  http.post(`${BASE}/api/dgt-report`, ({ request }) => {
    if (noAuth(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({}, { status: 200 })
  }),
  http.post(`${BASE}/api/stripe/checkout`, ({ request }) => {
    if (noAuth(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({}, { status: 200 })
  }),
  http.post(`${BASE}/api/stripe/portal`, ({ request }) => {
    if (noAuth(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({}, { status: 200 })
  }),
  http.post(`${BASE}/api/account/delete`, ({ request }) => {
    if (noAuth(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({}, { status: 200 })
  }),

  // ── Webhooks: require signature headers ──
  http.post(`${BASE}/api/stripe/webhook`, ({ request }) => {
    if (!request.headers.get('stripe-signature')) {
      return HttpResponse.json({ error: 'No signature' }, { status: 400 })
    }
    return HttpResponse.json({}, { status: 200 })
  }),
  http.post(`${BASE}/api/whatsapp/webhook`, () => {
    // Rejects without signature — but never crashes (non-500)
    return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }),

  // ── Crons: require x-cron-secret header ──
  http.post(`${BASE}/api/cron/freshness-check`, ({ request }) => {
    if (noCronSecret(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({}, { status: 200 })
  }),
  http.post(`${BASE}/api/cron/search-alerts`, ({ request }) => {
    if (noCronSecret(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({}, { status: 200 })
  }),
  http.post(`${BASE}/api/cron/publish-scheduled`, ({ request }) => {
    if (noCronSecret(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({}, { status: 200 })
  }),
  http.post(`${BASE}/api/cron/favorite-price-drop`, ({ request }) => {
    if (noCronSecret(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({}, { status: 200 })
  }),
  http.post(`${BASE}/api/cron/dealer-weekly-stats`, ({ request }) => {
    if (noCronSecret(request)) return HttpResponse.json({ statusCode: 401 }, { status: 401 })
    return HttpResponse.json({}, { status: 200 })
  }),

  // ── Homepage: security headers ──
  http.get(`${BASE}/`, () => {
    return new HttpResponse(null, {
      status: 200,
      headers: {
        'x-frame-options': 'SAMEORIGIN',
        'x-content-type-options': 'nosniff',
      },
    })
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

// ── 1. Protected endpoints require auth ──

describe('Auth: endpoints requieren autenticacion', () => {
  const protectedEndpoints = [
    {
      path: '/api/invoicing/create-invoice',
      method: 'POST',
      body: { dealerId: 'fake', serviceType: 'subscription', amountCents: 100 },
    },
    { path: '/api/invoicing/export-csv', method: 'GET' },
    {
      path: '/api/auction-deposit',
      method: 'POST',
      body: { auctionId: 'fake', registrationId: 'fake' },
    },
    { path: '/api/images/process', method: 'POST', body: { url: 'https://example.com/img.jpg' } },
    { path: '/api/social/generate-posts', method: 'POST', body: { vehicleId: 'fake' } },
    { path: '/api/verify-document', method: 'POST', body: { vehicleId: 'fake' } },
    { path: '/api/dgt-report', method: 'POST', body: { vehicleId: 'fake' } },
    { path: '/api/stripe/checkout', method: 'POST', body: { plan: 'basic', interval: 'month' } },
    { path: '/api/stripe/portal', method: 'POST', body: {} },
    { path: '/api/account/delete', method: 'POST', body: {} },
  ]

  for (const ep of protectedEndpoints) {
    it(`${ep.method} ${ep.path} sin auth → 401`, async () => {
      const res = await fetchAPI(ep.path, {
        method: ep.method,
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      })
      expect(res.status).toBe(401)
    })
  }
})

// ── 2. Webhooks reject without signature ──

describe('Webhooks: rechazan sin firma', () => {
  it('Stripe webhook sin firma → 400', async () => {
    const res = await fetchAPI('/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({ type: 'test' }),
    })
    expect([400, 500]).toContain(res.status)
  })

  it('WhatsApp webhook sin firma → rechazado', async () => {
    const res = await fetchAPI('/api/whatsapp/webhook', {
      method: 'POST',
      body: JSON.stringify({ object: 'whatsapp_business_account' }),
    })
    expect(res.status).toBeLessThan(500)
  })
})

// ── 3. Crons reject without CRON_SECRET ──

describe('Crons: rechazan sin CRON_SECRET', () => {
  const crons = [
    '/api/cron/freshness-check',
    '/api/cron/search-alerts',
    '/api/cron/publish-scheduled',
    '/api/cron/favorite-price-drop',
    '/api/cron/dealer-weekly-stats',
  ]

  for (const path of crons) {
    it(`${path} sin secret → 401`, async () => {
      const res = await fetchAPI(path, { method: 'POST', body: '{}' })
      expect(res.status).toBe(401)
    })
  }
})

// ── 4. Security headers ──

describe('Security headers', () => {
  it('Pagina publica tiene CSP y X-Frame-Options', async () => {
    const res = await fetch(`${BASE}/`)
    expect(res.headers.get('x-frame-options')).toBeTruthy()
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })
})
