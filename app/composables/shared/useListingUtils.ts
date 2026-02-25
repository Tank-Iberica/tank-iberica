/**
 * Shared listing utilities for admin and dealer pages.
 * Replaces duplicated formatPrice (25+ files) and status helpers (10+ files).
 */

// ---------------------------------------------------------------------------
// Vehicle status
// ---------------------------------------------------------------------------

export type VehicleStatus =
  | 'published'
  | 'draft'
  | 'paused'
  | 'rented'
  | 'workshop'
  | 'maintenance'
  | 'sold'

export interface StatusConfig {
  /** i18n key, e.g. 'shared.status.published' */
  label: string
  /** CSS class, e.g. 'status--published' */
  cssClass: string
}

const STATUS_MAP: Record<string, StatusConfig> = {
  published: { label: 'shared.status.published', cssClass: 'status--published' },
  draft: { label: 'shared.status.draft', cssClass: 'status--draft' },
  paused: { label: 'shared.status.paused', cssClass: 'status--paused' },
  rented: { label: 'shared.status.rented', cssClass: 'status--rented' },
  workshop: { label: 'shared.status.workshop', cssClass: 'status--workshop' },
  maintenance: { label: 'shared.status.maintenance', cssClass: 'status--maintenance' },
  sold: { label: 'shared.status.sold', cssClass: 'status--sold' },
}

const DEFAULT_STATUS: StatusConfig = {
  label: 'shared.status.draft',
  cssClass: 'status--draft',
}

/** Get the full config for a vehicle status. */
export function getStatusConfig(status: string): StatusConfig {
  return STATUS_MAP[status] ?? DEFAULT_STATUS
}

/** Get just the CSS class for a vehicle status. */
export function getStatusClass(status: string): string {
  return (STATUS_MAP[status] ?? DEFAULT_STATUS).cssClass
}

// ---------------------------------------------------------------------------
// Price formatting
// ---------------------------------------------------------------------------

const DEFAULT_PRICE_OPTIONS: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
}

/**
 * Format a number as EUR currency.
 * @param price - Price in euros (NOT cents). Null/undefined returns fallback.
 * @param locale - BCP 47 locale. Defaults to 'es-ES'.
 * @param options - Override Intl.NumberFormat options.
 */
export function formatPrice(
  price: number | null | undefined,
  locale: string = 'es-ES',
  options?: Partial<Intl.NumberFormatOptions>,
): string {
  if (price == null || price === 0) return '-'
  return new Intl.NumberFormat(locale, { ...DEFAULT_PRICE_OPTIONS, ...options }).format(price)
}

/**
 * Format cents as EUR currency.
 * @param cents - Price in cents. Null/undefined returns fallback.
 * @param locale - BCP 47 locale. Defaults to 'es-ES'.
 */
export function formatPriceCents(
  cents: number | null | undefined,
  locale: string = 'es-ES',
): string {
  if (cents == null || cents === 0) return '-'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}
