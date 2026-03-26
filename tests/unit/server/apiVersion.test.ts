import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  extractVersionFromPath,
  toHttpDate,
  isDeprecated,
  daysUntilSunset,
  API_SUNSET_DATES,
  API_DEPRECATION_ANNOUNCED,
  type ApiVersion,
} from '../../../server/utils/apiVersion'

// ---------------------------------------------------------------------------
// Unit tests for apiVersion utility
// ---------------------------------------------------------------------------

// ---- extractVersionFromPath ------------------------------------------------

describe('extractVersionFromPath', () => {
  it('extracts v1 from a v1 path', () => {
    expect(extractVersionFromPath('/api/v1/valuation')).toBe('v1')
  })

  it('extracts v2 from a v2 path', () => {
    expect(extractVersionFromPath('/api/v2/valuation')).toBe('v2')
  })

  it('returns null for unversioned /api/ paths', () => {
    expect(extractVersionFromPath('/api/health')).toBeNull()
  })

  it('returns null for non-api paths', () => {
    expect(extractVersionFromPath('/dashboard/vehiculos')).toBeNull()
  })

  it('returns null for version not in allowed set (v3)', () => {
    // v3 is not in ApiVersion type — returns null
    expect(extractVersionFromPath('/api/v3/something')).toBeNull()
  })

  it('handles deep path after version', () => {
    expect(extractVersionFromPath('/api/v1/market/valuation')).toBe('v1')
  })

  it('returns null for empty string', () => {
    expect(extractVersionFromPath('')).toBeNull()
  })
})

// ---- toHttpDate ------------------------------------------------------------

describe('toHttpDate', () => {
  it('converts ISO date to HTTP-date format', () => {
    const result = toHttpDate('2027-01-01')
    // Should be a valid HTTP-date (RFC 7231)
    expect(result).toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),/)
    expect(result).toContain('Jan 2027')
    expect(result).toContain('GMT')
  })

  it('includes time component', () => {
    const result = toHttpDate('2027-06-15')
    expect(result).toContain('2027')
    expect(result).toContain('GMT')
  })

  it('returns a non-empty string', () => {
    expect(toHttpDate('2026-01-01').length).toBeGreaterThan(0)
  })
})

// ---- isDeprecated ----------------------------------------------------------

describe('isDeprecated', () => {
  it('returns false for v1 (not deprecated — no sunset date)', () => {
    // v1 is currently active, no sunset date set
    expect(isDeprecated('v1')).toBe(false)
  })

  it('returns false for v2 (not deprecated — no sunset date)', () => {
    expect(isDeprecated('v2')).toBe(false)
  })

  it('returns true when a sunset date is set', () => {
    // Temporarily set a sunset date for testing
    const original = API_SUNSET_DATES['v1']
    try {
      API_SUNSET_DATES['v1'] = '2027-01-01'
      expect(isDeprecated('v1')).toBe(true)
    } finally {
      if (original === undefined) {
        delete API_SUNSET_DATES['v1']
      } else {
        API_SUNSET_DATES['v1'] = original
      }
    }
  })
})

// ---- daysUntilSunset -------------------------------------------------------

describe('daysUntilSunset', () => {
  it('returns null for non-deprecated version', () => {
    expect(daysUntilSunset('v1')).toBeNull()
  })

  it('returns positive days when sunset is in the future', () => {
    const original = API_SUNSET_DATES['v1']
    try {
      const future = new Date()
      future.setDate(future.getDate() + 100)
      API_SUNSET_DATES['v1'] = future.toISOString().split('T')[0]!

      const now = new Date()
      const days = daysUntilSunset('v1', now)
      expect(days).not.toBeNull()
      expect(days!).toBeGreaterThan(0)
      expect(days!).toBeLessThanOrEqual(101)
    } finally {
      if (original === undefined) delete API_SUNSET_DATES['v1']
      else API_SUNSET_DATES['v1'] = original
    }
  })

  it('returns 0 or negative when sunset has passed', () => {
    const original = API_SUNSET_DATES['v1']
    try {
      API_SUNSET_DATES['v1'] = '2020-01-01'

      const days = daysUntilSunset('v1', new Date())
      expect(days).not.toBeNull()
      expect(days!).toBeLessThanOrEqual(0)
    } finally {
      if (original === undefined) delete API_SUNSET_DATES['v1']
      else API_SUNSET_DATES['v1'] = original
    }
  })

  it('returns 1 or 2 days when sunset is tomorrow (timezone-dependent)', () => {
    const original = API_SUNSET_DATES['v1']
    try {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      API_SUNSET_DATES['v1'] = tomorrow.toISOString().split('T')[0]!

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const days = daysUntilSunset('v1', today)
      // Due to timezone offsets and Math.ceil, this can be 1 or 2
      expect(days).not.toBeNull()
      expect(days!).toBeGreaterThanOrEqual(1)
      expect(days!).toBeLessThanOrEqual(2)
    } finally {
      if (original === undefined) delete API_SUNSET_DATES['v1']
      else API_SUNSET_DATES['v1'] = original
    }
  })
})

// ---- API_SUNSET_DATES (data integrity) ------------------------------------

describe('API versioning data integrity', () => {
  it('v1 is NOT in sunset dates (no deprecation scheduled)', () => {
    expect(API_SUNSET_DATES['v1']).toBeUndefined()
  })

  it('v1 is NOT in deprecation announced dates', () => {
    expect(API_DEPRECATION_ANNOUNCED['v1']).toBeUndefined()
  })

  it('every version in sunset dates also has a deprecation announced date', () => {
    for (const version of Object.keys(API_SUNSET_DATES) as ApiVersion[]) {
      expect(
        API_DEPRECATION_ANNOUNCED[version],
        `${version} has sunset but no deprecation announcement`,
      ).toBeDefined()
    }
  })

  it('deprecation announcement is at least 180 days before sunset', () => {
    for (const version of Object.keys(API_SUNSET_DATES) as ApiVersion[]) {
      const sunset = new Date(API_SUNSET_DATES[version]!)
      const announced = new Date(API_DEPRECATION_ANNOUNCED[version]!)
      const diffDays = (sunset.getTime() - announced.getTime()) / (1000 * 60 * 60 * 24)
      expect(
        diffDays,
        `${version}: deprecation notice must be ≥180 days before sunset`,
      ).toBeGreaterThanOrEqual(180)
    }
  })
})
