/**
 * Tests for POST /api/cron/recalculate-landings
 *
 * Covers:
 * - Helper functions: updatePriceRange, incrementBrandCount, getTopBrands, formatPrice
 * - Intro text builders: buildTypeIntroEs/En, buildTypeProvinceIntroEs/En, buildTypeBrandIntroEs/En
 * - Handler integration: correct intro_text in upserted landings
 *
 * Backlog #164 — Texto auto-generado en landings con datos reales
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

// ─── Mocks ─────────────────────────────────────────────────────────────────────

const { mockReadBody, mockServiceRole, mockVerifyCronSecret } = vi.hoisted(() => ({
  mockReadBody: vi.fn().mockResolvedValue({ secret: 'cron-secret' }),
  mockServiceRole: vi.fn(),
  mockVerifyCronSecret: vi.fn(),
}))

vi.mock('~~/server/utils/cronLock', () => ({ acquireDbCronLock: vi.fn().mockResolvedValue(true) }))
vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: mockReadBody,
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: mockServiceRole,
}))

vi.mock('../../../server/utils/verifyCronSecret', () => ({
  verifyCronSecret: mockVerifyCronSecret,
}))
vi.mock('../../../server/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.stubGlobal('useRuntimeConfig', () => ({
  cronSecret: 'cron-secret',
  public: {},
}))

// ─── Imports ───────────────────────────────────────────────────────────────────

import handler, {
  updatePriceRange,
  incrementBrandCount,
  getTopBrands,
  formatPrice,
  buildTypeIntroEs,
  buildTypeIntroEn,
  buildTypeProvinceIntroEs,
  buildTypeProvinceIntroEn,
  buildTypeBrandIntroEs,
  buildTypeBrandIntroEn,
} from '../../../server/api/cron/recalculate-landings.post'

// ─── updatePriceRange ──────────────────────────────────────────────────────────

describe('updatePriceRange', () => {
  it('sets initial min and max from non-null price', () => {
    const entry = { minPrice: null as number | null, maxPrice: null as number | null }
    updatePriceRange(entry, 15000)
    expect(entry.minPrice).toBe(15000)
    expect(entry.maxPrice).toBe(15000)
  })

  it('updates min when lower price seen', () => {
    const entry = { minPrice: 10000, maxPrice: 20000 }
    updatePriceRange(entry, 5000)
    expect(entry.minPrice).toBe(5000)
    expect(entry.maxPrice).toBe(20000)
  })

  it('updates max when higher price seen', () => {
    const entry = { minPrice: 5000, maxPrice: 20000 }
    updatePriceRange(entry, 30000)
    expect(entry.minPrice).toBe(5000)
    expect(entry.maxPrice).toBe(30000)
  })

  it('ignores null price', () => {
    const entry = { minPrice: 5000 as number | null, maxPrice: 10000 as number | null }
    updatePriceRange(entry, null)
    expect(entry.minPrice).toBe(5000)
    expect(entry.maxPrice).toBe(10000)
  })

  it('ignores zero price', () => {
    const entry = { minPrice: null as number | null, maxPrice: null as number | null }
    updatePriceRange(entry, 0)
    expect(entry.minPrice).toBeNull()
    expect(entry.maxPrice).toBeNull()
  })
})

// ─── incrementBrandCount ───────────────────────────────────────────────────────

describe('incrementBrandCount', () => {
  it('initializes brand count to 1', () => {
    const brandCounts = new Map<string, number>()
    incrementBrandCount(brandCounts, 'Volvo')
    expect(brandCounts.get('Volvo')).toBe(1)
  })

  it('increments existing brand count', () => {
    const brandCounts = new Map<string, number>([['Volvo', 3]])
    incrementBrandCount(brandCounts, 'Volvo')
    expect(brandCounts.get('Volvo')).toBe(4)
  })

  it('ignores null brand', () => {
    const brandCounts = new Map<string, number>()
    incrementBrandCount(brandCounts, null)
    expect(brandCounts.size).toBe(0)
  })
})

// ─── getTopBrands ──────────────────────────────────────────────────────────────

describe('getTopBrands', () => {
  it('returns top N brands sorted by count descending', () => {
    const brandCounts = new Map([
      ['Volvo', 10],
      ['Scania', 7],
      ['MAN', 5],
      ['DAF', 3],
    ])
    expect(getTopBrands(brandCounts, 3)).toEqual(['Volvo', 'Scania', 'MAN'])
  })

  it('returns all brands when fewer than N', () => {
    const brandCounts = new Map([['Volvo', 2]])
    expect(getTopBrands(brandCounts, 3)).toEqual(['Volvo'])
  })

  it('returns empty array for empty map', () => {
    expect(getTopBrands(new Map())).toEqual([])
  })

  it('defaults to 3 brands', () => {
    const brandCounts = new Map([
      ['A', 5],
      ['B', 4],
      ['C', 3],
      ['D', 2],
    ])
    expect(getTopBrands(brandCounts)).toHaveLength(3)
  })
})

// ─── formatPrice ──────────────────────────────────────────────────────────────

describe('formatPrice', () => {
  it('formats ES with period thousand separator', () => {
    expect(formatPrice(12500, 'es')).toBe('12.500')
  })

  it('formats EN with comma thousand separator', () => {
    expect(formatPrice(12500, 'en')).toBe('12,500')
  })

  it('formats small numbers without separators', () => {
    expect(formatPrice(999, 'es')).toBe('999')
    expect(formatPrice(999, 'en')).toBe('999')
  })
})

// ─── buildTypeIntroEs ─────────────────────────────────────────────────────────

describe('buildTypeIntroEs', () => {
  it('includes count and type', () => {
    const text = buildTypeIntroEs('Tractores', 15, null, null, [])
    expect(text).toContain('15 tractores')
    expect(text).toContain('Tracciona')
  })

  it('includes price range when both prices available', () => {
    const text = buildTypeIntroEs('Tractores', 15, 5000, 25000, [])
    expect(text).toContain('5.000€')
    expect(text).toContain('25.000€')
    expect(text).toContain('Precios desde')
  })

  it('shows single price when min equals max', () => {
    const text = buildTypeIntroEs('Tractores', 1, 10000, 10000, [])
    expect(text).toContain('Precio: 10.000€')
    expect(text).not.toContain('Precios desde')
  })

  it('includes top brands when available', () => {
    const text = buildTypeIntroEs('Tractores', 15, null, null, ['Volvo', 'Scania'])
    expect(text).toContain('Volvo, Scania')
    expect(text).toContain('marcas más habituales')
  })

  it('omits brands section when no brands', () => {
    const text = buildTypeIntroEs('Tractores', 15, null, null, [])
    expect(text).not.toContain('marcas')
  })

  it('includes call to action', () => {
    const text = buildTypeIntroEs('Tractores', 15, null, null, [])
    expect(text).toContain('propietarios y empresas verificadas')
  })
})

// ─── buildTypeIntroEn ─────────────────────────────────────────────────────────

describe('buildTypeIntroEn', () => {
  it('includes count and type', () => {
    const text = buildTypeIntroEn('Tractors', 15, null, null, [])
    expect(text).toContain('15 used tractors')
    expect(text).toContain('Tracciona')
  })

  it('includes price range', () => {
    const text = buildTypeIntroEn('Tractors', 15, 5000, 25000, [])
    expect(text).toContain('€5,000')
    expect(text).toContain('€25,000')
    expect(text).toContain('Priced from')
  })

  it('includes top brands', () => {
    const text = buildTypeIntroEn('Tractors', 15, null, null, ['Volvo', 'Scania'])
    expect(text).toContain('Volvo, Scania')
    expect(text).toContain('Top brands include')
  })

  it('includes call to action', () => {
    const text = buildTypeIntroEn('Tractors', 15, null, null, [])
    expect(text).toContain('verified owners and businesses')
  })
})

// ─── buildTypeProvinceIntroEs ─────────────────────────────────────────────────

describe('buildTypeProvinceIntroEs', () => {
  it('includes province name', () => {
    const text = buildTypeProvinceIntroEs('Tractores', 'León', 8, null, null, [])
    expect(text).toContain('León')
    expect(text).toContain('8 tractores')
  })

  it('includes price range', () => {
    const text = buildTypeProvinceIntroEs('Tractores', 'León', 8, 8000, 20000, [])
    expect(text).toContain(formatPrice(8000, 'es') + '€')
    expect(text).toContain(formatPrice(20000, 'es') + '€')
  })

  it('includes brands when available', () => {
    const text = buildTypeProvinceIntroEs('Tractores', 'León', 8, null, null, ['Volvo'])
    expect(text).toContain('Marcas disponibles: Volvo')
  })

  it('omits brands section when empty', () => {
    const text = buildTypeProvinceIntroEs('Tractores', 'León', 8, null, null, [])
    expect(text).not.toContain('Marcas')
  })
})

// ─── buildTypeProvinceIntroEn ─────────────────────────────────────────────────

describe('buildTypeProvinceIntroEn', () => {
  it('includes province name', () => {
    const text = buildTypeProvinceIntroEn('Tractors', 'León', 8, null, null, [])
    expect(text).toContain('León')
    expect(text).toContain('8 used tractors')
  })

  it('includes price range', () => {
    const text = buildTypeProvinceIntroEn('Tractors', 'León', 8, 8000, 20000, [])
    expect(text).toContain('€8,000')
    expect(text).toContain('€20,000')
  })

  it('includes brands', () => {
    const text = buildTypeProvinceIntroEn('Tractors', 'León', 8, null, null, ['Volvo'])
    expect(text).toContain('Available brands: Volvo')
  })
})

// ─── buildTypeBrandIntroEs ────────────────────────────────────────────────────

describe('buildTypeBrandIntroEs', () => {
  it('includes brand and type', () => {
    const text = buildTypeBrandIntroEs('Tractores', 'Volvo', 5, null, null)
    expect(text).toContain('Volvo tractores')
    expect(text).toContain('5')
  })

  it('includes price range', () => {
    const text = buildTypeBrandIntroEs('Tractores', 'Volvo', 5, 12000, 35000, null)
    expect(text).toContain('12.000€')
    expect(text).toContain('35.000€')
  })

  it('includes verification note', () => {
    const text = buildTypeBrandIntroEs('Tractores', 'Volvo', 5, null, null)
    expect(text).toContain('revisados')
  })

  it('handles null max price gracefully (no price text)', () => {
    const text = buildTypeBrandIntroEs('Tractores', 'Volvo', 5, 10000, null)
    expect(text).not.toContain('€')
  })
})

// ─── buildTypeBrandIntroEn ────────────────────────────────────────────────────

describe('buildTypeBrandIntroEn', () => {
  it('includes brand and type', () => {
    const text = buildTypeBrandIntroEn('Tractors', 'Volvo', 5, null, null)
    expect(text).toContain('Volvo tractors')
    expect(text).toContain('5')
  })

  it('includes price range', () => {
    const text = buildTypeBrandIntroEn('Tractors', 'Volvo', 5, 12000, 35000)
    expect(text).toContain('€12,000')
    expect(text).toContain('€35,000')
  })
})

// ─── Handler integration ───────────────────────────────────────────────────────

describe('POST /api/cron/recalculate-landings', () => {
  const mockSub = { id: 'sub-1', slug: 'tractores', name_es: 'Tractores', name_en: 'Tractors' }

  const mockVehicles = [
    {
      id: 'v1',
      brand: 'Volvo',
      location_province: 'León',
      subcategory_id: 'sub-1',
      price: 15000,
      subcategories: mockSub,
    },
    {
      id: 'v2',
      brand: 'Scania',
      location_province: 'León',
      subcategory_id: 'sub-1',
      price: 25000,
      subcategories: mockSub,
    },
    {
      id: 'v3',
      brand: 'Volvo',
      location_province: 'Burgos',
      subcategory_id: 'sub-1',
      price: 10000,
      subcategories: mockSub,
    },
    {
      id: 'v4',
      brand: 'Volvo',
      location_province: null,
      subcategory_id: 'sub-1',
      price: null,
      subcategories: mockSub,
    },
    {
      id: 'v5',
      brand: null,
      location_province: 'León',
      subcategory_id: 'sub-1',
      price: 20000,
      subcategories: mockSub,
    },
  ]

  function makeSupabase(vehicles: unknown[], upsertError: unknown = null) {
    const upsertChain: any = {
      upsert: vi.fn().mockResolvedValue({ error: upsertError }),
    }
    const updateChain: any = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      lt: vi.fn().mockResolvedValue({ error: null }),
    }
    const selectChain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockResolvedValue({ data: vehicles, error: null }),
    }
    return {
      from: vi.fn((table: string) => {
        if (table === 'vehicles') return selectChain
        if (table === 'active_landings') return { ...upsertChain, ...updateChain }
        return selectChain
      }),
    }
  }

  beforeEach(() => {
    mockReadBody.mockResolvedValue({ secret: 'cron-secret' })
  })

  it('returns ok with correct totals', async () => {
    const supabase = makeSupabase(mockVehicles)
    mockServiceRole.mockReturnValue(supabase)

    const result = await handler({} as any)
    expect(result.ok).toBe(true)
    expect(result.total).toBeGreaterThan(0)
  })

  it('upserts landings with intro_text_es containing count', async () => {
    let capturedLandings: any[] = []
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'vehicles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            not: vi.fn().mockResolvedValue({ data: mockVehicles, error: null }),
          }
        }
        return {
          upsert: vi.fn((rows: any[]) => {
            capturedLandings = [...capturedLandings, ...rows]
            return Promise.resolve({ error: null })
          }),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          lt: vi.fn().mockResolvedValue({ error: null }),
        }
      }),
    }
    mockServiceRole.mockReturnValue(supabase)

    await handler({} as any)

    const typeLanding = capturedLandings.find((l: any) => l.slug === 'tractores')
    expect(typeLanding).toBeDefined()
    expect(typeLanding.intro_text_es).toContain('5') // 5 total tractores
    expect(typeLanding.intro_text_es).toContain('tractores')
    expect(typeLanding.intro_text_en).toContain('tractors')
  })

  it('upserts landings with price range in intro text when prices available', async () => {
    let capturedLandings: any[] = []
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'vehicles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            not: vi.fn().mockResolvedValue({ data: mockVehicles, error: null }),
          }
        }
        return {
          upsert: vi.fn((rows: any[]) => {
            capturedLandings = [...capturedLandings, ...rows]
            return Promise.resolve({ error: null })
          }),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          lt: vi.fn().mockResolvedValue({ error: null }),
        }
      }),
    }
    mockServiceRole.mockReturnValue(supabase)

    await handler({} as any)

    const typeLanding = capturedLandings.find((l: any) => l.slug === 'tractores')
    // min=10000, max=25000 (ignores null price of v4)
    expect(typeLanding.intro_text_es).toContain('10.000€')
    expect(typeLanding.intro_text_es).toContain('25.000€')
  })

  it('upserts province landing with province name in intro', async () => {
    let capturedLandings: any[] = []
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'vehicles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            not: vi.fn().mockResolvedValue({ data: mockVehicles, error: null }),
          }
        }
        return {
          upsert: vi.fn((rows: any[]) => {
            capturedLandings = [...capturedLandings, ...rows]
            return Promise.resolve({ error: null })
          }),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          lt: vi.fn().mockResolvedValue({ error: null }),
        }
      }),
    }
    mockServiceRole.mockReturnValue(supabase)

    await handler({} as any)

    const leonLanding = capturedLandings.find((l: any) => l.slug === 'tractores-leon')
    expect(leonLanding).toBeDefined()
    expect(leonLanding.intro_text_es).toContain('León')
    expect(leonLanding.intro_text_en).toContain('León')
  })

  it('upserts brand landing with brand name in intro', async () => {
    let capturedLandings: any[] = []
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'vehicles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            not: vi.fn().mockResolvedValue({ data: mockVehicles, error: null }),
          }
        }
        return {
          upsert: vi.fn((rows: any[]) => {
            capturedLandings = [...capturedLandings, ...rows]
            return Promise.resolve({ error: null })
          }),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          lt: vi.fn().mockResolvedValue({ error: null }),
        }
      }),
    }
    mockServiceRole.mockReturnValue(supabase)

    await handler({} as any)

    const volvoBrandLanding = capturedLandings.find((l: any) => l.slug === 'tractores-volvo')
    expect(volvoBrandLanding).toBeDefined()
    expect(volvoBrandLanding.intro_text_es).toContain('Volvo')
    expect(volvoBrandLanding.intro_text_en).toContain('Volvo')
  })

  it('returns ok with zero totals when no vehicles', async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    }
    mockServiceRole.mockReturnValue(supabase)

    const result = await handler({} as any)
    expect(result.ok).toBe(true)
    expect(result.total).toBe(0)
  })

  it('returns error when fetch fails', async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      })),
    }
    mockServiceRole.mockReturnValue(supabase)

    const result = await handler({} as any)
    expect(result.ok).toBe(false)
    expect(result.error).toBe('Database error')
  })
})
