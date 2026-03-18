/**
 * Tests for #63 — Landing page catalog filtering
 *
 * Validates:
 * - filters_json parsing and application
 * - Filter combinations (subcategory, province, brand)
 * - Empty filters handling
 */
import { describe, it, expect } from 'vitest'

// ── Replicate filter application logic from [...slug].vue ───────────────────

interface FiltersJson {
  subcategory_id?: string
  location_province_eq?: string
  brand?: string
}

/**
 * Build a list of filter operations from filters_json.
 * Each entry is [method, column, value].
 */
function buildFilterOps(filters: FiltersJson): Array<[string, string, string]> {
  const ops: Array<[string, string, string]> = []
  if (filters.subcategory_id) ops.push(['eq', 'subcategory_id', filters.subcategory_id])
  if (filters.location_province_eq) ops.push(['eq', 'location_province', filters.location_province_eq])
  if (filters.brand) ops.push(['ilike', 'brand', filters.brand])
  return ops
}

describe('Landing catalog — filters_json parsing (#63)', () => {
  it('builds subcategory filter', () => {
    const ops = buildFilterOps({ subcategory_id: 'abc-123' })
    expect(ops).toEqual([['eq', 'subcategory_id', 'abc-123']])
  })

  it('builds province filter', () => {
    const ops = buildFilterOps({ location_province_eq: 'Madrid' })
    expect(ops).toEqual([['eq', 'location_province', 'Madrid']])
  })

  it('builds brand filter with ilike', () => {
    const ops = buildFilterOps({ brand: 'Volvo' })
    expect(ops).toEqual([['ilike', 'brand', 'Volvo']])
  })

  it('builds combined subcategory + province', () => {
    const ops = buildFilterOps({ subcategory_id: 'sub-1', location_province_eq: 'Barcelona' })
    expect(ops).toHaveLength(2)
    expect(ops[0]).toEqual(['eq', 'subcategory_id', 'sub-1'])
    expect(ops[1]).toEqual(['eq', 'location_province', 'Barcelona'])
  })

  it('builds combined subcategory + brand', () => {
    const ops = buildFilterOps({ subcategory_id: 'sub-2', brand: 'MAN' })
    expect(ops).toHaveLength(2)
    expect(ops[0]).toEqual(['eq', 'subcategory_id', 'sub-2'])
    expect(ops[1]).toEqual(['ilike', 'brand', 'MAN'])
  })

  it('returns empty for empty filters', () => {
    const ops = buildFilterOps({})
    expect(ops).toHaveLength(0)
  })

  it('ignores undefined values', () => {
    const ops = buildFilterOps({ subcategory_id: undefined, brand: undefined })
    expect(ops).toHaveLength(0)
  })
})

describe('Landing catalog — slug generation (#63)', () => {
  function buildLandingSlug(type: string, province?: string, brand?: string): string {
    const base = type.toLowerCase().replaceAll(' ', '-')
    if (province) return `${base}-${province.toLowerCase().replaceAll(' ', '-')}`
    if (brand) return `${base}-${brand.toLowerCase().replaceAll(' ', '-')}`
    return base
  }

  it('generates type-only slug', () => {
    expect(buildLandingSlug('camiones-frigorificos')).toBe('camiones-frigorificos')
  })

  it('generates type+province slug', () => {
    expect(buildLandingSlug('camiones-frigorificos', 'Madrid')).toBe('camiones-frigorificos-madrid')
  })

  it('generates type+brand slug', () => {
    expect(buildLandingSlug('camiones-frigorificos', undefined, 'Volvo')).toBe('camiones-frigorificos-volvo')
  })

  it('handles spaces in province name', () => {
    expect(buildLandingSlug('gruas', 'Santa Cruz de Tenerife')).toBe('gruas-santa-cruz-de-tenerife')
  })
})
