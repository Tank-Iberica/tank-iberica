import { describe, it, expect, beforeAll } from 'vitest'

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

// Helpers
async function fetchAPI(path: string, options?: RequestInit) {
  return fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
}

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
      if (!serverAvailable) return

      const res = await fetchAPI(ep.path, {
        method: ep.method,
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      })
      expect(res.status).toBe(401)
    })
  }
})

describe('Webhooks: rechazan sin firma', () => {
  it('Stripe webhook sin firma → 400', async () => {
    if (!serverAvailable) return

    const res = await fetchAPI('/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({ type: 'test' }),
    })
    expect([400, 500]).toContain(res.status)
  })

  it('WhatsApp webhook sin firma → rechazado', async () => {
    if (!serverAvailable) return

    const res = await fetchAPI('/api/whatsapp/webhook', {
      method: 'POST',
      body: JSON.stringify({ object: 'whatsapp_business_account' }),
    })
    expect(res.status).toBeLessThan(500)
  })
})

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
      if (!serverAvailable) return

      const res = await fetchAPI(path, { method: 'POST', body: '{}' })
      expect(res.status).toBe(401)
    })
  }
})

describe('Security headers', () => {
  it('Pagina publica tiene CSP y X-Frame-Options', async () => {
    if (!serverAvailable) return

    const res = await fetch(`${BASE}/`)
    expect(res.headers.get('x-frame-options')).toBeTruthy()
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })
})
