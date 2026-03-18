import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const COMPONENT = readFileSync(resolve(ROOT, 'app/components/ui/SubmitButton.vue'), 'utf-8')

describe('UiSubmitButton', () => {
  describe('Props interface', () => {
    it('has loading prop (boolean, default false)', () => {
      expect(COMPONENT).toContain('loading?: boolean')
      expect(COMPONENT).toContain('loading: false')
    })

    it('has disabled prop (boolean, default false)', () => {
      expect(COMPONENT).toContain('disabled?: boolean')
      expect(COMPONENT).toContain('disabled: false')
    })

    it('has label prop for idle text', () => {
      expect(COMPONENT).toContain('label?: string')
    })

    it('has loadingLabel prop for loading text', () => {
      expect(COMPONENT).toContain('loadingLabel?: string')
    })

    it('has variant prop with 4 options', () => {
      expect(COMPONENT).toContain("'primary'")
      expect(COMPONENT).toContain("'secondary'")
      expect(COMPONENT).toContain("'outline'")
      expect(COMPONENT).toContain("'danger'")
    })

    it('has type prop (button | submit)', () => {
      expect(COMPONENT).toContain("type?: 'button' | 'submit'")
    })
  })

  describe('Loading state', () => {
    it('is disabled when loading', () => {
      expect(COMPONENT).toContain(':disabled="loading || disabled"')
    })

    it('has aria-busy when loading', () => {
      expect(COMPONENT).toContain(':aria-busy="loading"')
    })

    it('shows spinner when loading', () => {
      expect(COMPONENT).toContain('v-if="loading"')
      expect(COMPONENT).toContain('submit-btn__spinner')
    })

    it('spinner is aria-hidden', () => {
      expect(COMPONENT).toContain('aria-hidden="true"')
    })

    it('shows loadingLabel when loading and loadingLabel provided', () => {
      expect(COMPONENT).toContain('loading ? loadingLabel || label')
    })
  })

  describe('CSS & Variants', () => {
    it('applies variant class dynamically', () => {
      expect(COMPONENT).toContain('`submit-btn--${variant}`')
    })

    it('has primary variant styles', () => {
      expect(COMPONENT).toContain('.submit-btn--primary')
      expect(COMPONENT).toContain('var(--color-primary)')
    })

    it('has secondary variant styles', () => {
      expect(COMPONENT).toContain('.submit-btn--secondary')
    })

    it('has outline variant styles', () => {
      expect(COMPONENT).toContain('.submit-btn--outline')
    })

    it('has danger variant styles', () => {
      expect(COMPONENT).toContain('.submit-btn--danger')
      expect(COMPONENT).toContain('var(--color-error)')
    })

    it('has disabled styling (reduced opacity, not-allowed cursor)', () => {
      expect(COMPONENT).toContain('.submit-btn:disabled')
      expect(COMPONENT).toContain('cursor: not-allowed')
    })

    it('has spinner animation', () => {
      expect(COMPONENT).toContain('@keyframes submit-spin')
      expect(COMPONENT).toContain('animation: submit-spin')
    })
  })

  describe('Accessibility', () => {
    it('uses semantic button element', () => {
      expect(COMPONENT).toContain('<button')
      expect(COMPONENT).toContain(':type="type"')
    })

    it('emits click event', () => {
      expect(COMPONENT).toContain("click: [event: MouseEvent]")
      expect(COMPONENT).toContain('@click="$emit(\'click\', $event)"')
    })

    it('min-height meets touch target guidelines (44px = 2.75rem)', () => {
      expect(COMPONENT).toContain('min-height: 2.75rem')
    })

    it('hover styles only apply on hover-capable devices', () => {
      const hoverMediaQueries = COMPONENT.match(/@media \(hover: hover\)/g)
      expect(hoverMediaQueries).not.toBeNull()
      expect(hoverMediaQueries!.length).toBeGreaterThanOrEqual(3)
    })
  })
})
