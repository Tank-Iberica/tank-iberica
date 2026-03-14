import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sendIndexNow, vehicleUrl, articleUrl } from '../../../server/utils/indexNow'

describe('vehicleUrl', () => {
  it('builds correct vehicle URL', () => {
    expect(vehicleUrl('camion-abc-123', 'https://tracciona.com')).toBe(
      'https://tracciona.com/vehiculo/camion-abc-123',
    )
  })
})

describe('articleUrl', () => {
  it('builds correct article URL', () => {
    expect(articleUrl('guia-compra-cisternas', 'https://tracciona.com')).toBe(
      'https://tracciona.com/noticias/guia-compra-cisternas',
    )
  })
})

describe('sendIndexNow', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    process.env = originalEnv
    vi.unstubAllGlobals()
  })

  it('returns skipped=true when INDEXNOW_KEY is not set', async () => {
    delete process.env.INDEXNOW_KEY
    const result = await sendIndexNow(['https://tracciona.com/vehiculo/test'])
    expect(result.skipped).toBe(true)
    expect(result.ok).toBe(true)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns ok=true with urlCount=0 when empty urls', async () => {
    process.env.INDEXNOW_KEY = 'test-key-abc'
    const result = await sendIndexNow([])
    expect(result.ok).toBe(true)
    expect(result.urlCount).toBe(0)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('sends POST request to IndexNow endpoint with correct payload', async () => {
    process.env.INDEXNOW_KEY = 'mykey123'
    process.env.NUXT_PUBLIC_SITE_URL = 'https://tracciona.com'
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, status: 200 })

    const result = await sendIndexNow([
      'https://tracciona.com/vehiculo/camion-1',
      'https://tracciona.com/vehiculo/camion-2',
    ])

    expect(result.ok).toBe(true)
    expect(result.urlCount).toBe(2)
    expect(fetch).toHaveBeenCalledOnce()

    const [url, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toBe('https://api.indexnow.org/indexnow')
    expect(options.method).toBe('POST')

    const body = JSON.parse(options.body)
    expect(body.host).toBe('tracciona.com')
    expect(body.key).toBe('mykey123')
    expect(body.keyLocation).toBe('https://tracciona.com/api/indexnow-key')
    expect(body.urlList).toHaveLength(2)
  })

  it('returns ok=true for status 202', async () => {
    process.env.INDEXNOW_KEY = 'mykey123'
    process.env.NUXT_PUBLIC_SITE_URL = 'https://tracciona.com'
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 202 })

    const result = await sendIndexNow(['https://tracciona.com/vehiculo/x'])
    expect(result.ok).toBe(true)
    expect(result.status).toBe(202)
  })

  it('returns ok=false for non-200/202 status', async () => {
    process.env.INDEXNOW_KEY = 'mykey123'
    process.env.NUXT_PUBLIC_SITE_URL = 'https://tracciona.com'
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 422 })

    const result = await sendIndexNow(['https://tracciona.com/vehiculo/x'])
    expect(result.ok).toBe(false)
    expect(result.status).toBe(422)
  })

  it('returns ok=false but does not throw on network error', async () => {
    process.env.INDEXNOW_KEY = 'mykey123'
    process.env.NUXT_PUBLIC_SITE_URL = 'https://tracciona.com'
    ;(fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'))

    const result = await sendIndexNow(['https://tracciona.com/vehiculo/x'])
    expect(result.ok).toBe(false)
    expect(result.urlCount).toBe(1)
  })

  it('uses fallback siteUrl when env not set', async () => {
    process.env.INDEXNOW_KEY = 'mykey123'
    delete process.env.NUXT_PUBLIC_SITE_URL
    delete process.env.SITE_URL
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, status: 200 })

    await sendIndexNow(['https://tracciona.com/vehiculo/x'])

    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body)
    expect(body.host).toBe('tracciona.com')
    expect(body.keyLocation).toContain('tracciona.com')
  })
})
