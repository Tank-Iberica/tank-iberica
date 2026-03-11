/**
 * Tests for app/components/ui/PasswordStrength.vue
 * Score logic:
 *   >= 8 chars  → +1
 *   >= 12 chars → +1
 *   has uppercase → +1
 *   has digit → +1
 *   has symbol → +1
 * weak: score <= 2 | medium: score <= 3 | strong: score >= 4+
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { ref, computed } from 'vue'

beforeAll(() => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k }))
})

import PasswordStrength from '../../../app/components/ui/PasswordStrength.vue'

describe('UiPasswordStrength', () => {
  const factory = (password: string) =>
    shallowMount(PasswordStrength, {
      props: { password },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders nothing when password is empty', () => {
    const w = factory('')
    expect(w.find('.password-strength').exists()).toBe(false)
  })

  it('shows strength meter when password has content', () => {
    const w = factory('abc')
    expect(w.find('.password-strength').exists()).toBe(true)
  })

  it('shows weak for short simple password (score 0)', () => {
    // 'abc' → no criteria met → score 0 → weak
    const w = factory('abc')
    expect(w.find('.label--weak').exists()).toBe(true)
  })

  it('shows weak for >= 8 chars lowercase only (score 1)', () => {
    // 'abcdefgh' → length >= 8 (+1) = score 1 → weak
    const w = factory('abcdefgh')
    expect(w.find('.label--weak').exists()).toBe(true)
  })

  it('shows weak for >= 8 chars + uppercase (score 2)', () => {
    // 'Abcdefgh' → length >= 8 (+1) + uppercase (+1) = score 2 → weak
    const w = factory('Abcdefgh')
    expect(w.find('.label--weak').exists()).toBe(true)
  })

  it('shows medium for score 3', () => {
    // 'Abcdef1h' → >= 8 (+1) + uppercase (+1) + digit (+1) = 3 → medium
    const w = factory('Abcdef1h')
    expect(w.find('.label--medium').exists()).toBe(true)
  })

  it('shows strong for score >= 4', () => {
    // 'Abcdef1!' → >= 8 (+1) + uppercase (+1) + digit (+1) + symbol (+1) = 4 → strong (> 3)
    const w = factory('Abcdef1!')
    expect(w.find('.label--strong').exists()).toBe(true)
  })

  it('shows strong for all 5 criteria met', () => {
    // 'Abcdefghij1!' → >= 8 (+1) + >= 12 (+1) + uppercase (+1) + digit (+1) + symbol (+1) = 5
    const w = factory('Abcdefghij1!')
    expect(w.find('.label--strong').exists()).toBe(true)
  })

  it('has role=status for accessibility', () => {
    const w = factory('test')
    expect(w.find('[role="status"]').exists()).toBe(true)
  })

  it('has aria-live=polite', () => {
    const w = factory('test')
    expect(w.find('[aria-live="polite"]').exists()).toBe(true)
  })

  it('renders 3 strength bars', () => {
    const w = factory('test')
    expect(w.findAll('.strength-bar').length).toBe(3)
  })

  it('no bars active for score 0 (weak with no criteria)', () => {
    // 'abc' → score 0 → no bars active (bars need score >= 1, >= 3, >= 5)
    const w = factory('abc')
    const bars = w.findAll('.strength-bar')
    expect(bars[0].classes()).not.toContain('active')
    expect(bars[1].classes()).not.toContain('active')
    expect(bars[2].classes()).not.toContain('active')
  })

  it('first bar active for score 1', () => {
    // 'abcdefgh' → score 1 → first bar active (score >= 1)
    const w = factory('abcdefgh')
    const bars = w.findAll('.strength-bar')
    expect(bars[0].classes()).toContain('active')
    expect(bars[1].classes()).not.toContain('active')
    expect(bars[2].classes()).not.toContain('active')
  })

  it('first two bars active for score 3', () => {
    // 'Abcdef1h' → score 3 → bar1 (>=1) and bar2 (>=3) active
    const w = factory('Abcdef1h')
    const bars = w.findAll('.strength-bar')
    expect(bars[0].classes()).toContain('active')
    expect(bars[1].classes()).toContain('active')
    expect(bars[2].classes()).not.toContain('active')
  })

  it('all bars active for score 5', () => {
    // 'Abcdefghij1!' → score 5 → all bars active
    const w = factory('Abcdefghij1!')
    const bars = w.findAll('.strength-bar')
    bars.forEach(bar => expect(bar.classes()).toContain('active'))
  })
})
