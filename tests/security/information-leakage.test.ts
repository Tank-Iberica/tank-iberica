import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

/**
 * Information leakage tests — la app no expone datos internos
 *
 * Uses MSW to model expected server behavior (contracts).
 * Capa 2 (integration job with real server) verifies the actual implementation.
 */

const BASE = 'http://localhost:3000'

const sensitiveFiles = [
  '/.env',
  '/.env.local',
  '/.env.production',
  '/package.json',
  '/nuxt.config.ts',
  '/tsconfig.json',
  '/.git/HEAD',
  '/.git/config',
  '/server/utils/aiConfig.ts',
  '/server/services/aiProvider.ts',
]

const server = setupServer(
  // Malformed JSON → clean error, no stack trace or service names
  http.post(`${BASE}/api/generate-description`, async ({ request }) => {
    try {
      await request.json()
    } catch {
      return HttpResponse.json({ statusCode: 400, message: 'Solicitud inválida' }, { status: 400 })
    }
    return HttpResponse.json({ statusCode: 401, message: 'Autenticación requerida' }, { status: 401 })
  }),

  // Sensitive files → 404 (not publicly accessible)
  ...sensitiveFiles.map((file) =>
    http.get(`${BASE}${file}`, () =>
      HttpResponse.json({ statusCode: 404, message: 'Recurso no encontrado' }, { status: 404 }),
    ),
  ),

  // Homepage with security headers (no x-powered-by, has referrer-policy and permissions-policy)
  http.get(`${BASE}/`, () => {
    return new HttpResponse(null, {
      status: 200,
      headers: {
        'referrer-policy': 'strict-origin-when-cross-origin',
        'permissions-policy': 'camera=(), microphone=(), geolocation=()',
      },
    })
  }),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ── 1. Error responses do not expose internals ──

describe('Information leakage: la app no expone datos internos', () => {
  it('Errores 500 no exponen stack traces', async () => {
    const res = await fetch(`${BASE}/api/generate-description`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{malformed json!!!',
    })
    const text = await res.text()
    expect(text).not.toContain('node_modules')
    expect(text).not.toContain('at Object.')
    expect(text).not.toContain('server/api/')
    expect(text).not.toContain('ANTHROPIC_API_KEY')
    expect(text).not.toContain('SUPABASE')
  })

  for (const file of sensitiveFiles) {
    it(`${file} no es accesible públicamente`, async () => {
      const res = await fetch(`${BASE}${file}`)
      expect(res.status).not.toBe(200)
    })
  }
})

// ── 2. Security headers ──

describe('Headers de seguridad', () => {
  it('No expone X-Powered-By', async () => {
    const res = await fetch(`${BASE}/`)
    expect(res.headers.get('x-powered-by')).toBeNull()
  })

  it('Tiene Referrer-Policy', async () => {
    const res = await fetch(`${BASE}/`)
    const referrer = res.headers.get('referrer-policy')
    expect(referrer).toBeTruthy()
  })

  it('Tiene Permissions-Policy', async () => {
    const res = await fetch(`${BASE}/`)
    const permissions = res.headers.get('permissions-policy')
    expect(permissions).toBeTruthy()
  })
})
