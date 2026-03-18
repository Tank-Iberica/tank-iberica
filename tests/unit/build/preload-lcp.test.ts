import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Verifies LCP (Largest Contentful Paint) optimization:
 * - Font preload configured in nuxt.config
 * - Preconnect hints for image CDNs
 * - VehicleCard uses fetchpriority for above-fold images
 * - SSR inlines critical CSS (Nuxt 3 default behavior)
 */

const ROOT = resolve(__dirname, '../../..')

function readFile(relPath: string): string {
  return readFileSync(resolve(ROOT, relPath), 'utf-8')
}

describe('LCP resource preloading', () => {
  const nuxtConfig = readFile('nuxt.config.ts')
  const vehicleCard = readFile('app/components/catalog/VehicleCard.vue')

  describe('Font preloading', () => {
    it('Google Fonts has preload enabled', () => {
      expect(nuxtConfig).toContain('preload: true')
    })

    it('Google Fonts uses font-display: swap', () => {
      expect(nuxtConfig).toContain("display: 'swap'")
    })

    it('Google Fonts has preconnect hints', () => {
      expect(nuxtConfig).toContain("rel: 'preconnect', href: 'https://fonts.googleapis.com'")
      expect(nuxtConfig).toContain("rel: 'preconnect', href: 'https://fonts.gstatic.com'")
    })
  })

  describe('Image CDN preconnect', () => {
    it('Cloudinary has preconnect', () => {
      expect(nuxtConfig).toContain("rel: 'preconnect', href: 'https://res.cloudinary.com'")
    })

    it('Cloudinary has dns-prefetch', () => {
      expect(nuxtConfig).toContain("rel: 'dns-prefetch', href: 'https://res.cloudinary.com'")
    })

    it('Supabase URL has preconnect when configured', () => {
      expect(nuxtConfig).toContain("rel: 'preconnect', href: process.env.SUPABASE_URL")
    })
  })

  describe('Above-fold image optimization', () => {
    it('VehicleCard supports priority prop for eager loading', () => {
      expect(vehicleCard).toContain('priority')
      expect(vehicleCard).toContain(`:loading="priority ? 'eager' : 'lazy'"`)
    })

    it('VehicleCard sets fetchpriority=high for priority images', () => {
      expect(vehicleCard).toContain(`:fetchpriority="priority ? 'high' : 'auto'"`)
    })

    it('VehicleGrid passes priority to first 4 cards', () => {
      const grid = readFile('app/components/catalog/VehicleGrid.vue')
      expect(grid).toContain(':priority="idx < 4"')
    })
  })
})
