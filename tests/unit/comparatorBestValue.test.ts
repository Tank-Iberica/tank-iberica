import { describe, it, expect } from 'vitest'
import { getBestVehicleIds } from '../../app/composables/usePerfilComparador'

// ---------------------------------------------------------------------------
// Unit tests for comparator best-value highlighting logic
// ---------------------------------------------------------------------------

const vehicles = [
  { id: 'v1' },
  { id: 'v2' },
  { id: 'v3' },
]

// ---- price (lower is better) -----------------------------------------------

describe('getBestVehicleIds — price (lower is better)', () => {
  it('returns the vehicle with the lowest price', () => {
    const best = getBestVehicleIds(vehicles, [50000, 30000, 45000], 'price')
    expect(best.has('v2')).toBe(true)
    expect(best.has('v1')).toBe(false)
    expect(best.has('v3')).toBe(false)
  })

  it('returns multiple vehicles if tied', () => {
    const best = getBestVehicleIds(vehicles, [30000, 30000, 45000], 'price')
    expect(best.has('v1')).toBe(true)
    expect(best.has('v2')).toBe(true)
    expect(best.has('v3')).toBe(false)
  })

  it('ignores null values', () => {
    const best = getBestVehicleIds(vehicles, [null, 25000, null], 'price')
    expect(best.has('v2')).toBe(true)
    expect(best.has('v1')).toBe(false)
  })

  it('ignores zero values (invalid price)', () => {
    const best = getBestVehicleIds(vehicles, [0, 30000, 25000], 'price')
    expect(best.has('v3')).toBe(true)
    expect(best.has('v1')).toBe(false)
  })

  it('returns empty set when all values are null', () => {
    const best = getBestVehicleIds(vehicles, [null, null, null], 'price')
    expect(best.size).toBe(0)
  })

  it('returns empty set with only one vehicle', () => {
    const best = getBestVehicleIds([{ id: 'v1' }], [50000], 'price')
    expect(best.size).toBe(0)
  })
})

// ---- km (lower is better) --------------------------------------------------

describe('getBestVehicleIds — km (lower is better)', () => {
  it('returns vehicle with lowest km', () => {
    const best = getBestVehicleIds(vehicles, [150000, 80000, 120000], 'km')
    expect(best.has('v2')).toBe(true)
    expect(best.size).toBe(1)
  })

  it('handles all equal km', () => {
    const best = getBestVehicleIds(vehicles, [100000, 100000, 100000], 'km')
    expect(best.size).toBe(3)
  })
})

// ---- year (higher is better) -----------------------------------------------

describe('getBestVehicleIds — year (higher is better)', () => {
  it('returns the newest vehicle (highest year)', () => {
    const best = getBestVehicleIds(vehicles, [2018, 2022, 2020], 'year')
    expect(best.has('v2')).toBe(true)
    expect(best.has('v1')).toBe(false)
    expect(best.has('v3')).toBe(false)
  })

  it('returns tied vehicles when years match', () => {
    const best = getBestVehicleIds(vehicles, [2022, 2022, 2019], 'year')
    expect(best.has('v1')).toBe(true)
    expect(best.has('v2')).toBe(true)
    expect(best.has('v3')).toBe(false)
  })

  it('handles null years gracefully', () => {
    const best = getBestVehicleIds(vehicles, [null, 2021, null], 'year')
    expect(best.has('v2')).toBe(true)
    expect(best.size).toBe(1)
  })
})

// ---- non-comparable fields -------------------------------------------------

describe('getBestVehicleIds — non-comparable fields', () => {
  it('returns empty set for brand (string field)', () => {
    // Values for string fields won't be numbers — irrelevant input
    const best = getBestVehicleIds(vehicles, [null, null, null], 'brand')
    expect(best.size).toBe(0)
  })

  it('returns empty set for location (string field)', () => {
    const best = getBestVehicleIds(vehicles, [null, null, null], 'location')
    expect(best.size).toBe(0)
  })

  it('returns empty set for category (string field)', () => {
    const best = getBestVehicleIds(vehicles, [null, null, null], 'category')
    expect(best.size).toBe(0)
  })

  it('returns empty set for is_verified (boolean field)', () => {
    const best = getBestVehicleIds(vehicles, [null, null, null], 'is_verified')
    expect(best.size).toBe(0)
  })

  it('returns empty set for unknown key', () => {
    const best = getBestVehicleIds(vehicles, [100, 200, 300], 'unknown_field')
    expect(best.size).toBe(0)
  })
})
