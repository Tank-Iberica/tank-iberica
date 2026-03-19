import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')

const MODALS = [
  'app/components/modals/AuthModal.vue',
  'app/components/modals/DemandModal.vue',
  'app/components/modals/ReportModal.vue',
  'app/components/modals/SubscribeModal.vue',
  'app/components/modals/AdvertiseModal.vue',
  'app/components/modals/SoldModal.vue',
  'app/components/modals/DevModal.vue',
  'app/components/ui/ConfirmModal.vue',
  'app/components/ui/ExportModal.vue',
  'app/components/vehicle/ContactSellerModal.vue',
]

const FOCUS_TRAP = readFileSync(resolve(ROOT, 'app/composables/useFocusTrap.ts'), 'utf-8')

describe('Focus trap in all modals', () => {
  for (const modalPath of MODALS) {
    const name = modalPath.split('/').pop()!.replace('.vue', '')

    describe(name, () => {
      const content = readFileSync(resolve(ROOT, modalPath), 'utf-8')

      it('uses useFocusTrap composable', () => {
        expect(content).toContain('useFocusTrap()')
      })

      it('has ref on container for focus trap', () => {
        // Check for ref binding on modal container (various names: modalRef, dialogRef, panelRef)
        expect(content).toMatch(/ref="(modalRef|dialogRef|panelRef|containerRef)"/i)
      })

      it('activates focus trap when opening', () => {
        expect(content).toContain('activateTrap')
      })

      it('deactivates focus trap when closing', () => {
        expect(content).toContain('deactivateTrap')
      })
    })
  }

  describe('useFocusTrap composable', () => {
    it('targets focusable elements (buttons, inputs, links, selects, textareas)', () => {
      expect(FOCUS_TRAP).toContain('a[href]')
      expect(FOCUS_TRAP).toContain('button:not([disabled])')
      expect(FOCUS_TRAP).toContain('input:not([disabled])')
      expect(FOCUS_TRAP).toContain('select:not([disabled])')
      expect(FOCUS_TRAP).toContain('textarea:not([disabled])')
    })

    it('handles Tab key for forward navigation', () => {
      expect(FOCUS_TRAP).toContain("e.key !== 'Tab'")
    })

    it('handles Shift+Tab for backward navigation', () => {
      expect(FOCUS_TRAP).toContain('e.shiftKey')
    })

    it('wraps focus from last to first element', () => {
      expect(FOCUS_TRAP).toContain('document.activeElement === last')
      expect(FOCUS_TRAP).toContain('first.focus()')
    })

    it('wraps focus from first to last element on Shift+Tab', () => {
      expect(FOCUS_TRAP).toContain('document.activeElement === first')
      expect(FOCUS_TRAP).toContain('last.focus()')
    })

    it('restores focus to previously focused element on deactivate', () => {
      expect(FOCUS_TRAP).toContain('previouslyFocused')
      expect(FOCUS_TRAP).toContain('previouslyFocused.focus')
    })

    it('cleans up on unmount', () => {
      expect(FOCUS_TRAP).toContain('onUnmounted(deactivate)')
    })
  })
})
