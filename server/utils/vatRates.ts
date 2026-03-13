/**
 * VAT rate utilities for invoice generation.
 * Standard EU VAT rates by country code.
 */

const VAT_RATES: Record<string, number> = {
  ES: 0.21,
  DE: 0.19,
  FR: 0.2,
  IT: 0.22,
  PT: 0.23,
  BE: 0.21,
  NL: 0.21,
  AT: 0.2,
  PL: 0.23,
  SE: 0.25,
  DK: 0.25,
  FI: 0.24,
  IE: 0.23,
  GR: 0.24,
  CZ: 0.21,
  HU: 0.27,
  RO: 0.19,
  BG: 0.2,
  HR: 0.25,
  SK: 0.2,
  SI: 0.22,
  LT: 0.21,
  LV: 0.21,
  EE: 0.2,
  LU: 0.17,
  CY: 0.19,
  MT: 0.18,
  GB: 0.2,
  CH: 0.077,
  NO: 0.25,
}

const DEFAULT_VAT_RATE = 0.21

/**
 * Get VAT rate for a country code (ISO 3166-1 alpha-2).
 * Returns 0.21 (Spanish standard) as default.
 */
export function getVatRate(countryCode?: string | null): number {
  if (!countryCode) return DEFAULT_VAT_RATE
  return VAT_RATES[countryCode.toUpperCase()] ?? DEFAULT_VAT_RATE
}

/**
 * Calculate tax amount from a gross (tax-inclusive) amount.
 * Returns the tax portion in the same unit as grossAmount.
 */
export function calculateTaxFromGross(grossAmount: number, vatRate: number): number {
  return Math.round(grossAmount - grossAmount / (1 + vatRate))
}

/**
 * Calculate tax amount from a net (tax-exclusive) amount.
 * Returns the tax portion in the same unit as netAmount.
 */
export function calculateTaxFromNet(netAmount: number, vatRate: number): number {
  return Math.round(netAmount * vatRate)
}
