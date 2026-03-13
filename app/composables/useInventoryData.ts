/**
 * Inventory data aggregation composable — data access for fleet management.
 *
 * Provides:
 * - Vehicle count aggregation by status, category, dealer
 * - Time-series snapshots for trend analysis
 * - Stale inventory detection
 * - Value-at-risk calculation (unsold inventory value)
 * - Stock movement tracking (in/out flow)
 *
 * Pure calculation functions exported for testability.
 * Used by dealer dashboard, admin fleet view, and analytics exports.
 * Sync point S4: Agent A needs this for #198 (Bloque 25).
 */

export interface VehicleRecord {
  id: string
  status: string
  categoryId?: string
  dealerId?: string
  price: number
  createdAt: string
  updatedAt?: string
  soldAt?: string
}

export interface StatusAggregate {
  status: string
  count: number
  totalValue: number
  avgPrice: number
}

export interface CategoryAggregate {
  categoryId: string
  count: number
  totalValue: number
  avgPrice: number
  avgAge: number
}

export interface StockMovement {
  period: string
  inflow: number
  outflow: number
  net: number
}

export interface InventorySnapshot {
  date: string
  activeCount: number
  totalValue: number
  avgPrice: number
}

export interface ValueAtRisk {
  totalUnsoldValue: number
  agingValue: number
  agingPercentage: number
  avgDaysUnsold: number
}

/**
 * Aggregate vehicles by status with value metrics.
 */
export function aggregateByStatus(vehicles: VehicleRecord[]): StatusAggregate[] {
  const map = new Map<string, { count: number; totalValue: number }>()

  for (const v of vehicles) {
    const existing = map.get(v.status) ?? { count: 0, totalValue: 0 }
    existing.count += 1
    existing.totalValue += Math.max(0, v.price)
    map.set(v.status, existing)
  }

  return Array.from(map.entries())
    .map(([status, data]) => ({
      status,
      count: data.count,
      totalValue: data.totalValue,
      avgPrice: data.count > 0 ? Math.round(data.totalValue / data.count) : 0,
    }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Aggregate vehicles by category with value and age metrics.
 */
export function aggregateByCategory(vehicles: VehicleRecord[]): CategoryAggregate[] {
  const now = Date.now()
  const map = new Map<string, { count: number; totalValue: number; totalAge: number }>()

  for (const v of vehicles) {
    const cat = v.categoryId ?? 'uncategorized'
    const existing = map.get(cat) ?? { count: 0, totalValue: 0, totalAge: 0 }
    existing.count += 1
    existing.totalValue += Math.max(0, v.price)
    existing.totalAge += (now - new Date(v.createdAt).getTime()) / (24 * 60 * 60 * 1000)
    map.set(cat, existing)
  }

  return Array.from(map.entries())
    .map(([categoryId, data]) => ({
      categoryId,
      count: data.count,
      totalValue: data.totalValue,
      avgPrice: data.count > 0 ? Math.round(data.totalValue / data.count) : 0,
      avgAge: data.count > 0 ? Math.round(data.totalAge / data.count) : 0,
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
}

/**
 * Calculate stock movements (inflow/outflow) over time periods.
 * Inflow = newly created vehicles; outflow = newly sold vehicles.
 */
export function calculateStockMovements(
  vehicles: VehicleRecord[],
  periodDays: number = 30,
  bucketDays: number = 7,
): StockMovement[] {
  const now = Date.now()
  const cutoff = now - periodDays * 24 * 60 * 60 * 1000
  const buckets: StockMovement[] = []

  for (let start = cutoff; start < now; start += bucketDays * 24 * 60 * 60 * 1000) {
    const end = Math.min(start + bucketDays * 24 * 60 * 60 * 1000, now)
    const period = new Date(start).toISOString().slice(0, 10)

    const inflow = vehicles.filter((v) => {
      const t = new Date(v.createdAt).getTime()
      return t >= start && t < end
    }).length

    const outflow = vehicles.filter((v) => {
      if (!v.soldAt) return false
      const t = new Date(v.soldAt).getTime()
      return t >= start && t < end
    }).length

    buckets.push({ period, inflow, outflow, net: inflow - outflow })
  }

  return buckets
}

/**
 * Generate inventory snapshots for trend tracking.
 * Simulates daily snapshots by counting active vehicles at each point.
 */
export function generateSnapshots(
  vehicles: VehicleRecord[],
  periodDays: number = 30,
  bucketDays: number = 7,
): InventorySnapshot[] {
  const now = Date.now()
  const cutoff = now - periodDays * 24 * 60 * 60 * 1000
  const snapshots: InventorySnapshot[] = []

  for (let point = cutoff; point <= now; point += bucketDays * 24 * 60 * 60 * 1000) {
    const active = vehicles.filter((v) => {
      const created = new Date(v.createdAt).getTime()
      if (created > point) return false
      if (v.soldAt && new Date(v.soldAt).getTime() <= point) return false
      if (v.status === 'draft') return false
      return true
    })

    const totalValue = active.reduce((sum, v) => sum + Math.max(0, v.price), 0)

    snapshots.push({
      date: new Date(point).toISOString().slice(0, 10),
      activeCount: active.length,
      totalValue,
      avgPrice: active.length > 0 ? Math.round(totalValue / active.length) : 0,
    })
  }

  return snapshots
}

/**
 * Calculate value at risk from unsold inventory.
 */
export function calculateValueAtRisk(
  vehicles: VehicleRecord[],
  agingThresholdDays: number = 90,
): ValueAtRisk {
  const now = Date.now()
  const agingCutoff = now - agingThresholdDays * 24 * 60 * 60 * 1000

  const unsold = vehicles.filter((v) => v.status === 'published')

  if (unsold.length === 0) {
    return { totalUnsoldValue: 0, agingValue: 0, agingPercentage: 0, avgDaysUnsold: 0 }
  }

  const totalUnsoldValue = unsold.reduce((sum, v) => sum + Math.max(0, v.price), 0)

  const aging = unsold.filter((v) => new Date(v.createdAt).getTime() < agingCutoff)
  const agingValue = aging.reduce((sum, v) => sum + Math.max(0, v.price), 0)

  const totalDaysUnsold = unsold.reduce((sum, v) => {
    return sum + (now - new Date(v.createdAt).getTime()) / (24 * 60 * 60 * 1000)
  }, 0)

  return {
    totalUnsoldValue,
    agingValue,
    agingPercentage: totalUnsoldValue > 0
      ? Math.round((agingValue / totalUnsoldValue) * 100)
      : 0,
    avgDaysUnsold: Math.round(totalDaysUnsold / unsold.length),
  }
}

/**
 * Detect stale inventory — vehicles with no updates in N days.
 */
export function findStaleListings(
  vehicles: VehicleRecord[],
  staleDays: number = 60,
): VehicleRecord[] {
  const now = Date.now()
  const cutoff = now - staleDays * 24 * 60 * 60 * 1000

  return vehicles
    .filter((v) => {
      if (v.status !== 'published') return false
      const lastActivity = v.updatedAt
        ? new Date(v.updatedAt).getTime()
        : new Date(v.createdAt).getTime()
      return lastActivity < cutoff
    })
    .sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : new Date(a.createdAt).getTime()
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : new Date(b.createdAt).getTime()
      return aTime - bTime
    })
}

/**
 * Calculate dealer-level inventory summary for multi-dealer platforms.
 */
export function aggregateByDealer(
  vehicles: VehicleRecord[],
): Array<{ dealerId: string; activeCount: number; totalValue: number; avgPrice: number; oldestDays: number }> {
  const now = Date.now()
  const map = new Map<string, { activeCount: number; totalValue: number; oldestCreated: number }>()

  for (const v of vehicles) {
    if (v.status !== 'published') continue
    const dealer = v.dealerId ?? 'unknown'
    const existing = map.get(dealer) ?? { activeCount: 0, totalValue: 0, oldestCreated: now }
    existing.activeCount += 1
    existing.totalValue += Math.max(0, v.price)
    const created = new Date(v.createdAt).getTime()
    if (created < existing.oldestCreated) existing.oldestCreated = created
    map.set(dealer, existing)
  }

  return Array.from(map.entries())
    .map(([dealerId, data]) => ({
      dealerId,
      activeCount: data.activeCount,
      totalValue: data.totalValue,
      avgPrice: data.activeCount > 0 ? Math.round(data.totalValue / data.activeCount) : 0,
      oldestDays: Math.round((now - data.oldestCreated) / (24 * 60 * 60 * 1000)),
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
}
