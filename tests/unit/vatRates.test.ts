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
    it('contains all major EU countries', () => {
      expect(EU_VAT_RATES['ES']).toBe(21)
      expect(EU_VAT_RATES['DE']).toBe(19)
      expect(EU_VAT_RATES['FR']).toBe(20)
      expect(EU_VAT_RATES['IT']).toBe(22)
      expect(EU_VAT_RATES['PT']).toBe(23)
      expect(EU_VAT_RATES['NL']).toBe(21)
    })

    it('has correct rates for high-VAT countries', () => {
      expect(EU_VAT_RATES['HU']).toBe(27) // highest in EU
      expect(EU_VAT_RATES['SE']).toBe(25)
      expect(EU_VAT_RATES['DK']).toBe(25)
      expect(EU_VAT_RATES['HR']).toBe(25)
    })

    it('has correct rates for low-VAT countries', () => {
      expect(EU_VAT_RATES['LU']).toBe(17) // lowest in EU
      expect(EU_VAT_RATES['MT']).toBe(18)
    })

    it('includes GB (post-Brexit compatibility)', () => {
      expect(EU_VAT_RATES['GB']).toBe(20)
    })
  })

  describe('DEFAULT_VAT_RATE', () => {
    it('is 21 (Spain)', () => {
      expect(DEFAULT_VAT_RATE).toBe(21)
    })
  })

  describe('getVatRate', () => {
    it('returns correct rate for known countries', () => {
      expect(getVatRate('ES')).toBe(21)
      expect(getVatRate('DE')).toBe(19)
      expect(getVatRate('HU')).toBe(27)
      expect(getVatRate('LU')).toBe(17)
    })

    it('is case-insensitive', () => {
      expect(getVatRate('es')).toBe(21)
      expect(getVatRate('de')).toBe(19)
      expect(getVatRate('Fr')).toBe(20)
    })

    it('returns default for unknown country', () => {
      expect(getVatRate('US')).toBe(DEFAULT_VAT_RATE)
      expect(getVatRate('JP')).toBe(DEFAULT_VAT_RATE)
      expect(getVatRate('XX')).toBe(DEFAULT_VAT_RATE)
    })

    it('returns default for null/undefined', () => {
      expect(getVatRate(null)).toBe(DEFAULT_VAT_RATE)
      expect(getVatRate(undefined)).toBe(DEFAULT_VAT_RATE)
    })

    it('returns default for empty string', () => {
      expect(getVatRate('')).toBe(DEFAULT_VAT_RATE)
    })
  })

  describe('calculateTaxFromGross', () => {
    it('calculates tax correctly for 21% (Spain)', () => {
      // 100 EUR gross = 100 * 21 / 121 = 17.36 EUR tax
      expect(calculateTaxFromGross(10000, 21)).toBe(1736)
    })

    it('calculates tax correctly for 19% (Germany)', () => {
      // 100 EUR gross = 100 * 19 / 119 = 15.97 EUR tax
      expect(calculateTaxFromGross(10000, 19)).toBe(1597)
    })

    it('calculates tax correctly for 27% (Hungary)', () => {
      // 100 EUR gross = 100 * 27 / 127 = 21.26 EUR tax
      expect(calculateTaxFromGross(10000, 27)).toBe(2126)
    })

    it('rounds to nearest cent', () => {
      // 39.99 EUR gross at 21% = 3999 * 21 / 121 = 694.13... → 694
      expect(calculateTaxFromGross(3999, 21)).toBe(694)
    })

    it('returns 0 for 0 amount', () => {
      expect(calculateTaxFromGross(0, 21)).toBe(0)
    })

    it('returns 0 for 0% VAT', () => {
      expect(calculateTaxFromGross(10000, 0)).toBe(0)
    })
  })

  describe('calculateTaxFromNet', () => {
    it('calculates tax correctly for 21% (Spain)', () => {
      // 100 EUR net = 100 * 21 / 100 = 21 EUR tax
      expect(calculateTaxFromNet(10000, 21)).toBe(2100)
    })

    it('calculates tax correctly for 19% (Germany)', () => {
      expect(calculateTaxFromNet(10000, 19)).toBe(1900)
    })

    it('rounds to nearest cent', () => {
      // 33.33 EUR net at 21% = 3333 * 21 / 100 = 699.93 → 700
      expect(calculateTaxFromNet(3333, 21)).toBe(700)
    })

    it('returns 0 for 0 amount', () => {
      expect(calculateTaxFromNet(0, 21)).toBe(0)
    })

    it('returns 0 for 0% VAT', () => {
      expect(calculateTaxFromNet(10000, 0)).toBe(0)
    })
  })
})
