import { describe, it, expect } from 'vitest'
import {
  getMonthLabel,
  getMonthsRange,
  monthStart,
  monthEnd,
  pctChange,
} from '../../app/composables/shared/dateHelpers'

// ─── getMonthLabel ────────────────────────────────────────────────────────

describe('getMonthLabel', () => {
  it('formats January correctly (month 0)', () => {
    expect(getMonthLabel(new Date(2026, 0, 15))).toBe('2026-01')
  })

  it('formats December correctly (month 11)', () => {
    expect(getMonthLabel(new Date(2026, 11, 1))).toBe('2026-12')
  })

  it('pads single-digit months with leading zero', () => {
    expect(getMonthLabel(new Date(2026, 2, 10))).toBe('2026-03')
  })

  it('handles year boundary', () => {
    expect(getMonthLabel(new Date(2025, 11, 31))).toBe('2025-12')
  })

  it('formats September (month 8) with leading zero', () => {
    expect(getMonthLabel(new Date(2024, 8, 1))).toBe('2024-09')
  })
})

// ─── getMonthsRange ───────────────────────────────────────────────────────

describe('getMonthsRange', () => {
  it('returns the correct count of months', () => {
    const result = getMonthsRange(6)
    expect(result).toHaveLength(6)
  })

  it('returns Date objects', () => {
    const result = getMonthsRange(3)
    for (const d of result) {
      expect(d).toBeInstanceOf(Date)
    }
  })

  it('each date is the first of the month', () => {
    const result = getMonthsRange(4)
    for (const d of result) {
      expect(d.getDate()).toBe(1)
    }
  })

  it('returns months in ascending order', () => {
    const result = getMonthsRange(3)
    expect(result[0]!.getTime()).toBeLessThan(result[1]!.getTime())
    expect(result[1]!.getTime()).toBeLessThan(result[2]!.getTime())
  })

  it('last date is in the current month', () => {
    const result = getMonthsRange(1)
    const now = new Date()
    expect(result[0]!.getMonth()).toBe(now.getMonth())
    expect(result[0]!.getFullYear()).toBe(now.getFullYear())
  })

  it('returns empty array for count=0', () => {
    const result = getMonthsRange(0)
    expect(result).toHaveLength(0)
  })

  it('returns 12 months for count=12', () => {
    const result = getMonthsRange(12)
    expect(result).toHaveLength(12)
  })
})

// ─── monthStart ───────────────────────────────────────────────────────────

describe('monthStart', () => {
  it('returns ISO string for the first of the given month', () => {
    const date = new Date(2026, 0, 15) // Jan 15
    const result = monthStart(date)
    const parsed = new Date(result)
    expect(parsed.getFullYear()).toBe(2026)
    expect(parsed.getMonth()).toBe(0)
    expect(parsed.getDate()).toBe(1)
  })

  it('returns a valid ISO string', () => {
    const date = new Date(2026, 5, 20)
    const result = monthStart(date)
    expect(() => new Date(result)).not.toThrow()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}/)
  })

  it('ignores the day part of the input date', () => {
    const date1 = new Date(2026, 3, 1)
    const date2 = new Date(2026, 3, 30)
    const parsed1 = new Date(monthStart(date1))
    const parsed2 = new Date(monthStart(date2))
    expect(parsed1.getMonth()).toBe(parsed2.getMonth())
    expect(parsed1.getDate()).toBe(parsed2.getDate())
  })
})

// ─── monthEnd ─────────────────────────────────────────────────────────────

describe('monthEnd', () => {
  it('returns ISO string for the first of the NEXT month', () => {
    const date = new Date(2026, 0, 15) // Jan → next is Feb
    const result = monthEnd(date)
    const parsed = new Date(result)
    expect(parsed.getMonth()).toBe(1) // February
    expect(parsed.getDate()).toBe(1)
  })

  it('correctly wraps from December to January of next year', () => {
    const date = new Date(2026, 11, 15) // December
    const result = monthEnd(date)
    const parsed = new Date(result)
    expect(parsed.getFullYear()).toBe(2027)
    expect(parsed.getMonth()).toBe(0) // January
  })

  it('returns a valid ISO string', () => {
    const date = new Date(2026, 5, 10)
    const result = monthEnd(date)
    expect(() => new Date(result)).not.toThrow()
  })

  it('monthEnd is after monthStart for the same date', () => {
    const date = new Date(2026, 2, 15)
    expect(new Date(monthEnd(date)).getTime()).toBeGreaterThan(
      new Date(monthStart(date)).getTime(),
    )
  })
})

// ─── pctChange ────────────────────────────────────────────────────────────

describe('pctChange', () => {
  it('returns 100 when previous is 0 and current > 0', () => {
    expect(pctChange(10, 0)).toBe(100)
  })

  it('returns 0 when both are 0', () => {
    expect(pctChange(0, 0)).toBe(0)
  })

  it('calculates positive percentage growth', () => {
    // (150 - 100) / 100 * 100 = 50
    expect(pctChange(150, 100)).toBe(50)
  })

  it('calculates negative percentage (decline)', () => {
    // (80 - 100) / 100 * 100 = -20
    expect(pctChange(80, 100)).toBe(-20)
  })

  it('returns 0 when current equals previous', () => {
    expect(pctChange(100, 100)).toBe(0)
  })

  it('rounds to nearest integer', () => {
    // (10 - 3) / 3 * 100 ≈ 233.33 → 233
    expect(pctChange(10, 3)).toBe(233)
  })

  it('handles large numbers', () => {
    expect(pctChange(2000, 1000)).toBe(100)
  })

  it('handles fractional change', () => {
    // (105 - 100) / 100 * 100 = 5
    expect(pctChange(105, 100)).toBe(5)
  })
})
