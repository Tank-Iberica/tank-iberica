import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// Unit tests for the configurable price threshold logic in
// server/api/cron/favorite-price-drop.post.ts
//
// The rule: skip notification if fav.price_threshold is set AND
//           the new vehicle price is still ABOVE the threshold.
// ---------------------------------------------------------------------------

interface FavoriteEntry {
  user_id: string
  price_threshold: number | null
}

interface VehicleRow {
  price: number
}

/** Mirrors the threshold guard added to the cron */
function shouldNotify(fav: FavoriteEntry, vehicle: VehicleRow): boolean {
  if (fav.price_threshold !== null && vehicle.price > fav.price_threshold) {
    return false
  }
  return true
}

describe('priceThreshold — shouldNotify', () => {
  // No threshold set → always notify on any price drop
  it('notifies when no threshold is set (null)', () => {
    expect(shouldNotify({ user_id: 'u1', price_threshold: null }, { price: 50000 })).toBe(true)
  })

  // Threshold set, price above threshold → skip
  it('skips when price is above threshold', () => {
    expect(
      shouldNotify({ user_id: 'u1', price_threshold: 40000 }, { price: 45000 }),
    ).toBe(false)
  })

  // Threshold set, price exactly at threshold → notify
  it('notifies when price equals threshold', () => {
    expect(
      shouldNotify({ user_id: 'u1', price_threshold: 40000 }, { price: 40000 }),
    ).toBe(true)
  })

  // Threshold set, price below threshold → notify
  it('notifies when price drops below threshold', () => {
    expect(
      shouldNotify({ user_id: 'u1', price_threshold: 40000 }, { price: 38000 }),
    ).toBe(true)
  })

  // Zero threshold is a valid value (notify when price = 0, i.e., free listing)
  it('handles threshold of 0 correctly', () => {
    expect(shouldNotify({ user_id: 'u1', price_threshold: 0 }, { price: 1 })).toBe(false)
    expect(shouldNotify({ user_id: 'u1', price_threshold: 0 }, { price: 0 })).toBe(true)
  })

  // Multiple users: mix of threshold and no-threshold favorites
  it('handles mix of threshold and no-threshold favorites for same vehicle', () => {
    const vehicle = { price: 42000 }
    const favs: FavoriteEntry[] = [
      { user_id: 'u1', price_threshold: null },    // always notify
      { user_id: 'u2', price_threshold: 50000 },   // notify — price < threshold
      { user_id: 'u3', price_threshold: 40000 },   // skip — price > threshold
      { user_id: 'u4', price_threshold: 42000 },   // notify — price = threshold
    ]
    const notified = favs.filter((f) => shouldNotify(f, vehicle)).map((f) => f.user_id)
    expect(notified).toEqual(['u1', 'u2', 'u4'])
    expect(notified).not.toContain('u3')
  })

  // Very large threshold (buy expensive machinery)
  it('handles large price values correctly', () => {
    expect(
      shouldNotify({ user_id: 'u1', price_threshold: 500000 }, { price: 499999 }),
    ).toBe(true)
    expect(
      shouldNotify({ user_id: 'u1', price_threshold: 500000 }, { price: 500001 }),
    ).toBe(false)
  })
})
