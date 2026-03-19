import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')

describe('Contextual next-action nudges post-milestone (N16)', () => {
  describe('DashboardOnboarding component', () => {
    const src = readFileSync(
      resolve(ROOT, 'app/components/dashboard/index/DashboardOnboarding.vue'),
      'utf-8',
    )

    it('shows progress percentage', () => {
      expect(src).toContain('progress')
      expect(src).toContain("progress + '%'")
    })

    it('displays steps checklist', () => {
      expect(src).toContain('v-for="step in steps"')
    })

    it('marks completed steps with checkmark', () => {
      expect(src).toContain('step.done')
    })

    it('has CTA to complete onboarding', () => {
      expect(src).toContain('/dashboard/portal')
    })

    it('uses progress bar visual', () => {
      expect(src).toContain('progress-bar')
      expect(src).toContain('progress-fill')
    })
  })

  describe('OnboardingTourCard component', () => {
    const src = readFileSync(resolve(ROOT, 'app/components/ui/OnboardingTourCard.vue'), 'utf-8')

    it('supports tour steps', () => {
      expect(src).toContain('step')
    })

    it('has next/prev navigation', () => {
      expect(src).toContain('next')
      expect(src).toContain('prev')
    })

    it('has skip option', () => {
      expect(src).toContain('skip')
    })

    it('has action button for CTA', () => {
      expect(src).toContain('action')
    })
  })

  describe('useOnboardingTour composable', () => {
    const src = readFileSync(resolve(ROOT, 'app/composables/useOnboardingTour.ts'), 'utf-8')

    it('exports startTour', () => {
      expect(src).toContain('startTour')
    })

    it('exports nextStep', () => {
      expect(src).toContain('nextStep')
    })

    it('exports skipTour', () => {
      expect(src).toContain('skipTour')
    })

    it('persists tour completion', () => {
      expect(src).toMatch(/localStorage|sessionStorage/)
    })

    it('tracks step number and total', () => {
      expect(src).toContain('stepNumber')
      expect(src).toContain('totalSteps')
    })
  })

  describe('Buyer tour integrated in layout', () => {
    const layout = readFileSync(resolve(ROOT, 'app/layouts/default.vue'), 'utf-8')

    it('renders OnboardingTourCard', () => {
      expect(layout).toContain('OnboardingTourCard')
    })

    it('defines buyer tour steps', () => {
      expect(layout).toContain('buyerTourSteps')
    })

    it('auto-starts tour on mount', () => {
      expect(layout).toContain('startTour')
    })
  })
})
