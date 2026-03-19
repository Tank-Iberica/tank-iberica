import { describe, it, expect } from 'vitest'
import { loadNuxtConfig } from '../../helpers/nuxtConfig'

describe('Font subsetting (N21)', () => {
  let config: Record<string, any>

  beforeAll(async () => {
    config = await loadNuxtConfig()
  })

  it('uses @nuxtjs/google-fonts module', () => {
    expect(config.modules).toContain('@nuxtjs/google-fonts')
  })

  it('specifies Inter font family', () => {
    expect(config.googleFonts.families.Inter).toBeDefined()
  })

  it('limits to latin + latin-ext subsets (ES+EN coverage)', () => {
    expect(config.googleFonts.subsets).toEqual(['latin', 'latin-ext'])
  })

  it('self-hosts fonts with download: true', () => {
    expect(config.googleFonts.download).toBe(true)
  })

  it('uses font-display: swap for performance', () => {
    expect(config.googleFonts.display).toBe('swap')
  })

  it('preloads fonts', () => {
    expect(config.googleFonts.preload).toBe(true)
  })

  it('only loads needed weights (400, 500, 600, 700)', () => {
    expect(config.googleFonts.families.Inter).toEqual([400, 500, 600, 700])
  })

  it('has preconnect hint for Google Fonts CDN', () => {
    const links = config.app.head.link
    const preconnect = links.find(
      (l: any) => l.rel === 'preconnect' && l.href === 'https://fonts.googleapis.com',
    )
    expect(preconnect).toBeDefined()
  })
})
