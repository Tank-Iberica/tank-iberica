import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Verifies OG/meta tags are dynamically set from vertical_config.
 */

const ROOT = resolve(__dirname, '../../..')

function readFile(relPath: string): string {
  return readFileSync(resolve(ROOT, relPath), 'utf-8')
}

describe('usePageSeo dynamic OG tags', () => {
  const pageSeo = readFile('app/composables/usePageSeo.ts')
  const nuxtConfig = readFile('nuxt.config.ts')

  describe('reads from vertical_config', () => {
    it('accesses vertical_config state', () => {
      expect(pageSeo).toContain("useState<Record<string, unknown> | null>('vertical_config')")
    })

    it('reads og_image_url from vertical_config', () => {
      expect(pageSeo).toContain('og_image_url')
    })

    it('reads site name from vertical_config.name', () => {
      expect(pageSeo).toContain('verticalName')
      expect(pageSeo).toContain('verticalConfig.value?.name')
    })

    it('reads theme color from vertical_config.theme', () => {
      expect(pageSeo).toContain('color_primary')
      expect(pageSeo).toContain('verticalThemeColor')
    })
  })

  describe('falls back to defaults', () => {
    it('falls back to og-default.png when no vertical og_image', () => {
      expect(pageSeo).toContain('/og-default.png')
    })

    it('falls back to i18n site.title when no vertical name', () => {
      expect(pageSeo).toContain("t('site.title')")
    })
  })

  describe('sets all required OG tags', () => {
    it('sets ogSiteName', () => {
      expect(pageSeo).toContain('ogSiteName')
    })

    it('sets ogImage', () => {
      expect(pageSeo).toContain('ogImage')
    })

    it('sets ogTitle and ogDescription', () => {
      expect(pageSeo).toContain('ogTitle')
      expect(pageSeo).toContain('ogDescription')
    })

    it('sets twitterCard', () => {
      expect(pageSeo).toContain('twitterCard')
    })

    it('conditionally sets themeColor', () => {
      expect(pageSeo).toContain('themeColor')
    })
  })

  describe('nuxt.config has static OG defaults', () => {
    it('has og:site_name meta', () => {
      expect(nuxtConfig).toContain("property: 'og:site_name'")
    })

    it('has theme-color meta', () => {
      expect(nuxtConfig).toContain("name: 'theme-color'")
    })
  })
})
