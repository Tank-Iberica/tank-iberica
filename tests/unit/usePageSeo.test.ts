import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePageSeo } from '../../app/composables/usePageSeo'

const mockSeoMeta = vi.fn()
const mockHead = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('useSeoMeta', mockSeoMeta)
  vi.stubGlobal('useHead', mockHead)
})

// ─── useSeoMeta calls ─────────────────────────────────────────────────────────

describe('useSeoMeta', () => {
  it('is called once', () => {
    usePageSeo({ title: 'Test', description: 'Desc', path: '/test' })
    expect(mockSeoMeta).toHaveBeenCalledTimes(1)
  })

  it('passes title to useSeoMeta', () => {
    usePageSeo({ title: 'My Title', description: 'Desc', path: '/test' })
    expect(mockSeoMeta).toHaveBeenCalledWith(expect.objectContaining({ title: 'My Title' }))
  })

  it('passes description to useSeoMeta', () => {
    usePageSeo({ title: 'Title', description: 'My Description', path: '/test' })
    expect(mockSeoMeta).toHaveBeenCalledWith(expect.objectContaining({ description: 'My Description' }))
  })

  it('passes ogTitle equal to title', () => {
    usePageSeo({ title: 'OG Title', description: 'Desc', path: '/test' })
    expect(mockSeoMeta).toHaveBeenCalledWith(expect.objectContaining({ ogTitle: 'OG Title' }))
  })

  it('passes ogDescription equal to description', () => {
    usePageSeo({ title: 'T', description: 'OG Desc', path: '/test' })
    expect(mockSeoMeta).toHaveBeenCalledWith(expect.objectContaining({ ogDescription: 'OG Desc' }))
  })

  it('uses provided image as ogImage', () => {
    usePageSeo({ title: 'T', description: 'D', path: '/test', image: 'https://cdn.com/img.jpg' })
    expect(mockSeoMeta).toHaveBeenCalledWith(
      expect.objectContaining({ ogImage: 'https://cdn.com/img.jpg' }),
    )
  })

  it('uses default image when no image provided', () => {
    usePageSeo({ title: 'T', description: 'D', path: '/test' })
    expect(mockSeoMeta).toHaveBeenCalledWith(
      expect.objectContaining({ ogImage: 'https://tracciona.com/og-default.png' }),
    )
  })

  it('uses provided type as ogType', () => {
    usePageSeo({ title: 'T', description: 'D', path: '/test', type: 'article' })
    expect(mockSeoMeta).toHaveBeenCalledWith(expect.objectContaining({ ogType: 'article' }))
  })

  it('defaults ogType to "website"', () => {
    usePageSeo({ title: 'T', description: 'D', path: '/test' })
    expect(mockSeoMeta).toHaveBeenCalledWith(expect.objectContaining({ ogType: 'website' }))
  })

  it('sets ogUrl to canonical URL', () => {
    usePageSeo({ title: 'T', description: 'D', path: '/camiones' })
    expect(mockSeoMeta).toHaveBeenCalledWith(
      expect.objectContaining({ ogUrl: 'https://tracciona.com/camiones' }),
    )
  })

  it('sets ogSiteName from site.title i18n key', () => {
    usePageSeo({ title: 'T', description: 'D', path: '/test' })
    expect(mockSeoMeta).toHaveBeenCalledWith(expect.objectContaining({ ogSiteName: 'site.title' }))
  })

  it('sets twitterCard to summary_large_image', () => {
    usePageSeo({ title: 'T', description: 'D', path: '/test' })
    expect(mockSeoMeta).toHaveBeenCalledWith(
      expect.objectContaining({ twitterCard: 'summary_large_image' }),
    )
  })

  it('sets robots to index follow', () => {
    usePageSeo({ title: 'T', description: 'D', path: '/test' })
    expect(mockSeoMeta).toHaveBeenCalledWith(expect.objectContaining({ robots: 'index, follow' }))
  })
})

// ─── useHead calls ────────────────────────────────────────────────────────────

describe('useHead', () => {
  it('is called once', () => {
    usePageSeo({ title: 'T', description: 'D', path: '/test' })
    expect(mockHead).toHaveBeenCalledTimes(1)
  })

  it('includes canonical link', () => {
    usePageSeo({ title: 'T', description: 'D', path: '/camiones' })
    const [config] = mockHead.mock.calls[0]!
    const canonical = config.link.find((l: { rel: string }) => l.rel === 'canonical')
    expect(canonical.href).toBe('https://tracciona.com/camiones')
  })

  it('includes es hreflang link', () => {
    usePageSeo({ title: 'T', description: 'D', path: '/camiones' })
    const [config] = mockHead.mock.calls[0]!
    const esLink = config.link.find((l: { hreflang?: string }) => l.hreflang === 'es')
    expect(esLink).toBeDefined()
    expect(esLink.href).toBe('https://tracciona.com/camiones')
  })

  it('includes en hreflang link', () => {
    usePageSeo({ title: 'T', description: 'D', path: '/camiones' })
    const [config] = mockHead.mock.calls[0]!
    const enLink = config.link.find((l: { hreflang?: string }) => l.hreflang === 'en')
    expect(enLink).toBeDefined()
    expect(enLink.href).toBe('https://tracciona.com/en/camiones')
  })

  it('includes x-default hreflang', () => {
    usePageSeo({ title: 'T', description: 'D', path: '/camiones' })
    const [config] = mockHead.mock.calls[0]!
    const xDefault = config.link.find((l: { hreflang?: string }) => l.hreflang === 'x-default')
    expect(xDefault).toBeDefined()
  })

  it('does not include script when no jsonLd provided', () => {
    usePageSeo({ title: 'T', description: 'D', path: '/test' })
    const [config] = mockHead.mock.calls[0]!
    expect(config.script).toBeUndefined()
  })

  it('includes JSON-LD script when jsonLd is provided', () => {
    usePageSeo({
      title: 'T',
      description: 'D',
      path: '/test',
      jsonLd: { '@type': 'Organization', name: 'Tracciona' },
    })
    const [config] = mockHead.mock.calls[0]!
    expect(config.script).toHaveLength(1)
    expect(config.script[0].type).toBe('application/ld+json')
    expect(config.script[0].innerHTML).toContain('Organization')
  })
})

// ─── locale prefix stripping ──────────────────────────────────────────────────

describe('locale prefix in path', () => {
  it('strips /en/ prefix from path for hreflang', () => {
    usePageSeo({ title: 'T', description: 'D', path: '/en/camiones' })
    const [config] = mockHead.mock.calls[0]!
    const esLink = config.link.find((l: { hreflang?: string }) => l.hreflang === 'es')
    // /en/camiones → cleanPath = /camiones
    expect(esLink.href).toBe('https://tracciona.com/camiones')
  })

  it('strips /es/ prefix from path for hreflang', () => {
    usePageSeo({ title: 'T', description: 'D', path: '/es/camiones' })
    const [config] = mockHead.mock.calls[0]!
    const esLink = config.link.find((l: { hreflang?: string }) => l.hreflang === 'es')
    expect(esLink.href).toBe('https://tracciona.com/camiones')
  })

  it('strips /en root path', () => {
    usePageSeo({ title: 'T', description: 'D', path: '/en' })
    const [config] = mockHead.mock.calls[0]!
    const esLink = config.link.find((l: { hreflang?: string }) => l.hreflang === 'es')
    expect(esLink.href).toBe('https://tracciona.com/')
  })

  it('does not strip non-locale prefix', () => {
    usePageSeo({ title: 'T', description: 'D', path: '/enterprise/camiones' })
    const [config] = mockHead.mock.calls[0]!
    const esLink = config.link.find((l: { hreflang?: string }) => l.hreflang === 'es')
    // 'enterprise' is not a locale prefix
    expect(esLink.href).toBe('https://tracciona.com/enterprise/camiones')
  })

  it('canonical URL always uses the original path (not stripped)', () => {
    usePageSeo({ title: 'T', description: 'D', path: '/en/camiones' })
    const [config] = mockHead.mock.calls[0]!
    const canonical = config.link.find((l: { rel: string }) => l.rel === 'canonical')
    // canonical uses the original path with locale prefix
    expect(canonical.href).toBe('https://tracciona.com/en/camiones')
  })
})
