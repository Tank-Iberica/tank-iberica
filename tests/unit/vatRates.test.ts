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
    it('contains all 28 EU countries + UK', () => {
      expect(Object.keys(EU_VAT_RATES).length).toBe(28)
    })

    it('has Spain at 21%', () => {
      expect(EU_VAT_RATES.ES).toBe(21)
    })

    it('has Portugal at 23%', () => {
      expect(EU_VAT_RATES.PT).toBe(23)
    })

    it('has Germany at 19%', () => {
      expect(EU_VAT_RATES.DE).toBe(19)
    })

    it('has Hungary at 27% (highest EU rate)', () => {
      expect(EU_VAT_RATES.HU).toBe(27)
    })

    it('has Luxembourg at 17% (lowest EU rate)', () => {
      expect(EU_VAT_RATES.LU).toBe(17)
    })

    it('has UK at 20%', () => {
      expect(EU_VAT_RATES.GB).toBe(20)
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
      expect(getVatRate('PT')).toBe(23)
      expect(getVatRate('DE')).toBe(19)
    })

    it('returns default for unknown country', () => {
      expect(getVatRate('US')).toBe(21)
      expect(getVatRate('JP')).toBe(21)
    })

    it('returns default for null', () => {
      expect(getVatRate(null)).toBe(21)
    })

    it('returns default for undefined', () => {
      expect(getVatRate(undefined)).toBe(21)
    })

    it('returns default for empty string', () => {
      expect(getVatRate('')).toBe(21)
    })

    it('is case-insensitive', () => {
      expect(getVatRate('es')).toBe(21)
      expect(getVatRate('pt')).toBe(23)
      expect(getVatRate('De')).toBe(19)
    })
  })

  describe('calculateTaxFromGross', () => {
    it('calculates correctly for Spain (21%)', () => {
      // 3900 * 21 / 121 = 676.86 → 677
      expect(calculateTaxFromGross(3900, 21)).toBe(677)
    })

    it('calculates correctly for Portugal (23%)', () => {
      // 3900 * 23 / 123 = 729.27 → 729
      expect(calculateTaxFromGross(3900, 23)).toBe(729)
    })

    it('calculates correctly for Germany (19%)', () => {
      // 3900 * 19 / 119 = 622.69 → 623
      expect(calculateTaxFromGross(3900, 19)).toBe(623)
    })

    it('returns 0 for 0 amount', () => {
      expect(calculateTaxFromGross(0, 21)).toBe(0)
    })

    it('rounds to nearest integer', () => {
      // 1000 * 21 / 121 = 173.55 → 174
      expect(calculateTaxFromGross(1000, 21)).toBe(174)
    })
  })

  describe('calculateTaxFromNet', () => {
    it('calculates correctly for Spain (21%)', () => {
      // 3223 * 21 / 100 = 676.83 → 677
      expect(calculateTaxFromNet(3223, 21)).toBe(677)
    })

    it('calculates correctly for Portugal (23%)', () => {
      // 3000 * 23 / 100 = 690
      expect(calculateTaxFromNet(3000, 23)).toBe(690)
    })

    it('returns 0 for 0 amount', () => {
      expect(calculateTaxFromNet(0, 21)).toBe(0)
    })
  })
})
