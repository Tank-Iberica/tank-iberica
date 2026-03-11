import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useHreflang } from '../../app/composables/useHreflang'

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  // useHreflang calls useHead() as a side effect — stub it as no-op
  vi.stubGlobal('useHead', vi.fn())
})

const SITE = 'https://tracciona.com'

// ─── Path normalization ───────────────────────────────────────────────────

describe('hreflangLinks — path normalization', () => {
  it('uses path as-is when no locale prefix', () => {
    const { hreflangLinks } = useHreflang('/vehiculos/camion-1')
    expect(hreflangLinks[0]!.href).toBe(`${SITE}/vehiculos/camion-1`)
  })

  it('strips /en/ prefix from path', () => {
    const { hreflangLinks } = useHreflang('/en/vehiculos/camion-1')
    expect(hreflangLinks[0]!.href).toBe(`${SITE}/vehiculos/camion-1`)
  })

  it('strips /es/ prefix from path', () => {
    const { hreflangLinks } = useHreflang('/es/vehiculos/camion-1')
    expect(hreflangLinks[0]!.href).toBe(`${SITE}/vehiculos/camion-1`)
  })

  it('handles /en alone (becomes /)', () => {
    const { hreflangLinks } = useHreflang('/en')
    expect(hreflangLinks[0]!.href).toBe(`${SITE}/`)
  })

  it('handles /es alone (becomes /)', () => {
    const { hreflangLinks } = useHreflang('/es')
    expect(hreflangLinks[0]!.href).toBe(`${SITE}/`)
  })

  it('adds leading slash when missing', () => {
    const { hreflangLinks } = useHreflang('vehiculos/test')
    expect(hreflangLinks[0]!.href).toBe(`${SITE}/vehiculos/test`)
  })

  it('handles root path /', () => {
    const { hreflangLinks } = useHreflang('/')
    expect(hreflangLinks[0]!.href).toBe(`${SITE}/`)
  })
})

// ─── hreflangLinks structure ──────────────────────────────────────────────

describe('hreflangLinks structure', () => {
  it('returns exactly 3 links', () => {
    const { hreflangLinks } = useHreflang('/test')
    expect(hreflangLinks).toHaveLength(3)
  })

  it('all links have rel="alternate"', () => {
    const { hreflangLinks } = useHreflang('/test')
    for (const link of hreflangLinks) {
      expect(link.rel).toBe('alternate')
    }
  })

  it('first link has hreflang="es" with site URL (no prefix)', () => {
    const { hreflangLinks } = useHreflang('/guia/articulo')
    const esLink = hreflangLinks.find((l) => l.hreflang === 'es')!
    expect(esLink).toBeDefined()
    expect(esLink.href).toBe(`${SITE}/guia/articulo`)
  })

  it('second link has hreflang="en" with /en/ prefix', () => {
    const { hreflangLinks } = useHreflang('/guia/articulo')
    const enLink = hreflangLinks.find((l) => l.hreflang === 'en')!
    expect(enLink).toBeDefined()
    expect(enLink.href).toBe(`${SITE}/en/guia/articulo`)
  })

  it('third link has hreflang="x-default" pointing to ES URL', () => {
    const { hreflangLinks } = useHreflang('/guia/articulo')
    const defaultLink = hreflangLinks.find((l) => l.hreflang === 'x-default')!
    expect(defaultLink).toBeDefined()
    expect(defaultLink.href).toBe(`${SITE}/guia/articulo`)
  })

  it('calls useHead with the link array', () => {
    const useHeadMock = vi.fn()
    vi.stubGlobal('useHead', useHeadMock)
    useHreflang('/test')
    expect(useHeadMock).toHaveBeenCalledWith(
      expect.objectContaining({ link: expect.any(Array) }),
    )
  })
})
