/**
 * Product metrics composable — unified dealer dashboard KPIs.
 *
 * Aggregates product-level data into actionable metrics:
 * - Revenue metrics (GMV, avg sale price, revenue trend)
 * - Conversion funnel (views → contacts → sales)
 * - Listing performance (CTR, avg position, response time)
 * - Portfolio health (diversity, concentration, risk)
 *
 * Pure calculation functions exported for testability.
 * Used in dealer dashboard, admin reports, and analytics pages.
 */

export interface SaleRecord {
  price: number
  soldAt: string
  categoryId?: string
}

export interface ListingMetric {
  views: number
  contacts: number
  favorites: number
  daysListed: number
  price: number
  categoryId?: string
}

export interface FunnelStage {
  stage: string
  count: number
  rate: number
}

export interface RevenueSummary {
  totalGmv: number
  avgSalePrice: number
  medianSalePrice: number
  salesCount: number
  periodDays: number
  dailyAvgGmv: number
}

export interface PortfolioHealth {
  totalListings: number
  categoryCount: number
  topCategoryShare: number
  herfindahlIndex: number
  diversityScore: number
}

export interface ListingPerformance {
  avgViews: number
  avgContacts: number
  avgFavorites: number
  overallCtr: number
  avgDaysListed: number
  contactRate: number
}

/**
 * Calculate revenue summary from sales records within a period.
 */
export function calculateRevenueSummary(
  sales: SaleRecord[],
  periodDays: number = 30,
): RevenueSummary {
  const now = Date.now()
  const cutoff = now - periodDays * 24 * 60 * 60 * 1000

  const recent = sales.filter(
    (s) => new Date(s.soldAt).getTime() >= cutoff && s.price > 0,
  )

  if (recent.length === 0) {
    return {
      totalGmv: 0,
      avgSalePrice: 0,
      medianSalePrice: 0,
      salesCount: 0,
      periodDays,
      dailyAvgGmv: 0,
    }
  }

  const prices = recent.map((s) => s.price).sort((a, b) => a - b)
  const totalGmv = prices.reduce((sum, p) => sum + p, 0)
  const avgSalePrice = Math.round(totalGmv / prices.length)

  const mid = prices.length % 2 === 0
    ? Math.round((prices[prices.length / 2 - 1]! + prices[prices.length / 2]!) / 2)
    : prices[Math.floor(prices.length / 2)]!

  return {
    totalGmv,
    avgSalePrice,
    medianSalePrice: mid,
    salesCount: recent.length,
    periodDays,
    dailyAvgGmv: Math.round(totalGmv / periodDays),
  }
}

/**
 * Calculate conversion funnel from listing metrics.
 * Funnel: impressions/views → contacts → favorites.
 */
export function calculateFunnel(metrics: ListingMetric[]): FunnelStage[] {
  if (metrics.length === 0) {
    return [
      { stage: 'views', count: 0, rate: 0 },
      { stage: 'contacts', count: 0, rate: 0 },
      { stage: 'favorites', count: 0, rate: 0 },
    ]
  }

  const totalViews = metrics.reduce((s, m) => s + m.views, 0)
  const totalContacts = metrics.reduce((s, m) => s + m.contacts, 0)
  const totalFavorites = metrics.reduce((s, m) => s + m.favorites, 0)

  return [
    { stage: 'views', count: totalViews, rate: 1 },
    {
      stage: 'contacts',
      count: totalContacts,
      rate: totalViews > 0 ? Math.round((totalContacts / totalViews) * 10000) / 10000 : 0,
    },
    {
      stage: 'favorites',
      count: totalFavorites,
      rate: totalViews > 0 ? Math.round((totalFavorites / totalViews) * 10000) / 10000 : 0,
    },
  ]
}

/**
 * Calculate listing performance averages.
 */
export function calculateListingPerformance(metrics: ListingMetric[]): ListingPerformance {
  if (metrics.length === 0) {
    return {
      avgViews: 0,
      avgContacts: 0,
      avgFavorites: 0,
      overallCtr: 0,
      avgDaysListed: 0,
      contactRate: 0,
    }
  }

  const n = metrics.length
  const totalViews = metrics.reduce((s, m) => s + m.views, 0)
  const totalContacts = metrics.reduce((s, m) => s + m.contacts, 0)
  const totalFavorites = metrics.reduce((s, m) => s + m.favorites, 0)
  const totalDays = metrics.reduce((s, m) => s + m.daysListed, 0)

  return {
    avgViews: Math.round(totalViews / n),
    avgContacts: Math.round((totalContacts / n) * 10) / 10,
    avgFavorites: Math.round((totalFavorites / n) * 10) / 10,
    overallCtr: totalViews > 0
      ? Math.round((totalContacts / totalViews) * 10000) / 10000
      : 0,
    avgDaysListed: Math.round(totalDays / n),
    contactRate: totalViews > 0
      ? Math.round((totalContacts / totalViews) * 100)
      : 0,
  }
}

/**
 * Calculate portfolio health / diversification metrics.
 * Uses Herfindahl-Hirschman Index for concentration.
 */
export function calculatePortfolioHealth(metrics: ListingMetric[]): PortfolioHealth {
  if (metrics.length === 0) {
    return {
      totalListings: 0,
      categoryCount: 0,
      topCategoryShare: 0,
      herfindahlIndex: 0,
      diversityScore: 100,
    }
  }

  const categoryCounts = new Map<string, number>()
  for (const m of metrics) {
    const cat = m.categoryId ?? 'uncategorized'
    categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1)
  }

  const total = metrics.length
  const shares = Array.from(categoryCounts.values()).map((c) => c / total)
  const topShare = Math.max(...shares)

  // Herfindahl-Hirschman Index: sum of squared market shares (0-1 scale)
  const hhi = shares.reduce((sum, s) => sum + s * s, 0)

  // Diversity score: inverse of HHI normalized to 0-100
  // HHI = 1 means perfectly concentrated (1 category), diversity = 0
  // HHI = 1/n means perfectly diversified, diversity ≈ 100
  const minHhi = categoryCounts.size > 0 ? 1 / categoryCounts.size : 1
  const diversityScore = categoryCounts.size <= 1
    ? 0
    : Math.round(((1 - hhi) / (1 - minHhi)) * 100)

  return {
    totalListings: total,
    categoryCount: categoryCounts.size,
    topCategoryShare: Math.round(topShare * 100),
    herfindahlIndex: Math.round(hhi * 10000) / 10000,
    diversityScore: Math.max(0, Math.min(100, diversityScore)),
  }
}

/**
 * Calculate revenue by category from sales records.
 */
export function revenueByCategory(
  sales: SaleRecord[],
): Array<{ categoryId: string; total: number; count: number; avgPrice: number }> {
  const map = new Map<string, { total: number; count: number }>()

  for (const sale of sales) {
    if (sale.price <= 0) continue
    const cat = sale.categoryId ?? 'uncategorized'
    const existing = map.get(cat) ?? { total: 0, count: 0 }
    existing.total += sale.price
    existing.count += 1
    map.set(cat, existing)
  }

  return Array.from(map.entries())
    .map(([categoryId, data]) => ({
      categoryId,
      total: data.total,
      count: data.count,
      avgPrice: Math.round(data.total / data.count),
    }))
    .sort((a, b) => b.total - a.total)
}

/**
 * Identify top and bottom performing listings by contact rate.
 */
export function rankListingsByContactRate(
  metrics: ListingMetric[],
  topN: number = 5,
): { top: Array<ListingMetric & { rate: number }>; bottom: Array<ListingMetric & { rate: number }> } {
  const withRate = metrics
    .filter((m) => m.views > 0)
    .map((m) => ({
      ...m,
      rate: Math.round((m.contacts / m.views) * 10000) / 10000,
    }))
    .sort((a, b) => b.rate - a.rate)

  return {
    top: withRate.slice(0, topN),
    bottom: withRate.slice(-topN).reverse(),
  }
}
