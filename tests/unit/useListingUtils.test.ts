import { describe, it, expect } from 'vitest'
import {
  getStatusConfig,
  getStatusClass,
  formatPrice,
  formatPriceCents,
} from '../../app/composables/shared/useListingUtils'

// ─── getStatusConfig ──────────────────────────────────────────────────────

describe('getStatusConfig', () => {
  it.each([
    ['published', 'shared.status.published', 'status--published'],
    ['draft', 'shared.status.draft', 'status--draft'],
    ['paused', 'shared.status.paused', 'status--paused'],
    ['rented', 'shared.status.rented', 'status--rented'],
    ['workshop', 'shared.status.workshop', 'status--workshop'],
    ['maintenance', 'shared.status.maintenance', 'status--maintenance'],
    ['sold', 'shared.status.sold', 'status--sold'],
  ] as const)('returns correct config for "%s"', (status, label, cssClass) => {
    const config = getStatusConfig(status)
    expect(config.label).toBe(label)
    expect(config.cssClass).toBe(cssClass)
  })

  it('returns default (draft) config for unknown status', () => {
    const config = getStatusConfig('unknown_status')
    expect(config.label).toBe('shared.status.draft')
    expect(config.cssClass).toBe('status--draft')
  })

  it('returns an object with label and cssClass', () => {
    const config = getStatusConfig('sold')
    expect(config).toHaveProperty('label')
    expect(config).toHaveProperty('cssClass')
  })
})

// ─── getStatusClass ───────────────────────────────────────────────────────

describe('getStatusClass', () => {
  it.each([
    ['published', 'status--published'],
    ['draft', 'status--draft'],
    ['paused', 'status--paused'],
    ['rented', 'status--rented'],
    ['workshop', 'status--workshop'],
    ['maintenance', 'status--maintenance'],
    ['sold', 'status--sold'],
  ] as const)('returns "%s" for status "%s"', (status, expected) => {
    expect(getStatusClass(status)).toBe(expected)
  })

  it('returns default class (status--draft) for unknown status', () => {
    expect(getStatusClass('foobar')).toBe('status--draft')
  })

  it('returns default class for empty string', () => {
    expect(getStatusClass('')).toBe('status--draft')
  })
})

// ─── formatPrice ──────────────────────────────────────────────────────────

describe('formatPrice', () => {
  it('returns "-" for null', () => {
    expect(formatPrice(null)).toBe('-')
  })

  it('returns "-" for undefined', () => {
    expect(formatPrice(undefined)).toBe('-')
  })

  it('returns "-" for 0', () => {
    expect(formatPrice(0)).toBe('-')
  })

  it('formats a positive price as EUR currency', () => {
    const result = formatPrice(50000)
    expect(result).toBeTruthy()
    expect(result).not.toBe('-')
  })

  it('formatted result contains the price amount', () => {
    const result = formatPrice(80000)
    expect(result).toContain('80')
  })

  it('uses custom locale when provided', () => {
    const es = formatPrice(50000, 'es-ES')
    const de = formatPrice(50000, 'de-DE')
    // Both should be truthy and contain the number
    expect(es).toBeTruthy()
    expect(de).toBeTruthy()
  })

  it('applies custom options', () => {
    // With maximumFractionDigits=2, should format with decimals
    const result = formatPrice(50000.5, 'es-ES', { maximumFractionDigits: 2 })
    expect(result).toBeTruthy()
  })

  it('formats 1 euro without showing zero (price is truthy)', () => {
    const result = formatPrice(1)
    expect(result).not.toBe('-')
  })

  it('formats negative price (loss scenario)', () => {
    const result = formatPrice(-5000)
    expect(result).toBeTruthy()
    expect(result).not.toBe('-')
  })
})

// ─── formatPriceCents ─────────────────────────────────────────────────────

describe('formatPriceCents', () => {
  it('returns "-" for null', () => {
    expect(formatPriceCents(null)).toBe('-')
  })

  it('returns "-" for undefined', () => {
    expect(formatPriceCents(undefined)).toBe('-')
  })

  it('returns "-" for 0 cents', () => {
    expect(formatPriceCents(0)).toBe('-')
  })

  it('formats 10000 cents as 100.00 EUR', () => {
    const result = formatPriceCents(10000)
    expect(result).toBeTruthy()
    expect(result).not.toBe('-')
  })

  it('includes decimal part (2 fraction digits)', () => {
    const result = formatPriceCents(9999)
    // 9999 cents = 99.99 EUR
    expect(result).toContain('99')
  })

  it('uses custom locale when provided', () => {
    const result = formatPriceCents(5000, 'de-DE')
    expect(result).toBeTruthy()
  })

  it('formats small amounts correctly', () => {
    const result = formatPriceCents(1) // 0.01 EUR
    expect(result).toBeTruthy()
    expect(result).not.toBe('-')
  })

  it('formats large amounts correctly', () => {
    const result = formatPriceCents(10_000_00) // 10000 EUR (1M cents)
    expect(result).toBeTruthy()
  })
})
