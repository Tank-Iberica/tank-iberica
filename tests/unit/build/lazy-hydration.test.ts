import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const LAYOUT = readFileSync(resolve(ROOT, 'app/layouts/default.vue'), 'utf-8')

describe('Lazy hydration below-the-fold', () => {
  describe('Footer', () => {
    it('uses Lazy prefix for deferred hydration', () => {
      expect(LAYOUT).toContain('<LazyLayoutAppFooter')
    })

    it('does NOT load footer eagerly', () => {
      expect(LAYOUT).not.toMatch(/<LayoutAppFooter\s/)
    })
  })

  describe('Modals (lazy loaded)', () => {
    it('AuthModal is lazy', () => {
      expect(LAYOUT).toContain('<LazyModalsAuthModal')
    })

    it('AdvertiseModal is lazy', () => {
      expect(LAYOUT).toContain('<LazyModalsAdvertiseModal')
    })

    it('DemandModal is lazy', () => {
      expect(LAYOUT).toContain('<LazyModalsDemandModal')
    })

    it('SubscribeModal is lazy', () => {
      expect(LAYOUT).toContain('<LazyModalsSubscribeModal')
    })

    it('UserPanel is lazy', () => {
      expect(LAYOUT).toContain('<LazyUserPanel')
    })
  })

  describe('Other below-fold components', () => {
    it('CookieBanner is lazy', () => {
      expect(LAYOUT).toContain('<LazyLayoutCookieBanner')
    })

    it('AccessibilityFAB is lazy', () => {
      expect(LAYOUT).toContain('<LazyAccessibilityFAB')
    })

    it('ScrollToTop is lazy', () => {
      expect(LAYOUT).toContain('<LazyUiScrollToTop')
    })

    it('OfflineBanner is lazy', () => {
      expect(LAYOUT).toContain('<LazyUiOfflineBanner')
    })
  })

  describe('Above-fold components are NOT lazy', () => {
    it('main content slot renders immediately', () => {
      expect(LAYOUT).toContain('<slot />')
    })
  })
})
