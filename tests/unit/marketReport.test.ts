import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { MarketRow, PriceHistoryRow } from '../../server/services/marketReport'
import { generateMarketReport, generateDealerIntelligence } from '../../server/services/marketReport'

// ─── Helper: mock Supabase client ─────────────────────────────

function makeRow(overrides: Partial<MarketRow> = {}): MarketRow {
  return {
    id: 'mr-1',
    vertical: 'tracciona',
    subcategory: 'Camiones',
    brand: 'Volvo',
    avg_price: 45000,
    median_price: 42000,
    min_price: 30000,
    max_price: 60000,
    listings: 50,
    sold_count: 10,
    avg_days_to_sell: 25,
    location_province: 'Madrid',
    month: '2026-02',
    ...overrides,
  }
}

function makeHistoryRow(overrides: Partial<PriceHistoryRow> = {}): PriceHistoryRow {
  return {
    id: 'ph-1',
    vertical: 'tracciona',
    subcategory: 'Camiones',
    avg_price: 44000,
    median_price: 41000,
    listings: 45,
    week: '2026-02-01',
    ...overrides,
  }
}

interface ChainResult {
  data: unknown
  error: unknown
  count?: number
}

function createMockSupabase(
  marketResult: ChainResult = { data: [], error: null },
  historyResult: ChainResult = { data: [], error: null },
) {
  let callCount = 0

  const createChain = (result: ChainResult) => {
    const chain: Record<string, unknown> = {}
    const methods = ['select', 'eq', 'gte', 'lte', 'neq', 'not', 'order', 'limit', 'in']
    methods.forEach((m) => {
      chain[m] = () => chain
    })
    // Make the chain thenable
    chain.then = (resolve: (val: ChainResult) => unknown) => resolve(result)
    return chain
  }

  return {
    from: (table: string) => {
      callCount++
      if (table === 'market_data') return createChain(marketResult)
      if (table === 'price_history') return createChain(historyResult)
      if (table === 'vehicles') {
        // For dealer intelligence - first call = dealer vehicles, second = market vehicles
        return createChain(callCount <= 2 ? marketResult : historyResult)
      }
      return createChain({ data: [], error: null })
    },
  }
}

// ─── generateMarketReport ─────────────────────────────────────

describe('generateMarketReport', () => {
  it('returns HTML with no data', async () => {
    const supabase = createMockSupabase()
    const result = await generateMarketReport(supabase as any, { isPublic: true })
    expect(result.html).toContain('<!DOCTYPE html>')
    expect(result.html).toContain('Informe de Mercado')
    expect(result.html).toContain('TRACCIONA')
    expect(result.html).toContain('Datos insuficientes')
  })

  it('returns HTML with market data for public report', async () => {
    const rows = [
      makeRow({ subcategory: 'Camiones', brand: 'Volvo', month: '2026-01', listings: 30, avg_price: 40000 }),
      makeRow({ subcategory: 'Camiones', brand: 'Scania', month: '2026-02', listings: 25, avg_price: 45000 }),
      makeRow({ subcategory: 'Furgonetas', brand: 'Mercedes', month: '2026-01', listings: 20, avg_price: 25000 }),
      makeRow({ subcategory: 'Furgonetas', brand: 'Iveco', month: '2026-02', listings: 15, avg_price: 22000 }),
    ]
    const supabase = createMockSupabase(
      { data: rows, error: null },
      { data: [], error: null },
    )
    const result = await generateMarketReport(supabase as any, { isPublic: true })
    expect(result.html).toContain('Camiones')
    expect(result.html).toContain('Furgonetas')
    expect(result.html).toContain('Resumen Ejecutivo')
    expect(result.html).toContain('Precios por Subcategor')
    // Public reports should NOT contain certain private sections
    expect(result.html).not.toContain('Top 10 Marcas')
    expect(result.html).not.toContain('Desglose Geogr')
  })

  it('returns HTML with extra sections for private report', async () => {
    const rows = [
      makeRow({ subcategory: 'Camiones', brand: 'Volvo', month: '2026-01', listings: 30, location_province: 'Madrid' }),
      makeRow({ subcategory: 'Camiones', brand: 'Scania', month: '2026-02', listings: 25, location_province: 'Barcelona' }),
    ]
    const supabase = createMockSupabase(
      { data: rows, error: null },
      { data: [], error: null },
    )
    const result = await generateMarketReport(supabase as any, { isPublic: false })
    expect(result.html).toContain('Top 10 Marcas por Volumen')
    expect(result.html).toContain('Desglose Geogr')
    expect(result.html).toContain('Tendencias de Precios')
    expect(result.html).toContain('Volvo')
    expect(result.html).toContain('Scania')
    expect(result.html).toContain('Madrid')
    expect(result.html).toContain('Barcelona')
  })

  it('computes trends when multiple months exist', async () => {
    const rows = [
      makeRow({ subcategory: 'Camiones', month: '2026-01', avg_price: 40000 }),
      makeRow({ subcategory: 'Camiones', month: '2026-02', avg_price: 50000 }),
      makeRow({ subcategory: 'Camiones', month: '2026-03', avg_price: 55000 }),
    ]
    const supabase = createMockSupabase({ data: rows, error: null }, { data: [], error: null })
    const result = await generateMarketReport(supabase as any, { isPublic: false })
    // Should show trend section with rising prices
    expect(result.html).toContain('Tendencias de Precios')
    expect(result.html).toContain('Al alza')
  })

  it('throws on market data error', async () => {
    const supabase = createMockSupabase(
      { data: null, error: { message: 'DB connection failed' } },
    )
    await expect(
      generateMarketReport(supabase as any, { isPublic: true }),
    ).rejects.toThrow('Error al obtener datos de mercado: DB connection failed')
  })

  it('throws on history error', async () => {
    const marketOk = { data: [], error: null }
    const historyErr = { data: null, error: { message: 'Timeout' } }
    const supabase = createMockSupabase(marketOk, historyErr)
    await expect(
      generateMarketReport(supabase as any, { isPublic: true }),
    ).rejects.toThrow('Error al obtener historial de precios: Timeout')
  })

  it('uses default vertical "tracciona" when not specified', async () => {
    const supabase = createMockSupabase()
    const result = await generateMarketReport(supabase as any, { isPublic: true })
    expect(result.html).toContain('Informe de Mercado')
  })

  it('HTML escapes subcategory names', async () => {
    const rows = [
      makeRow({ subcategory: 'Camiones <script>', month: '2026-01' }),
      makeRow({ subcategory: 'Camiones <script>', month: '2026-02' }),
    ]
    const supabase = createMockSupabase({ data: rows, error: null }, { data: [], error: null })
    const result = await generateMarketReport(supabase as any, { isPublic: false })
    expect(result.html).not.toContain('<script>')
    expect(result.html).toContain('&lt;script&gt;')
  })

  it('groups multiple rows of same subcategory in same month (push path)', async () => {
    const rows = [
      makeRow({ subcategory: 'Camiones', brand: 'Volvo', month: '2026-01', avg_price: 40000 }),
      makeRow({ subcategory: 'Camiones', brand: 'Scania', month: '2026-01', avg_price: 42000 }),
      makeRow({ subcategory: 'Camiones', brand: 'Volvo', month: '2026-02', avg_price: 50000 }),
      makeRow({ subcategory: 'Camiones', brand: 'Scania', month: '2026-02', avg_price: 52000 }),
      makeRow({ subcategory: 'Camiones', brand: 'MAN', month: '2026-03', avg_price: 55000 }),
      makeRow({ subcategory: 'Camiones', brand: 'DAF', month: '2026-03', avg_price: 58000 }),
    ]
    const supabase = createMockSupabase({ data: rows, error: null }, { data: [], error: null })
    const result = await generateMarketReport(supabase as any, { isPublic: false })
    expect(result.html).toContain('Tendencias de Precios')
    expect(result.html).toContain('Camiones')
  })

  it('returns empty trends for single-month data (private)', async () => {
    const rows = [
      makeRow({ subcategory: 'Furgonetas', month: '2026-03', avg_price: 25000 }),
    ]
    const supabase = createMockSupabase({ data: rows, error: null }, { data: [], error: null })
    const result = await generateMarketReport(supabase as any, { isPublic: false })
    expect(result.html).toContain('Datos insuficientes para calcular tendencias')
  })

  it('handles subcategory only in latest month (no previous prices)', async () => {
    const rows = [
      makeRow({ subcategory: 'Camiones', month: '2026-01', avg_price: 40000 }),
      makeRow({ subcategory: 'Camiones', month: '2026-02', avg_price: 45000 }),
      makeRow({ subcategory: 'Camiones', month: '2026-03', avg_price: 50000 }),
      // NewCategory only in latest month — no previous data
      makeRow({ subcategory: 'Plataformas', month: '2026-03', avg_price: 30000 }),
    ]
    const supabase = createMockSupabase({ data: rows, error: null }, { data: [], error: null })
    const result = await generateMarketReport(supabase as any, { isPublic: false })
    expect(result.html).toContain('Tendencias de Precios')
    // Plataformas should not appear in trends (no previous data to compare)
    expect(result.html).toContain('Camiones')
  })

  it('handles rows with zero prices gracefully', async () => {
    const rows = [
      makeRow({ avg_price: 0, median_price: 0, min_price: 0, max_price: 0, month: '2026-01' }),
      makeRow({ avg_price: 0, median_price: 0, min_price: 0, max_price: 0, month: '2026-02' }),
    ]
    const supabase = createMockSupabase({ data: rows, error: null }, { data: [], error: null })
    const result = await generateMarketReport(supabase as any, { isPublic: true })
    expect(result.html).toContain('<!DOCTYPE html>')
  })
})

// ─── generateDealerIntelligence ────────────────────────────────

describe('generateDealerIntelligence', () => {
  it('returns empty report when dealer has no vehicles', async () => {
    const supabase = createMockSupabase({ data: [], error: null })
    const result = await generateDealerIntelligence(supabase as any, 'dealer-1')
    expect(result.dealerId).toBe('dealer-1')
    expect(result.totalVehicles).toBe(0)
    expect(result.insights).toEqual([])
    expect(result.summary.belowMarket).toBe(0)
    expect(result.summary.atMarket).toBe(0)
    expect(result.summary.aboveMarket).toBe(0)
    expect(result.summary.averageDeviation).toBe(0)
  })

  it('generates insights when dealer has vehicles and market data exists', async () => {
    const dealerVehicles = [
      { id: 'v1', brand: 'Volvo', model: 'FH16', price: 60000, subcategory_id: 'sc1', year: 2020 },
      { id: 'v2', brand: 'Scania', model: 'R500', price: 30000, subcategory_id: 'sc1', year: 2018 },
    ]
    const marketVehicles = [
      { brand: 'Volvo', model: 'FH16', price: 50000, subcategory_id: 'sc1' },
      { brand: 'Volvo', model: 'FH16', price: 52000, subcategory_id: 'sc1' },
      { brand: 'Volvo', model: 'FH16', price: 48000, subcategory_id: 'sc1' },
      { brand: 'Scania', model: 'R500', price: 35000, subcategory_id: 'sc1' },
      { brand: 'Scania', model: 'R500', price: 33000, subcategory_id: 'sc1' },
      { brand: 'Scania', model: 'R500', price: 37000, subcategory_id: 'sc1' },
    ]

    let callCount = 0
    const createChain = (data: unknown) => {
      const chain: Record<string, unknown> = {}
      const methods = ['select', 'eq', 'gte', 'lte', 'neq', 'not', 'order', 'limit', 'in']
      methods.forEach((m) => { chain[m] = () => chain })
      chain.then = (resolve: (val: unknown) => unknown) => resolve({ data, error: null })
      return chain
    }

    const supabase = {
      from: () => {
        callCount++
        return createChain(callCount === 1 ? dealerVehicles : marketVehicles)
      },
    }

    const result = await generateDealerIntelligence(supabase as any, 'dealer-1')
    expect(result.totalVehicles).toBe(2)
    expect(result.insights.length).toBeGreaterThan(0)

    // Volvo FH16 at 60k vs market avg ~50k = above market
    const volvoInsight = result.insights.find((i) => i.brand === 'Volvo')
    expect(volvoInsight).toBeDefined()
    expect(volvoInsight!.pricePosition).toBe('above')
    expect(volvoInsight!.suggestion).toContain('por encima')

    // Scania R500 at 30k vs market avg ~35k = below market
    const scaniaInsight = result.insights.find((i) => i.brand === 'Scania')
    expect(scaniaInsight).toBeDefined()
    expect(scaniaInsight!.pricePosition).toBe('below')
    expect(scaniaInsight!.suggestion).toContain('por debajo')

    // Summary
    expect(result.summary.aboveMarket).toBe(1)
    expect(result.summary.belowMarket).toBe(1)
  })

  it('falls back to brand prices when exact model has too few comparables', async () => {
    const dealerVehicles = [
      { id: 'v1', brand: 'Volvo', model: 'FH16', price: 55000, subcategory_id: 'sc1', year: 2020 },
    ]
    // Only 1 exact match but 4 brand matches
    const marketVehicles = [
      { brand: 'Volvo', model: 'FH16', price: 50000, subcategory_id: 'sc1' },
      { brand: 'Volvo', model: 'FH12', price: 40000, subcategory_id: 'sc1' },
      { brand: 'Volvo', model: 'FH500', price: 45000, subcategory_id: 'sc1' },
      { brand: 'Volvo', model: 'FMX', price: 48000, subcategory_id: 'sc1' },
    ]

    let callCount = 0
    const createChain = (data: unknown) => {
      const chain: Record<string, unknown> = {}
      const methods = ['select', 'eq', 'gte', 'lte', 'neq', 'not', 'order', 'limit', 'in']
      methods.forEach((m) => { chain[m] = () => chain })
      chain.then = (resolve: (val: unknown) => unknown) => resolve({ data, error: null })
      return chain
    }

    const supabase = {
      from: () => {
        callCount++
        return createChain(callCount === 1 ? dealerVehicles : marketVehicles)
      },
    }

    const result = await generateDealerIntelligence(supabase as any, 'dealer-1')
    expect(result.insights.length).toBe(1)
    // Falls back to brand average (~45750), dealer price 55k = above market
    expect(result.insights[0]!.pricePosition).toBe('above')
  })

  it('handles null market data gracefully', async () => {
    const dealerVehicles = [
      { id: 'v1', brand: 'Volvo', model: 'FH16', price: 50000, subcategory_id: 'sc1', year: 2020 },
    ]

    let callCount = 0
    const createChain = (data: unknown) => {
      const chain: Record<string, unknown> = {}
      const methods = ['select', 'eq', 'gte', 'lte', 'neq', 'not', 'order', 'limit', 'in']
      methods.forEach((m) => { chain[m] = () => chain })
      chain.then = (resolve: (val: unknown) => unknown) => resolve({ data, error: null })
      return chain
    }

    const supabase = {
      from: () => {
        callCount++
        return createChain(callCount === 1 ? dealerVehicles : null)
      },
    }

    const result = await generateDealerIntelligence(supabase as any, 'dealer-1')
    expect(result.totalVehicles).toBe(1)
    expect(result.insights).toEqual([]) // No market data to compare against
  })
})
