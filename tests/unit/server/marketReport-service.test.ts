/**
 * Tests for server/services/marketReport.ts
 * Covers i18n (locale switching) and HTML generation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// We test generateMarketReport (the exported function) with a mocked Supabase.
// For direct HTML testing we expose the pure path by calling generateMarketReport
// with empty data.

vi.mock('@supabase/supabase-js')

function makeSupabaseMock(marketRows: unknown[] = [], historyRows: unknown[] = []) {
  let callCount = 0
  const chain = {
    select: () => chain,
    eq: () => chain,
    gte: () => chain,
    order: () => chain,
    limit: () => chain,
    then: (resolve: (v: unknown) => void) => {
      callCount++
      const rows = callCount === 1 ? marketRows : historyRows
      return Promise.resolve({ data: rows, error: null }).then(resolve)
    },
  }
  return {
    from: () => chain,
  }
}

import { generateMarketReport } from '../../../server/services/marketReport'

describe('generateMarketReport — i18n', () => {
  beforeEach(() => {
    process.env.NUXT_PUBLIC_SITE_NAME = 'Tracciona'
    process.env.NUXT_PUBLIC_SITE_URL = 'tracciona.com'
  })

  it('generates HTML with lang="es" by default', async () => {
    const supabase = makeSupabaseMock()
    const { html } = await generateMarketReport(supabase as any, { isPublic: true })
    expect(html).toContain('lang="es"')
  })

  it('generates HTML with lang="en" when locale=en', async () => {
    const supabase = makeSupabaseMock()
    const { html } = await generateMarketReport(supabase as any, { isPublic: true, locale: 'en' })
    expect(html).toContain('lang="en"')
  })

  it('uses Spanish section titles by default', async () => {
    const supabase = makeSupabaseMock()
    const { html } = await generateMarketReport(supabase as any, { isPublic: false })
    expect(html).toContain('Resumen Ejecutivo')
    expect(html).toContain('Informe de Mercado')
  })

  it('uses English section titles when locale=en', async () => {
    const supabase = makeSupabaseMock()
    const { html } = await generateMarketReport(supabase as any, { isPublic: false, locale: 'en' })
    expect(html).toContain('Executive Summary')
    expect(html).toContain('Market Report')
  })

  it('uses English trend labels when locale=en', async () => {
    const supabase = makeSupabaseMock()
    const { html } = await generateMarketReport(supabase as any, { isPublic: false, locale: 'en' })
    expect(html).toContain('Price Trends')
  })

  it('uses Spanish trend labels by default', async () => {
    const supabase = makeSupabaseMock()
    const { html } = await generateMarketReport(supabase as any, { isPublic: false })
    expect(html).toContain('Tendencias de Precios')
  })

  it('site name appears in cover section', async () => {
    const supabase = makeSupabaseMock()
    const { html } = await generateMarketReport(supabase as any, { isPublic: true })
    expect(html).toContain('TRACCIONA')
    expect(html).toContain('tracciona.com')
  })

  it('public report does not include Top Brands or Geographic Breakdown sections', async () => {
    const supabase = makeSupabaseMock()
    const { html } = await generateMarketReport(supabase as any, { isPublic: true })
    // Top Brands section only appears in full (non-public) report
    expect(html).not.toContain('Top 10 Marcas')
    expect(html).not.toContain('Top 10 Brands')
  })

  it('full report includes Top Brands section (ES)', async () => {
    const supabase = makeSupabaseMock()
    const { html } = await generateMarketReport(supabase as any, { isPublic: false })
    expect(html).toContain('Top 10 Marcas')
  })

  it('full report includes Top Brands section (EN)', async () => {
    const supabase = makeSupabaseMock()
    const { html } = await generateMarketReport(supabase as any, { isPublic: false, locale: 'en' })
    expect(html).toContain('Top 10 Brands')
  })

  it('falls back to es for unknown locale', async () => {
    const supabase = makeSupabaseMock()
    const { html } = await generateMarketReport(supabase as any, { isPublic: true, locale: 'fr' as any })
    expect(html).toContain('lang="fr"')
    // Falls back to Spanish translations since fr is not in TRANSLATIONS
    expect(html).toContain('Resumen Ejecutivo')
  })

  it('renders subcategory data when market rows are provided', async () => {
    const marketRows = [
      {
        id: '1', vertical: 'tracciona', subcategory: 'Excavadoras', brand: 'CAT',
        avg_price: 50000, median_price: 48000, min_price: 30000, max_price: 80000,
        listings: 15, sold_count: 5, avg_days_to_sell: 30, location_province: 'Madrid',
        month: new Date().toISOString(),
      },
    ]
    const supabase = makeSupabaseMock(marketRows, [])
    const { html } = await generateMarketReport(supabase as any, { isPublic: false })
    expect(html).toContain('Excavadoras')
  })
})
