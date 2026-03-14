/**
 * Shared formatting utilities.
 * Used across composables (useDatos, useValoracion) and components.
 */

/**
 * Map i18n locale codes to BCP 47 locale strings for Intl formatting.
 * Defaults to 'es-ES' for unknown locales.
 */
function toIntlLocale(locale: string): string {
  const map: Record<string, string> = {
    es: 'es-ES',
    en: 'en-GB',
    fr: 'fr-FR',
    pt: 'pt-PT',
    de: 'de-DE',
  }
  return map[locale] ?? 'es-ES'
}

/** Format a number as euros with the given locale (no decimals). */
export function formatPrice(value: number, locale = 'es'): string {
  return new Intl.NumberFormat(toIntlLocale(locale), {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

/** Format a number as euros with decimals. */
export function formatPriceDecimal(value: number, locale = 'es'): string {
  return new Intl.NumberFormat(toIntlLocale(locale), {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }

/** Format a date string or Date object for display. */
export function formatDate(
  date: string | Date,
  locale = 'es',
  options: Intl.DateTimeFormatOptions = DEFAULT_DATE_OPTIONS,
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(toIntlLocale(locale), options)
}

/** Format a number with thousands separator, no currency symbol. */
export function formatNumber(value: number, locale = 'es'): string {
  return new Intl.NumberFormat(toIntlLocale(locale)).format(value)
}
