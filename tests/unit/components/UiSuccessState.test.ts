import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const COMPONENT = readFileSync(resolve(ROOT, 'app/components/ui/SuccessState.vue'), 'utf-8')

describe('UiSuccessState', () => {
  describe('Props', () => {
    it('has show prop (boolean)', () => {
      expect(COMPONENT).toContain('show: boolean')
    })

    it('has message prop (string)', () => {
      expect(COMPONENT).toContain('message: string')
    })

    it('has actions prop (SuccessAction[])', () => {
      expect(COMPONENT).toContain('actions?: SuccessAction[]')
    })
  })

  describe('SuccessAction interface', () => {
    it('has label field', () => {
      expect(COMPONENT).toContain('label: string')
    })

    it('supports navigation with to field', () => {
      expect(COMPONENT).toContain('to?: string')
    })

    it('supports click handler', () => {
      expect(COMPONENT).toContain('onClick?: () => void')
    })

    it('supports primary/secondary variant', () => {
      expect(COMPONENT).toContain("variant?: 'primary' | 'secondary'")
    })
  })

  describe('Conditional rendering', () => {
    it('renders only when show is true', () => {
      expect(COMPONENT).toContain('v-if="show"')
    })

    it('uses Vue Transition', () => {
      expect(COMPONENT).toContain('<Transition name="success-state">')
    })
  })

  describe('Accessibility', () => {
    it('has role="status"', () => {
      expect(COMPONENT).toContain('role="status"')
    })

    it('has aria-live="polite"', () => {
      expect(COMPONENT).toContain('aria-live="polite"')
    })

    it('buttons meet touch target min-height (2.75rem)', () => {
      expect(COMPONENT).toContain('min-height: 2.75rem')
    })
  })

  describe('Actions rendering', () => {
    it('renders NuxtLink for actions with to', () => {
      expect(COMPONENT).toContain('v-if="action.to"')
      expect(COMPONENT).toContain('<NuxtLink')
      expect(COMPONENT).toContain(':to="action.to"')
    })

    it('renders button for actions with onClick', () => {
      expect(COMPONENT).toContain('v-else')
      expect(COMPONENT).toContain('action.onClick?.()')
    })

    it('applies variant classes', () => {
      expect(COMPONENT).toContain('success-state__btn--primary')
      expect(COMPONENT).toContain('success-state__btn--secondary')
    })
  })

  describe('Animated checkmark', () => {
    it('uses UiSuccessCheckmark subcomponent', () => {
      expect(COMPONENT).toContain('<UiSuccessCheckmark')
    })

    it('SuccessCheckmark component exists', () => {
      expect(existsSync(resolve(ROOT, 'app/components/ui/SuccessCheckmark.vue'))).toBe(true)
    })
  })

  describe('Transition CSS', () => {
    it('has enter transition', () => {
      expect(COMPONENT).toContain('.success-state-enter-active')
      expect(COMPONENT).toContain('.success-state-enter-from')
    })

    it('enter-from includes opacity and transform', () => {
      expect(COMPONENT).toContain('opacity: 0')
      expect(COMPONENT).toContain('translateY')
    })
  })
})
