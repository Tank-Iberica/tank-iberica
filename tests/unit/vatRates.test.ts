import { describe, it, expect } from 'vitest'
import { getVatRate, calculateTaxFromGross, calculateTaxFromNet } from '../../server/utils/vatRates'

describe('vatRates', () => {
  describe('getVatRate', () => {
    it('returns correct rate for known country', () => {
      expect(getVatRate('ES')).toBe(0.21)
      expect(getVatRate('PT')).toBe(0.23)
      expect(getVatRate('DE')).toBe(0.19)
    })

    it('returns Spain rate for Hungary (highest EU)', () => {
      expect(getVatRate('HU')).toBe(0.27)
    })

    it('returns Luxembourg rate (lowest EU)', () => {
      expect(getVatRate('LU')).toBe(0.17)
    })

    it('returns UK rate', () => {
      expect(getVatRate('GB')).toBe(0.2)
    })

    it('returns default for unknown country', () => {
      expect(getVatRate('US')).toBe(0.21)
      expect(getVatRate('JP')).toBe(0.21)
    })

    it('returns default for null', () => {
      expect(getVatRate(null)).toBe(0.21)
    })

    it('returns default for undefined', () => {
      expect(getVatRate(undefined)).toBe(0.21)
    })

    it('returns default for empty string', () => {
      expect(getVatRate('')).toBe(0.21)
    })

    it('is case-insensitive', () => {
      expect(getVatRate('es')).toBe(0.21)
      expect(getVatRate('pt')).toBe(0.23)
      expect(getVatRate('De')).toBe(0.19)
    })
  })

  describe('calculateTaxFromGross', () => {
    it('calculates correctly for Spain (21%)', () => {
      // 3900 - 3900 / 1.21 = 3900 - 3223.14 = 676.86 → 677
      expect(calculateTaxFromGross(3900, 0.21)).toBe(677)
    })

    it('calculates correctly for Portugal (23%)', () => {
      // 3900 - 3900 / 1.23 = 3900 - 3170.73 = 729.27 → 729
      expect(calculateTaxFromGross(3900, 0.23)).toBe(729)
    })

    it('calculates correctly for Germany (19%)', () => {
      // 3900 - 3900 / 1.19 = 3900 - 3277.31 = 622.69 → 623
      expect(calculateTaxFromGross(3900, 0.19)).toBe(623)
    })

    it('returns 0 for 0 amount', () => {
      expect(calculateTaxFromGross(0, 0.21)).toBe(0)
    })

    it('rounds to nearest integer', () => {
      // 1000 - 1000 / 1.21 = 1000 - 826.45 = 173.55 → 174
      expect(calculateTaxFromGross(1000, 0.21)).toBe(174)
    })
  })

  describe('calculateTaxFromNet', () => {
    it('calculates correctly for Spain (21%)', () => {
      // 3223 * 0.21 = 676.83 → 677
      expect(calculateTaxFromNet(3223, 0.21)).toBe(677)
    })

    it('calculates correctly for Portugal (23%)', () => {
      // 3000 * 0.23 = 690
      expect(calculateTaxFromNet(3000, 0.23)).toBe(690)
    })

    it('returns 0 for 0 amount', () => {
      expect(calculateTaxFromNet(0, 0.21)).toBe(0)
    })
  })
})
