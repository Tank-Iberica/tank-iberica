import { describe, it, expect } from 'vitest'
import {
  EU_VAT_RATES,
  DEFAULT_VAT_RATE,
  getVatRate,
  calculateTaxFromGross,
  calculateTaxFromNet,
} from '../../server/utils/vatRates'

describe('vatRates', () => {
  describe('EU_VAT_RATES', () => {
    it('contains Spain at 21%', () => {
      expect(EU_VAT_RATES.ES).toBe(21)
    })

    it('contains Germany at 19%', () => {
      expect(EU_VAT_RATES.DE).toBe(19)
    })

    it('contains Hungary at 27% (highest EU rate)', () => {
      expect(EU_VAT_RATES.HU).toBe(27)
    })

    it('contains Luxembourg at 17% (lowest EU rate)', () => {
      expect(EU_VAT_RATES.LU).toBe(17)
    })

    it('contains all 28 EU+GB countries', () => {
      expect(Object.keys(EU_VAT_RATES).length).toBe(28)
    })

    it('all rates are between 15 and 30', () => {
      for (const [code, rate] of Object.entries(EU_VAT_RATES)) {
        expect(rate, `${code} rate`).toBeGreaterThanOrEqual(15)
        expect(rate, `${code} rate`).toBeLessThanOrEqual(30)
      }
    })
  })

  describe('DEFAULT_VAT_RATE', () => {
    it('is 21 (Spain)', () => {
      expect(DEFAULT_VAT_RATE).toBe(21)
    })
  })

  describe('getVatRate', () => {
    it('returns correct rate for known country', () => {
      expect(getVatRate('ES')).toBe(21)
      expect(getVatRate('DE')).toBe(19)
      expect(getVatRate('FR')).toBe(20)
    })

    it('returns default for unknown country', () => {
      expect(getVatRate('US')).toBe(21)
      expect(getVatRate('XX')).toBe(21)
    })

    it('returns default for null/undefined', () => {
      expect(getVatRate(null)).toBe(21)
      expect(getVatRate(undefined)).toBe(21)
    })

    it('returns default for empty string', () => {
      expect(getVatRate('')).toBe(21)
    })

    it('is case-insensitive', () => {
      expect(getVatRate('es')).toBe(21)
      expect(getVatRate('de')).toBe(19)
      expect(getVatRate('Fr')).toBe(20)
    })
  })

  describe('calculateTaxFromGross', () => {
    it('calculates Spanish VAT from gross', () => {
      // 12100 gross at 21% → tax = 12100 * 21 / 121 = 2100
      expect(calculateTaxFromGross(12100, 21)).toBe(2100)
    })

    it('calculates German VAT from gross', () => {
      // 11900 gross at 19% → tax = 11900 * 19 / 119 = 1900
      expect(calculateTaxFromGross(11900, 19)).toBe(1900)
    })

    it('rounds correctly', () => {
      // 1000 gross at 21% → tax = 1000 * 21 / 121 = 173.55... → 174
      expect(calculateTaxFromGross(1000, 21)).toBe(174)
    })

    it('returns 0 for 0 gross', () => {
      expect(calculateTaxFromGross(0, 21)).toBe(0)
    })
  })

  describe('calculateTaxFromNet', () => {
    it('calculates Spanish VAT from net', () => {
      // 10000 net at 21% → tax = 10000 * 21 / 100 = 2100
      expect(calculateTaxFromNet(10000, 21)).toBe(2100)
    })

    it('calculates German VAT from net', () => {
      // 10000 net at 19% → tax = 10000 * 19 / 100 = 1900
      expect(calculateTaxFromNet(10000, 19)).toBe(1900)
    })

    it('rounds correctly', () => {
      // 999 net at 21% → tax = 999 * 21 / 100 = 209.79 → 210
      expect(calculateTaxFromNet(999, 21)).toBe(210)
    })

    it('returns 0 for 0 net', () => {
      expect(calculateTaxFromNet(0, 21)).toBe(0)
    })
  })
})
