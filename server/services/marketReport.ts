/**
 * Market Report Service
 * Extracted from server/api/market-report.get.ts
 *
 * Contains all report data computation and HTML generation logic.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

/* ------------------------------------------------------------------ */
/*  Type definitions                                                   */
/* ------------------------------------------------------------------ */

type MarketTrend = 'rising' | 'falling' | 'stable'

export interface MarketRow {
  id: string
  vertical: string
  subcategory: string
  brand: string
  avg_price: number
  median_price: number
  min_price: number
  max_price: number
  listings: number
  sold_count: number
  avg_days_to_sell: number
  location_province: string
  month: string
}

export interface PriceHistoryRow {
  id: string
  vertical: string
  subcategory: string
  avg_price: number
  median_price: number
  listings: number
  week: string
}

interface SubcategoryStats {
  subcategory: string
  avgPrice: number
  medianPrice: number
  minPrice: number
  maxPrice: number
  totalListings: number
  totalSold: number
  avgDaysToSell: number
}

interface BrandStats {
  brand: string
  totalListings: number
  avgPrice: number
}

interface ProvinceStats {
  province: string
  totalListings: number
  avgPrice: number
}

interface TrendInfo {
  subcategory: string
  latestAvg: number
  previousAvg: number
  changePercent: number
  direction: MarketTrend
}

export interface ReportOptions {
  isPublic: boolean
  vertical?: string
  locale?: string
}

/* ------------------------------------------------------------------ */
/*  Translations                                                        */
/* ------------------------------------------------------------------ */

interface ReportTranslations {
  coverTitle: string
  coverSubtitle: string
  executiveSummary: string
  activeListings: string
  avgPriceGlobal: string
  vehiclesSold: string
  topCategory: string
  priceChangeSummary: (rising: number, falling: number) => string
  priceTrend: string
  insufficientData: string
  priceBySubcategory: string
  subcategory: string
  avgPrice: string
  medianPrice: string
  priceRange: string
  listings: string
  sold: string
  avgDaysToSell: string
  topBrands: string
  brand: string
  geographicBreakdown: string
  province: string
  priceTrends: string
  trendIntro: string
  prevPrice: string
  currPrice: string
  variation: string
  trend: string
  trendRising: string
  trendFalling: string
  trendStable: string
  noDataTrends: string
  noDataBrands: string
  noDataGeo: string
  noDataSummary: string
  noDataPrice: string
  footerDisclaimer: (siteName: string) => string
  generatedOn: (date: string, siteUrl: string) => string
  insufficientDataTrends: string
}

const TRANSLATIONS: Record<string, ReportTranslations> = {
  es: {
    coverTitle: 'Informe de Mercado',
    coverSubtitle: 'Maquinaria y Vehículos Industriales',
    executiveSummary: 'Resumen Ejecutivo',
    activeListings: 'Anuncios activos',
    avgPriceGlobal: 'Precio medio global',
    vehiclesSold: 'Vendidos',
    topCategory: 'Categoría principal',
    priceChangeSummary: (rising: number, falling: number) => {
      if (rising === 0 && falling === 0) return 'Sin datos suficientes para calcular tendencias.'
      if (rising > falling)
        return `Tendencia alcista: ${rising} subcategorías con precios al alza frente a ${falling} a la baja.`
      if (falling > rising)
        return `Tendencia bajista: ${falling} subcategorías con precios a la baja frente a ${rising} al alza.`
      return `Mercado estable: ${rising} subcategorías al alza y ${falling} a la baja.`
    },
    priceTrend: 'Tendencia de precios',
    insufficientData: 'Datos insuficientes para generar el resumen ejecutivo.',
    priceBySubcategory: 'Precios por Subcategoría',
    subcategory: 'Subcategoría',
    avgPrice: 'Precio Medio',
    medianPrice: 'Precio Mediana',
    priceRange: 'Rango (Min - Max)',
    listings: 'Anuncios',
    sold: 'Vendidos',
    avgDaysToSell: 'Días medio venta',
    topBrands: 'Top 10 Marcas por Volumen',
    brand: 'Marca',
    geographicBreakdown: 'Desglose Geográfico',
    province: 'Provincia',
    priceTrends: 'Tendencias de Precios',
    trendIntro: 'Comparativa entre el último mes disponible y el trimestre anterior.',
    prevPrice: 'Precio Anterior',
    currPrice: 'Precio Actual',
    variation: 'Variación',
    trend: 'Tendencia',
    trendRising: 'Al alza',
    trendFalling: 'A la baja',
    trendStable: 'Estable',
    noDataTrends:
      'Datos insuficientes para calcular tendencias. Se requieren al menos 2 meses de datos.',
    noDataBrands: 'Datos insuficientes para generar el ranking de marcas.',
    noDataGeo: 'Datos insuficientes para generar el desglose geográfico.',
    noDataSummary: 'Datos insuficientes para generar el resumen ejecutivo.',
    noDataPrice: 'Datos insuficientes para generar la tabla de precios.',
    footerDisclaimer: (siteName) =>
      `Los datos presentados en este informe han sido anonimizados y agregados a partir de la actividad registrada en ${siteName}. Este informe tiene carácter informativo y no constituye asesoramiento financiero ni comercial. Los precios y tendencias reflejados corresponden al mercado de segunda mano.`,
    generatedOn: (date, siteUrl) => `Informe generado el ${date} — ${siteUrl}`,
    insufficientDataTrends: 'Datos insuficientes para calcular tendencias.',
  },
  en: {
    coverTitle: 'Market Report',
    coverSubtitle: 'Industrial Machinery & Vehicles',
    executiveSummary: 'Executive Summary',
    activeListings: 'Active listings',
    avgPriceGlobal: 'Overall average price',
    vehiclesSold: 'Units sold',
    topCategory: 'Top category',
    priceChangeSummary: (rising: number, falling: number) => {
      if (rising === 0 && falling === 0) return 'Insufficient data to calculate trends.'
      if (rising > falling)
        return `Upward trend: ${rising} subcategories rising vs ${falling} falling.`
      if (falling > rising)
        return `Downward trend: ${falling} subcategories falling vs ${rising} rising.`
      return `Stable market: ${rising} subcategories rising and ${falling} falling.`
    },
    priceTrend: 'Price trend',
    insufficientData: 'Insufficient data to generate the executive summary.',
    priceBySubcategory: 'Prices by Subcategory',
    subcategory: 'Subcategory',
    avgPrice: 'Avg. Price',
    medianPrice: 'Median Price',
    priceRange: 'Range (Min - Max)',
    listings: 'Listings',
    sold: 'Sold',
    avgDaysToSell: 'Avg. days to sell',
    topBrands: 'Top 10 Brands by Volume',
    brand: 'Brand',
    geographicBreakdown: 'Geographic Breakdown',
    province: 'Province',
    priceTrends: 'Price Trends',
    trendIntro: 'Comparison between the latest available month and the previous quarter.',
    prevPrice: 'Previous Price',
    currPrice: 'Current Price',
    variation: 'Change',
    trend: 'Trend',
    trendRising: 'Rising',
    trendFalling: 'Falling',
    trendStable: 'Stable',
    noDataTrends: 'Insufficient data to calculate trends. At least 2 months of data required.',
    noDataBrands: 'Insufficient data to generate the brand ranking.',
    noDataGeo: 'Insufficient data to generate the geographic breakdown.',
    noDataSummary: 'Insufficient data to generate the executive summary.',
    noDataPrice: 'Insufficient data to generate the price table.',
    footerDisclaimer: (siteName) =>
      `The data presented in this report has been anonymised and aggregated from activity recorded on ${siteName}. This report is for informational purposes only and does not constitute financial or commercial advice. Prices and trends reflect the used machinery and vehicle market.`,
    generatedOn: (date, siteUrl) => `Report generated on ${date} — ${siteUrl}`,
    insufficientDataTrends: 'Insufficient data to calculate trends.',
  },
}

function getTranslations(locale?: string): ReportTranslations {
  return TRANSLATIONS[locale ?? 'es'] ?? TRANSLATIONS.es!
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatEUR(value: number): string {
  return value.toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function formatNumber(value: number): string {
  return value.toLocaleString('es-ES', { maximumFractionDigits: 1 })
}

function getQuarterLabel(date: Date): string {
  const q = Math.ceil((date.getMonth() + 1) / 3)
  return `T${q} ${date.getFullYear()}`
}

function escapeHtml(str: string): string {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function avgPositive(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0
}

function groupRows(rows: MarketRow[]): Map<string, MarketRow[]> {
  const grouped = new Map<string, MarketRow[]>()
  for (const row of rows) {
    const existing = grouped.get(row.subcategory)
    if (existing) existing.push(row)
    else grouped.set(row.subcategory, [row])
  }
  return grouped
}

/* ------------------------------------------------------------------ */
/*  Stats computation                                                  */
/* ------------------------------------------------------------------ */

function computeSingleSubcatStats(subcategory: string, items: MarketRow[]): SubcategoryStats {
  const totalListings = items.reduce((sum, r) => sum + (r.listings || 0), 0)
  const totalSold = items.reduce((sum, r) => sum + (r.sold_count || 0), 0)

  const avgPrices = items.filter((r) => r.avg_price > 0).map((r) => r.avg_price)
  const medianPrices = items.filter((r) => r.median_price > 0).map((r) => r.median_price)
  const minPrices = items.filter((r) => r.min_price > 0).map((r) => r.min_price)
  const maxPrices = items.filter((r) => r.max_price > 0).map((r) => r.max_price)
  const daysList = items.filter((r) => r.avg_days_to_sell > 0).map((r) => r.avg_days_to_sell)

  return {
    subcategory,
    avgPrice: avgPositive(avgPrices),
    medianPrice: avgPositive(medianPrices),
    minPrice: minPrices.length > 0 ? Math.min(...minPrices) : 0,
    maxPrice: maxPrices.length > 0 ? Math.max(...maxPrices) : 0,
    totalListings,
    totalSold,
    avgDaysToSell: avgPositive(daysList),
  }
}

function computeSubcategoryStats(rows: MarketRow[]): SubcategoryStats[] {
  const grouped = groupRows(rows)
  const result: SubcategoryStats[] = []
  for (const [subcategory, items] of grouped) {
    result.push(computeSingleSubcatStats(subcategory, items))
  }
  return result.sort((a, b) => b.totalListings - a.totalListings)
}

function newGroupEntry(row: MarketRow): {
  totalListings: number
  priceSum: number
  priceCount: number
} {
  const hasPrice = row.avg_price > 0
  return {
    totalListings: row.listings || 0,
    priceSum: hasPrice ? row.avg_price : 0,
    priceCount: hasPrice ? 1 : 0,
  }
}

function accumulateGroupStats(
  grouped: Map<string, { totalListings: number; priceSum: number; priceCount: number }>,
  key: string,
  row: MarketRow,
): void {
  const existing = grouped.get(key)
  if (!existing) {
    grouped.set(key, newGroupEntry(row))
    return
  }
  existing.totalListings += row.listings || 0
  if (row.avg_price > 0) {
    existing.priceSum += row.avg_price
    existing.priceCount += 1
  }
}

function computeBrandStats(rows: MarketRow[]): BrandStats[] {
  const grouped = new Map<string, { totalListings: number; priceSum: number; priceCount: number }>()
  for (const row of rows) {
    if (row.brand) accumulateGroupStats(grouped, row.brand, row)
  }

  return [...grouped.entries()]
    .map(([brand, stats]) => ({
      brand,
      totalListings: stats.totalListings,
      avgPrice: stats.priceCount > 0 ? stats.priceSum / stats.priceCount : 0,
    }))
    .sort((a, b) => b.totalListings - a.totalListings)
    .slice(0, 10)
}

function computeProvinceStats(rows: MarketRow[]): ProvinceStats[] {
  const grouped = new Map<string, { totalListings: number; priceSum: number; priceCount: number }>()
  for (const row of rows) {
    if (row.location_province) accumulateGroupStats(grouped, row.location_province, row)
  }

  return [...grouped.entries()]
    .map(([province, stats]) => ({
      province,
      totalListings: stats.totalListings,
      avgPrice: stats.priceCount > 0 ? stats.priceSum / stats.priceCount : 0,
    }))
    .sort((a, b) => b.totalListings - a.totalListings)
}

function groupPricesBySubcategory(rows: MarketRow[]): Map<string, number[]> {
  const grouped = new Map<string, number[]>()
  for (const r of rows) {
    if (r.avg_price > 0) {
      const existing = grouped.get(r.subcategory)
      if (existing) {
        existing.push(r.avg_price)
      } else {
        grouped.set(r.subcategory, [r.avg_price])
      }
    }
  }
  return grouped
}

function classifyTrendDirection(changePercent: number): MarketTrend {
  if (changePercent > 2) return 'rising'
  if (changePercent < -2) return 'falling'
  return 'stable'
}

function computeSingleTrend(
  subcategory: string,
  prices: number[],
  prevPrices: number[] | undefined,
): TrendInfo | null {
  if (!prevPrices || prevPrices.length === 0) return null

  const latestAvg = prices.reduce((s, v) => s + v, 0) / prices.length
  const previousAvg = prevPrices.reduce((s, v) => s + v, 0) / prevPrices.length
  if (previousAvg === 0) return null

  const changePercent = ((latestAvg - previousAvg) / previousAvg) * 100
  return {
    subcategory,
    latestAvg,
    previousAvg,
    changePercent,
    direction: classifyTrendDirection(changePercent),
  }
}

function computeTrends(rows: MarketRow[]): TrendInfo[] {
  if (rows.length === 0) return []

  const months = [...new Set(rows.map((r) => r.month))].sort((a, b) => a.localeCompare(b))
  if (months.length < 2) return []

  const latestMonth = months.at(-1)
  const previousMonth = months.length >= 3 ? months.at(-3) : months[0]

  const latestBySubcat = groupPricesBySubcategory(rows.filter((r) => r.month === latestMonth))
  const previousBySubcat = groupPricesBySubcategory(rows.filter((r) => r.month === previousMonth))

  const result: TrendInfo[] = []
  for (const [subcategory, prices] of latestBySubcat) {
    const trend = computeSingleTrend(subcategory, prices, previousBySubcat.get(subcategory))
    if (trend) result.push(trend)
  }

  return result.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
}

/* ------------------------------------------------------------------ */
/*  HTML generation helpers                                            */
/* ------------------------------------------------------------------ */

interface ExecutiveSummary {
  totalListings: number
  totalSold: number
  overallAvgPrice: number
  topCategory: string
  topCategoryListings: number
  priceChangeSummary: string
}

function buildPriceChangeSummary(trends: TrendInfo[], t: ReportTranslations): string {
  const risingCount = trends.filter((tr) => tr.direction === 'rising').length
  const fallingCount = trends.filter((tr) => tr.direction === 'falling').length
  return t.priceChangeSummary(risingCount, fallingCount)
}

function computeExecutiveSummary(
  subcategoryStats: ReturnType<typeof computeSubcategoryStats>,
  trends: ReturnType<typeof computeTrends>,
  t: ReportTranslations,
): ExecutiveSummary {
  const totalListings = subcategoryStats.reduce((s, r) => s + r.totalListings, 0)
  const totalSold = subcategoryStats.reduce((s, r) => s + r.totalSold, 0)
  const allAvgPrices = subcategoryStats.filter((s) => s.avgPrice > 0).map((s) => s.avgPrice)
  const overallAvgPrice =
    allAvgPrices.length > 0 ? allAvgPrices.reduce((s, v) => s + v, 0) / allAvgPrices.length : 0

  const topCategory = subcategoryStats.length > 0 ? subcategoryStats[0]!.subcategory : 'N/A'
  const topCategoryListings = subcategoryStats.length > 0 ? subcategoryStats[0]!.totalListings : 0

  return {
    totalListings,
    totalSold,
    overallAvgPrice,
    topCategory,
    topCategoryListings,
    priceChangeSummary: buildPriceChangeSummary(trends, t),
  }
}

/* ------------------------------------------------------------------ */
/*  HTML row builders                                                  */
/* ------------------------------------------------------------------ */

function rowClass(idx: number): string {
  return idx % 2 === 0 ? 'row-even' : 'row-odd'
}

function buildSubcatTableRow(
  s: SubcategoryStats,
  idx: number,
  isPublic: boolean,
  _t: ReportTranslations,
): string {
  const privateCols = isPublic
    ? ''
    : `<td class="num">${formatEUR(s.medianPrice)}</td>
      <td class="num">${formatEUR(s.minPrice)} - ${formatEUR(s.maxPrice)}</td>`
  const privateSuffix = isPublic
    ? ''
    : `<td class="num">${formatNumber(s.totalSold)}</td>
      <td class="num">${formatNumber(s.avgDaysToSell)}</td>`
  return `<tr class="${rowClass(idx)}">
      <td>${escapeHtml(s.subcategory)}</td>
      <td class="num">${formatEUR(s.avgPrice)}</td>
      ${privateCols}
      <td class="num">${formatNumber(s.totalListings)}</td>
      ${privateSuffix}
    </tr>`
}

function buildPriceTableHeaders(isPublic: boolean, t: ReportTranslations): string {
  const privateHeaders = isPublic ? '' : `<th>${t.medianPrice}</th><th>${t.priceRange}</th>`
  const privateSuffix = isPublic ? '' : `<th>${t.sold}</th><th>${t.avgDaysToSell}</th>`
  return `<tr><th>${t.subcategory}</th><th>${t.avgPrice}</th>${privateHeaders}<th>${t.listings}</th>${privateSuffix}</tr>`
}

function buildBrandRow(b: BrandStats, idx: number): string {
  return `<tr class="${rowClass(idx)}">
      <td>${escapeHtml(b.brand)}</td>
      <td class="num">${formatNumber(b.totalListings)}</td>
      <td class="num">${formatEUR(b.avgPrice)}</td>
    </tr>`
}

function buildProvinceRow(p: ProvinceStats, idx: number): string {
  return `<tr class="${rowClass(idx)}">
      <td>${escapeHtml(p.province)}</td>
      <td class="num">${formatNumber(p.totalListings)}</td>
      <td class="num">${formatEUR(p.avgPrice)}</td>
    </tr>`
}

function buildSummarySection(
  summary: ExecutiveSummary,
  hasData: boolean,
  t: ReportTranslations,
): string {
  if (!hasData) {
    return `<div class="page">
      <h2 class="section-title">${t.executiveSummary}</h2>
      <p class="no-data">${t.noDataSummary}</p>
    </div>`
  }
  return `<div class="page">
      <h2 class="section-title">${t.executiveSummary}</h2>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-value">${formatNumber(summary.totalListings)}</div>
          <div class="summary-label">${t.activeListings}</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${formatEUR(summary.overallAvgPrice)}</div>
          <div class="summary-label">${t.avgPriceGlobal}</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${formatNumber(summary.totalSold)}</div>
          <div class="summary-label">${t.vehiclesSold}</div>
        </div>
      </div>
      <div class="summary-text">
        <p><strong>${t.topCategory}:</strong> ${escapeHtml(summary.topCategory)} (${formatNumber(summary.topCategoryListings)} ${t.listings.toLowerCase()})</p>
        <p><strong>${t.priceTrend}:</strong> ${escapeHtml(summary.priceChangeSummary)}</p>
      </div>
    </div>`
}

function buildPriceTableSection(
  subcategoryStats: SubcategoryStats[],
  isPublic: boolean,
  hasData: boolean,
  t: ReportTranslations,
): string {
  if (!hasData) {
    return `<div class="page">
      <h2 class="section-title">${t.priceBySubcategory}</h2>
      <p class="no-data">${t.noDataPrice}</p>
    </div>`
  }
  const rows = subcategoryStats.map((s, idx) => buildSubcatTableRow(s, idx, isPublic, t)).join('')
  return `<div class="page">
      <h2 class="section-title">${t.priceBySubcategory}</h2>
      <table>
        <thead>${buildPriceTableHeaders(isPublic, t)}</thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`
}

/* ------------------------------------------------------------------ */
/*  HTML generation                                                    */
/* ------------------------------------------------------------------ */

const TREND_COLORS: Record<string, string> = {
  rising: '#16a34a',
  falling: '#dc2626',
  stable: '#6b7280',
}

function trendDirectionLabel(dir: MarketTrend, t: ReportTranslations): string {
  if (dir === 'rising') return t.trendRising
  if (dir === 'falling') return t.trendFalling
  return t.trendStable
}

function trendDirectionColor(dir: MarketTrend): string {
  return TREND_COLORS[dir]!
}

function buildTrendsSection(trends: TrendInfo[], t: ReportTranslations): string {
  if (trends.length === 0) {
    return `<div class="page">
      <h2 class="section-title">${t.priceTrends}</h2>
      <p class="no-data">${t.noDataTrends}</p>
    </div>`
  }

  const trendRows = trends
    .map(
      (tr, idx) => `
    <tr class="${idx % 2 === 0 ? 'row-even' : 'row-odd'}">
      <td>${escapeHtml(tr.subcategory)}</td>
      <td class="num">${formatEUR(tr.previousAvg)}</td>
      <td class="num">${formatEUR(tr.latestAvg)}</td>
      <td class="num" style="color: ${trendDirectionColor(tr.direction)}; font-weight: 600;">
        ${tr.changePercent >= 0 ? '+' : ''}${formatNumber(tr.changePercent)}%
      </td>
      <td style="color: ${trendDirectionColor(tr.direction)}; font-weight: 600;">
        ${trendDirectionLabel(tr.direction, t)}
      </td>
    </tr>
  `,
    )
    .join('')

  return `<div class="page">
      <h2 class="section-title">${t.priceTrends}</h2>
      <p class="section-intro">${t.trendIntro}</p>
      <table>
        <thead><tr><th>${t.subcategory}</th><th>${t.prevPrice}</th><th>${t.currPrice}</th><th>${t.variation}</th><th>${t.trend}</th></tr></thead>
        <tbody>${trendRows}</tbody>
      </table>
    </div>`
}

function buildTable(headers: string[], rows: string): string {
  const headerCells = headers.map((h) => '<th>' + h + '</th>').join('')
  return `<table><thead><tr>${headerCells}</tr></thead><tbody>${rows}</tbody></table>`
}

function buildTableSection(
  title: string,
  headers: string[],
  rows: string,
  hasData: boolean,
  noDataMsg: string,
): string {
  const content = hasData ? buildTable(headers, rows) : '<p class="no-data">' + noDataMsg + '</p>'
  return `<div class="page">
      <h2 class="section-title">${title}</h2>
      ${content}
    </div>`
}

function buildCoverSection(
  quarterLabel: string,
  siteName: string,
  siteUrl: string,
  t: ReportTranslations,
): string {
  return `<div class="page cover-page">
      <div class="cover-content">
        <div class="cover-logo">${escapeHtml(siteName.toUpperCase())}</div>
        <h1 class="cover-title">${t.coverTitle}</h1>
        <h2 class="cover-subtitle">${t.coverSubtitle}</h2>
        <div class="cover-quarter">${escapeHtml(quarterLabel)}</div>
        <div class="cover-url">${escapeHtml(siteUrl)}</div>
      </div>
    </div>`
}

function buildFooterSection(
  dateGenerated: string,
  siteName: string,
  siteUrl: string,
  t: ReportTranslations,
): string {
  return `<div class="footer">
      <p class="disclaimer">${t.footerDisclaimer(siteName)}</p>
      <p class="generated-date">${t.generatedOn(escapeHtml(dateGenerated), escapeHtml(siteUrl))}</p>
    </div>`
}

function assembleReportSections(
  opts: {
    isPublic: boolean
    hasData: boolean
    quarterLabel: string
    dateGenerated: string
    siteName: string
    siteUrl: string
    t: ReportTranslations
  },
  subcategoryStats: SubcategoryStats[],
  brandStats: BrandStats[],
  provinceStats: ProvinceStats[],
  trends: TrendInfo[],
  summary: ExecutiveSummary,
): string[] {
  const { t } = opts
  const cover = buildCoverSection(opts.quarterLabel, opts.siteName, opts.siteUrl, t)
  const summaryHtml = buildSummarySection(summary, opts.hasData, t)
  const priceTable = buildPriceTableSection(subcategoryStats, opts.isPublic, opts.hasData, t)
  const footer = buildFooterSection(opts.dateGenerated, opts.siteName, opts.siteUrl, t)

  if (opts.isPublic) return [cover, summaryHtml, priceTable, footer]

  const brandRows = brandStats.map((b, idx) => buildBrandRow(b, idx)).join('')
  const brandSection = buildTableSection(
    t.topBrands,
    [t.brand, t.listings, t.avgPrice],
    brandRows,
    opts.hasData,
    t.noDataBrands,
  )

  const provinceRows = provinceStats.map((p, idx) => buildProvinceRow(p, idx)).join('')
  const geoSection = buildTableSection(
    t.geographicBreakdown,
    [t.province, t.listings, t.avgPrice],
    provinceRows,
    opts.hasData,
    t.noDataGeo,
  )

  return [
    cover,
    summaryHtml,
    priceTable,
    brandSection,
    geoSection,
    buildTrendsSection(trends, t),
    footer,
  ]
}

function generateReportHTML(
  marketRows: MarketRow[] | null,
  historyRows: PriceHistoryRow[] | null,
  isPublic: boolean,
  locale?: string,
  siteName?: string,
  siteUrl?: string,
): string {
  const rows = marketRows ?? []
  const _history = historyRows ?? []
  const now = new Date()
  const quarterLabel = getQuarterLabel(now)
  const resolvedLocale = locale ?? 'es'
  const resolvedSiteName = siteName ?? 'Tracciona'
  const resolvedSiteUrl = siteUrl ?? 'tracciona.com'
  const t = getTranslations(resolvedLocale)
  const dateGenerated = now.toLocaleDateString(resolvedLocale === 'en' ? 'en-GB' : 'es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const hasData = rows.length > 0
  const subcategoryStats = hasData ? computeSubcategoryStats(rows) : []
  const brandStats = hasData ? computeBrandStats(rows) : []
  const provinceStats = hasData ? computeProvinceStats(rows) : []
  const trends = hasData ? computeTrends(rows) : []
  const summary = computeExecutiveSummary(subcategoryStats, trends, t)

  const fullReportSections = assembleReportSections(
    {
      isPublic,
      hasData,
      quarterLabel,
      dateGenerated,
      siteName: resolvedSiteName,
      siteUrl: resolvedSiteUrl,
      t,
    },
    subcategoryStats,
    brandStats,
    provinceStats,
    trends,
    summary,
  )

  return `<!DOCTYPE html>
<html lang="${escapeHtml(resolvedLocale)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.coverTitle} ${escapeHtml(quarterLabel)} — ${escapeHtml(resolvedSiteName)}</title>
  <style>
    /* ---- Base ---- */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #1f2937;
      background: #ffffff;
    }

    /* ---- Cover ---- */
    .cover-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #23424A;
      color: #ffffff;
      text-align: center;
    }

    .cover-content { max-width: 600px; padding: 48px 24px; }

    .cover-logo {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 6px;
      text-transform: uppercase;
      margin-bottom: 48px;
      opacity: 0.7;
    }

    .cover-title {
      font-size: 40px;
      font-weight: 700;
      line-height: 1.2;
      margin-bottom: 12px;
    }

    .cover-subtitle {
      font-size: 22px;
      font-weight: 400;
      opacity: 0.85;
      margin-bottom: 48px;
    }

    .cover-quarter {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 16px;
    }

    .cover-url {
      font-size: 14px;
      opacity: 0.5;
      letter-spacing: 2px;
    }

    /* ---- Page sections ---- */
    .page {
      padding: 48px 40px;
      max-width: 960px;
      margin: 0 auto;
    }

    .section-title {
      font-size: 24px;
      font-weight: 700;
      color: #23424A;
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 3px solid #23424A;
    }

    .section-intro {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 20px;
    }

    /* ---- Summary grid ---- */
    .summary-grid {
      display: flex;
      gap: 24px;
      margin-bottom: 32px;
      flex-wrap: wrap;
    }

    .summary-card {
      flex: 1;
      min-width: 180px;
      background: #f0f5f6;
      border-left: 4px solid #23424A;
      padding: 24px;
      border-radius: 4px;
    }

    .summary-value {
      font-size: 28px;
      font-weight: 700;
      color: #23424A;
      margin-bottom: 4px;
    }

    .summary-label {
      font-size: 13px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .summary-text {
      font-size: 15px;
      line-height: 1.8;
    }

    .summary-text p { margin-bottom: 8px; }

    /* ---- Tables ---- */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-bottom: 16px;
    }

    thead th {
      background: #23424A;
      color: #ffffff;
      font-weight: 600;
      text-align: left;
      padding: 12px 14px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    tbody td {
      padding: 10px 14px;
      border-bottom: 1px solid #e5e7eb;
    }

    .row-even { background: #ffffff; }
    .row-odd { background: #f9fafb; }

    .num { text-align: right; font-variant-numeric: tabular-nums; }

    /* ---- No data ---- */
    .no-data {
      padding: 40px 24px;
      text-align: center;
      color: #9ca3af;
      font-size: 16px;
      background: #f9fafb;
      border-radius: 8px;
      border: 1px dashed #d1d5db;
    }

    /* ---- Footer ---- */
    .footer {
      padding: 32px 40px;
      max-width: 960px;
      margin: 0 auto;
      border-top: 2px solid #23424A;
    }

    .disclaimer {
      font-size: 11px;
      color: #9ca3af;
      line-height: 1.7;
      margin-bottom: 12px;
    }

    .generated-date {
      font-size: 12px;
      color: #6b7280;
      font-weight: 600;
    }

    /* ---- Print styles ---- */
    @media print {
      body { font-size: 12px; }

      .cover-page {
        min-height: 100vh;
        page-break-after: always;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .page {
        page-break-before: always;
        padding: 32px 24px;
      }

      .page:first-of-type { page-break-before: auto; }

      .summary-card {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      thead th {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .row-odd {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .footer {
        page-break-before: always;
        padding-top: 48px;
      }

      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
    }

    @page {
      size: A4;
      margin: 15mm;
    }
  </style>
</head>
<body>
${fullReportSections.join('\n')}
</body>
</html>`
}

/* ------------------------------------------------------------------ */
/*  Dealer Market Intelligence                                         */
/* ------------------------------------------------------------------ */

export interface DealerVehicleInsight {
  vehicleId: string
  brand: string
  model: string
  dealerPrice: number
  marketAvg: number
  marketMin: number
  marketMax: number
  pricePosition: 'below' | 'average' | 'above'
  priceDeviationPercent: number
  avgDaysOnMarket: number
  suggestion: string
}

export interface DealerIntelligenceReport {
  dealerId: string
  totalVehicles: number
  insights: DealerVehicleInsight[]
  summary: {
    belowMarket: number
    atMarket: number
    aboveMarket: number
    averageDeviation: number
  }
}

function buildVehicleInsight(
  vehicle: { id: string; brand: string; model: string; price: number },
  marketPrices: Map<string, number[]>,
  brandPrices: Map<string, number[]>,
): DealerVehicleInsight | null {
  const exactKey = `${vehicle.brand}:${vehicle.model}`.toLowerCase()
  const brandKey = vehicle.brand.toLowerCase()

  let comparePrices = marketPrices.get(exactKey)
  if (!comparePrices || comparePrices.length < 3) {
    comparePrices = brandPrices.get(brandKey)
  }

  if (!comparePrices || comparePrices.length < 2) return null

  const sorted = [...comparePrices].sort((a, b) => a - b)
  const marketAvg = sorted.reduce((s, v) => s + v, 0) / sorted.length
  const marketMin = sorted[0]!
  const marketMax = sorted.at(-1)!

  const deviation = ((vehicle.price - marketAvg) / marketAvg) * 100
  let pricePosition: 'below' | 'average' | 'above' = 'average'
  if (deviation > 10) pricePosition = 'above'
  else if (deviation < -10) pricePosition = 'below'

  const SUGGESTION_TEMPLATES: Record<string, string> = {
    above: 'está un {dev}% por encima del mercado. Considera ajustar el precio.',
    below: 'tiene buen precio, un {dev}% por debajo de la media.',
    average: 'está en línea con el mercado.',
  }
  const suggestion = `Tu ${vehicle.brand} ${vehicle.model} ${SUGGESTION_TEMPLATES[pricePosition]!.replace('{dev}', String(Math.abs(Math.round(deviation))))}`

  return {
    vehicleId: vehicle.id,
    brand: vehicle.brand,
    model: vehicle.model,
    dealerPrice: vehicle.price,
    marketAvg: Math.round(marketAvg),
    marketMin,
    marketMax,
    pricePosition,
    priceDeviationPercent: Math.round(deviation * 10) / 10,
    avgDaysOnMarket: 0,
    suggestion,
  }
}

function groupPricesByKey(
  vehicles: Array<{ brand: string; model: string; price: number }>,
  keyFn: (v: { brand: string; model: string }) => string,
): Map<string, number[]> {
  const map = new Map<string, number[]>()
  for (const v of vehicles) {
    const key = keyFn(v)
    const prices = map.get(key) ?? []
    prices.push(v.price)
    map.set(key, prices)
  }
  return map
}

function summarizeInsights(insights: DealerVehicleInsight[]): DealerIntelligenceReport['summary'] {
  const belowMarket = insights.filter((i) => i.pricePosition === 'below').length
  const atMarket = insights.filter((i) => i.pricePosition === 'average').length
  const aboveMarket = insights.filter((i) => i.pricePosition === 'above').length
  const avgDeviation =
    insights.length > 0
      ? insights.reduce((s, i) => s + i.priceDeviationPercent, 0) / insights.length
      : 0
  return {
    belowMarket,
    atMarket,
    aboveMarket,
    averageDeviation: Math.round(avgDeviation * 10) / 10,
  }
}

const EMPTY_INTELLIGENCE_SUMMARY: DealerIntelligenceReport['summary'] = {
  belowMarket: 0,
  atMarket: 0,
  aboveMarket: 0,
  averageDeviation: 0,
}

export async function generateDealerIntelligence(
  supabase: SupabaseClient,
  dealerId: string,
): Promise<DealerIntelligenceReport> {
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, brand, model, price, subcategory_id, year')
    .eq('dealer_id', dealerId)
    .eq('status', 'published')
    .not('price', 'is', null)
    .limit(100)

  const vehicleList = (vehicles || []) as Array<{
    id: string
    brand: string
    model: string
    price: number
    subcategory_id: string | null
    year: number | null
  }>

  if (vehicleList.length === 0) {
    return { dealerId, totalVehicles: 0, insights: [], summary: EMPTY_INTELLIGENCE_SUMMARY }
  }

  const { data: marketData } = await supabase
    .from('vehicles')
    .select('brand, model, price, subcategory_id')
    .eq('status', 'published')
    .not('price', 'is', null)
    .neq('dealer_id', dealerId)
    .limit(5000)

  const allVehicles = (marketData || []) as Array<{
    brand: string
    model: string
    price: number
    subcategory_id: string | null
  }>

  const marketPrices = groupPricesByKey(allVehicles, (v) => `${v.brand}:${v.model}`.toLowerCase())
  const brandPrices = groupPricesByKey(allVehicles, (v) => v.brand.toLowerCase())

  const insights: DealerVehicleInsight[] = []
  for (const vehicle of vehicleList) {
    const insight = buildVehicleInsight(vehicle, marketPrices, brandPrices)
    if (insight) insights.push(insight)
  }

  return {
    dealerId,
    totalVehicles: vehicleList.length,
    insights: insights.toSorted(
      (a, b) => Math.abs(b.priceDeviationPercent) - Math.abs(a.priceDeviationPercent),
    ),
    summary: summarizeInsights(insights),
  }
}

/* ------------------------------------------------------------------ */
/*  Main service function                                              */
/* ------------------------------------------------------------------ */

export async function generateMarketReport(
  supabase: SupabaseClient,
  options: ReportOptions,
): Promise<{ html: string }> {
  const vertical = options.vertical || process.env.NUXT_PUBLIC_VERTICAL || 'tracciona'

  // Fetch market data (last 3 months)
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const { data: marketRows, error: marketError } = await supabase
    .from('market_data')
    .select('*')
    .eq('vertical', vertical)
    .gte('month', threeMonthsAgo.toISOString())
    .order('month', { ascending: false })
    .limit(5000)

  if (marketError) {
    throw new Error(`Error al obtener datos de mercado: ${marketError.message}`)
  }

  // Fetch price history (last 12 months for trends)
  const yearAgo = new Date()
  yearAgo.setFullYear(yearAgo.getFullYear() - 1)

  const { data: historyRows, error: historyError } = await supabase
    .from('price_history')
    .select('*')
    .eq('vertical', vertical)
    .gte('week', yearAgo.toISOString())
    .order('week', { ascending: true })
    .limit(5000)

  if (historyError) {
    throw new Error(`Error al obtener historial de precios: ${historyError.message}`)
  }

  const siteName =
    process.env.NUXT_PUBLIC_SITE_NAME || vertical.charAt(0).toUpperCase() + vertical.slice(1)
  const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || `${vertical}.com`

  const html = generateReportHTML(
    (marketRows ?? []) as unknown as MarketRow[],
    (historyRows ?? []) as unknown as PriceHistoryRow[],
    options.isPublic,
    options.locale,
    siteName,
    siteUrl,
  )

  return { html }
}
