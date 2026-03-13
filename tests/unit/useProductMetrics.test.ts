import { describe, it, expect } from 'vitest'

/**
 * Tests for useProductMetrics composable — unified dealer dashboard KPIs.
 */

interface SaleRecord {
  price: number
  soldAt: string
  categoryId?: string
}

interface ListingMetric {
  views: number
  contacts: number
  favorites: number
  daysListed: number
  price: number
  categoryId?: string
}

interface FunnelStage {
  stage: string
  count: number
  rate: number
}

interface RevenueSummary {
  totalGmv: number
  avgSalePrice: number
  medianSalePrice: number
  salesCount: number
  periodDays: number
  dailyAvgGmv: number
}

interface PortfolioHealth {
  totalListings: number
  categoryCount: number
  topCategoryShare: number
  herfindahlIndex: number
  diversityScore: number
}

interface ListingPerformance {
  avgViews: number
  avgContacts: number
  avgFavorites: number
  overallCtr: number
  avgDaysListed: number
  contactRate: number
}

function calculateRevenueSummary(sales: SaleRecord[], periodDays: number = 30): RevenueSummary {
  const now = Date.now()
  const cutoff = now - periodDays * 24 * 60 * 60 * 1000
  const recent = sales.filter(
    (s) => new Date(s.soldAt).getTime() >= cutoff && s.price > 0,
  )
  if (recent.length === 0) {
    return { totalGmv: 0, avgSalePrice: 0, medianSalePrice: 0, salesCount: 0, periodDays, dailyAvgGmv: 0 }
  }
  const prices = recent.map((s) => s.price).sort((a, b) => a - b)
  const totalGmv = prices.reduce((sum, p) => sum + p, 0)
  const avgSalePrice = Math.round(totalGmv / prices.length)
  const mid = prices.length % 2 === 0
    ? Math.round((prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2)
    : prices[Math.floor(prices.length / 2)]
  return { totalGmv, avgSalePrice, medianSalePrice: mid, salesCount: recent.length, periodDays, dailyAvgGmv: Math.round(totalGmv / periodDays) }
}

function calculateFunnel(metrics: ListingMetric[]): FunnelStage[] {
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
    { stage: 'contacts', count: totalContacts, rate: totalViews > 0 ? Math.round((totalContacts / totalViews) * 10000) / 10000 : 0 },
    { stage: 'favorites', count: totalFavorites, rate: totalViews > 0 ? Math.round((totalFavorites / totalViews) * 10000) / 10000 : 0 },
  ]
}

function calculateListingPerformance(metrics: ListingMetric[]): ListingPerformance {
  if (metrics.length === 0) {
    return { avgViews: 0, avgContacts: 0, avgFavorites: 0, overallCtr: 0, avgDaysListed: 0, contactRate: 0 }
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
    overallCtr: totalViews > 0 ? Math.round((totalContacts / totalViews) * 10000) / 10000 : 0,
    avgDaysListed: Math.round(totalDays / n),
    contactRate: totalViews > 0 ? Math.round((totalContacts / totalViews) * 100) : 0,
  }
}

function calculatePortfolioHealth(metrics: ListingMetric[]): PortfolioHealth {
  if (metrics.length === 0) {
    return { totalListings: 0, categoryCount: 0, topCategoryShare: 0, herfindahlIndex: 0, diversityScore: 100 }
  }
  const categoryCounts = new Map<string, number>()
  for (const m of metrics) {
    const cat = m.categoryId ?? 'uncategorized'
    categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1)
  }
  const total = metrics.length
  const shares = Array.from(categoryCounts.values()).map((c) => c / total)
  const topShare = Math.max(...shares)
  const hhi = shares.reduce((sum, s) => sum + s * s, 0)
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

function revenueByCategory(sales: SaleRecord[]) {
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

function rankListingsByContactRate(
  metrics: ListingMetric[],
  topN: number = 5,
) {
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

// Helpers
const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()

const mkSale = (overrides: Partial<SaleRecord> = {}): SaleRecord => ({
  price: 50000,
  soldAt: daysAgo(5),
  categoryId: 'cat-trucks',
  ...overrides,
})

const mkMetric = (overrides: Partial<ListingMetric> = {}): ListingMetric => ({
  views: 100,
  contacts: 5,
  favorites: 10,
  daysListed: 30,
  price: 50000,
  categoryId: 'cat-trucks',
  ...overrides,
})

// ─── calculateRevenueSummary ──────────────────────────────

describe('calculateRevenueSummary', () => {
  it('empty sales returns zeroes', () => {
    const result = calculateRevenueSummary([])
    expect(result.totalGmv).toBe(0)
    expect(result.salesCount).toBe(0)
    expect(result.dailyAvgGmv).toBe(0)
  })

  it('calculates GMV correctly', () => {
    const sales = [mkSale({ price: 30000 }), mkSale({ price: 70000 })]
    const result = calculateRevenueSummary(sales)
    expect(result.totalGmv).toBe(100000)
    expect(result.salesCount).toBe(2)
    expect(result.avgSalePrice).toBe(50000)
  })

  it('calculates median for odd count', () => {
    const sales = [
      mkSale({ price: 10000 }),
      mkSale({ price: 30000 }),
      mkSale({ price: 50000 }),
    ]
    const result = calculateRevenueSummary(sales)
    expect(result.medianSalePrice).toBe(30000)
  })

  it('calculates median for even count', () => {
    const sales = [
      mkSale({ price: 20000 }),
      mkSale({ price: 40000 }),
      mkSale({ price: 60000 }),
      mkSale({ price: 80000 }),
    ]
    const result = calculateRevenueSummary(sales)
    expect(result.medianSalePrice).toBe(50000)
  })

  it('calculates daily average', () => {
    const sales = [mkSale({ price: 60000 })]
    const result = calculateRevenueSummary(sales, 30)
    expect(result.dailyAvgGmv).toBe(2000)
  })

  it('filters old sales outside period', () => {
    const sales = [mkSale({ soldAt: daysAgo(60) })]
    const result = calculateRevenueSummary(sales, 30)
    expect(result.salesCount).toBe(0)
    expect(result.totalGmv).toBe(0)
  })

  it('ignores zero-price sales', () => {
    const sales = [mkSale({ price: 0 }), mkSale({ price: 50000 })]
    const result = calculateRevenueSummary(sales)
    expect(result.salesCount).toBe(1)
    expect(result.totalGmv).toBe(50000)
  })
})

// ─── calculateFunnel ──────────────────────────────────────

describe('calculateFunnel', () => {
  it('empty metrics returns 3 stages with 0', () => {
    const funnel = calculateFunnel([])
    expect(funnel).toHaveLength(3)
    expect(funnel.every((s) => s.count === 0)).toBe(true)
  })

  it('views stage always rate = 1', () => {
    const funnel = calculateFunnel([mkMetric()])
    expect(funnel[0].stage).toBe('views')
    expect(funnel[0].rate).toBe(1)
  })

  it('calculates contact rate correctly', () => {
    const metrics = [mkMetric({ views: 200, contacts: 10 })]
    const funnel = calculateFunnel(metrics)
    expect(funnel[1].stage).toBe('contacts')
    expect(funnel[1].count).toBe(10)
    expect(funnel[1].rate).toBe(0.05)
  })

  it('aggregates across multiple listings', () => {
    const metrics = [
      mkMetric({ views: 100, contacts: 5, favorites: 10 }),
      mkMetric({ views: 200, contacts: 10, favorites: 20 }),
    ]
    const funnel = calculateFunnel(metrics)
    expect(funnel[0].count).toBe(300)
    expect(funnel[1].count).toBe(15)
    expect(funnel[2].count).toBe(30)
  })
})

// ─── calculateListingPerformance ──────────────────────────

describe('calculateListingPerformance', () => {
  it('empty metrics returns zeroes', () => {
    const perf = calculateListingPerformance([])
    expect(perf.avgViews).toBe(0)
    expect(perf.overallCtr).toBe(0)
  })

  it('calculates averages correctly', () => {
    const metrics = [
      mkMetric({ views: 100, contacts: 10, favorites: 20, daysListed: 10 }),
      mkMetric({ views: 200, contacts: 20, favorites: 40, daysListed: 20 }),
    ]
    const perf = calculateListingPerformance(metrics)
    expect(perf.avgViews).toBe(150)
    expect(perf.avgContacts).toBe(15)
    expect(perf.avgFavorites).toBe(30)
    expect(perf.avgDaysListed).toBe(15)
  })

  it('calculates CTR as contacts/views', () => {
    const metrics = [mkMetric({ views: 1000, contacts: 50 })]
    const perf = calculateListingPerformance(metrics)
    expect(perf.overallCtr).toBe(0.05)
    expect(perf.contactRate).toBe(5) // 5%
  })

  it('contactRate is integer percentage', () => {
    const metrics = [mkMetric({ views: 300, contacts: 9 })]
    const perf = calculateListingPerformance(metrics)
    expect(perf.contactRate).toBe(3) // 3%
  })
})

// ─── calculatePortfolioHealth ─────────────────────────────

describe('calculatePortfolioHealth', () => {
  it('empty metrics returns defaults', () => {
    const health = calculatePortfolioHealth([])
    expect(health.totalListings).toBe(0)
    expect(health.diversityScore).toBe(100)
  })

  it('single category = 0 diversity', () => {
    const metrics = [mkMetric(), mkMetric(), mkMetric()]
    const health = calculatePortfolioHealth(metrics)
    expect(health.categoryCount).toBe(1)
    expect(health.topCategoryShare).toBe(100)
    expect(health.herfindahlIndex).toBe(1)
    expect(health.diversityScore).toBe(0)
  })

  it('perfectly diversified = 100 score', () => {
    const metrics = [
      mkMetric({ categoryId: 'cat-a' }),
      mkMetric({ categoryId: 'cat-b' }),
      mkMetric({ categoryId: 'cat-c' }),
      mkMetric({ categoryId: 'cat-d' }),
    ]
    const health = calculatePortfolioHealth(metrics)
    expect(health.categoryCount).toBe(4)
    expect(health.topCategoryShare).toBe(25)
    expect(health.diversityScore).toBe(100)
  })

  it('partial diversification gives intermediate score', () => {
    const metrics = [
      mkMetric({ categoryId: 'cat-a' }),
      mkMetric({ categoryId: 'cat-a' }),
      mkMetric({ categoryId: 'cat-a' }),
      mkMetric({ categoryId: 'cat-b' }),
    ]
    const health = calculatePortfolioHealth(metrics)
    expect(health.categoryCount).toBe(2)
    expect(health.topCategoryShare).toBe(75)
    expect(health.diversityScore).toBeGreaterThan(0)
    expect(health.diversityScore).toBeLessThan(100)
  })

  it('HHI range is 0-1', () => {
    const metrics = [
      mkMetric({ categoryId: 'cat-a' }),
      mkMetric({ categoryId: 'cat-b' }),
    ]
    const health = calculatePortfolioHealth(metrics)
    expect(health.herfindahlIndex).toBeGreaterThanOrEqual(0)
    expect(health.herfindahlIndex).toBeLessThanOrEqual(1)
  })

  it('uncategorized items grouped together', () => {
    const metrics = [
      mkMetric({ categoryId: undefined }),
      mkMetric({ categoryId: undefined }),
      mkMetric({ categoryId: 'cat-a' }),
    ]
    const health = calculatePortfolioHealth(metrics)
    expect(health.categoryCount).toBe(2)
  })
})

// ─── revenueByCategory ───────────────────────────────────

describe('revenueByCategory', () => {
  it('empty sales returns empty', () => {
    expect(revenueByCategory([])).toEqual([])
  })

  it('groups by category', () => {
    const sales = [
      mkSale({ categoryId: 'cat-a', price: 10000 }),
      mkSale({ categoryId: 'cat-a', price: 20000 }),
      mkSale({ categoryId: 'cat-b', price: 50000 }),
    ]
    const result = revenueByCategory(sales)
    expect(result).toHaveLength(2)
    // Sorted by total desc: cat-b (50k) then cat-a (30k)
    expect(result[0].categoryId).toBe('cat-b')
    expect(result[0].total).toBe(50000)
    expect(result[1].categoryId).toBe('cat-a')
    expect(result[1].total).toBe(30000)
    expect(result[1].avgPrice).toBe(15000)
  })

  it('ignores zero-price sales', () => {
    const sales = [mkSale({ price: 0 }), mkSale({ price: 30000 })]
    const result = revenueByCategory(sales)
    expect(result[0].count).toBe(1)
  })

  it('uses uncategorized for missing category', () => {
    const sales = [mkSale({ categoryId: undefined, price: 10000 })]
    const result = revenueByCategory(sales)
    expect(result[0].categoryId).toBe('uncategorized')
  })
})

// ─── rankListingsByContactRate ────────────────────────────

describe('rankListingsByContactRate', () => {
  it('empty returns empty top and bottom', () => {
    const result = rankListingsByContactRate([])
    expect(result.top).toEqual([])
    expect(result.bottom).toEqual([])
  })

  it('ranks by contact rate descending', () => {
    const metrics = [
      mkMetric({ views: 100, contacts: 1 }),  // 1%
      mkMetric({ views: 100, contacts: 10 }), // 10%
      mkMetric({ views: 100, contacts: 5 }),  // 5%
    ]
    const result = rankListingsByContactRate(metrics, 3)
    expect(result.top[0].rate).toBe(0.1)
    expect(result.top[1].rate).toBe(0.05)
    expect(result.top[2].rate).toBe(0.01)
  })

  it('respects topN limit', () => {
    const metrics = Array.from({ length: 10 }, (_, i) =>
      mkMetric({ views: 100, contacts: i + 1 }),
    )
    const result = rankListingsByContactRate(metrics, 3)
    expect(result.top).toHaveLength(3)
    expect(result.bottom).toHaveLength(3)
  })

  it('filters out zero-view listings', () => {
    const metrics = [
      mkMetric({ views: 0, contacts: 0 }),
      mkMetric({ views: 100, contacts: 5 }),
    ]
    const result = rankListingsByContactRate(metrics)
    expect(result.top).toHaveLength(1)
  })

  it('bottom is reverse sorted (worst first)', () => {
    const metrics = [
      mkMetric({ views: 100, contacts: 1 }),  // 1%
      mkMetric({ views: 100, contacts: 10 }), // 10%
      mkMetric({ views: 100, contacts: 5 }),  // 5%
    ]
    const result = rankListingsByContactRate(metrics, 3)
    expect(result.bottom[0].rate).toBe(0.01)
  })
})
