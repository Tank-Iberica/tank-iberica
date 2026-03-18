import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const COMPONENT = readFileSync(resolve(ROOT, 'app/components/ui/OfflineBanner.vue'), 'utf-8')
const LAYOUT = readFileSync(resolve(ROOT, 'app/layouts/default.vue'), 'utf-8')

describe('OfflineBanner', () => {
  describe('Connectivity detection', () => {
    it('uses useOfflineSync composable', () => {
      expect(COMPONENT).toContain('useOfflineSync()')
    })

    it('shows banner when offline', () => {
      expect(COMPONENT).toContain('!isOnline.value')
    })

    it('only runs on client side', () => {
      expect(COMPONENT).toContain('import.meta.client')
    })
  })

  describe('Accessibility', () => {
    it('has role="alert"', () => {
      expect(COMPONENT).toContain('role="alert"')
    })

    it('has aria-live="assertive"', () => {
      expect(COMPONENT).toContain('aria-live="assertive"')
    })

    it('SVG icon is aria-hidden', () => {
      expect(COMPONENT).toContain('aria-hidden="true"')
    })
  })

  describe('Content', () => {
    it('uses i18n for offline message', () => {
      expect(COMPONENT).toContain("$t('common.offlineBanner')")
    })

    it('shows pending count for offline queue', () => {
      expect(COMPONENT).toContain('pendingCount > 0')
      expect(COMPONENT).toContain("$t('common.offlinePending'")
    })
  })

  describe('Transition', () => {
    it('uses Vue Transition', () => {
      expect(COMPONENT).toContain('<Transition name="offline-banner">')
    })

    it('slides up from bottom', () => {
      expect(COMPONENT).toContain('translateY(100%)')
    })

    it('respects prefers-reduced-motion', () => {
      expect(COMPONENT).toContain('@media (prefers-reduced-motion: reduce)')
      expect(COMPONENT).toContain('transition: none')
    })
  })

  describe('Positioning', () => {
    it('is fixed at bottom of viewport', () => {
      expect(COMPONENT).toContain('position: fixed')
      expect(COMPONENT).toContain('bottom: 0')
    })

    it('has high z-index', () => {
      expect(COMPONENT).toContain('z-index: 9999')
    })
  })

  describe('Integration', () => {
    it('is included in default layout', () => {
      expect(LAYOUT).toContain('OfflineBanner')
    })
  })
})
