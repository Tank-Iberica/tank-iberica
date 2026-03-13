/**
 * Inventory tracking composable — fleet stock level monitoring.
 *
 * Calculates:
 * - Stock levels by status (published, draft, sold, etc.)
 * - Days on market (average time to sell)
 * - Sell-through rate
 * - Stock turnover ratio
 * - Aging inventory alerts
 *
 * Pure calculation functions exported for testability.
 * Used in dealer dashboard and admin fleet management.
 */

export interface InventoryItem {
  id: string
  status: string
  createdAt: string
  soldAt?: string
  price?: number
}

export interface StockLevel {
  status: string
  count: number
  percentage: number
}

export interface InventoryHealth {
  totalVehicles: number
  activeListings: number
  soldLast30Days: number
  avgDaysOnMarket: number
  sellThroughRate: number
  turnoverRatio: number
  agingCount: number
}

/**
 * Calculate stock levels by status.
 */
export function calculateStockLevels(items: InventoryItem[]): StockLevel[] {
  const counts = new Map<string, number>()
  for (const item of items) {
    counts.set(item.status, (counts.get(item.status) ?? 0) + 1)
  }

  const total = items.length || 1
  return Array.from(counts.entries())
    .map(([status, count]) => ({
      status,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Calculate average days on market for sold vehicles.
 */
export function calculateAvgDaysOnMarket(items: InventoryItem[]): number {
  const sold = items.filter((i) => i.status === 'sold' && i.soldAt)
  if (sold.length === 0) return 0

  let totalDays = 0
  for (const item of sold) {
    const created = new Date(item.createdAt).getTime()
    const soldDate = new Date(item.soldAt!).getTime()
    const days = Math.max(0, (soldDate - created) / (24 * 60 * 60 * 1000))
    totalDays += days
  }

  return Math.round(totalDays / sold.length)
}

/**
 * Calculate sell-through rate (sold / (sold + active) in last N days).
 * Returns 0-1 ratio.
 */
export function calculateSellThroughRate(
  items: InventoryItem[],
  periodDays: number = 30,
): number {
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

/**
 * Calculate stock turnover ratio (sold / avg stock level).
 * Annualized by default.
 */
export function calculateTurnoverRatio(
  soldCount: number,
  avgActiveStock: number,
  periodDays: number = 30,
): number {
  if (avgActiveStock === 0) return 0
  const annualized = (soldCount / periodDays) * 365
  return Math.round((annualized / avgActiveStock) * 10) / 10
}

/**
 * Count aging inventory (vehicles older than threshold days).
 */
export function countAgingInventory(
  items: InventoryItem[],
  thresholdDays: number = 90,
): number {
  const now = Date.now()
  const cutoff = now - thresholdDays * 24 * 60 * 60 * 1000

  return items.filter((i) =>
    i.status === 'published' && new Date(i.createdAt).getTime() < cutoff,
  ).length
}

/**
 * Calculate complete inventory health metrics.
 */
export function calculateInventoryHealth(
  items: InventoryItem[],
  periodDays: number = 30,
  agingThresholdDays: number = 90,
): InventoryHealth {
  const totalVehicles = items.length
  const activeListings = items.filter((i) => i.status === 'published').length

  const now = Date.now()
  const cutoff = now - periodDays * 24 * 60 * 60 * 1000
  const soldLast30Days = items.filter((i) =>
    i.status === 'sold' && i.soldAt && new Date(i.soldAt).getTime() >= cutoff,
  ).length

  return {
    totalVehicles,
    activeListings,
    soldLast30Days,
    avgDaysOnMarket: calculateAvgDaysOnMarket(items),
    sellThroughRate: calculateSellThroughRate(items, periodDays),
    turnoverRatio: calculateTurnoverRatio(soldLast30Days, activeListings, periodDays),
    agingCount: countAgingInventory(items, agingThresholdDays),
  }
}
