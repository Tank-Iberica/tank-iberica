import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  buildVehicleSchema,
  buildOrganizationSchema,
  buildBreadcrumbSchema,
  buildWebSiteSchema,
  useJsonLd,
} from '../../app/composables/useStructuredData'

const mockHead = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('useHead', mockHead)
})

// ─── buildVehicleSchema ────────────────────────────────────────────────────────

describe('buildVehicleSchema', () => {
  const minimal = { brand: 'Volvo', model: 'FH16', slug: 'volvo-fh16-abc123' }

  it('has @context schema.org', () => {
    expect(buildVehicleSchema(minimal)['@context']).toBe('https://schema.org')
  })

  it('has @type Vehicle + Product', () => {
    expect(buildVehicleSchema(minimal)['@type']).toEqual(['Vehicle', 'Product'])
  })

  it('name includes year when provided', () => {
    expect(buildVehicleSchema({ ...minimal, year: 2020 }).name).toBe('Volvo FH16 2020')
  })

  it('name excludes year when null', () => {
    expect(buildVehicleSchema({ ...minimal, year: null }).name).toBe('Volvo FH16')
  })

  it('name excludes year when not provided', () => {
    expect(buildVehicleSchema(minimal).name).toBe('Volvo FH16')
  })

  it('canonical URL uses slug', () => {
    expect(buildVehicleSchema(minimal).url).toBe('https://tracciona.com/vehiculo/volvo-fh16-abc123')
  })

  it('sku equals slug', () => {
    expect(buildVehicleSchema(minimal).sku).toBe('volvo-fh16-abc123')
  })

  it('model field equals model', () => {
    expect(buildVehicleSchema(minimal).model).toBe('FH16')
  })

  it('vehicleModelDate is year as string', () => {
    expect(buildVehicleSchema({ ...minimal, year: 2021 }).vehicleModelDate).toBe('2021')
  })

  it('vehicleModelDate is undefined when year not provided', () => {
    expect(buildVehicleSchema(minimal).vehicleModelDate).toBeUndefined()
  })

  it('brand object has @type Brand', () => {
    const s = buildVehicleSchema(minimal) as { brand: { '@type': string; name: string } }
    expect(s.brand['@type']).toBe('Brand')
    expect(s.brand.name).toBe('Volvo')
  })

  it('description is included when provided', () => {
    expect(buildVehicleSchema({ ...minimal, description: 'Good truck' }).description).toBe(
      'Good truck',
    )
  })

  it('description is undefined when null', () => {
    expect(buildVehicleSchema({ ...minimal, description: null }).description).toBeUndefined()
  })

  it('image is included when provided', () => {
    expect(
      buildVehicleSchema({ ...minimal, image: 'https://cdn.com/img.jpg' }).image,
    ).toBe('https://cdn.com/img.jpg')
  })

  it('image is undefined when null', () => {
    expect(buildVehicleSchema({ ...minimal, image: null }).image).toBeUndefined()
  })

  it('mileageFromOdometer is set when km provided', () => {
    const s = buildVehicleSchema({ ...minimal, km: 150000 }) as {
      mileageFromOdometer: { '@type': string; value: number; unitCode: string }
    }
    expect(s.mileageFromOdometer['@type']).toBe('QuantitativeValue')
    expect(s.mileageFromOdometer.value).toBe(150000)
    expect(s.mileageFromOdometer.unitCode).toBe('KMT')
  })

  it('mileageFromOdometer is undefined when km is null', () => {
    expect(buildVehicleSchema({ ...minimal, km: null }).mileageFromOdometer).toBeUndefined()
  })

  it('fuelType is included when provided', () => {
    expect(buildVehicleSchema({ ...minimal, fuelType: 'Diesel' }).fuelType).toBe('Diesel')
  })

  it('fuelType is undefined when null', () => {
    expect(buildVehicleSchema({ ...minimal, fuelType: null }).fuelType).toBeUndefined()
  })

  it('offers priceCurrency is EUR', () => {
    const s = buildVehicleSchema(minimal) as { offers: { priceCurrency: string } }
    expect(s.offers.priceCurrency).toBe('EUR')
  })

  it('offers.price is set when provided', () => {
    const s = buildVehicleSchema({ ...minimal, price: 50000 }) as { offers: { price: number } }
    expect(s.offers.price).toBe(50000)
  })

  it('offers.price is undefined when null', () => {
    const s = buildVehicleSchema({ ...minimal, price: null }) as { offers: { price?: number } }
    expect(s.offers.price).toBeUndefined()
  })

  it('offers availability is InStock', () => {
    const s = buildVehicleSchema(minimal) as { offers: { availability: string } }
    expect(s.offers.availability).toBe('https://schema.org/InStock')
  })

  it('offers.seller uses sellerName when provided', () => {
    const s = buildVehicleSchema({ ...minimal, sellerName: 'Dealer X' }) as {
      offers: { seller: { name: string } }
    }
    expect(s.offers.seller.name).toBe('Dealer X')
  })

  it('offers.seller defaults to Tracciona', () => {
    const s = buildVehicleSchema(minimal) as { offers: { seller: { name: string } } }
    expect(s.offers.seller.name).toBe('Tracciona')
  })

  it('offers.itemCondition uses provided condition', () => {
    const s = buildVehicleSchema({
      ...minimal,
      condition: 'https://schema.org/NewCondition',
    }) as { offers: { itemCondition: string } }
    expect(s.offers.itemCondition).toBe('https://schema.org/NewCondition')
  })

  it('offers.itemCondition defaults to UsedCondition', () => {
    const s = buildVehicleSchema(minimal) as { offers: { itemCondition: string } }
    expect(s.offers.itemCondition).toBe('https://schema.org/UsedCondition')
  })

  it('availableAtOrFrom is set when location provided', () => {
    const s = buildVehicleSchema({ ...minimal, location: 'Madrid' }) as {
      availableAtOrFrom: { name: string }
    }
    expect(s.availableAtOrFrom.name).toBe('Madrid')
  })

  it('availableAtOrFrom is undefined when no location', () => {
    expect(buildVehicleSchema(minimal).availableAtOrFrom).toBeUndefined()
  })

  it('availableAtOrFrom.address.addressCountry defaults to ES', () => {
    const s = buildVehicleSchema({ ...minimal, location: 'Madrid' }) as {
      availableAtOrFrom: { address: { addressCountry: string; addressRegion?: string } }
    }
    expect(s.availableAtOrFrom.address.addressCountry).toBe('ES')
  })

  it('availableAtOrFrom.address.addressCountry uses provided value', () => {
    const s = buildVehicleSchema({
      ...minimal,
      location: 'Paris',
      locationCountry: 'FR',
    }) as { availableAtOrFrom: { address: { addressCountry: string } } }
    expect(s.availableAtOrFrom.address.addressCountry).toBe('FR')
  })

  it('availableAtOrFrom.address.addressRegion is set when provided', () => {
    const s = buildVehicleSchema({
      ...minimal,
      location: 'Madrid',
      locationRegion: 'Madrid',
    }) as { availableAtOrFrom: { address: { addressRegion: string } } }
    expect(s.availableAtOrFrom.address.addressRegion).toBe('Madrid')
  })
})

// ─── buildOrganizationSchema ──────────────────────────────────────────────────

describe('buildOrganizationSchema', () => {
  it('has @context schema.org', () => {
    expect(buildOrganizationSchema()['@context']).toBe('https://schema.org')
  })

  it('has @type Organization', () => {
    expect(buildOrganizationSchema()['@type']).toBe('Organization')
  })

  it('has name Tracciona', () => {
    expect(buildOrganizationSchema().name).toBe('Tracciona')
  })

  it('has url https://tracciona.com', () => {
    expect(buildOrganizationSchema().url).toBe('https://tracciona.com')
  })

  it('has logo url', () => {
    expect(buildOrganizationSchema().logo).toBe('https://tracciona.com/icon-512x512.png')
  })

  it('has foundingDate 2024', () => {
    expect(buildOrganizationSchema().foundingDate).toBe('2024')
  })

  it('contactPoint has email', () => {
    const s = buildOrganizationSchema() as {
      contactPoint: { email: string; contactType: string }
    }
    expect(s.contactPoint.email).toBe('tankiberica@gmail.com')
  })

  it('contactPoint type is customer service', () => {
    const s = buildOrganizationSchema() as { contactPoint: { contactType: string } }
    expect(s.contactPoint.contactType).toBe('customer service')
  })

  it('sameAs is an empty array', () => {
    expect(buildOrganizationSchema().sameAs).toEqual([])
  })
})

// ─── buildBreadcrumbSchema ────────────────────────────────────────────────────

describe('buildBreadcrumbSchema', () => {
  it('has @context schema.org', () => {
    expect(buildBreadcrumbSchema([])['@context']).toBe('https://schema.org')
  })

  it('has @type BreadcrumbList', () => {
    expect(buildBreadcrumbSchema([])['@type']).toBe('BreadcrumbList')
  })

  it('returns empty itemListElement for empty input', () => {
    const s = buildBreadcrumbSchema([]) as { itemListElement: unknown[] }
    expect(s.itemListElement).toHaveLength(0)
  })

  it('position starts at 1', () => {
    const s = buildBreadcrumbSchema([{ name: 'Home' }]) as {
      itemListElement: Array<{ position: number }>
    }
    expect(s.itemListElement[0]!.position).toBe(1)
  })

  it('maps multiple items with sequential positions', () => {
    const s = buildBreadcrumbSchema([
      { name: 'Home' },
      { name: 'Camiones' },
      { name: 'Volvo' },
    ]) as { itemListElement: Array<{ position: number; name: string }> }
    expect(s.itemListElement).toHaveLength(3)
    expect(s.itemListElement[0]!.position).toBe(1)
    expect(s.itemListElement[1]!.position).toBe(2)
    expect(s.itemListElement[2]!.position).toBe(3)
  })

  it('name is mapped correctly', () => {
    const s = buildBreadcrumbSchema([{ name: 'Camiones' }]) as {
      itemListElement: Array<{ name: string }>
    }
    expect(s.itemListElement[0]!.name).toBe('Camiones')
  })

  it('includes item URL when provided', () => {
    const s = buildBreadcrumbSchema([{ name: 'Home', url: 'https://tracciona.com' }]) as {
      itemListElement: Array<{ item?: string }>
    }
    expect(s.itemListElement[0]!.item).toBe('https://tracciona.com')
  })

  it('omits item property when URL not provided', () => {
    const s = buildBreadcrumbSchema([{ name: 'Home' }]) as {
      itemListElement: Array<{ item?: string }>
    }
    expect(s.itemListElement[0]!.item).toBeUndefined()
  })
})

// ─── buildWebSiteSchema ───────────────────────────────────────────────────────

describe('buildWebSiteSchema', () => {
  it('has @context schema.org', () => {
    expect(buildWebSiteSchema()['@context']).toBe('https://schema.org')
  })

  it('has @type WebSite', () => {
    expect(buildWebSiteSchema()['@type']).toBe('WebSite')
  })

  it('has name Tracciona', () => {
    expect(buildWebSiteSchema().name).toBe('Tracciona')
  })

  it('has url https://tracciona.com', () => {
    expect(buildWebSiteSchema().url).toBe('https://tracciona.com')
  })

  it('potentialAction is SearchAction', () => {
    const s = buildWebSiteSchema() as { potentialAction: { '@type': string } }
    expect(s.potentialAction['@type']).toBe('SearchAction')
  })

  it('potentialAction.target contains search_term_string', () => {
    const s = buildWebSiteSchema() as { potentialAction: { target: string } }
    expect(s.potentialAction.target).toContain('search_term_string')
  })

  it('potentialAction.target points to site root', () => {
    const s = buildWebSiteSchema() as { potentialAction: { target: string } }
    expect(s.potentialAction.target).toContain('https://tracciona.com')
  })
})

// ─── useJsonLd ────────────────────────────────────────────────────────────────

describe('useJsonLd', () => {
  it('calls useHead once for single schema', () => {
    useJsonLd({ '@type': 'Organization' })
    expect(mockHead).toHaveBeenCalledTimes(1)
  })

  it('passes script array with one entry for single schema', () => {
    useJsonLd({ '@type': 'Organization' })
    const [config] = mockHead.mock.calls[0]!
    expect(config.script).toHaveLength(1)
  })

  it('script type is application/ld+json', () => {
    useJsonLd({ '@type': 'Organization' })
    const [config] = mockHead.mock.calls[0]!
    expect(config.script[0].type).toBe('application/ld+json')
  })

  it('script innerHTML is JSON string of the schema', () => {
    const schema = { '@type': 'Organization', name: 'Tracciona' }
    useJsonLd(schema)
    const [config] = mockHead.mock.calls[0]!
    expect(config.script[0].innerHTML).toBe(JSON.stringify(schema))
  })

  it('accepts array of schemas and creates multiple scripts', () => {
    useJsonLd([{ '@type': 'Organization' }, { '@type': 'WebSite' }])
    const [config] = mockHead.mock.calls[0]!
    expect(config.script).toHaveLength(2)
  })

  it('all scripts have application/ld+json type', () => {
    useJsonLd([{ '@type': 'Organization' }, { '@type': 'WebSite' }])
    const [config] = mockHead.mock.calls[0]!
    expect(config.script.every((s: { type: string }) => s.type === 'application/ld+json')).toBe(
      true,
    )
  })

  it('each script innerHTML contains its schema type', () => {
    useJsonLd([{ '@type': 'Organization' }, { '@type': 'WebSite' }])
    const [config] = mockHead.mock.calls[0]!
    expect(config.script[0].innerHTML).toContain('Organization')
    expect(config.script[1].innerHTML).toContain('WebSite')
  })
})
