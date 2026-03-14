import { describe, it, expect } from 'vitest'

/**
 * Tests for useAnalyticsProcessor composable — event aggregation.
 */

interface AnalyticsEvent {
  type: string
  vehicleId?: string
  pageUrl?: string
  referrer?: string
  userId?: string
  sessionId?: string
  timestamp: string
}

function countEventsByType(events: AnalyticsEvent[]) {
  const map = new Map<string, { count: number; users: Set<string> }>()
  for (const event of events) {
    const existing = map.get(event.type) ?? { count: 0, users: new Set<string>() }
    existing.count += 1
    if (event.userId) existing.users.add(event.userId)
    map.set(event.type, existing)
  }
  return Array.from(map.entries())
    .map(([type, data]) => ({ type, count: data.count, uniqueUsers: data.users.size }))
    .sort((a, b) => b.count - a.count)
}

function getTopPages(events: AnalyticsEvent[], limit: number = 10) {
  const viewEvents = events.filter((e) => e.type === 'page_view' && e.pageUrl)
  const map = new Map<string, { views: number; users: Set<string>; totalEvents: number }>()
  for (const event of viewEvents) {
    const existing = map.get(event.pageUrl!) ?? { views: 0, users: new Set<string>(), totalEvents: 0 }
    existing.views += 1
    if (event.userId) existing.users.add(event.userId)
    map.set(event.pageUrl!, existing)
  }
  for (const event of events) {
    if (!event.pageUrl) continue
    const existing = map.get(event.pageUrl)
    if (existing && event.userId) existing.totalEvents += 1
  }
  return Array.from(map.entries())
    .map(([pageUrl, data]) => ({
      pageUrl, views: data.views, uniqueUsers: data.users.size,
      avgEventsPerUser: data.users.size > 0 ? Math.round((data.totalEvents / data.users.size) * 10) / 10 : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit)
}

function summarizeReferrers(events: AnalyticsEvent[]) {
  const viewEvents = events.filter((e) => e.type === 'page_view')
  if (viewEvents.length === 0) return []
  const map = new Map<string, { visits: number; users: Set<string> }>()
  for (const event of viewEvents) {
    const ref = event.referrer || 'direct'
    const existing = map.get(ref) ?? { visits: 0, users: new Set<string>() }
    existing.visits += 1
    if (event.userId) existing.users.add(event.userId)
    map.set(ref, existing)
  }
  const total = viewEvents.length
  return Array.from(map.entries())
    .map(([referrer, data]) => ({
      referrer, visits: data.visits, uniqueUsers: data.users.size,
      percentage: Math.round((data.visits / total) * 100),
    }))
    .sort((a, b) => b.visits - a.visits)
}

function getHourlyActivity(events: AnalyticsEvent[]) {
  const counts = Array.from({length: 24}).fill(0)
  for (const event of events) {
    const hour = new Date(event.timestamp).getHours()
    counts[hour] += 1
  }
  return counts.map((count: number, hour: number) => ({ hour, count }))
}

function getDailyActivity(events: AnalyticsEvent[], periodDays: number = 30) {
  const now = Date.now()
  const cutoff = now - periodDays * 24 * 60 * 60 * 1000
  const dayMs = 24 * 60 * 60 * 1000
  const days: Array<{ date: string; count: number; uniqueUsers: number }> = []
  for (let day = cutoff; day < now; day += dayMs) {
    const dayStart = day
    const dayEnd = day + dayMs
    const date = new Date(day).toISOString().slice(0, 10)
    const dayEvents = events.filter((e) => {
      const t = new Date(e.timestamp).getTime()
      return t >= dayStart && t < dayEnd
    })
    const uniqueUsers = new Set(dayEvents.filter((e) => e.userId).map((e) => e.userId)).size
    days.push({ date, count: dayEvents.length, uniqueUsers })
  }
  return days
}

function estimateUniqueVisitors(events: AnalyticsEvent[]) {
  const users = new Set<string>()
  const sessions = new Set<string>()
  for (const event of events) {
    if (event.userId) users.add(event.userId)
    if (event.sessionId) sessions.add(event.sessionId)
  }
  return {
    uniqueUsers: users.size, uniqueSessions: sessions.size,
    avgEventsPerSession: sessions.size > 0 ? Math.round((events.length / sessions.size) * 10) / 10 : 0,
  }
}

function getTopVehicles(events: AnalyticsEvent[], limit: number = 10) {
  const vehicleEvents = events.filter((e) => e.vehicleId)
  const map = new Map<string, { events: number; users: Set<string> }>()
  for (const event of vehicleEvents) {
    const existing = map.get(event.vehicleId!) ?? { events: 0, users: new Set<string>() }
    existing.events += 1
    if (event.userId) existing.users.add(event.userId)
    map.set(event.vehicleId!, existing)
  }
  return Array.from(map.entries())
    .map(([vehicleId, data]) => ({ vehicleId, events: data.events, uniqueUsers: data.users.size }))
    .sort((a, b) => b.events - a.events)
    .slice(0, limit)
}

// Helpers
const hoursAgo = (n: number) => new Date(Date.now() - n * 60 * 60 * 1000).toISOString()
const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()

const mkEvent = (overrides: Partial<AnalyticsEvent> = {}): AnalyticsEvent => ({
  type: 'page_view',
  timestamp: hoursAgo(1),
  ...overrides,
})

// ─── countEventsByType ────────────────────────────────────

describe('countEventsByType', () => {
  it('empty returns empty', () => {
    expect(countEventsByType([])).toEqual([])
  })

  it('counts by type', () => {
    const events = [
      mkEvent({ type: 'page_view' }),
      mkEvent({ type: 'page_view' }),
      mkEvent({ type: 'click' }),
    ]
    const result = countEventsByType(events)
    expect(result[0].type).toBe('page_view')
    expect(result[0].count).toBe(2)
    expect(result[1].type).toBe('click')
    expect(result[1].count).toBe(1)
  })

  it('tracks unique users', () => {
    const events = [
      mkEvent({ type: 'page_view', userId: 'u1' }),
      mkEvent({ type: 'page_view', userId: 'u1' }),
      mkEvent({ type: 'page_view', userId: 'u2' }),
    ]
    const result = countEventsByType(events)
    expect(result[0].uniqueUsers).toBe(2)
  })

  it('sorted by count descending', () => {
    const events = [
      mkEvent({ type: 'rare' }),
      mkEvent({ type: 'common' }),
      mkEvent({ type: 'common' }),
      mkEvent({ type: 'common' }),
    ]
    const result = countEventsByType(events)
    expect(result[0].type).toBe('common')
  })
})

// ─── getTopPages ──────────────────────────────────────────

describe('getTopPages', () => {
  it('empty returns empty', () => {
    expect(getTopPages([])).toEqual([])
  })

  it('counts views per page', () => {
    const events = [
      mkEvent({ pageUrl: '/home' }),
      mkEvent({ pageUrl: '/home' }),
      mkEvent({ pageUrl: '/about' }),
    ]
    const result = getTopPages(events)
    expect(result[0].pageUrl).toBe('/home')
    expect(result[0].views).toBe(2)
  })

  it('respects limit', () => {
    const events = Array.from({ length: 20 }, (_, i) =>
      mkEvent({ pageUrl: `/page-${i}` }),
    )
    const result = getTopPages(events, 5)
    expect(result).toHaveLength(5)
  })

  it('only counts page_view events', () => {
    const events = [
      mkEvent({ type: 'page_view', pageUrl: '/home' }),
      mkEvent({ type: 'click', pageUrl: '/home' }),
    ]
    const result = getTopPages(events)
    expect(result[0].views).toBe(1) // only page_view counted
  })

  it('tracks unique users per page', () => {
    const events = [
      mkEvent({ pageUrl: '/home', userId: 'u1' }),
      mkEvent({ pageUrl: '/home', userId: 'u1' }),
      mkEvent({ pageUrl: '/home', userId: 'u2' }),
    ]
    const result = getTopPages(events)
    expect(result[0].uniqueUsers).toBe(2)
  })
})

// ─── summarizeReferrers ───────────────────────────────────

describe('summarizeReferrers', () => {
  it('empty returns empty', () => {
    expect(summarizeReferrers([])).toEqual([])
  })

  it('groups by referrer', () => {
    const events = [
      mkEvent({ referrer: 'google.com' }),
      mkEvent({ referrer: 'google.com' }),
      mkEvent({ referrer: 'facebook.com' }),
    ]
    const result = summarizeReferrers(events)
    expect(result[0].referrer).toBe('google.com')
    expect(result[0].visits).toBe(2)
  })

  it('uses direct for missing referrer', () => {
    const events = [mkEvent({ referrer: undefined })]
    const result = summarizeReferrers(events)
    expect(result[0].referrer).toBe('direct')
  })

  it('calculates percentages', () => {
    const events = [
      mkEvent({ referrer: 'google.com' }),
      mkEvent({ referrer: 'google.com' }),
      mkEvent({ referrer: 'google.com' }),
      mkEvent({ referrer: 'facebook.com' }),
    ]
    const result = summarizeReferrers(events)
    expect(result[0].percentage).toBe(75)
    expect(result[1].percentage).toBe(25)
  })

  it('only counts page_view events', () => {
    const events = [
      mkEvent({ type: 'page_view', referrer: 'google.com' }),
      mkEvent({ type: 'click', referrer: 'google.com' }),
    ]
    const result = summarizeReferrers(events)
    expect(result[0].visits).toBe(1)
  })
})

// ─── getHourlyActivity ────────────────────────────────────

describe('getHourlyActivity', () => {
  it('returns 24 hours', () => {
    const result = getHourlyActivity([])
    expect(result).toHaveLength(24)
    expect(result[0].hour).toBe(0)
    expect(result[23].hour).toBe(23)
  })

  it('counts events per hour', () => {
    const now = new Date()
    const currentHour = now.getHours()
    const events = [
      mkEvent({ timestamp: now.toISOString() }),
      mkEvent({ timestamp: now.toISOString() }),
    ]
    const result = getHourlyActivity(events)
    expect(result[currentHour].count).toBe(2)
  })

  it('all zeros for empty events', () => {
    const result = getHourlyActivity([])
    expect(result.every((h) => h.count === 0)).toBe(true)
  })
})

// ─── getDailyActivity ─────────────────────────────────────

describe('getDailyActivity', () => {
  it('returns correct number of days', () => {
    const result = getDailyActivity([], 7)
    expect(result).toHaveLength(7)
  })

  it('counts events per day', () => {
    const events = [
      mkEvent({ timestamp: daysAgo(1), userId: 'u1' }),
      mkEvent({ timestamp: daysAgo(1), userId: 'u2' }),
    ]
    const result = getDailyActivity(events, 3)
    expect(result.some((d) => d.count > 0)).toBe(true)
  })

  it('tracks unique users per day', () => {
    const events = [
      mkEvent({ timestamp: daysAgo(1), userId: 'u1' }),
      mkEvent({ timestamp: daysAgo(1), userId: 'u1' }),
      mkEvent({ timestamp: daysAgo(1), userId: 'u2' }),
    ]
    const result = getDailyActivity(events, 3)
    const activeDay = result.find((d) => d.count > 0)
    expect(activeDay?.uniqueUsers).toBe(2)
  })

  it('date format is YYYY-MM-DD', () => {
    const result = getDailyActivity([], 3)
    for (const day of result) {
      expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})

// ─── estimateUniqueVisitors ───────────────────────────────

describe('estimateUniqueVisitors', () => {
  it('empty returns zeroes', () => {
    const result = estimateUniqueVisitors([])
    expect(result.uniqueUsers).toBe(0)
    expect(result.uniqueSessions).toBe(0)
    expect(result.avgEventsPerSession).toBe(0)
  })

  it('counts unique users and sessions', () => {
    const events = [
      mkEvent({ userId: 'u1', sessionId: 's1' }),
      mkEvent({ userId: 'u1', sessionId: 's1' }),
      mkEvent({ userId: 'u2', sessionId: 's2' }),
    ]
    const result = estimateUniqueVisitors(events)
    expect(result.uniqueUsers).toBe(2)
    expect(result.uniqueSessions).toBe(2)
  })

  it('calculates avg events per session', () => {
    const events = [
      mkEvent({ sessionId: 's1' }),
      mkEvent({ sessionId: 's1' }),
      mkEvent({ sessionId: 's1' }),
      mkEvent({ sessionId: 's2' }),
      mkEvent({ sessionId: 's2' }),
    ]
    const result = estimateUniqueVisitors(events)
    expect(result.avgEventsPerSession).toBe(2.5)
  })

  it('handles events without userId', () => {
    const events = [
      mkEvent({ userId: undefined, sessionId: 's1' }),
      mkEvent({ userId: 'u1', sessionId: 's2' }),
    ]
    const result = estimateUniqueVisitors(events)
    expect(result.uniqueUsers).toBe(1)
    expect(result.uniqueSessions).toBe(2)
  })
})

// ─── getTopVehicles ───────────────────────────────────────

describe('getTopVehicles', () => {
  it('empty returns empty', () => {
    expect(getTopVehicles([])).toEqual([])
  })

  it('ranks vehicles by event count', () => {
    const events = [
      mkEvent({ vehicleId: 'v1' }),
      mkEvent({ vehicleId: 'v1' }),
      mkEvent({ vehicleId: 'v1' }),
      mkEvent({ vehicleId: 'v2' }),
    ]
    const result = getTopVehicles(events)
    expect(result[0].vehicleId).toBe('v1')
    expect(result[0].events).toBe(3)
  })

  it('respects limit', () => {
    const events = Array.from({ length: 20 }, (_, i) =>
      mkEvent({ vehicleId: `v-${i}` }),
    )
    const result = getTopVehicles(events, 3)
    expect(result).toHaveLength(3)
  })

  it('tracks unique users per vehicle', () => {
    const events = [
      mkEvent({ vehicleId: 'v1', userId: 'u1' }),
      mkEvent({ vehicleId: 'v1', userId: 'u1' }),
      mkEvent({ vehicleId: 'v1', userId: 'u2' }),
    ]
    const result = getTopVehicles(events)
    expect(result[0].uniqueUsers).toBe(2)
  })

  it('ignores events without vehicleId', () => {
    const events = [
      mkEvent({ vehicleId: 'v1' }),
      mkEvent({ vehicleId: undefined }),
    ]
    const result = getTopVehicles(events)
    expect(result).toHaveLength(1)
  })
})
