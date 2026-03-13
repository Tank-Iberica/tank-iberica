/**
 * EU VAT Rates
 * Standard rates by country code (ISO 3166-1 alpha-2).
 * Shared across billing service and invoicing endpoints.
 */
export const EU_VAT_RATES: Record<string, number> = {
  ES: 21,
  PT: 23,
  FR: 20,
  DE: 19,
  IT: 22,
  NL: 21,
  BE: 21,
  AT: 20,
  IE: 23,
  PL: 23,
  SE: 25,
  DK: 25,
  FI: 24,
  CZ: 21,
  RO: 19,
  HU: 27,
  BG: 20,
  HR: 25,
  SK: 20,
  SI: 22,
  LT: 21,
  LV: 21,
  EE: 22,
  CY: 19,
  MT: 18,
  LU: 17,
  GR: 24,
  GB: 20,
}

/** Default VAT rate when country is unknown */
export const DEFAULT_VAT_RATE = 21

/**
 * Get VAT rate for a given country code.
 * Falls back to DEFAULT_VAT_RATE (21%) for unknown countries.
 */
export function getVatRate(countryCode: string | null | undefined): number {
  if (!countryCode) return DEFAULT_VAT_RATE
  return EU_VAT_RATES[countryCode.toUpperCase()] ?? DEFAULT_VAT_RATE
}

/**
 * Calculate tax from gross amount (tax-inclusive).
 * Formula: tax = gross * rate / (100 + rate)
 */
export function calculateTaxFromGross(grossCents: number, vatRate: number): number {
  return Math.round((grossCents * vatRate) / (100 + vatRate))
}

/**
 * Calculate tax from net amount (tax-exclusive).
 * Formula: tax = net * rate / 100
 */
export function calculateTaxFromNet(netCents: number, vatRate: number): number {
  return Math.round((netCents * vatRate) / 100)
}
