import { describe, it, expect } from 'vitest'
import { loadNuxtConfig } from '../../helpers/nuxtConfig'

describe('Service Worker precache & runtime caching', () => {
  let config: Record<string, any>

  beforeAll(async () => {
    config = await loadNuxtConfig()
  })

  describe('PWA workbox config', () => {
    it('has workbox configuration', () => {
      expect(config.pwa.workbox).toBeDefined()
    })

    it('has globPatterns for static asset precaching', () => {
      const patterns = config.pwa.workbox.globPatterns
      expect(patterns).toBeDefined()
      expect(patterns[0]).toContain('js')
      expect(patterns[0]).toContain('css')
      expect(patterns[0]).toContain('woff2')
    })

    it('has navigateFallback for offline page', () => {
      expect(config.pwa.workbox.navigateFallback).toBe('/offline')
    })
  })

  describe('Runtime caching strategies', () => {
    it('caches page navigations with NetworkFirst', () => {
      const caches = config.pwa.workbox.runtimeCaching
      const navCache = caches.find((c: any) => c.options?.cacheName === 'page-navigations')
      expect(navCache).toBeDefined()
      expect(navCache.handler).toBe('NetworkFirst')
    })

    it('page cache has reasonable expiration (10-30 entries, 7 days)', () => {
      const caches = config.pwa.workbox.runtimeCaching
      const navCache = caches.find((c: any) => c.options?.cacheName === 'page-navigations')
      const { maxEntries, maxAgeSeconds } = navCache.options.expiration
      expect(maxEntries).toBeGreaterThanOrEqual(10)
      expect(maxEntries).toBeLessThanOrEqual(30)
      expect(maxAgeSeconds).toBe(60 * 60 * 24 * 7) // 7 days
    })

    it('page cache uses network timeout fallback', () => {
      const caches = config.pwa.workbox.runtimeCaching
      const navCache = caches.find((c: any) => c.options?.cacheName === 'page-navigations')
      const timeout = navCache.options.networkTimeoutSeconds
      expect(timeout).toBeGreaterThanOrEqual(3)
      expect(timeout).toBeLessThanOrEqual(10)
    })

    it('caches Cloudinary images with CacheFirst', () => {
      const caches = config.pwa.workbox.runtimeCaching
      const cloudinaryCache = caches.find((c: any) => c.options?.cacheName === 'cloudinary-images')
      expect(cloudinaryCache).toBeDefined()
      expect(cloudinaryCache.handler).toBe('CacheFirst')
    })

    it('caches Google Fonts with CacheFirst', () => {
      const caches = config.pwa.workbox.runtimeCaching
      const fontsCache = caches.find((c: any) => c.options?.cacheName === 'google-fonts')
      expect(fontsCache).toBeDefined()
      expect(fontsCache.handler).toBe('CacheFirst')
    })

    it('caches Supabase API with NetworkFirst', () => {
      const caches = config.pwa.workbox.runtimeCaching
      const supabaseCache = caches.find((c: any) => c.options?.cacheName === 'supabase-api')
      expect(supabaseCache).toBeDefined()
      expect(supabaseCache.handler).toBe('NetworkFirst')
    })

    it('Supabase API cache has short TTL (5 min)', () => {
      const caches = config.pwa.workbox.runtimeCaching
      const supabaseCache = caches.find((c: any) => c.options?.cacheName === 'supabase-api')
      expect(supabaseCache.options.expiration.maxAgeSeconds).toBe(300)
    })
  })

  describe('PWA registration', () => {
    it('has autoUpdate register type', () => {
      expect(config.pwa.registerType).toBe('autoUpdate')
    })

    it('has install prompt enabled', () => {
      expect(config.pwa.client.installPrompt).toBe(true)
    })

    it('has standalone display mode', () => {
      expect(config.pwa.manifest.display).toBe('standalone')
    })
  })
})
