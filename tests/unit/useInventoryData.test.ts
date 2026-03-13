import { describe, it, expect } from 'vitest'

/**
 * Tests for useInventoryData composable — fleet data aggregation.
 */

interface VehicleRecord {
  id: string
  status: string
  categoryId?: string
  dealerId?: string
  price: number
  createdAt: string
  updatedAt?: string
  soldAt?: string
}

function aggregateByStatus(vehicles: VehicleRecord[]) {
  const map = new Map<string, { count: number; totalValue: number }>()
  for (const v of vehicles) {
    const existing = map.get(v.status) ?? { count: 0, totalValue: 0 }
    existing.count += 1
    existing.totalValue += Math.max(0, v.price)
    map.set(v.status, existing)
  }
  return Array.from(map.entries())
    .map(([status, data]) => ({
      status, count: data.count, totalValue: data.totalValue,
      avgPrice: data.count > 0 ? Math.round(data.totalValue / data.count) : 0,
    }))
    .sort((a, b) => b.count - a.count)
}

function aggregateByCategory(vehicles: VehicleRecord[]) {
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
      categoryId, count: data.count, totalValue: data.totalValue,
      avgPrice: data.count > 0 ? Math.round(data.totalValue / data.count) : 0,
      avgAge: data.count > 0 ? Math.round(data.totalAge / data.count) : 0,
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
}

function calculateStockMovements(vehicles: VehicleRecord[], periodDays: number = 30, bucketDays: number = 7) {
  const now = Date.now()
  const cutoff = now - periodDays * 24 * 60 * 60 * 1000
  const buckets: Array<{ period: string; inflow: number; outflow: number; net: number }> = []
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

function generateSnapshots(vehicles: VehicleRecord[], periodDays: number = 30, bucketDays: number = 7) {
  const now = Date.now()
  const cutoff = now - periodDays * 24 * 60 * 60 * 1000
  const snapshots: Array<{ date: string; activeCount: number; totalValue: number; avgPrice: number }> = []
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

function calculateValueAtRisk(vehicles: VehicleRecord[], agingThresholdDays: number = 90) {
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
    totalUnsoldValue, agingValue,
    agingPercentage: totalUnsoldValue > 0 ? Math.round((agingValue / totalUnsoldValue) * 100) : 0,
    avgDaysUnsold: Math.round(totalDaysUnsold / unsold.length),
  }
}

function findStaleListings(vehicles: VehicleRecord[], staleDays: number = 60) {
  const now = Date.now()
  const cutoff = now - staleDays * 24 * 60 * 60 * 1000
  return vehicles
    .filter((v) => {
      if (v.status !== 'published') return false
      const lastActivity = v.updatedAt ? new Date(v.updatedAt).getTime() : new Date(v.createdAt).getTime()
      return lastActivity < cutoff
    })
    .sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : new Date(a.createdAt).getTime()
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : new Date(b.createdAt).getTime()
      return aTime - bTime
    })
}

function aggregateByDealer(vehicles: VehicleRecord[]) {
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
      dealerId, activeCount: data.activeCount, totalValue: data.totalValue,
      avgPrice: data.activeCount > 0 ? Math.round(data.totalValue / data.activeCount) : 0,
      oldestDays: Math.round((now - data.oldestCreated) / (24 * 60 * 60 * 1000)),
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
}

// Helpers
const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()

const mkVehicle = (overrides: Partial<VehicleRecord> = {}): VehicleRecord => ({
  id: `v-${Math.random().toString(36).slice(2, 6)}`,
  status: 'published',
  price: 50000,
  createdAt: daysAgo(30),
  ...overrides,
})

// ─── aggregateByStatus ────────────────────────────────────

describe('aggregateByStatus', () => {
  it('empty returns empty', () => {
    expect(aggregateByStatus([])).toEqual([])
  })

  it('groups by status with counts and values', () => {
    const vehicles = [
      mkVehicle({ status: 'published', price: 30000 }),
      mkVehicle({ status: 'published', price: 70000 }),
      mkVehicle({ status: 'sold', price: 40000 }),
    ]
    const result = aggregateByStatus(vehicles)
    expect(result).toHaveLength(2)
    const published = result.find((r) => r.status === 'published')!
    expect(published.count).toBe(2)
    expect(published.totalValue).toBe(100000)
    expect(published.avgPrice).toBe(50000)
  })

  it('sorted by count descending', () => {
    const vehicles = [
      mkVehicle({ status: 'draft' }),
      mkVehicle({ status: 'published' }),
      mkVehicle({ status: 'published' }),
    ]
    const result = aggregateByStatus(vehicles)
    expect(result[0].status).toBe('published')
  })

  it('handles negative prices as 0', () => {
    const vehicles = [mkVehicle({ price: -1000 })]
    const result = aggregateByStatus(vehicles)
    expect(result[0].totalValue).toBe(0)
  })
})

// ─── aggregateByCategory ──────────────────────────────────

describe('aggregateByCategory', () => {
  it('empty returns empty', () => {
    expect(aggregateByCategory([])).toEqual([])
  })

  it('groups by category with value and age', () => {
    const vehicles = [
      mkVehicle({ categoryId: 'cat-a', price: 60000, createdAt: daysAgo(10) }),
      mkVehicle({ categoryId: 'cat-a', price: 40000, createdAt: daysAgo(20) }),
      mkVehicle({ categoryId: 'cat-b', price: 80000, createdAt: daysAgo(5) }),
    ]
    const result = aggregateByCategory(vehicles)
    expect(result).toHaveLength(2)
    // cat-a: 100k total, cat-b: 80k — sorted by totalValue desc
    // But cat-b has higher single value; cat-a has 100k total
    expect(result[0].categoryId).toBe('cat-a')
    expect(result[0].totalValue).toBe(100000)
    expect(result[0].avgAge).toBeGreaterThan(0)
  })

  it('uses uncategorized for missing categoryId', () => {
    const vehicles = [mkVehicle({ categoryId: undefined })]
    const result = aggregateByCategory(vehicles)
    expect(result[0].categoryId).toBe('uncategorized')
  })

  it('sorted by totalValue descending', () => {
    const vehicles = [
      mkVehicle({ categoryId: 'cheap', price: 10000 }),
      mkVehicle({ categoryId: 'expensive', price: 100000 }),
    ]
    const result = aggregateByCategory(vehicles)
    expect(result[0].categoryId).toBe('expensive')
  })
})

// ─── calculateStockMovements ──────────────────────────────

describe('calculateStockMovements', () => {
  it('empty vehicles returns buckets with 0s', () => {
    const result = calculateStockMovements([], 14, 7)
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((b) => b.inflow === 0 && b.outflow === 0)).toBe(true)
  })

  it('counts inflow for newly created vehicles', () => {
    const vehicles = [mkVehicle({ createdAt: daysAgo(2) })]
    const result = calculateStockMovements(vehicles, 7, 7)
    expect(result.some((b) => b.inflow > 0)).toBe(true)
  })

  it('counts outflow for sold vehicles', () => {
    const vehicles = [mkVehicle({ soldAt: daysAgo(3), createdAt: daysAgo(30) })]
    const result = calculateStockMovements(vehicles, 7, 7)
    expect(result.some((b) => b.outflow > 0)).toBe(true)
  })

  it('net = inflow - outflow', () => {
    const vehicles = [
      mkVehicle({ createdAt: daysAgo(2) }),
      mkVehicle({ createdAt: daysAgo(2) }),
      mkVehicle({ soldAt: daysAgo(2), createdAt: daysAgo(30) }),
    ]
    const result = calculateStockMovements(vehicles, 7, 7)
    const lastBucket = result[result.length - 1]
    expect(lastBucket.net).toBe(lastBucket.inflow - lastBucket.outflow)
  })

  it('buckets have date labels', () => {
    const result = calculateStockMovements([], 14, 7)
    for (const bucket of result) {
      expect(bucket.period).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})

// ─── generateSnapshots ────────────────────────────────────

describe('generateSnapshots', () => {
  it('empty vehicles returns snapshots with 0 counts', () => {
    const result = generateSnapshots([], 14, 7)
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((s) => s.activeCount === 0)).toBe(true)
  })

  it('counts active vehicles at each point', () => {
    const vehicles = [
      mkVehicle({ status: 'published', createdAt: daysAgo(60), price: 50000 }),
    ]
    const result = generateSnapshots(vehicles, 30, 30)
    // Vehicle was created 60 days ago, so should appear in all snapshots
    expect(result.some((s) => s.activeCount > 0)).toBe(true)
  })

  it('excludes draft vehicles', () => {
    const vehicles = [mkVehicle({ status: 'draft', createdAt: daysAgo(60) })]
    const result = generateSnapshots(vehicles, 30, 30)
    expect(result.every((s) => s.activeCount === 0)).toBe(true)
  })

  it('excludes sold vehicles after sale date', () => {
    const vehicles = [
      mkVehicle({ status: 'sold', createdAt: daysAgo(60), soldAt: daysAgo(20) }),
    ]
    const result = generateSnapshots(vehicles, 14, 7)
    // All snapshots are within last 14 days, vehicle sold 20 days ago
    expect(result.every((s) => s.activeCount === 0)).toBe(true)
  })

  it('calculates totalValue and avgPrice', () => {
    const vehicles = [
      mkVehicle({ status: 'published', createdAt: daysAgo(60), price: 30000 }),
      mkVehicle({ status: 'published', createdAt: daysAgo(60), price: 70000 }),
    ]
    const result = generateSnapshots(vehicles, 7, 7)
    const lastSnapshot = result[result.length - 1]
    expect(lastSnapshot.totalValue).toBe(100000)
    expect(lastSnapshot.avgPrice).toBe(50000)
  })
})

// ─── calculateValueAtRisk ─────────────────────────────────

describe('calculateValueAtRisk', () => {
  it('no published vehicles returns zeroes', () => {
    const result = calculateValueAtRisk([])
    expect(result.totalUnsoldValue).toBe(0)
    expect(result.agingValue).toBe(0)
  })

  it('calculates total unsold value', () => {
    const vehicles = [
      mkVehicle({ status: 'published', price: 30000 }),
      mkVehicle({ status: 'published', price: 70000 }),
      mkVehicle({ status: 'sold', price: 50000 }),
    ]
    const result = calculateValueAtRisk(vehicles)
    expect(result.totalUnsoldValue).toBe(100000)
  })

  it('identifies aging inventory value', () => {
    const vehicles = [
      mkVehicle({ status: 'published', price: 40000, createdAt: daysAgo(100) }),
      mkVehicle({ status: 'published', price: 60000, createdAt: daysAgo(10) }),
    ]
    const result = calculateValueAtRisk(vehicles, 90)
    expect(result.agingValue).toBe(40000)
    expect(result.agingPercentage).toBe(40)
  })

  it('calculates average days unsold', () => {
    const vehicles = [
      mkVehicle({ status: 'published', createdAt: daysAgo(20) }),
      mkVehicle({ status: 'published', createdAt: daysAgo(40) }),
    ]
    const result = calculateValueAtRisk(vehicles)
    expect(result.avgDaysUnsold).toBe(30)
  })

  it('ignores non-published vehicles', () => {
    const vehicles = [mkVehicle({ status: 'sold', price: 100000, createdAt: daysAgo(200) })]
    const result = calculateValueAtRisk(vehicles)
    expect(result.totalUnsoldValue).toBe(0)
  })
})

// ─── findStaleListings ────────────────────────────────────

describe('findStaleListings', () => {
  it('empty returns empty', () => {
    expect(findStaleListings([])).toEqual([])
  })

  it('finds stale published vehicles', () => {
    const vehicles = [
      mkVehicle({ status: 'published', createdAt: daysAgo(90), updatedAt: undefined }),
      mkVehicle({ status: 'published', createdAt: daysAgo(10) }),
    ]
    const result = findStaleListings(vehicles, 60)
    expect(result).toHaveLength(1)
    expect(result[0].createdAt).toBe(vehicles[0].createdAt)
  })

  it('uses updatedAt when available', () => {
    const vehicles = [
      mkVehicle({ status: 'published', createdAt: daysAgo(90), updatedAt: daysAgo(5) }),
    ]
    const result = findStaleListings(vehicles, 60)
    // Updated 5 days ago, not stale
    expect(result).toHaveLength(0)
  })

  it('ignores non-published vehicles', () => {
    const vehicles = [
      mkVehicle({ status: 'sold', createdAt: daysAgo(200) }),
      mkVehicle({ status: 'draft', createdAt: daysAgo(200) }),
    ]
    const result = findStaleListings(vehicles, 60)
    expect(result).toHaveLength(0)
  })

  it('sorted by oldest first', () => {
    const vehicles = [
      mkVehicle({ id: 'newer', status: 'published', createdAt: daysAgo(80) }),
      mkVehicle({ id: 'oldest', status: 'published', createdAt: daysAgo(120) }),
      mkVehicle({ id: 'old', status: 'published', createdAt: daysAgo(100) }),
    ]
    const result = findStaleListings(vehicles, 60)
    expect(result[0].id).toBe('oldest')
    expect(result[1].id).toBe('old')
    expect(result[2].id).toBe('newer')
  })
})

// ─── aggregateByDealer ────────────────────────────────────

describe('aggregateByDealer', () => {
  it('empty returns empty', () => {
    expect(aggregateByDealer([])).toEqual([])
  })

  it('groups active vehicles by dealer', () => {
    const vehicles = [
      mkVehicle({ dealerId: 'dealer-a', price: 30000 }),
      mkVehicle({ dealerId: 'dealer-a', price: 70000 }),
      mkVehicle({ dealerId: 'dealer-b', price: 50000 }),
    ]
    const result = aggregateByDealer(vehicles)
    expect(result).toHaveLength(2)
    expect(result[0].dealerId).toBe('dealer-a')
    expect(result[0].activeCount).toBe(2)
    expect(result[0].totalValue).toBe(100000)
  })

  it('ignores non-published vehicles', () => {
    const vehicles = [
      mkVehicle({ dealerId: 'dealer-a', status: 'sold' }),
      mkVehicle({ dealerId: 'dealer-a', status: 'published' }),
    ]
    const result = aggregateByDealer(vehicles)
    expect(result[0].activeCount).toBe(1)
  })

  it('sorted by totalValue descending', () => {
    const vehicles = [
      mkVehicle({ dealerId: 'small', price: 10000 }),
      mkVehicle({ dealerId: 'big', price: 100000 }),
    ]
    const result = aggregateByDealer(vehicles)
    expect(result[0].dealerId).toBe('big')
  })

  it('calculates oldest listing age', () => {
    const vehicles = [
      mkVehicle({ dealerId: 'dealer-a', createdAt: daysAgo(10) }),
      mkVehicle({ dealerId: 'dealer-a', createdAt: daysAgo(50) }),
    ]
    const result = aggregateByDealer(vehicles)
    expect(result[0].oldestDays).toBe(50)
  })

  it('uses unknown for missing dealerId', () => {
    const vehicles = [mkVehicle({ dealerId: undefined })]
    const result = aggregateByDealer(vehicles)
    expect(result[0].dealerId).toBe('unknown')
  })
})
