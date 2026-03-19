import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

// Track calls to useSeoMeta and useHead
const seoMetaCalls: any[] = []
const headCalls: any[] = []

vi.stubGlobal('ref', ref)
vi.stubGlobal(
  'useSeoMeta',
  vi.fn((meta: any) => seoMetaCalls.push(meta)),
)
vi.stubGlobal(
  'useHead',
  vi.fn((config: any) => headCalls.push(config)),
)
vi.stubGlobal(
  'useI18n',
  vi.fn(() => ({
    t: vi.fn((key: string) => (key === 'site.title' ? 'Tracciona' : key)),
    locale: { value: 'es' },
  })),
)
vi.stubGlobal(
  'useSiteUrl',
  vi.fn(() => 'https://tracciona.com'),
)
vi.stubGlobal(
  'useState',
  vi.fn((_key: string) => ref(null)),
)

import { usePageSeo } from '../../../app/composables/usePageSeo'

describe('usePageSeo dynamic OG tags', () => {
  beforeEach(() => {
    seoMetaCalls.length = 0
    headCalls.length = 0
    vi.clearAllMocks()
  })

  describe('Basic SEO meta tags', () => {
    it('sets title and description', () => {
      usePageSeo({ title: 'Test Page', description: 'A test', path: '/test' })
      const meta = seoMetaCalls[0]
      expect(meta.title).toBe('Test Page')
      expect(meta.description).toBe('A test')
    })

    it('sets OG title and description', () => {
      usePageSeo({ title: 'My Title', description: 'My Desc', path: '/page' })
      const meta = seoMetaCalls[0]
      expect(meta.ogTitle).toBe('My Title')
      expect(meta.ogDescription).toBe('My Desc')
    })

    it('sets Twitter card to summary_large_image', () => {
      usePageSeo({ title: 'T', description: 'D', path: '/t' })
      expect(seoMetaCalls[0].twitterCard).toBe('summary_large_image')
    })

    it('sets ogUrl to canonical URL', () => {
      usePageSeo({ title: 'T', description: 'D', path: '/catalog' })
      expect(seoMetaCalls[0].ogUrl).toBe('https://tracciona.com/catalog')
    })

    it('sets robots to index, follow', () => {
      usePageSeo({ title: 'T', description: 'D', path: '/t' })
      expect(seoMetaCalls[0].robots).toBe('index, follow')
    })
  })

  describe('Vertical config integration', () => {
    it('reads og_image_url from vertical_config', () => {
      vi.mocked(useState).mockReturnValue(
        ref({
          og_image_url: 'https://cdn.tracciona.com/og-custom.png',
          name: { es: 'Custom Vertical' },
        }) as any,
      )

      usePageSeo({ title: 'T', description: 'D', path: '/t' })
      expect(seoMetaCalls[0].ogImage).toBe('https://cdn.tracciona.com/og-custom.png')
    })

    it('reads site name from vertical_config.name', () => {
      vi.mocked(useState).mockReturnValue(
        ref({
          name: { es: 'Mi Vertical', en: 'My Vertical' },
        }) as any,
      )

      usePageSeo({ title: 'T', description: 'D', path: '/t' })
      expect(seoMetaCalls[0].ogSiteName).toBe('Mi Vertical')
    })

    it('reads theme color from vertical_config.theme', () => {
      vi.mocked(useState).mockReturnValue(
        ref({
          theme: { color_primary: '#FF5733' },
        }) as any,
      )

      usePageSeo({ title: 'T', description: 'D', path: '/t' })
      expect(seoMetaCalls[0].themeColor).toBe('#FF5733')
    })
  })

  describe('Fallbacks', () => {
    it('falls back to /og-default.png when no vertical og_image', () => {
      vi.mocked(useState).mockReturnValue(ref(null) as any)
      usePageSeo({ title: 'T', description: 'D', path: '/t' })
      expect(seoMetaCalls[0].ogImage).toBe('https://tracciona.com/og-default.png')
    })

    it('falls back to i18n site.title when no vertical name', () => {
      vi.mocked(useState).mockReturnValue(ref(null) as any)
      usePageSeo({ title: 'T', description: 'D', path: '/t' })
      expect(seoMetaCalls[0].ogSiteName).toBe('Tracciona')
    })

    it('uses custom image when provided', () => {
      vi.mocked(useState).mockReturnValue(ref(null) as any)
      usePageSeo({ title: 'T', description: 'D', path: '/t', image: 'https://custom.jpg' })
      expect(seoMetaCalls[0].ogImage).toBe('https://custom.jpg')
    })
  })

  describe('Head config', () => {
    it('sets canonical link', () => {
      usePageSeo({ title: 'T', description: 'D', path: '/catalog' })
      const head = headCalls[0]
      expect(
        head.link.some(
          (l: any) => l.rel === 'canonical' && l.href === 'https://tracciona.com/catalog',
        ),
      ).toBe(true)
    })

    it('sets hreflang tags for es and en', () => {
      usePageSeo({ title: 'T', description: 'D', path: '/catalog' })
      const head = headCalls[0]
      expect(head.link.some((l: any) => l.hreflang === 'es')).toBe(true)
      expect(head.link.some((l: any) => l.hreflang === 'en')).toBe(true)
      expect(head.link.some((l: any) => l.hreflang === 'x-default')).toBe(true)
    })

    it('adds JSON-LD script when provided', () => {
      const jsonLd = { '@type': 'WebPage', name: 'Test' }
      usePageSeo({ title: 'T', description: 'D', path: '/t', jsonLd })
      const head = headCalls[0]
      expect(head.script).toBeDefined()
      expect(head.script[0].type).toBe('application/ld+json')
      expect(JSON.parse(head.script[0].innerHTML)).toEqual(jsonLd)
    })

    it('does not add JSON-LD when not provided', () => {
      usePageSeo({ title: 'T', description: 'D', path: '/t' })
      expect(headCalls[0].script).toBeUndefined()
    })
  })
})
