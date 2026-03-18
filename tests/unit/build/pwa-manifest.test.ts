import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Verifies PWA manifest configuration for deep linking and scope.
 */

const ROOT = resolve(__dirname, '../../..')
const nuxtConfig = readFileSync(resolve(ROOT, 'nuxt.config.ts'), 'utf-8')

describe('PWA manifest deep linking', () => {
  it('manifest has scope set to root', () => {
    expect(nuxtConfig).toContain("scope: '/'")
  })

  it('manifest has start_url', () => {
    expect(nuxtConfig).toContain("start_url: '/'")
  })

  it('manifest has display: standalone', () => {
    expect(nuxtConfig).toContain("display: 'standalone'")
  })

  it('manifest has app id', () => {
    expect(nuxtConfig).toContain("id: '/'")
  })

  it('manifest has required icons', () => {
    expect(nuxtConfig).toContain("'/icon-192x192.png'")
    expect(nuxtConfig).toContain("'/icon-512x512.png'")
  })

  it('manifest has maskable icon', () => {
    expect(nuxtConfig).toContain("purpose: 'maskable'")
  })

  it('manifest has theme and background color', () => {
    expect(nuxtConfig).toContain("theme_color: '#23424A'")
    expect(nuxtConfig).toContain("background_color: '#F3F4F6'")
  })

  it('workbox has navigateFallback for offline', () => {
    expect(nuxtConfig).toContain("navigateFallback: '/offline'")
  })
})
