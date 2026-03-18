import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'

describe('siteConfig', () => {
  const origSiteUrl = process.env.SITE_URL
  const origPublicUrl = process.env.NUXT_PUBLIC_SITE_URL
  const origSiteName = process.env.SITE_NAME
  const origSiteEmail = process.env.SITE_EMAIL
  const origBrandPrimary = process.env.BRAND_COLOR_PRIMARY
  const origBrandPrimaryDark = process.env.BRAND_COLOR_PRIMARY_DARK
  const origBrandAccent = process.env.BRAND_COLOR_ACCENT

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    if (origSiteUrl !== undefined) process.env.SITE_URL = origSiteUrl
    else delete process.env.SITE_URL
    if (origPublicUrl !== undefined) process.env.NUXT_PUBLIC_SITE_URL = origPublicUrl
    else delete process.env.NUXT_PUBLIC_SITE_URL
    if (origSiteName !== undefined) process.env.SITE_NAME = origSiteName
    else delete process.env.SITE_NAME
    if (origSiteEmail !== undefined) process.env.SITE_EMAIL = origSiteEmail
    else delete process.env.SITE_EMAIL
    if (origBrandPrimary !== undefined) process.env.BRAND_COLOR_PRIMARY = origBrandPrimary
    else delete process.env.BRAND_COLOR_PRIMARY
    if (origBrandPrimaryDark !== undefined)
      process.env.BRAND_COLOR_PRIMARY_DARK = origBrandPrimaryDark
    else delete process.env.BRAND_COLOR_PRIMARY_DARK
    if (origBrandAccent !== undefined) process.env.BRAND_COLOR_ACCENT = origBrandAccent
    else delete process.env.BRAND_COLOR_ACCENT
  })

  it('getSiteUrl returns SITE_URL if set', async () => {
    process.env.SITE_URL = 'https://custom.example.com'
    const { getSiteUrl } = await import('../../../server/utils/siteConfig')
    expect(getSiteUrl()).toBe('https://custom.example.com')
  })

  it('getSiteUrl falls back to NUXT_PUBLIC_SITE_URL', async () => {
    delete process.env.SITE_URL
    process.env.NUXT_PUBLIC_SITE_URL = 'https://nuxt-public.example.com'
    const { getSiteUrl } = await import('../../../server/utils/siteConfig')
    expect(getSiteUrl()).toBe('https://nuxt-public.example.com')
  })

  it('getSiteUrl defaults to tracciona.com', async () => {
    delete process.env.SITE_URL
    delete process.env.NUXT_PUBLIC_SITE_URL
    const { getSiteUrl } = await import('../../../server/utils/siteConfig')
    expect(getSiteUrl()).toBe('https://tracciona.com')
  })

  it('getSiteName returns SITE_NAME if set', async () => {
    process.env.SITE_NAME = 'CustomSite'
    const { getSiteName } = await import('../../../server/utils/siteConfig')
    expect(getSiteName()).toBe('CustomSite')
  })

  it('getSiteName defaults to Tracciona', async () => {
    delete process.env.SITE_NAME
    const { getSiteName } = await import('../../../server/utils/siteConfig')
    expect(getSiteName()).toBe('Tracciona')
  })

  // ─── #78 — getSiteEmail ───────────────────────────────────────────────────

  it('getSiteEmail returns SITE_EMAIL env if set', async () => {
    process.env.SITE_EMAIL = 'custom@example.com'
    const { getSiteEmail } = await import('../../../server/utils/siteConfig')
    expect(getSiteEmail()).toBe('custom@example.com')
  })

  it('getSiteEmail derives from getSiteUrl when SITE_EMAIL not set', async () => {
    delete process.env.SITE_EMAIL
    process.env.SITE_URL = 'https://example.com'
    const { getSiteEmail } = await import('../../../server/utils/siteConfig')
    expect(getSiteEmail()).toBe('hola@example.com')
  })

  it('getSiteEmail defaults to hola@tracciona.com', async () => {
    delete process.env.SITE_EMAIL
    delete process.env.SITE_URL
    delete process.env.NUXT_PUBLIC_SITE_URL
    const { getSiteEmail } = await import('../../../server/utils/siteConfig')
    expect(getSiteEmail()).toBe('hola@tracciona.com')
  })

  it('getSiteEmail strips https:// from URL correctly', async () => {
    delete process.env.SITE_EMAIL
    process.env.SITE_URL = 'https://my-marketplace.io'
    const { getSiteEmail } = await import('../../../server/utils/siteConfig')
    expect(getSiteEmail()).toBe('hola@my-marketplace.io')
  })

  it('getSiteEmail strips http:// from URL correctly', async () => {
    delete process.env.SITE_EMAIL
    process.env.SITE_URL = 'http://localhost:3000'
    const { getSiteEmail } = await import('../../../server/utils/siteConfig')
    expect(getSiteEmail()).toBe('hola@localhost:3000')
  })

  // ─── #78 — BRAND_COLORS ──────────────────────────────────────────────────

  it('BRAND_COLORS has all required keys', async () => {
    const { BRAND_COLORS } = await import('../../../server/utils/siteConfig')
    expect(BRAND_COLORS).toHaveProperty('primary')
    expect(BRAND_COLORS).toHaveProperty('primaryDark')
    expect(BRAND_COLORS).toHaveProperty('accent')
    expect(BRAND_COLORS).toHaveProperty('white')
    expect(BRAND_COLORS).toHaveProperty('gray100')
    expect(BRAND_COLORS).toHaveProperty('gray600')
    expect(BRAND_COLORS).toHaveProperty('gray800')
  })

  it('BRAND_COLORS has correct hardcoded values', async () => {
    const { BRAND_COLORS } = await import('../../../server/utils/siteConfig')
    expect(BRAND_COLORS.white).toBe('#ffffff')
    expect(BRAND_COLORS.gray100).toBe('#f7fafc')
    expect(BRAND_COLORS.gray600).toBe('#718096')
    expect(BRAND_COLORS.gray800).toBe('#2d3748')
  })

  it('BRAND_COLORS uses default primary when env not set', async () => {
    delete process.env.BRAND_COLOR_PRIMARY
    const { BRAND_COLORS } = await import('../../../server/utils/siteConfig')
    expect(BRAND_COLORS.primary).toBe('#23424A')
  })

  it('BRAND_COLORS uses default primaryDark when env not set', async () => {
    delete process.env.BRAND_COLOR_PRIMARY_DARK
    const { BRAND_COLORS } = await import('../../../server/utils/siteConfig')
    expect(BRAND_COLORS.primaryDark).toBe('#1a3236')
  })

  it('BRAND_COLORS uses default accent when env not set', async () => {
    delete process.env.BRAND_COLOR_ACCENT
    const { BRAND_COLORS } = await import('../../../server/utils/siteConfig')
    expect(BRAND_COLORS.accent).toBe('#E8A838')
  })

  it('BRAND_COLORS all values are valid hex colors', async () => {
    const { BRAND_COLORS } = await import('../../../server/utils/siteConfig')
    const hexPattern = /^#[0-9a-f]{6}$/i
    Object.values(BRAND_COLORS).forEach((color) => {
      expect(color).toMatch(hexPattern)
    })
  })
})
