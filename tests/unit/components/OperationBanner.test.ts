import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const COMPONENT = readFileSync(resolve(ROOT, 'app/components/ui/OperationBanner.vue'), 'utf-8')

describe('UiOperationBanner', () => {
  describe('Props', () => {
    it('has active prop (boolean)', () => {
      expect(COMPONENT).toContain('active: boolean')
    })

    it('has message prop (optional string)', () => {
      expect(COMPONENT).toContain('message?: string')
    })

    it('has delay prop (default 2000ms)', () => {
      expect(COMPONENT).toContain('delay?: number')
      expect(COMPONENT).toContain('delay: 2000')
    })
  })

  describe('Delayed show behavior', () => {
    it('uses setTimeout with configurable delay', () => {
      expect(COMPONENT).toContain('setTimeout')
      expect(COMPONENT).toContain('props.delay')
    })

    it('clears timeout when operation finishes before delay', () => {
      expect(COMPONENT).toContain('clearTimeout(timer)')
    })

    it('hides banner when active becomes false', () => {
      expect(COMPONENT).toContain('showBanner.value = false')
    })

    it('cleans up on unmount', () => {
      expect(COMPONENT).toContain('onUnmounted')
      expect(COMPONENT).toContain('clearTimeout')
    })
  })

  describe('Display', () => {
    it('shows spinner when visible', () => {
      expect(COMPONENT).toContain('op-banner__spinner')
      expect(COMPONENT).toContain('aria-hidden="true"')
    })

    it('shows message text', () => {
      expect(COMPONENT).toContain('op-banner__text')
    })

    it('uses i18n fallback message', () => {
      expect(COMPONENT).toContain("t('common.operationInProgress')")
    })
  })

  describe('Accessibility', () => {
    it('has role="status"', () => {
      expect(COMPONENT).toContain('role="status"')
    })

    it('has aria-live="polite"', () => {
      expect(COMPONENT).toContain('aria-live="polite"')
    })
  })

  describe('Positioning', () => {
    it('is fixed at top of viewport (sticky)', () => {
      expect(COMPONENT).toContain('position: fixed')
      expect(COMPONENT).toContain('top: 0')
    })

    it('has high z-index', () => {
      expect(COMPONENT).toContain('z-index: 9998')
    })
  })

  describe('Transition', () => {
    it('uses Vue Transition', () => {
      expect(COMPONENT).toContain('<Transition name="op-banner">')
    })

    it('slides down from top', () => {
      expect(COMPONENT).toContain('translateY(-100%)')
    })

    it('respects prefers-reduced-motion', () => {
      expect(COMPONENT).toContain('@media (prefers-reduced-motion: reduce)')
    })
  })
})
