/**
 * Tests for useListingRenewal — pure functions.
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('~/composables/useListingLifecycle', () => ({
  useListingLifecycle: vi.fn(() => ({
    transition: vi.fn(),
    bulkTransition: vi.fn(),
  })),
  isValidTransition: vi.fn(() => true),
  STATUS_TRANSITIONS: {},
  STATUS_META: {},
}))

import { isRenewable } from '../../app/composables/useListingRenewal'
import type { VehicleStatus } from '../../app/composables/useListingLifecycle'

describe('isRenewable', () => {
  it('expired status is renewable', () => {
    expect(isRenewable('expired')).toBe(true)
  })

  it('paused status is renewable', () => {
    expect(isRenewable('paused')).toBe(true)
  })

  it('draft status is renewable', () => {
    expect(isRenewable('draft')).toBe(true)
  })

  it('published status is not renewable', () => {
    expect(isRenewable('published')).toBe(false)
  })

  it('sold status is not renewable', () => {
    expect(isRenewable('sold')).toBe(false)
  })

  it('archived status is not renewable', () => {
    expect(isRenewable('archived')).toBe(false)
  })

  it('rented status is not renewable', () => {
    expect(isRenewable('rented')).toBe(false)
  })

  it('maintenance status is not renewable', () => {
    expect(isRenewable('maintenance')).toBe(false)
  })
})
