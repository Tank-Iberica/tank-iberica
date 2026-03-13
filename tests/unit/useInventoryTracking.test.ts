import { describe, it, expect } from 'vitest'

/**
 * Tests for useInventoryTracking composable — fleet stock monitoring.
 */

interface InventoryItem {
  id: string
  status: string
  createdAt: string
  soldAt?: string
  price?: number
}

function calculateStockLevels(items: InventoryItem[]) {
  const counts = new Map<string, number>()
  for (const item of items) {
    counts.set(item.status, (counts.get(item.status) ?? 0) + 1)
  }
  const total = items.length || 1
  return Array.from(counts.entries())
    .map(([status, count]) => ({ status, count, percentage: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
}

function calculateAvgDaysOnMarket(items: InventoryItem[]): number {
  const sold = items.filter((i) => i.status === 'sold' && i.soldAt)
  if (sold.length === 0) return 0
  let totalDays = 0
  for (const item of sold) {
    const created = new Date(item.createdAt).getTime()
    const soldDate = new Date(item.soldAt!).getTime()
    totalDays += Math.max(0, (soldDate - created) / (24 * 60 * 60 * 1000))
  }
  return Math.round(totalDays / sold.length)
}

function calculateSellThroughRate(items: InventoryItem[], periodDays: number = 30): number {
  const now = Date.now()
  const cutoff = now - periodDays * 24 * 60 * 60 * 1000
  const recentSold = items.filter((i) =>
    i.status === 'sold' && i.soldAt && new Date(i.soldAt).getTime() >= cutoff,
  ).length
  const active = items.filter((i) => i.status === 'published').length
  const denominator = recentSold + active
  if (denominator === 0) return 0
  return Math.round((recentSold / denominator) * 100) / 100
}

function calculateTurnoverRatio(soldCount: number, avgActiveStock: number, periodDays: number = 30): number {
  if (avgActiveStock === 0) return 0
  const annualized = (soldCount / periodDays) * 365
  return Math.round((annualized / avgActiveStock) * 10) / 10
}

function countAgingInventory(items: InventoryItem[], thresholdDays: number = 90): number {
  const now = Date.now()
  const cutoff = now - thresholdDays * 24 * 60 * 60 * 1000
  return items.filter((i) =>
    i.status === 'published' && new Date(i.createdAt).getTime() < cutoff,
  ).length
}

function calculateInventoryHealth(items: InventoryItem[], periodDays: number = 30, agingThresholdDays: number = 90) {
  const totalVehicles = items.length
  const activeListings = items.filter((i) => i.status === 'published').length
  const now = Date.now()
  const cutoff = now - periodDays * 24 * 60 * 60 * 1000
  const soldLast30Days = items.filter((i) =>
    i.status === 'sold' && i.soldAt && new Date(i.soldAt).getTime() >= cutoff,
  ).length
  return {
    totalVehicles, activeListings, soldLast30Days,
    avgDaysOnMarket: calculateAvgDaysOnMarket(items),
    sellThroughRate: calculateSellThroughRate(items, periodDays),
    turnoverRatio: calculateTurnoverRatio(soldLast30Days, activeListings, periodDays),
    agingCount: countAgingInventory(items, agingThresholdDays),
  }
}

// Helpers
const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()

const mkItem = (overrides: Partial<InventoryItem> = {}): InventoryItem => ({
  id: `v-${Math.random().toString(36).slice(2, 6)}`,
  status: 'published',
  createdAt: daysAgo(30),
  ...overrides,
})

// ─── calculateStockLevels ───────────────────────────────────

describe('calculateStockLevels', () => {
  it('empty items returns empty', () => {
    expect(calculateStockLevels([])).toEqual([])
  })

  it('counts by status', () => {
    const items = [
      mkItem({ status: 'published' }),
      mkItem({ status: 'published' }),
      mkItem({ status: 'sold' }),
    ]
    const levels = calculateStockLevels(items)
    expect(levels.find((l) => l.status === 'published')?.count).toBe(2)
    expect(levels.find((l) => l.status === 'sold')?.count).toBe(1)
  })

  it('calculates percentages', () => {
    const items = [
      mkItem({ status: 'published' }),
      mkItem({ status: 'published' }),
      mkItem({ status: 'published' }),
      mkItem({ status: 'sold' }),
    ]
    const levels = calculateStockLevels(items)
    expect(levels[0].percentage).toBe(75)
    expect(levels[1].percentage).toBe(25)
  })

  it('sorted by count descending', () => {
    const items = [
      mkItem({ status: 'draft' }),
      mkItem({ status: 'published' }),
      mkItem({ status: 'published' }),
      mkItem({ status: 'published' }),
    ]
    const levels = calculateStockLevels(items)
    expect(levels[0].status).toBe('published')
  })
})

// ─── calculateAvgDaysOnMarket ───────────────────────────────

describe('calculateAvgDaysOnMarket', () => {
  it('0 for no sold items', () => {
    expect(calculateAvgDaysOnMarket([])).toBe(0)
    expect(calculateAvgDaysOnMarket([mkItem()])).toBe(0)
  })

  it('calculates correctly for sold items', () => {
    const items = [
      mkItem({ status: 'sold', createdAt: daysAgo(20), soldAt: daysAgo(10) }),
      mkItem({ status: 'sold', createdAt: daysAgo(40), soldAt: daysAgo(10) }),
    ]
    const avg = calculateAvgDaysOnMarket(items)
    // (10 + 30) / 2 = 20
    expect(avg).toBe(20)
  })

  it('ignores sold without soldAt', () => {
    const items = [
      mkItem({ status: 'sold' }), // no soldAt
    ]
    expect(calculateAvgDaysOnMarket(items)).toBe(0)
  })
})

// ─── calculateSellThroughRate ───────────────────────────────

describe('calculateSellThroughRate', () => {
  it('0 for empty items', () => {
    expect(calculateSellThroughRate([])).toBe(0)
  })

  it('0 for all active, no sales', () => {
    const items = [mkItem(), mkItem()]
    expect(calculateSellThroughRate(items)).toBe(0)
  })

  it('calculates correctly', () => {
    const items = [
      mkItem({ status: 'published' }),
      mkItem({ status: 'published' }),
      mkItem({ status: 'published' }),
      mkItem({ status: 'sold', soldAt: daysAgo(5) }),
    ]
    // 1 sold / (1 sold + 3 active) = 0.25
    expect(calculateSellThroughRate(items)).toBe(0.25)
  })

  it('ignores old sales', () => {
    const items = [
      mkItem({ status: 'published' }),
      mkItem({ status: 'sold', soldAt: daysAgo(60) }), // Outside 30-day window
    ]
    expect(calculateSellThroughRate(items, 30)).toBe(0)
  })
})

// ─── calculateTurnoverRatio ─────────────────────────────────

describe('calculateTurnoverRatio', () => {
  it('0 for no active stock', () => {
    expect(calculateTurnoverRatio(5, 0)).toBe(0)
  })

  it('annualizes the ratio', () => {
    // 10 sold in 30 days with 50 active = (10/30)*365/50 ≈ 2.4
    const ratio = calculateTurnoverRatio(10, 50, 30)
    expect(ratio).toBeCloseTo(2.4, 0)
  })

  it('higher sold count = higher ratio', () => {
    const low = calculateTurnoverRatio(5, 50, 30)
    const high = calculateTurnoverRatio(20, 50, 30)
    expect(high).toBeGreaterThan(low)
  })
})

// ─── countAgingInventory ────────────────────────────────────

describe('countAgingInventory', () => {
  it('0 for fresh inventory', () => {
    const items = [mkItem({ createdAt: daysAgo(10) })]
    expect(countAgingInventory(items, 90)).toBe(0)
  })

  it('counts old published items', () => {
    const items = [
      mkItem({ createdAt: daysAgo(100) }),
      mkItem({ createdAt: daysAgo(95) }),
      mkItem({ createdAt: daysAgo(10) }),
    ]
    expect(countAgingInventory(items, 90)).toBe(2)
  })

  it('ignores non-published items', () => {
    const items = [
      mkItem({ status: 'sold', createdAt: daysAgo(200) }),
    ]
    expect(countAgingInventory(items, 90)).toBe(0)
  })

  it('custom threshold', () => {
    const items = [mkItem({ createdAt: daysAgo(35) })]
    expect(countAgingInventory(items, 30)).toBe(1)
    expect(countAgingInventory(items, 60)).toBe(0)
  })
})

// ─── calculateInventoryHealth ───────────────────────────────

describe('calculateInventoryHealth', () => {
  it('returns complete metrics', () => {
    const items = [
      mkItem({ status: 'published', createdAt: daysAgo(10) }),
      mkItem({ status: 'published', createdAt: daysAgo(100) }),
      mkItem({ status: 'sold', createdAt: daysAgo(40), soldAt: daysAgo(5) }),
      mkItem({ status: 'draft', createdAt: daysAgo(2) }),
    ]
    const health = calculateInventoryHealth(items)
    expect(health.totalVehicles).toBe(4)
    expect(health.activeListings).toBe(2)
    expect(health.soldLast30Days).toBe(1)
    expect(health.avgDaysOnMarket).toBeGreaterThan(0)
    expect(health.agingCount).toBe(1) // 100 days old published item
  })

  it('handles empty fleet', () => {
    const health = calculateInventoryHealth([])
    expect(health.totalVehicles).toBe(0)
    expect(health.activeListings).toBe(0)
    expect(health.sellThroughRate).toBe(0)
  })
})
