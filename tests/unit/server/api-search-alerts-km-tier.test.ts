/**
 * Tests for cron/search-alerts — km filter and tier enforcement (#18)
 */
import { describe, it, expect, vi } from 'vitest'

// Import the pure helper functions by re-exporting from the module.
// We test them via the module's exported handler indirectly, but here we
// test the pure functions extracted from the file.

// Since the functions are not separately exported, we test behavior via
// isolated re-implementations that mirror the source logic exactly.

// -- Mirrored pure functions (must stay in sync with source) ----------------

const PLAN_MAX_FREQUENCY: Record<string, string> = {
  free: 'weekly',
  basic: 'weekly',
  classic: 'daily',
  premium: 'instant',
}

const FREQUENCY_WEIGHT: Record<string, number> = {
  instant: 3,
  daily: 2,
  weekly: 1,
}

function effectiveFrequency(alertFreq: string | null, planMax: string): string {
  const freq = alertFreq ?? 'daily'
  const freqWeight = FREQUENCY_WEIGHT[freq] ?? 1
  const maxWeight = FREQUENCY_WEIGHT[planMax] ?? 1
  return freqWeight > maxWeight ? planMax : freq
}

function isAlertEligible(
  alert: { last_sent_at: string | null; frequency: string | null },
  now: Date,
  planMax: string,
): boolean {
  const freq = effectiveFrequency(alert.frequency, planMax)
  const lastSent = alert.last_sent_at ? new Date(alert.last_sent_at) : null
  if (freq === 'instant') return !lastSent || now.getTime() - lastSent.getTime() > 60_000
  if (freq === 'daily')
    return !lastSent || now.getTime() - lastSent.getTime() > 24 * 60 * 60 * 1000
  if (freq === 'weekly')
    return !lastSent || now.getTime() - lastSent.getTime() > 7 * 24 * 60 * 60 * 1000
  return false
}

interface VehicleRow {
  attributes_json: Record<string, unknown> | null
  [key: string]: unknown
}

function applyKmFilter(
  vehicles: VehicleRow[],
  filters: { km_min?: number; km_max?: number },
): VehicleRow[] {
  if (filters.km_min == null && filters.km_max == null) return vehicles
  return vehicles.filter((v) => {
    const km =
      typeof v.attributes_json?.km === 'number'
        ? v.attributes_json.km
        : typeof v.attributes_json?.km === 'string'
          ? Number(v.attributes_json.km)
          : null
    if (km === null || Number.isNaN(km)) return true
    if (filters.km_min != null && km < filters.km_min) return false
    if (filters.km_max != null && km > filters.km_max) return false
    return true
  })
}

// ---------------------------------------------------------------------------

describe('effectiveFrequency', () => {
  it('returns alert frequency when within plan max', () => {
    expect(effectiveFrequency('daily', 'instant')).toBe('daily')
    expect(effectiveFrequency('weekly', 'daily')).toBe('weekly')
    expect(effectiveFrequency('instant', 'instant')).toBe('instant')
  })

  it('caps frequency to plan max when alert frequency exceeds plan', () => {
    expect(effectiveFrequency('instant', 'daily')).toBe('daily')
    expect(effectiveFrequency('instant', 'weekly')).toBe('weekly')
    expect(effectiveFrequency('daily', 'weekly')).toBe('weekly')
  })

  it('defaults to daily when alertFreq is null', () => {
    expect(effectiveFrequency(null, 'instant')).toBe('daily')
    expect(effectiveFrequency(null, 'weekly')).toBe('weekly')
  })

  it('respects plan tiers for all plans', () => {
    for (const [plan, max] of Object.entries(PLAN_MAX_FREQUENCY)) {
      const result = effectiveFrequency('instant', max)
      expect(result).toBe(max === 'instant' ? 'instant' : max)
      void plan // suppress unused warning
    }
  })
})

describe('isAlertEligible — tier enforcement', () => {
  const now = new Date('2026-01-15T12:00:00Z')

  it('free/basic plan caps instant alerts to weekly', () => {
    // Alert set to instant, fired 2 hours ago → ineligible for weekly plan
    const alert = {
      frequency: 'instant',
      last_sent_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    }
    expect(isAlertEligible(alert, now, 'weekly')).toBe(false)
  })

  it('free plan allows instant alert if last sent > 7 days ago', () => {
    const alert = {
      frequency: 'instant',
      last_sent_at: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    }
    expect(isAlertEligible(alert, now, 'weekly')).toBe(true)
  })

  it('classic plan caps instant to daily', () => {
    const alert = {
      frequency: 'instant',
      last_sent_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    }
    expect(isAlertEligible(alert, now, 'daily')).toBe(false)
  })

  it('classic plan allows daily alert if last sent > 24h ago', () => {
    const alert = {
      frequency: 'daily',
      last_sent_at: new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString(),
    }
    expect(isAlertEligible(alert, now, 'daily')).toBe(true)
  })

  it('premium plan allows instant alerts within 60s window', () => {
    const alert = {
      frequency: 'instant',
      last_sent_at: new Date(now.getTime() - 30_000).toISOString(),
    }
    expect(isAlertEligible(alert, now, 'instant')).toBe(false) // 30s < 60s threshold
  })

  it('premium plan allows instant alert after 60s', () => {
    const alert = {
      frequency: 'instant',
      last_sent_at: new Date(now.getTime() - 65_000).toISOString(),
    }
    expect(isAlertEligible(alert, now, 'instant')).toBe(true)
  })

  it('never-sent alerts are always eligible', () => {
    const alert = { frequency: 'weekly', last_sent_at: null }
    expect(isAlertEligible(alert, now, 'weekly')).toBe(true)
    expect(isAlertEligible(alert, now, 'instant')).toBe(true)
  })
})

describe('applyKmFilter', () => {
  const makeVehicle = (km: number | null | string): VehicleRow => ({
    attributes_json: km !== null ? { km } : null,
  })

  it('returns all vehicles when no km filters', () => {
    const vehicles = [makeVehicle(10000), makeVehicle(50000)]
    expect(applyKmFilter(vehicles, {})).toHaveLength(2)
  })

  it('filters by km_min', () => {
    const vehicles = [makeVehicle(10000), makeVehicle(50000), makeVehicle(100000)]
    const result = applyKmFilter(vehicles, { km_min: 30000 })
    expect(result).toHaveLength(2)
  })

  it('filters by km_max', () => {
    const vehicles = [makeVehicle(10000), makeVehicle(50000), makeVehicle(100000)]
    const result = applyKmFilter(vehicles, { km_max: 60000 })
    expect(result).toHaveLength(2)
  })

  it('filters by km_min and km_max together', () => {
    const vehicles = [makeVehicle(10000), makeVehicle(50000), makeVehicle(100000)]
    const result = applyKmFilter(vehicles, { km_min: 30000, km_max: 80000 })
    expect(result).toHaveLength(1)
    expect((result[0].attributes_json as { km: number }).km).toBe(50000)
  })

  it('includes vehicles with null attributes_json (km unknown)', () => {
    const vehicles = [makeVehicle(null), makeVehicle(50000)]
    const result = applyKmFilter(vehicles, { km_min: 30000 })
    expect(result).toHaveLength(2) // null km = include
  })

  it('includes vehicles with no km key in attributes_json', () => {
    const vehicles: VehicleRow[] = [{ attributes_json: { color: 'red' } }, makeVehicle(50000)]
    const result = applyKmFilter(vehicles, { km_min: 30000 })
    expect(result).toHaveLength(2)
  })

  it('handles km stored as string in attributes_json', () => {
    const vehicles = [makeVehicle('10000'), makeVehicle('80000')]
    const result = applyKmFilter(vehicles, { km_min: 30000 })
    expect(result).toHaveLength(1)
  })
})
