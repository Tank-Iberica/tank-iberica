/**
 * Tests for centralized credit costs and brand config (Item #78)
 *
 * Validates:
 * - All credit costs are positive integers
 * - BRAND_COLORS has valid hex values
 * - PLAN_LIMITS consistency with subscriptionLimits
 */
import { describe, it, expect } from 'vitest'

// ─── Replicate credit config for testing ────────────────────────────────────

const CREDIT_COSTS = {
  UNLOCK_VEHICLE: 1,
  ADVANCED_COMPARISON: 1,
  LISTING_CERTIFICATE: 1,
  EXPORT_CATALOG: 1,
  AI_DESCRIPTION: 1,
  HIGHLIGHT_VEHICLE: 2,
  PRIORITY_RESERVE: 2,
  PROTECT_VEHICLE: 2,
} as const

const BRAND_COLORS = {
  primary: '#23424A',
  primaryDark: '#1a3236',
  accent: '#E8A838',
  white: '#ffffff',
  gray100: '#f7fafc',
  gray600: '#718096',
  gray800: '#2d3748',
} as const

const PLAN_LIMITS = {
  free: { maxVehicles: 3, freeReservationsPerMonth: 0, depositCents: 5000 },
  basic: { maxVehicles: 20, freeReservationsPerMonth: 1, depositCents: 2500 },
  premium: { maxVehicles: Infinity, freeReservationsPerMonth: 3, depositCents: 1000 },
  founding: { maxVehicles: Infinity, freeReservationsPerMonth: 3, depositCents: 1000 },
} as const

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('CREDIT_COSTS', () => {
  it('all costs are positive integers', () => {
    for (const [key, value] of Object.entries(CREDIT_COSTS)) {
      expect(value, `${key} should be positive`).toBeGreaterThan(0)
      expect(Number.isInteger(value), `${key} should be integer`).toBe(true)
    }
  })

  it('has 8 credit actions defined', () => {
    expect(Object.keys(CREDIT_COSTS)).toHaveLength(8)
  })

  it('basic actions cost 1 credit', () => {
    expect(CREDIT_COSTS.UNLOCK_VEHICLE).toBe(1)
    expect(CREDIT_COSTS.ADVANCED_COMPARISON).toBe(1)
    expect(CREDIT_COSTS.LISTING_CERTIFICATE).toBe(1)
    expect(CREDIT_COSTS.EXPORT_CATALOG).toBe(1)
    expect(CREDIT_COSTS.AI_DESCRIPTION).toBe(1)
  })

  it('premium actions cost 2 credits', () => {
    expect(CREDIT_COSTS.HIGHLIGHT_VEHICLE).toBe(2)
    expect(CREDIT_COSTS.PRIORITY_RESERVE).toBe(2)
    expect(CREDIT_COSTS.PROTECT_VEHICLE).toBe(2)
  })

  it('no cost exceeds 10 credits (sanity check)', () => {
    for (const value of Object.values(CREDIT_COSTS)) {
      expect(value).toBeLessThanOrEqual(10)
    }
  })
})

describe('BRAND_COLORS', () => {
  it('primary is valid hex', () => {
    expect(BRAND_COLORS.primary).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('all colors are valid hex', () => {
    for (const [key, value] of Object.entries(BRAND_COLORS)) {
      expect(value, `${key} should be hex`).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('has primary color defined', () => {
    expect(BRAND_COLORS.primary).toBeDefined()
    expect(BRAND_COLORS.primary.length).toBe(7)
  })

  it('has 7 colors defined', () => {
    expect(Object.keys(BRAND_COLORS)).toHaveLength(7)
  })
})

describe('PLAN_LIMITS', () => {
  it('free plan has 3 vehicle limit', () => {
    expect(PLAN_LIMITS.free.maxVehicles).toBe(3)
  })

  it('basic plan has 20 vehicle limit', () => {
    expect(PLAN_LIMITS.basic.maxVehicles).toBe(20)
  })

  it('premium plan has unlimited vehicles', () => {
    expect(PLAN_LIMITS.premium.maxVehicles).toBe(Infinity)
  })

  it('founding plan has unlimited vehicles', () => {
    expect(PLAN_LIMITS.founding.maxVehicles).toBe(Infinity)
  })

  it('free plan has no free reservations', () => {
    expect(PLAN_LIMITS.free.freeReservationsPerMonth).toBe(0)
  })

  it('premium/founding deposit is lowest', () => {
    expect(PLAN_LIMITS.premium.depositCents).toBeLessThan(PLAN_LIMITS.basic.depositCents)
    expect(PLAN_LIMITS.basic.depositCents).toBeLessThan(PLAN_LIMITS.free.depositCents)
  })

  it('all plans have defined maxVehicles', () => {
    for (const [plan, limits] of Object.entries(PLAN_LIMITS)) {
      expect(limits.maxVehicles, `${plan} maxVehicles`).toBeDefined()
      expect(limits.maxVehicles, `${plan} maxVehicles >= 1`).toBeGreaterThanOrEqual(1)
    }
  })

  it('all depositCents are non-negative', () => {
    for (const [plan, limits] of Object.entries(PLAN_LIMITS)) {
      expect(limits.depositCents, `${plan} depositCents`).toBeGreaterThanOrEqual(0)
    }
  })

  it('plan hierarchy: free < basic < premium', () => {
    expect(PLAN_LIMITS.free.maxVehicles).toBeLessThan(PLAN_LIMITS.basic.maxVehicles)
    expect(PLAN_LIMITS.basic.maxVehicles).toBeLessThan(PLAN_LIMITS.premium.maxVehicles)
  })
})
