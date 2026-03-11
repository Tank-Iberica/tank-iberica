import { describe, it, expect, vi, beforeEach } from 'vitest'
import { applyFilters } from '../../../app/composables/shared/vehiclesHelpers'
import type { FilterChain } from '../../../app/composables/shared/vehiclesHelpers'
import type { VehicleFilters } from '../../../app/composables/shared/vehiclesTypes'

// ── Mock query builder ────────────────────────────────────────────────────────

function makeChain(): { chain: FilterChain; calls: Array<[string, ...unknown[]]> } {
  const calls: Array<[string, ...unknown[]]> = []
  const chain: FilterChain = {
    eq: vi.fn((col, val) => { calls.push(['eq', col, val]); return chain }),
    gte: vi.fn((col, val) => { calls.push(['gte', col, val]); return chain }),
    lte: vi.fn((col, val) => { calls.push(['lte', col, val]); return chain }),
    in: vi.fn((col, vals) => { calls.push(['in', col, vals]); return chain }),
    or: vi.fn((filter) => { calls.push(['or', filter]); return chain }),
    ilike: vi.fn((col, pattern) => { calls.push(['ilike', col, pattern]); return chain }),
  }
  return { chain, calls }
}

function callNames(calls: Array<[string, ...unknown[]]>): string[] {
  return calls.map(([name]) => name)
}

// ── visible_from guard ────────────────────────────────────────────────────────

describe('applyFilters — visible_from guard', () => {
  it('always adds the visible_from or-filter', () => {
    const { chain, calls } = makeChain()
    applyFilters(chain, {})
    expect(callNames(calls)).toContain('or')
    const orCall = calls.find(([name]) => name === 'or')!
    expect(orCall[1]).toMatch(/visible_from/)
  })
})

// ── category / action filters ─────────────────────────────────────────────────

describe('applyFilters — category/action', () => {
  it('uses in() when actions array provided', () => {
    const { chain, calls } = makeChain()
    applyFilters(chain, { actions: ['venta', 'alquiler'] })
    const inCall = calls.find(([n, col]) => n === 'in' && col === 'category')
    expect(inCall).toBeDefined()
  })

  it('uses in() when categories array provided (alias)', () => {
    const { chain, calls } = makeChain()
    applyFilters(chain, { categories: ['venta'] })
    const inCall = calls.find(([n, col]) => n === 'in' && col === 'category')
    expect(inCall).toBeDefined()
  })

  it('uses eq() for single action string', () => {
    const { chain, calls } = makeChain()
    applyFilters(chain, { action: 'venta' })
    const eqCall = calls.find(([n, col]) => n === 'eq' && col === 'category')
    expect(eqCall).toBeDefined()
    expect(eqCall![2]).toBe('venta')
  })

  it('uses eq() for single category string', () => {
    const { chain, calls } = makeChain()
    applyFilters(chain, { category: 'alquiler' })
    const eqCall = calls.find(([n, col]) => n === 'eq' && col === 'category')
    expect(eqCall![2]).toBe('alquiler')
  })

  it('does not add category filter when none specified', () => {
    const { chain, calls } = makeChain()
    applyFilters(chain, {})
    const hasCatFilter = calls.some(([_, col]) => col === 'category')
    expect(hasCatFilter).toBe(false)
  })
})

// ── category_id ───────────────────────────────────────────────────────────────

describe('applyFilters — category_id', () => {
  it('adds eq(category_id) when specified', () => {
    const { chain, calls } = makeChain()
    applyFilters(chain, { category_id: 'cat-123' })
    const call = calls.find(([n, col]) => n === 'eq' && col === 'category_id')
    expect(call![2]).toBe('cat-123')
  })

  it('does not add category_id when not specified', () => {
    const { chain, calls } = makeChain()
    applyFilters(chain, {})
    expect(calls.some(([_, col]) => col === 'category_id')).toBe(false)
  })
})

// ── price range ───────────────────────────────────────────────────────────────

describe('applyFilters — price range', () => {
  it('adds gte for price_min', () => {
    const { chain, calls } = makeChain()
    applyFilters(chain, { price_min: 10000 })
    expect(calls).toContainEqual(['gte', 'price', 10000])
  })

  it('adds lte for price_max', () => {
    const { chain, calls } = makeChain()
    applyFilters(chain, { price_max: 50000 })
    expect(calls).toContainEqual(['lte', 'price', 50000])
  })

  it('adds both for price range', () => {
    const { chain, calls } = makeChain()
    applyFilters(chain, { price_min: 5000, price_max: 30000 })
    expect(calls).toContainEqual(['gte', 'price', 5000])
    expect(calls).toContainEqual(['lte', 'price', 30000])
  })

  it('allows price_min of 0', () => {
    const { chain, calls } = makeChain()
    applyFilters(chain, { price_min: 0 })
    expect(calls).toContainEqual(['gte', 'price', 0])
  })
})

// ── year range ────────────────────────────────────────────────────────────────

describe('applyFilters — year range', () => {
  it('adds gte for year_min', () => {
    const { chain, calls } = makeChain()
    applyFilters(chain, { year_min: 2018 })
    expect(calls).toContainEqual(['gte', 'year', 2018])
  })

  it('adds lte for year_max', () => {
    const { chain, calls } = makeChain()
    applyFilters(chain, { year_max: 2023 })
    expect(calls).toContainEqual(['lte', 'year', 2023])
  })
})

// ── brand ─────────────────────────────────────────────────────────────────────

describe('applyFilters — brand', () => {
  it('adds ilike for brand', () => {
    const { chain, calls } = makeChain()
    applyFilters(chain, { brand: 'Volvo' })
    expect(calls).toContainEqual(['ilike', 'brand', '%Volvo%'])
  })

  it('does not add ilike when brand not specified', () => {
    const { chain, calls } = makeChain()
    applyFilters(chain, {})
    expect(calls.some(([n]) => n === 'ilike')).toBe(false)
  })
})

// ── location filters (priority: province > region > country) ──────────────────

describe('applyFilters — location (province wins)', () => {
  it('uses eq(location_province) when province_eq specified', () => {
    const { chain, calls } = makeChain()
    applyFilters(chain, {
      location_province_eq: 'Madrid',
      location_regions: ['Centro'],
      location_countries: ['ES'],
    })
    expect(calls).toContainEqual(['eq', 'location_province', 'Madrid'])
    expect(calls.some(([_, col]) => col === 'location_region')).toBe(false)
    expect(calls.some(([_, col]) => col === 'location_country')).toBe(false)
  })

  it('uses in(location_region) when region specified and no province', () => {
    const { chain, calls } = makeChain()
    applyFilters(chain, {
      location_regions: ['Cataluña'],
      location_countries: ['ES'],
    })
    expect(calls.some(([n, col]) => n === 'in' && col === 'location_region')).toBe(true)
    expect(calls.some(([_, col]) => col === 'location_country')).toBe(false)
  })

  it('uses in(location_country) when only countries specified', () => {
    const { chain, calls } = makeChain()
    applyFilters(chain, { location_countries: ['ES', 'PT'] })
    expect(calls.some(([n, col]) => n === 'in' && col === 'location_country')).toBe(true)
  })

  it('does not add location filters when none specified', () => {
    const { chain, calls } = makeChain()
    applyFilters(chain, {})
    expect(calls.some(([_, col]) => String(col).startsWith('location_'))).toBe(false)
  })

  it('does not apply region filter when array is empty', () => {
    const { chain, calls } = makeChain()
    applyFilters(chain, { location_regions: [] })
    expect(calls.some(([_, col]) => col === 'location_region')).toBe(false)
  })
})

// ── featured & dealer_id ──────────────────────────────────────────────────────

describe('applyFilters — featured and dealer_id', () => {
  it('adds eq(featured, true) when featured=true', () => {
    const { chain, calls } = makeChain()
    applyFilters(chain, { featured: true })
    expect(calls).toContainEqual(['eq', 'featured', true])
  })

  it('does not add featured filter when false/undefined', () => {
    const { chain, calls } = makeChain()
    applyFilters(chain, { featured: false })
    expect(calls.some(([_, col]) => col === 'featured')).toBe(false)
  })

  it('adds eq(dealer_id) when specified', () => {
    const { chain, calls } = makeChain()
    applyFilters(chain, { dealer_id: 'dealer-abc' })
    expect(calls).toContainEqual(['eq', 'dealer_id', 'dealer-abc'])
  })
})

// ── combined filter scenario ──────────────────────────────────────────────────

describe('applyFilters — combined filters', () => {
  it('applies all filters together without conflicts', () => {
    const { chain, calls } = makeChain()
    const filters: VehicleFilters = {
      category: 'venta',
      category_id: 'cat-1',
      price_min: 10000,
      price_max: 80000,
      year_min: 2015,
      year_max: 2024,
      brand: 'MAN',
      featured: true,
      dealer_id: 'dealer-1',
      location_countries: ['ES'],
    }
    applyFilters(chain, filters)
    expect(calls.length).toBeGreaterThan(5)
    expect(calls.some(([n]) => n === 'or')).toBe(true) // visible_from
    expect(calls.some(([n, col]) => n === 'eq' && col === 'category')).toBe(true)
    expect(calls.some(([n, col]) => n === 'eq' && col === 'category_id')).toBe(true)
    expect(calls.some(([n]) => n === 'ilike')).toBe(true)
    expect(calls.some(([n, col]) => n === 'eq' && col === 'featured')).toBe(true)
  })

  it('returns the same chain (fluent API)', () => {
    const { chain } = makeChain()
    const result = applyFilters(chain, { brand: 'Volvo' })
    expect(result).toBe(chain)
  })
})
