/**
 * Product export utilities — structured data for sharing and feeds.
 *
 * Generates:
 * - JSON-LD structured data for search engines
 * - Open Graph metadata for social sharing
 * - Plain text summary for WhatsApp/email sharing
 * - CSV row for bulk export
 *
 * Pure functions exported for testability.
 * Used by vehicle detail pages, social sharing, and merchant feeds.
 */

export interface ProductData {
  id: string
  brand: string
  model: string
  year?: number
  km?: number
  price?: number
  currency?: string
  description?: string
  imageUrl?: string
  url: string
  dealerName?: string
  dealerUrl?: string
  location?: string
  condition?: string
  category?: string
}

/**
 * Generate JSON-LD Product structured data for SEO.
 * See: https://schema.org/Product
 */
export function generateJsonLd(product: ProductData): Record<string, unknown> {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${product.brand} ${product.model}${product.year ? ` (${product.year})` : ''}`,
    description: product.description ?? '',
    url: product.url,
    category: product.category ?? 'Vehicle',
  }

  if (product.imageUrl) {
    jsonLd.image = product.imageUrl
  }

  if (product.price !== undefined && product.price > 0) {
    jsonLd.offers = {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency ?? 'EUR',
      availability: 'https://schema.org/InStock',
      url: product.url,
    }
  }

  if (product.condition) {
    jsonLd.itemCondition = product.condition === 'Nuevo'
      ? 'https://schema.org/NewCondition'
      : 'https://schema.org/UsedCondition'
  }

  if (product.dealerName) {
    jsonLd.seller = {
      '@type': 'Organization',
      name: product.dealerName,
      url: product.dealerUrl ?? '',
    }
  }

  if (product.km !== undefined) {
    jsonLd.mileageFromOdometer = {
      '@type': 'QuantitativeValue',
      value: product.km,
      unitCode: 'KMT',
    }
  }

  return jsonLd
}

/**
 * Generate Open Graph metadata for social sharing.
 */
export function generateOpenGraph(product: ProductData): Record<string, string> {
  const title = `${product.brand} ${product.model}${product.year ? ` ${product.year}` : ''}`
  const priceStr = product.price
    ? `${product.price.toLocaleString('es-ES')} ${product.currency ?? '€'}`
    : ''

  const description = product.description
    ? product.description.slice(0, 200)
    : `${title}${priceStr ? ` - ${priceStr}` : ''}${product.location ? ` en ${product.location}` : ''}`

  const meta: Record<string, string> = {
    'og:title': title,
    'og:description': description,
    'og:url': product.url,
    'og:type': 'product',
  }

  if (product.imageUrl) {
    meta['og:image'] = product.imageUrl
  }

  if (product.price) {
    meta['product:price:amount'] = String(product.price)
    meta['product:price:currency'] = product.currency ?? 'EUR'
  }

  return meta
}

/**
 * Generate plain text summary for WhatsApp/email sharing.
 */
export function generateShareText(
  product: ProductData,
  locale: string = 'es',
): string {
  const title = `${product.brand} ${product.model}`
  const year = product.year ? `${locale === 'en' ? 'Year' : 'Año'}: ${product.year}` : ''
  const km = product.km !== undefined
    ? `${locale === 'en' ? 'Mileage' : 'Km'}: ${product.km.toLocaleString('es-ES')} km`
    : ''
  const price = product.price
    ? `${locale === 'en' ? 'Price' : 'Precio'}: ${product.price.toLocaleString('es-ES')} ${product.currency ?? '€'}`
    : ''
  const location = product.location
    ? `${locale === 'en' ? 'Location' : 'Ubicación'}: ${product.location}`
    : ''

  const parts = [title, year, km, price, location, product.url].filter(Boolean)
  return parts.join('\n')
}

/**
 * Generate CSV row for bulk export.
 */
export function generateCsvRow(product: ProductData): string {
  const fields = [
    product.id,
    product.brand,
    product.model,
    String(product.year ?? ''),
    String(product.km ?? ''),
    String(product.price ?? ''),
    product.currency ?? 'EUR',
    product.location ?? '',
    product.condition ?? '',
    product.category ?? '',
    product.dealerName ?? '',
    product.url,
  ]

  return fields.map((f) => `"${f.replace(/"/g, '""')}"`).join(',')
}

/**
 * CSV header row matching generateCsvRow field order.
 */
export const CSV_HEADER = 'id,brand,model,year,km,price,currency,location,condition,category,dealer,url'
