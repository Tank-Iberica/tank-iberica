import { describe, it, expect, afterEach } from 'vitest'

describe('siteConfig', () => {
  const origSiteUrl = process.env.SITE_URL
  const origPublicUrl = process.env.NUXT_PUBLIC_SITE_URL
  const origSiteName = process.env.SITE_NAME

  afterEach(() => {
    if (origSiteUrl !== undefined) process.env.SITE_URL = origSiteUrl
    else delete process.env.SITE_URL
    if (origPublicUrl !== undefined) process.env.NUXT_PUBLIC_SITE_URL = origPublicUrl
    else delete process.env.NUXT_PUBLIC_SITE_URL
    if (origSiteName !== undefined) process.env.SITE_NAME = origSiteName
    else delete process.env.SITE_NAME
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
})
