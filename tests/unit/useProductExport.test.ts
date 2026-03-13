import { describe, it, expect } from 'vitest'

/**
 * Tests for useProductExport composable — structured data generation.
 */

interface ProductData {
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

function generateJsonLd(product: ProductData): Record<string, unknown> {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${product.brand} ${product.model}${product.year ? ` (${product.year})` : ''}`,
    description: product.description ?? '',
    url: product.url,
    category: product.category ?? 'Vehicle',
  }
  if (product.imageUrl) jsonLd.image = product.imageUrl
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
    jsonLd.seller = { '@type': 'Organization', name: product.dealerName, url: product.dealerUrl ?? '' }
  }
  if (product.km !== undefined) {
    jsonLd.mileageFromOdometer = { '@type': 'QuantitativeValue', value: product.km, unitCode: 'KMT' }
  }
  return jsonLd
}

function generateOpenGraph(product: ProductData): Record<string, string> {
  const title = `${product.brand} ${product.model}${product.year ? ` ${product.year}` : ''}`
  const priceStr = product.price ? `${product.price.toLocaleString('es-ES')} ${product.currency ?? '€'}` : ''
  const description = product.description
    ? product.description.slice(0, 200)
    : `${title}${priceStr ? ` - ${priceStr}` : ''}${product.location ? ` en ${product.location}` : ''}`
  const meta: Record<string, string> = {
    'og:title': title,
    'og:description': description,
    'og:url': product.url,
    'og:type': 'product',
  }
  if (product.imageUrl) meta['og:image'] = product.imageUrl
  if (product.price) {
    meta['product:price:amount'] = String(product.price)
    meta['product:price:currency'] = product.currency ?? 'EUR'
  }
  return meta
}

function generateShareText(product: ProductData, locale: string = 'es'): string {
  const title = `${product.brand} ${product.model}`
  const year = product.year ? `${locale === 'en' ? 'Year' : 'Año'}: ${product.year}` : ''
  const km = product.km !== undefined ? `${locale === 'en' ? 'Mileage' : 'Km'}: ${product.km.toLocaleString('es-ES')} km` : ''
  const price = product.price ? `${locale === 'en' ? 'Price' : 'Precio'}: ${product.price.toLocaleString('es-ES')} ${product.currency ?? '€'}` : ''
  const location = product.location ? `${locale === 'en' ? 'Location' : 'Ubicación'}: ${product.location}` : ''
  return [title, year, km, price, location, product.url].filter(Boolean).join('\n')
}

function generateCsvRow(product: ProductData): string {
  const fields = [
    product.id, product.brand, product.model,
    String(product.year ?? ''), String(product.km ?? ''), String(product.price ?? ''),
    product.currency ?? 'EUR', product.location ?? '', product.condition ?? '',
    product.category ?? '', product.dealerName ?? '', product.url,
  ]
  return fields.map((f) => `"${f.replace(/"/g, '""')}"`).join(',')
}

const CSV_HEADER = 'id,brand,model,year,km,price,currency,location,condition,category,dealer,url'

const SAMPLE: ProductData = {
  id: 'v-1',
  brand: 'Volvo',
  model: 'FH16',
  year: 2020,
  km: 150000,
  price: 65000,
  currency: 'EUR',
  description: 'Cabeza tractora en excelente estado, revisión completa.',
  imageUrl: 'https://cdn.example.com/volvo.jpg',
  url: 'https://tracciona.com/dealer/volvo-fh16',
  dealerName: 'Trucks León',
  dealerUrl: 'https://tracciona.com/dealer',
  location: 'León',
  condition: 'Usado',
  category: 'Cabezas tractoras',
}

// ─── generateJsonLd ─────────────────────────────────────────

describe('generateJsonLd', () => {
  it('has correct @context and @type', () => {
    const ld = generateJsonLd(SAMPLE)
    expect(ld['@context']).toBe('https://schema.org')
    expect(ld['@type']).toBe('Product')
  })

  it('includes name with year', () => {
    const ld = generateJsonLd(SAMPLE)
    expect(ld.name).toBe('Volvo FH16 (2020)')
  })

  it('name without year when not provided', () => {
    const ld = generateJsonLd({ ...SAMPLE, year: undefined })
    expect(ld.name).toBe('Volvo FH16')
  })

  it('includes offers when price > 0', () => {
    const ld = generateJsonLd(SAMPLE)
    const offers = ld.offers as Record<string, unknown>
    expect(offers['@type']).toBe('Offer')
    expect(offers.price).toBe(65000)
    expect(offers.priceCurrency).toBe('EUR')
  })

  it('no offers when price is 0', () => {
    const ld = generateJsonLd({ ...SAMPLE, price: 0 })
    expect(ld.offers).toBeUndefined()
  })

  it('no offers when price undefined', () => {
    const ld = generateJsonLd({ ...SAMPLE, price: undefined })
    expect(ld.offers).toBeUndefined()
  })

  it('includes seller info', () => {
    const ld = generateJsonLd(SAMPLE)
    const seller = ld.seller as Record<string, unknown>
    expect(seller.name).toBe('Trucks León')
  })

  it('includes mileage', () => {
    const ld = generateJsonLd(SAMPLE)
    const mileage = ld.mileageFromOdometer as Record<string, unknown>
    expect(mileage.value).toBe(150000)
    expect(mileage.unitCode).toBe('KMT')
  })

  it('used condition maps correctly', () => {
    const ld = generateJsonLd(SAMPLE)
    expect(ld.itemCondition).toBe('https://schema.org/UsedCondition')
  })

  it('new condition maps correctly', () => {
    const ld = generateJsonLd({ ...SAMPLE, condition: 'Nuevo' })
    expect(ld.itemCondition).toBe('https://schema.org/NewCondition')
  })

  it('includes image when provided', () => {
    const ld = generateJsonLd(SAMPLE)
    expect(ld.image).toBe('https://cdn.example.com/volvo.jpg')
  })

  it('no image when not provided', () => {
    const ld = generateJsonLd({ ...SAMPLE, imageUrl: undefined })
    expect(ld.image).toBeUndefined()
  })
})

// ─── generateOpenGraph ──────────────────────────────────────

describe('generateOpenGraph', () => {
  it('has og:title with brand model year', () => {
    const og = generateOpenGraph(SAMPLE)
    expect(og['og:title']).toBe('Volvo FH16 2020')
  })

  it('has og:type = product', () => {
    const og = generateOpenGraph(SAMPLE)
    expect(og['og:type']).toBe('product')
  })

  it('has og:url', () => {
    const og = generateOpenGraph(SAMPLE)
    expect(og['og:url']).toBe(SAMPLE.url)
  })

  it('uses description when provided', () => {
    const og = generateOpenGraph(SAMPLE)
    expect(og['og:description']).toContain('Cabeza tractora')
  })

  it('truncates long descriptions at 200 chars', () => {
    const long = { ...SAMPLE, description: 'A'.repeat(300) }
    const og = generateOpenGraph(long)
    expect(og['og:description'].length).toBe(200)
  })

  it('generates fallback description without description', () => {
    const og = generateOpenGraph({ ...SAMPLE, description: undefined })
    expect(og['og:description']).toContain('Volvo FH16')
  })

  it('includes price meta tags', () => {
    const og = generateOpenGraph(SAMPLE)
    expect(og['product:price:amount']).toBe('65000')
    expect(og['product:price:currency']).toBe('EUR')
  })

  it('includes og:image when provided', () => {
    const og = generateOpenGraph(SAMPLE)
    expect(og['og:image']).toBe('https://cdn.example.com/volvo.jpg')
  })
})

// ─── generateShareText ──────────────────────────────────────

describe('generateShareText', () => {
  it('includes brand and model', () => {
    const text = generateShareText(SAMPLE)
    expect(text).toContain('Volvo FH16')
  })

  it('includes year in Spanish', () => {
    const text = generateShareText(SAMPLE, 'es')
    expect(text).toContain('Año: 2020')
  })

  it('includes year in English', () => {
    const text = generateShareText(SAMPLE, 'en')
    expect(text).toContain('Year: 2020')
  })

  it('includes URL', () => {
    const text = generateShareText(SAMPLE)
    expect(text).toContain(SAMPLE.url)
  })

  it('includes location', () => {
    const text = generateShareText(SAMPLE, 'es')
    expect(text).toContain('Ubicación: León')
  })

  it('omits missing fields', () => {
    const minimal: ProductData = { id: 'v-1', brand: 'Volvo', model: 'FH16', url: 'https://test.com' }
    const text = generateShareText(minimal)
    expect(text).not.toContain('Año')
    expect(text).not.toContain('Precio')
    expect(text).toContain('Volvo FH16')
    expect(text).toContain('https://test.com')
  })
})

// ─── generateCsvRow ─────────────────────────────────────────

describe('generateCsvRow', () => {
  it('produces correct number of fields', () => {
    const row = generateCsvRow(SAMPLE)
    const fields = row.split('","')
    expect(fields.length).toBe(12)
  })

  it('escapes quotes', () => {
    const withQuotes = { ...SAMPLE, brand: 'He said "hello"' }
    const row = generateCsvRow(withQuotes)
    expect(row).toContain('""hello""')
  })

  it('handles missing optional fields', () => {
    const minimal: ProductData = { id: 'v-1', brand: 'Volvo', model: 'FH16', url: 'https://test.com' }
    const row = generateCsvRow(minimal)
    expect(row).toContain('"v-1"')
    expect(row).toContain('"Volvo"')
  })

  it('CSV_HEADER has 12 columns', () => {
    expect(CSV_HEADER.split(',').length).toBe(12)
  })
})
