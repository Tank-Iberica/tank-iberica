import { describe, it, expect } from 'vitest'
import { loadNuxtConfig } from '../../helpers/nuxtConfig'

describe('PWA manifest deep linking', () => {
  let config: Record<string, any>

  beforeAll(async () => {
    config = await loadNuxtConfig()
  })

  it('manifest has scope set to root', () => {
    expect(config.pwa.manifest.scope).toBe('/')
  })

  it('manifest has start_url', () => {
    expect(config.pwa.manifest.start_url).toBe('/')
  })

  it('manifest has display: standalone', () => {
    expect(config.pwa.manifest.display).toBe('standalone')
  })

  it('manifest has app id', () => {
    expect(config.pwa.manifest.id).toBe('/')
  })

  it('manifest has required icons', () => {
    const icons = config.pwa.manifest.icons
    const sizes = icons.map((i: any) => i.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
  })

  it('manifest has maskable icon', () => {
    const icons = config.pwa.manifest.icons
    const maskable = icons.find((i: any) => i.purpose === 'maskable')
    expect(maskable).toBeDefined()
  })

  it('manifest has theme and background color', () => {
    expect(config.pwa.manifest.theme_color).toBe('#23424A')
    expect(config.pwa.manifest.background_color).toBe('#F3F4F6')
  })

  it('workbox has navigateFallback for offline', () => {
    expect(config.pwa.workbox.navigateFallback).toBe('/offline')
  })
})
