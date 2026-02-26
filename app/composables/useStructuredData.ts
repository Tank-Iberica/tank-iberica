/**
 * Composable for Schema.org structured data (JSON-LD)
 *
 * Provides helpers to inject structured data for:
 * - Vehicle/Product pages
 * - Organization (site-wide)
 * - BreadcrumbList
 * - WebSite with SearchAction
 *
 * Vehicle page already has inline JSON-LD (vehiculo/[slug].vue).
 * This composable centralizes the schema builders for reuse.
 */

const SITE_URL = 'https://tracciona.com'
const SITE_NAME = 'Tracciona'

interface VehicleSchemaInput {
  brand: string
  model: string
  year?: number | null
  price?: number | null
  slug: string
  description?: string | null
  image?: string | null
  km?: number | null
  fuelType?: string | null
  location?: string | null
  locationCountry?: string | null
  locationRegion?: string | null
  sellerName?: string | null
  condition?: string
}

interface BreadcrumbItem {
  name: string
  url?: string
}

/**
 * Build Vehicle + Product JSON-LD schema
 */
export function buildVehicleSchema(v: VehicleSchemaInput): Record<string, unknown> {
  const canonicalUrl = `${SITE_URL}/vehiculo/${v.slug}`

  return {
    '@context': 'https://schema.org',
    '@type': ['Vehicle', 'Product'],
    name: `${v.brand} ${v.model}${v.year ? ` ${v.year}` : ''}`,
    description: v.description || undefined,
    image: v.image || undefined,
    brand: { '@type': 'Brand', name: v.brand },
    model: v.model,
    vehicleModelDate: v.year?.toString(),
    mileageFromOdometer: v.km
      ? { '@type': 'QuantitativeValue', value: v.km, unitCode: 'KMT' }
      : undefined,
    fuelType: v.fuelType || undefined,
    sku: v.slug,
    url: canonicalUrl,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: v.price || undefined,
      availability: 'https://schema.org/InStock',
      url: canonicalUrl,
      seller: { '@type': 'Organization', name: v.sellerName || SITE_NAME },
      itemCondition: v.condition || 'https://schema.org/UsedCondition',
    },
    availableAtOrFrom: v.location
      ? {
          '@type': 'Place',
          name: v.location,
          address: {
            '@type': 'PostalAddress',
            addressCountry: v.locationCountry || 'ES',
            addressRegion: v.locationRegion || undefined,
          },
        }
      : undefined,
  }
}

/**
 * Build Organization JSON-LD schema (site-wide)
 */
export function buildOrganizationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512x512.png`,
    description: 'Marketplace de vehículos industriales con IA',
    foundingDate: '2024',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'tankiberica@gmail.com',
    },
    sameAs: [],
  }
}

/**
 * Build BreadcrumbList JSON-LD schema
 */
export function buildBreadcrumbSchema(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  }
}

/**
 * Build WebSite JSON-LD schema with SearchAction
 */
export function buildWebSiteSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

/**
 * Inject JSON-LD script tag via useHead
 */
export function useJsonLd(schema: Record<string, unknown> | Record<string, unknown>[]): void {
  const schemas = Array.isArray(schema) ? schema : [schema]
  useHead({
    script: schemas.map((s) => ({
      type: 'application/ld+json',
      innerHTML: JSON.stringify(s),
    })),
  })
}
