/**
 * Tests for /api/admin/onboarding-velocity (Item #48)
 * Measures time from dealer registration to first vehicle publication.
 *
 * The endpoint:
 * 1. Tries RPC `calculate_onboarding_velocity` first
 * 2. Falls back to manual calculation from vehicles + users tables
 * 3. Returns avgHours, medianHours, within24h%, totalDealers
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock helpers ────────────────────────────────────────────────────────────

interface VelocityRow {
  user_id: string
  created_at: string
  users: { created_at: string }
}

function createMockRows(dealers: Array<{ registeredHoursAgo: number; firstPublishHoursAgo: number }>): VelocityRow[] {
  const now = Date.now()
  return dealers.map((d, i) => ({
    user_id: `user-${i}`,
    created_at: new Date(now - d.firstPublishHoursAgo * 3600_000).toISOString(),
    users: { created_at: new Date(now - d.registeredHoursAgo * 3600_000).toISOString() },
  }))
}

/**
 * Replicate the fallback calculation logic from the endpoint.
 * This tests the algorithm independently of Supabase.
 */
function calculateVelocity(rows: VelocityRow[]) {
  const userFirstVehicle = new Map<string, { registered: string; firstPublish: string }>()

  for (const row of rows) {
    if (!userFirstVehicle.has(row.user_id)) {
      userFirstVehicle.set(row.user_id, {
        registered: row.users.created_at,
        firstPublish: row.created_at,
      })
    }
  }

  const deltas: number[] = []
  for (const { registered, firstPublish } of userFirstVehicle.values()) {
    const deltaHours =
      (new Date(firstPublish).getTime() - new Date(registered).getTime()) / (1000 * 60 * 60)
    if (deltaHours >= 0) deltas.push(deltaHours)
  }

  const avgHours = deltas.length ? Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length) : 0
  const sortedDeltas = [...deltas].sort((a, b) => a - b)
  const medianHours = deltas.length ? Math.round(sortedDeltas[Math.floor(deltas.length / 2)]!) : 0

  return {
    totalDealers: userFirstVehicle.size,
    avgHours,
    medianHours,
    within24h: deltas.length
      ? Math.round((deltas.filter((d) => d <= 24).length / deltas.length) * 100)
      : 0,
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('/api/admin/onboarding-velocity', () => {
  describe('Velocity calculation algorithm', () => {
    it('calculates correct avg for single dealer', () => {
      const rows = createMockRows([{ registeredHoursAgo: 48, firstPublishHoursAgo: 24 }])
      const result = calculateVelocity(rows)

      expect(result.totalDealers).toBe(1)
      expect(result.avgHours).toBe(24)
      expect(result.medianHours).toBe(24)
      expect(result.within24h).toBe(100)
    })

    it('calculates correct avg for multiple dealers', () => {
      const rows = createMockRows([
        { registeredHoursAgo: 72, firstPublishHoursAgo: 48 },  // 24h
        { registeredHoursAgo: 48, firstPublishHoursAgo: 36 },  // 12h
        { registeredHoursAgo: 96, firstPublishHoursAgo: 48 },  // 48h
      ])
      const result = calculateVelocity(rows)

      expect(result.totalDealers).toBe(3)
      expect(result.avgHours).toBe(28) // (24+12+48)/3 = 28
    })

    it('calculates median correctly for odd count', () => {
      const rows = createMockRows([
        { registeredHoursAgo: 100, firstPublishHoursAgo: 90 },  // 10h
        { registeredHoursAgo: 100, firstPublishHoursAgo: 50 },  // 50h
        { registeredHoursAgo: 100, firstPublishHoursAgo: 70 },  // 30h
      ])
      const result = calculateVelocity(rows)

      // Sorted: [10, 30, 50] → median = 30
      expect(result.medianHours).toBe(30)
    })

    it('calculates within24h percentage', () => {
      const rows = createMockRows([
        { registeredHoursAgo: 48, firstPublishHoursAgo: 36 },  // 12h → within 24h
        { registeredHoursAgo: 48, firstPublishHoursAgo: 24 },  // 24h → within 24h
        { registeredHoursAgo: 96, firstPublishHoursAgo: 48 },  // 48h → NOT within 24h
      ])
      const result = calculateVelocity(rows)

      expect(result.within24h).toBe(67) // 2/3 = 66.67% → rounds to 67
    })

    it('handles empty data', () => {
      const result = calculateVelocity([])

      expect(result.totalDealers).toBe(0)
      expect(result.avgHours).toBe(0)
      expect(result.medianHours).toBe(0)
      expect(result.within24h).toBe(0)
    })

    it('takes only first vehicle per user (dedup)', () => {
      const now = Date.now()
      const rows: VelocityRow[] = [
        {
          user_id: 'user-1',
          created_at: new Date(now - 12 * 3600_000).toISOString(), // first vehicle: 12h ago
          users: { created_at: new Date(now - 48 * 3600_000).toISOString() },
        },
        {
          user_id: 'user-1',
          created_at: new Date(now - 6 * 3600_000).toISOString(), // second vehicle: 6h ago (should be ignored)
          users: { created_at: new Date(now - 48 * 3600_000).toISOString() },
        },
      ]
      const result = calculateVelocity(rows)

      expect(result.totalDealers).toBe(1)
      // Delta = 48h - 12h = 36h (first vehicle, not second)
      expect(result.avgHours).toBe(36)
    })

    it('ignores negative deltas (publish before registration)', () => {
      const rows = createMockRows([
        { registeredHoursAgo: 24, firstPublishHoursAgo: 48 },  // -24h (impossible, ignored)
      ])
      const result = calculateVelocity(rows)

      expect(result.totalDealers).toBe(1)
      expect(result.avgHours).toBe(0) // no valid deltas
      expect(result.within24h).toBe(0)
    })

    it('handles all dealers within 24h', () => {
      const rows = createMockRows([
        { registeredHoursAgo: 25, firstPublishHoursAgo: 24 },   // 1h
        { registeredHoursAgo: 30, firstPublishHoursAgo: 20 },   // 10h
        { registeredHoursAgo: 48, firstPublishHoursAgo: 26 },   // 22h
      ])
      const result = calculateVelocity(rows)

      expect(result.within24h).toBe(100)
    })

    it('handles no dealers within 24h', () => {
      const rows = createMockRows([
        { registeredHoursAgo: 120, firstPublishHoursAgo: 48 },  // 72h
        { registeredHoursAgo: 100, firstPublishHoursAgo: 50 },  // 50h
      ])
      const result = calculateVelocity(rows)

      expect(result.within24h).toBe(0)
    })

    it('rounds hours to integers', () => {
      const rows = createMockRows([
        { registeredHoursAgo: 50, firstPublishHoursAgo: 37 },   // 13h
        { registeredHoursAgo: 40, firstPublishHoursAgo: 30 },   // 10h
      ])
      const result = calculateVelocity(rows)

      expect(Number.isInteger(result.avgHours)).toBe(true)
      expect(Number.isInteger(result.medianHours)).toBe(true)
      expect(Number.isInteger(result.within24h)).toBe(true)
    })
  })

  describe('Return value shape', () => {
    it('returns all required fields', () => {
      const rows = createMockRows([
        { registeredHoursAgo: 48, firstPublishHoursAgo: 24 },
      ])
      const result = calculateVelocity(rows)

      expect(result).toHaveProperty('totalDealers')
      expect(result).toHaveProperty('avgHours')
      expect(result).toHaveProperty('medianHours')
      expect(result).toHaveProperty('within24h')
    })

    it('all values are non-negative', () => {
      const rows = createMockRows([
        { registeredHoursAgo: 72, firstPublishHoursAgo: 48 },
        { registeredHoursAgo: 48, firstPublishHoursAgo: 24 },
      ])
      const result = calculateVelocity(rows)

      expect(result.totalDealers).toBeGreaterThanOrEqual(0)
      expect(result.avgHours).toBeGreaterThanOrEqual(0)
      expect(result.medianHours).toBeGreaterThanOrEqual(0)
      expect(result.within24h).toBeGreaterThanOrEqual(0)
    })

    it('within24h is a percentage (0-100)', () => {
      const rows = createMockRows([
        { registeredHoursAgo: 50, firstPublishHoursAgo: 45 },  // 5h
      ])
      const result = calculateVelocity(rows)

      expect(result.within24h).toBeGreaterThanOrEqual(0)
      expect(result.within24h).toBeLessThanOrEqual(100)
    })
  })

  describe('Edge cases', () => {
    it('handles dealer who publishes instantly (0h delta)', () => {
      const now = Date.now()
      const rows: VelocityRow[] = [{
        user_id: 'user-1',
        created_at: new Date(now).toISOString(),
        users: { created_at: new Date(now).toISOString() },
      }]
      const result = calculateVelocity(rows)

      expect(result.avgHours).toBe(0)
      expect(result.within24h).toBe(100)
    })

    it('handles large number of dealers', () => {
      const rows = createMockRows(
        Array.from({ length: 100 }, (_, i) => ({
          registeredHoursAgo: 200,
          firstPublishHoursAgo: 200 - (i + 1) * 2,
        })),
      )
      const result = calculateVelocity(rows)

      expect(result.totalDealers).toBe(100)
      expect(result.avgHours).toBeGreaterThan(0)
    })
  })
})
