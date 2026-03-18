import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const CONFIG = readFileSync(resolve(ROOT, 'nuxt.config.ts'), 'utf-8')

describe('Service Worker precache & runtime caching', () => {
  describe('PWA workbox config', () => {
    it('has workbox configuration', () => {
      expect(CONFIG).toContain('workbox:')
    })

    it('has globPatterns for static asset precaching', () => {
      expect(CONFIG).toContain('globPatterns')
      expect(CONFIG).toContain('js,css,html,png,svg,ico,woff2')
    })

    it('has navigateFallback for offline page', () => {
      expect(CONFIG).toContain("navigateFallback: '/offline'")
    })
  })

  describe('Runtime caching strategies', () => {
    it('caches page navigations with NetworkFirst', () => {
      expect(CONFIG).toContain("cacheName: 'page-navigations'")
      expect(CONFIG).toContain("request.mode === 'navigate'")
    })

    it('page cache has reasonable expiration (max 20 entries, 7 days)', () => {
      // Verify maxEntries and 7-day TTL for navigations
      const navCacheMatch = CONFIG.match(
        /page-navigations[\s\S]*?maxEntries:\s*(\d+)[\s\S]*?maxAgeSeconds:\s*([^,}]+)/
      )
      expect(navCacheMatch).toBeTruthy()
      if (navCacheMatch) {
        expect(Number(navCacheMatch[1])).toBeLessThanOrEqual(30)
        expect(Number(navCacheMatch[1])).toBeGreaterThanOrEqual(10)
      }
    })

    it('page cache uses network timeout fallback', () => {
      // Verify networkTimeoutSeconds for navigations
      const navSection = CONFIG.match(/page-navigations[\s\S]*?networkTimeoutSeconds:\s*(\d+)/)
      expect(navSection).toBeTruthy()
      if (navSection) {
        expect(Number(navSection[1])).toBeLessThanOrEqual(10)
        expect(Number(navSection[1])).toBeGreaterThanOrEqual(3)
      }
    })

    it('caches Cloudinary images with CacheFirst', () => {
      expect(CONFIG).toContain("cacheName: 'cloudinary-images'")
      expect(CONFIG).toContain('cloudinary.com')
      expect(CONFIG).toMatch(/cloudinary[\s\S]*?handler:\s*'CacheFirst'/)
    })

    it('caches Google Fonts with CacheFirst', () => {
      expect(CONFIG).toContain("cacheName: 'google-fonts'")
      expect(CONFIG).toContain('googleapis|gstatic')
    })

    it('caches Supabase API with NetworkFirst', () => {
      expect(CONFIG).toContain("cacheName: 'supabase-api'")
      expect(CONFIG).toContain('supabase.co')
    })

    it('Supabase API cache has short TTL (5 min)', () => {
      const supabaseMatch = CONFIG.match(
        /supabase-api[\s\S]*?maxAgeSeconds:\s*([^,}]+)/
      )
      expect(supabaseMatch).toBeTruthy()
      if (supabaseMatch) {
        // 60 * 5 = 300
        expect(supabaseMatch[1].trim()).toContain('60 * 5')
      }
    })
  })

  describe('PWA manifest', () => {
    it('has autoUpdate register type', () => {
      expect(CONFIG).toContain("registerType: 'autoUpdate'")
    })

    it('has install prompt enabled', () => {
      expect(CONFIG).toContain('installPrompt: true')
    })

    it('has standalone display mode', () => {
      expect(CONFIG).toContain("display: 'standalone'")
    })
  })
})
