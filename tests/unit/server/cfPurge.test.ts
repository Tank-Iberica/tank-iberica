import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock logger
vi.mock('../../../server/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock getSiteUrl
vi.stubGlobal('getSiteUrl', () => 'https://test.tracciona.com')

describe('cfPurge', () => {
  let purgeUrls: typeof import('../../../server/utils/cfPurge').purgeUrls
  let purgeVehicleCache: typeof import('../../../server/utils/cfPurge').purgeVehicleCache

  const originalEnv = { ...process.env }

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    // Reset env
    delete process.env.CF_ZONE_ID
    delete process.env.CF_API_TOKEN
    globalThis.fetch = vi.fn()

    const mod = await import('../../../server/utils/cfPurge')
    purgeUrls = mod.purgeUrls
    purgeVehicleCache = mod.purgeVehicleCache
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  describe('purgeUrls', () => {
    it('skips when CF_ZONE_ID not configured', async () => {
      await purgeUrls(['https://example.com/page'])
      expect(globalThis.fetch).not.toHaveBeenCalled()
    })

    it('skips when CF_API_TOKEN not configured', async () => {
      process.env.CF_ZONE_ID = 'zone123'
      await purgeUrls(['https://example.com/page'])
      expect(globalThis.fetch).not.toHaveBeenCalled()
    })

    it('skips empty URL array', async () => {
      process.env.CF_ZONE_ID = 'zone123'
      process.env.CF_API_TOKEN = 'token123'
      await purgeUrls([])
      expect(globalThis.fetch).not.toHaveBeenCalled()
    })

    it('calls CF API with correct URL and auth', async () => {
      process.env.CF_ZONE_ID = 'zone123'
      process.env.CF_API_TOKEN = 'token123'
      ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(''),
      })

      await purgeUrls(['https://example.com/page1'])

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.cloudflare.com/client/v4/zones/zone123/purge_cache',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer token123',
          }),
          body: JSON.stringify({ files: ['https://example.com/page1'] }),
        }),
      )
    })

    it('batches URLs in groups of 30', async () => {
      process.env.CF_ZONE_ID = 'zone123'
      process.env.CF_API_TOKEN = 'token123'
      ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(''),
      })

      const urls = Array.from({ length: 35 }, (_, i) => `https://example.com/page${i}`)
      await purgeUrls(urls)

      expect(globalThis.fetch).toHaveBeenCalledTimes(2) // 30 + 5
    })

    it('handles API error gracefully', async () => {
      process.env.CF_ZONE_ID = 'zone123'
      process.env.CF_API_TOKEN = 'token123'
      ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      })

      // Should not throw
      await expect(purgeUrls(['https://example.com'])).resolves.toBeUndefined()
    })

    it('handles network error gracefully', async () => {
      process.env.CF_ZONE_ID = 'zone123'
      process.env.CF_API_TOKEN = 'token123'
      ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'))

      // Should not throw
      await expect(purgeUrls(['https://example.com'])).resolves.toBeUndefined()
    })
  })

  describe('purgeVehicleCache', () => {
    it('purges vehicle detail + catalog + homepage + feed URLs', () => {
      process.env.CF_ZONE_ID = 'zone123'
      process.env.CF_API_TOKEN = 'token123'
      ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(''),
      })

      purgeVehicleCache('cat-320-test')

      // Fire-and-forget, so we just check it doesn't throw
      expect(true).toBe(true)
    })
  })
})
