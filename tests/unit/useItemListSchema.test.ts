import { describe, it, expect } from 'vitest'
import { buildItemListSchema } from '../../app/utils/itemListSchema'

const SITE_URL = 'https://tracciona.com'

describe('buildItemListSchema', () => {
  it('returns null when items array is empty', () => {
    const result = buildItemListSchema([], SITE_URL)
    expect(result).toBeNull()
  })

  it('returns ItemList schema with correct @type and @context', () => {
    const schema = buildItemListSchema([{ slug: 'cisterna-001', name: 'Cisterna' }], SITE_URL)
    expect(schema!['@type']).toBe('ItemList')
    expect(schema!['@context']).toBe('https://schema.org')
  })

  it('numberOfItems matches items length', () => {
    const items = [
      { slug: 'a', name: 'A' },
      { slug: 'b', name: 'B' },
      { slug: 'c', name: 'C' },
    ]
    const schema = buildItemListSchema(items, SITE_URL)
    expect(schema!.numberOfItems).toBe(3)
  })

  it('itemListElement has correct length', () => {
    const items = [{ slug: 'a', name: 'A' }, { slug: 'b', name: 'B' }]
    const schema = buildItemListSchema(items, SITE_URL)
    const elements = schema!.itemListElement as unknown[]
    expect(elements).toHaveLength(2)
  })

  it('each element has @type ListItem with position, url, name', () => {
    const schema = buildItemListSchema(
      [{ slug: 'cisterna-abc', name: 'Cisterna ABC' }],
      SITE_URL,
    )
    const el = (schema!.itemListElement as Array<Record<string, unknown>>)[0]
    expect(el['@type']).toBe('ListItem')
    expect(el.position).toBe(1)
    expect(el.url).toBe(`${SITE_URL}/vehiculo/cisterna-abc`)
    expect(el.name).toBe('Cisterna ABC')
  })

  it('positions are sequential starting from 1', () => {
    const items = [
      { slug: 'x', name: 'X' },
      { slug: 'y', name: 'Y' },
      { slug: 'z', name: 'Z' },
    ]
    const schema = buildItemListSchema(items, SITE_URL)
    const elements = schema!.itemListElement as Array<Record<string, unknown>>
    expect(elements[0].position).toBe(1)
    expect(elements[1].position).toBe(2)
    expect(elements[2].position).toBe(3)
  })

  it('url uses siteUrl + /vehiculo/ + slug', () => {
    const schema = buildItemListSchema([{ slug: 'trailer-xyz', name: 'Trailer' }], SITE_URL)
    const el = (schema!.itemListElement as Array<Record<string, unknown>>)[0]
    expect(el.url).toBe('https://tracciona.com/vehiculo/trailer-xyz')
  })

  it('includes image when imageUrl is provided', () => {
    const schema = buildItemListSchema(
      [{ slug: 'a', name: 'A', imageUrl: 'https://cdn.example.com/img.jpg' }],
      SITE_URL,
    )
    const el = (schema!.itemListElement as Array<Record<string, unknown>>)[0]
    expect(el.image).toBe('https://cdn.example.com/img.jpg')
  })

  it('omits image when imageUrl is not provided', () => {
    const schema = buildItemListSchema([{ slug: 'a', name: 'A' }], SITE_URL)
    const el = (schema!.itemListElement as Array<Record<string, unknown>>)[0]
    expect('image' in el).toBe(false)
  })

  it('includes name when listName is provided', () => {
    const schema = buildItemListSchema([{ slug: 'a', name: 'A' }], SITE_URL, 'Cisternas de aluminio')
    expect(schema!.name).toBe('Cisternas de aluminio')
  })

  it('omits name when listName is not provided', () => {
    const schema = buildItemListSchema([{ slug: 'a', name: 'A' }], SITE_URL)
    expect('name' in schema!).toBe(false)
  })

  it('works with different siteUrl base', () => {
    const schema = buildItemListSchema(
      [{ slug: 'truck-1', name: 'Truck' }],
      'https://fleetbase.io',
    )
    const el = (schema!.itemListElement as Array<Record<string, unknown>>)[0]
    expect(el.url).toBe('https://fleetbase.io/vehiculo/truck-1')
  })

  it('handles 20 items correctly (max recommended)', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({ slug: `v-${i}`, name: `V ${i}` }))
    const schema = buildItemListSchema(items, SITE_URL)
    const elements = schema!.itemListElement as unknown[]
    expect(elements).toHaveLength(20)
    expect(schema!.numberOfItems).toBe(20)
  })
})
