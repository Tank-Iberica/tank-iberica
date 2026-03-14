/**
 * Analytics event processing composable — event aggregation and summaries.
 *
 * Processes raw analytics events into:
 * - Event counts by type and time period
 * - Unique visitor estimation
 * - Top pages/vehicles by engagement
 * - Referrer/source attribution
 * - Hourly/daily activity heatmap data
 *
 * Pure calculation functions exported for testability.
 * Used in admin analytics dashboard and dealer stats pages.
 */

export interface AnalyticsEvent {
  type: string
  vehicleId?: string
  pageUrl?: string
  referrer?: string
  userId?: string
  sessionId?: string
  timestamp: string
}

export interface EventCount {
  type: string
  count: number
  uniqueUsers: number
}

export interface PageEngagement {
  pageUrl: string
  views: number
  uniqueUsers: number
  avgEventsPerUser: number
}

export interface ReferrerSummary {
  referrer: string
  visits: number
  uniqueUsers: number
  percentage: number
}

export interface HourlyActivity {
  hour: number
  count: number
}

export interface DailyActivity {
  date: string
  count: number
  uniqueUsers: number
}

/**
 * Count events by type with unique user counts.
 */
export function countEventsByType(events: AnalyticsEvent[]): EventCount[] {
  const map = new Map<string, { count: number; users: Set<string> }>()

  for (const event of events) {
    const existing = map.get(event.type) ?? { count: 0, users: new Set<string>() }
    existing.count += 1
    if (event.userId) existing.users.add(event.userId)
    map.set(event.type, existing)
  }

  return Array.from(map.entries())
    .map(([type, data]) => ({
      type,
      count: data.count,
      uniqueUsers: data.users.size,
    }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Get top pages by engagement (views + unique users).
 */
export function getTopPages(events: AnalyticsEvent[], limit: number = 10): PageEngagement[] {
  const viewEvents = events.filter((e) => e.type === 'page_view' && e.pageUrl)
  const map = new Map<string, { views: number; users: Set<string>; totalEvents: number }>()

  for (const event of viewEvents) {
    const existing = map.get(event.pageUrl!) ?? { views: 0, users: new Set<string>(), totalEvents: 0 }
    existing.views += 1
    if (event.userId) existing.users.add(event.userId)
    map.set(event.pageUrl!, existing)
  }

  // Count all events per page (not just views)
  for (const event of events) {
    if (!event.pageUrl) continue
    const existing = map.get(event.pageUrl)
    if (existing && event.userId) {
      existing.totalEvents += 1
    }
  }

  return Array.from(map.entries())
    .map(([pageUrl, data]) => ({
      pageUrl,
      views: data.views,
      uniqueUsers: data.users.size,
      avgEventsPerUser: data.users.size > 0
        ? Math.round((data.totalEvents / data.users.size) * 10) / 10
        : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit)
}

/**
 * Summarize traffic sources from referrer data.
 */
export function summarizeReferrers(events: AnalyticsEvent[]): ReferrerSummary[] {
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
      referrer,
      visits: data.visits,
      uniqueUsers: data.users.size,
      percentage: Math.round((data.visits / total) * 100),
    }))
    .sort((a, b) => b.visits - a.visits)
}

/**
 * Generate hourly activity distribution (0-23 hours).
 */
export function getHourlyActivity(events: AnalyticsEvent[]): HourlyActivity[] {
  const counts = Array.from({ length: 24 }, () => 0)

  for (const event of events) {
    const hour = new Date(event.timestamp).getHours()
    counts[hour] = (counts[hour] ?? 0) + 1
  }

  return counts.map((count, hour) => ({ hour, count }))
}

/**
 * Generate daily activity over a period.
 */
export function getDailyActivity(
  events: AnalyticsEvent[],
  periodDays: number = 30,
): DailyActivity[] {
  const now = Date.now()
  const cutoff = now - periodDays * 24 * 60 * 60 * 1000
  const dayMs = 24 * 60 * 60 * 1000
  const days: DailyActivity[] = []

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

/**
 * Estimate unique visitors using session IDs.
 */
export function estimateUniqueVisitors(events: AnalyticsEvent[]): {
  uniqueUsers: number
  uniqueSessions: number
  avgEventsPerSession: number
} {
  const users = new Set<string>()
  const sessions = new Set<string>()

  for (const event of events) {
    if (event.userId) users.add(event.userId)
    if (event.sessionId) sessions.add(event.sessionId)
  }

  return {
    uniqueUsers: users.size,
    uniqueSessions: sessions.size,
    avgEventsPerSession: sessions.size > 0
      ? Math.round((events.length / sessions.size) * 10) / 10
      : 0,
  }
}

/**
 * Get top vehicles by engagement events.
 */
export function getTopVehicles(
  events: AnalyticsEvent[],
  limit: number = 10,
): Array<{ vehicleId: string; events: number; uniqueUsers: number }> {
  const vehicleEvents = events.filter((e) => e.vehicleId)
  const map = new Map<string, { events: number; users: Set<string> }>()

  for (const event of vehicleEvents) {
    const existing = map.get(event.vehicleId!) ?? { events: 0, users: new Set<string>() }
    existing.events += 1
    if (event.userId) existing.users.add(event.userId)
    map.set(event.vehicleId!, existing)
  }

  return Array.from(map.entries())
    .map(([vehicleId, data]) => ({
      vehicleId,
      events: data.events,
      uniqueUsers: data.users.size,
    }))
    .sort((a, b) => b.events - a.events)
    .slice(0, limit)
}
