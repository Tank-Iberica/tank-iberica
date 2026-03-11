/**
 * Tests for app/components/vehicle/VerificationDisclaimer.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import VerificationDisclaimer from '../../../app/components/vehicle/VerificationDisclaimer.vue'

describe('VerificationDisclaimer', () => {
  const factory = () =>
    shallowMount(VerificationDisclaimer, {
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders wrapper', () => {
    expect(factory().find('.verification-disclaimer').exists()).toBe(true)
  })

  it('shows disclaimer text', () => {
    expect(factory().find('.disclaimer-text').text()).toBe('verification.kmScore.disclaimer')
  })
})
