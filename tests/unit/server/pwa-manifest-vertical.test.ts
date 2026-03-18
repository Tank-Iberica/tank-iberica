import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const MANIFEST_SRC = readFileSync(
  resolve(ROOT, 'server/routes/manifest.webmanifest.get.ts'),
  'utf-8',
)
const NUXT_CFG = readFileSync(resolve(ROOT, 'nuxt.config.ts'), 'utf-8')
const VERTICAL_CFG = readFileSync(
  resolve(ROOT, 'app/composables/useVerticalConfig.ts'),
  'utf-8',
)

describe('PWA manifest per-vertical (N50)', () => {
  describe('Dynamic manifest route', () => {
    it('sets correct content type', () => {
      expect(MANIFEST_SRC).toContain('application/manifest+json')
    })

    it('sets cache headers', () => {
      expect(MANIFEST_SRC).toContain('Cache-Control')
      expect(MANIFEST_SRC).toContain('max-age')
    })

    it('reads from vertical_config table', () => {
      expect(MANIFEST_SRC).toContain("from('vertical_config')")
    })

    it('selects name, theme, logo, favicon, description', () => {
      expect(MANIFEST_SRC).toContain('name')
      expect(MANIFEST_SRC).toContain('theme')
      expect(MANIFEST_SRC).toContain('logo_url')
      expect(MANIFEST_SRC).toContain('favicon_url')
      expect(MANIFEST_SRC).toContain('meta_description')
    })

    it('uses NUXT_PUBLIC_VERTICAL env var', () => {
      expect(MANIFEST_SRC).toContain('NUXT_PUBLIC_VERTICAL')
    })

    it('falls back to tracciona vertical', () => {
      expect(MANIFEST_SRC).toContain("|| 'tracciona'")
    })

    it('uses locale-aware name from vertical_config', () => {
      expect(MANIFEST_SRC).toContain('data.name?.[locale]')
      expect(MANIFEST_SRC).toContain('data.name?.es')
    })

    it('uses theme color_primary for theme_color', () => {
      expect(MANIFEST_SRC).toContain('data.theme?.color_primary')
    })

    it('generates short_name from name', () => {
      expect(MANIFEST_SRC).toContain('short_name')
      expect(MANIFEST_SRC).toContain("split('—')")
    })

    it('supports custom icons from favicon_url and logo_url', () => {
      expect(MANIFEST_SRC).toContain('data.favicon_url')
      expect(MANIFEST_SRC).toContain('data.logo_url')
    })

    it('falls back to default icons when no custom ones', () => {
      expect(MANIFEST_SRC).toContain('/icon-192x192.png')
      expect(MANIFEST_SRC).toContain('/icon-512x512.png')
    })

    it('includes maskable icon', () => {
      expect(MANIFEST_SRC).toContain("purpose: 'maskable'")
    })

    it('has DEFAULT_MANIFEST fallback', () => {
      expect(MANIFEST_SRC).toContain('DEFAULT_MANIFEST')
    })

    it('returns defaults on DB error', () => {
      expect(MANIFEST_SRC).toContain('catch')
      expect(MANIFEST_SRC).toContain('return DEFAULT_MANIFEST')
    })

    it('uses display standalone', () => {
      expect(MANIFEST_SRC).toContain("'standalone'")
    })
  })

  describe('Static manifest in nuxt.config.ts', () => {
    it('has @vite-pwa/nuxt module', () => {
      expect(NUXT_CFG).toContain('@vite-pwa/nuxt')
    })

    it('defines manifest with name', () => {
      expect(NUXT_CFG).toContain("name: 'Tracciona")
    })

    it('defines theme_color matching primary', () => {
      expect(NUXT_CFG).toContain("theme_color: '#23424A'")
    })

    it('has 192x192 and 512x512 icons', () => {
      expect(NUXT_CFG).toContain('192x192')
      expect(NUXT_CFG).toContain('512x512')
    })

    it('uses autoUpdate register type', () => {
      expect(NUXT_CFG).toContain("registerType: 'autoUpdate'")
    })
  })

  describe('vertical_config supports manifest data', () => {
    it('has name field (multi-lang Record)', () => {
      expect(VERTICAL_CFG).toContain('name: Record<string, string>')
    })

    it('has theme field for colors', () => {
      expect(VERTICAL_CFG).toContain('theme: Record<string, string>')
    })

    it('has logo_url for icons', () => {
      expect(VERTICAL_CFG).toContain('logo_url: string | null')
    })

    it('has favicon_url for small icon', () => {
      expect(VERTICAL_CFG).toContain('favicon_url: string | null')
    })

    it('has meta_description for manifest description', () => {
      expect(VERTICAL_CFG).toContain('meta_description: Record<string, string> | null')
    })

    it('has default_locale', () => {
      expect(VERTICAL_CFG).toContain('default_locale: string')
    })
  })

  describe('Default manifest values consistency', () => {
    // Extract from dynamic route DEFAULT_MANIFEST
    it('default theme_color matches nuxt.config', () => {
      // Both should use #23424A
      expect(MANIFEST_SRC).toContain("#23424A")
      expect(NUXT_CFG).toContain("#23424A")
    })

    it('default background_color matches nuxt.config', () => {
      expect(MANIFEST_SRC).toContain('#F3F4F6')
      expect(NUXT_CFG).toContain('#F3F4F6')
    })

    it('default icons match nuxt.config', () => {
      // Both reference same icon paths
      expect(MANIFEST_SRC).toContain('/icon-192x192.png')
      expect(MANIFEST_SRC).toContain('/icon-512x512.png')
      expect(NUXT_CFG).toContain('/icon-192x192.png')
      expect(NUXT_CFG).toContain('/icon-512x512.png')
    })
  })
})
