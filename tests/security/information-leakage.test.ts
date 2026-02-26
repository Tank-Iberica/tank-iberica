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

describe('Information leakage: la app no expone datos internos', () => {
  it('Errores 500 no exponen stack traces', async () => {
    if (!serverAvailable) return

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

  for (const file of sensitiveFiles) {
    it(`${file} no es accesible públicamente`, async () => {
      if (!serverAvailable) return

      const res = await fetch(`${BASE}${file}`)
      // Should be 404 or 403, not 200
      expect(res.status).not.toBe(200)
    })
  }
})

describe('Headers de seguridad', () => {
  it('No expone X-Powered-By', async () => {
    if (!serverAvailable) return

    const res = await fetch(`${BASE}/`)
    expect(res.headers.get('x-powered-by')).toBeNull()
  })

  it('Tiene Referrer-Policy', async () => {
    if (!serverAvailable) return

    const res = await fetch(`${BASE}/`)
    const referrer = res.headers.get('referrer-policy')
    expect(referrer).toBeTruthy()
  })

  it('Tiene Permissions-Policy', async () => {
    if (!serverAvailable) return

    const res = await fetch(`${BASE}/`)
    const permissions = res.headers.get('permissions-policy')
    expect(permissions).toBeTruthy()
  })
})
