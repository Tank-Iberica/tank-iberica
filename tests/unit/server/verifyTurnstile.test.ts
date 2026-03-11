import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const TURNSTILE_SECRET = 'turnstile-secret-key'
const originalNodeEnv = process.env.NODE_ENV

beforeEach(() => {
  vi.clearAllMocks()
  process.env.NODE_ENV = 'test'
  delete process.env.TURNSTILE_SECRET_KEY
  // Default: config has a turnstile key
  vi.stubGlobal('useRuntimeConfig', () => ({
    turnstileSecretKey: TURNSTILE_SECRET,
    public: { vertical: 'tracciona' },
  }))
  // Default fetch: returns success
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({ success: true }),
    text: vi.fn().mockResolvedValue(''),
  }))
})

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv
})

import { verifyTurnstile } from '../../../server/utils/verifyTurnstile'

describe('verifyTurnstile', () => {
  it('returns true when Cloudflare responds with success', async () => {
    const result = await verifyTurnstile('valid-token')
    expect(result).toBe(true)
  })

  it('returns false when Cloudflare responds with failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: false }),
    }))
    const result = await verifyTurnstile('invalid-token')
    expect(result).toBe(false)
  })

  it('returns false when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const result = await verifyTurnstile('any-token')
    expect(result).toBe(false)
  })

  it('returns true in dev/test mode when no secret configured', async () => {
    process.env.NODE_ENV = 'development'
    vi.stubGlobal('useRuntimeConfig', () => ({ turnstileSecretKey: '', public: {} }))
    delete process.env.TURNSTILE_SECRET_KEY
    const result = await verifyTurnstile('any-token')
    expect(result).toBe(true)
  })

  it('returns false in production when no secret configured', async () => {
    process.env.NODE_ENV = 'production'
    vi.stubGlobal('useRuntimeConfig', () => ({ turnstileSecretKey: '', public: {} }))
    delete process.env.TURNSTILE_SECRET_KEY
    const result = await verifyTurnstile('any-token')
    expect(result).toBe(false)
  })

  it('includes ip in request body when provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    })
    vi.stubGlobal('fetch', mockFetch)
    await verifyTurnstile('token', '1.2.3.4')
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.remoteip).toBe('1.2.3.4')
  })

  it('does not include ip in body when not provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    })
    vi.stubGlobal('fetch', mockFetch)
    await verifyTurnstile('token')
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.remoteip).toBeUndefined()
  })

  it('sends request to Cloudflare siteverify endpoint', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    })
    vi.stubGlobal('fetch', mockFetch)
    await verifyTurnstile('token')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('uses TURNSTILE_SECRET_KEY env var as fallback', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ turnstileSecretKey: '', public: {} }))
    process.env.TURNSTILE_SECRET_KEY = TURNSTILE_SECRET
    const result = await verifyTurnstile('token')
    expect(result).toBe(true)
    delete process.env.TURNSTILE_SECRET_KEY
  })
})
