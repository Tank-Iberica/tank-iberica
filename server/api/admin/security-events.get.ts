/**
 * GET /api/admin/security-events
 *
 * Admin-only endpoint — returns the current security threat map.
 * Shows active IPs, recent event counts by type, and summary stats.
 *
 * Authentication: requires admin role.
 * Rate: internal dashboard polling — no external rate limiting needed.
 */
import { defineEventHandler } from 'h3'
import { requireRole } from '../../utils/rbac'
import {
  getActiveSecurityIps,
  getEventSummaryForIp,
  getRecentEventsForIp,
  getTotalEventCount,
  getStoreSize,
} from '../../utils/securityEvents'

export default defineEventHandler(async (event) => {
  await requireRole(event, 'admin')

  const activeIps = getActiveSecurityIps()
  const totalEvents = getTotalEventCount()
  const totalIps = getStoreSize()

  const threats = activeIps.map((ip) => {
    const summary = getEventSummaryForIp(ip)
    const recentEvents = getRecentEventsForIp(ip)
    const lastEventAt =
      recentEvents.length > 0
        ? new Date(recentEvents[recentEvents.length - 1]!.timestamp).toISOString()
        : null

    return {
      ip,
      eventCount: recentEvents.length,
      typeSummary: summary,
      lastEventAt,
      topPath: getMostFrequentPath(recentEvents),
    }
  })

  // Sort by event count descending (most active threats first)
  threats.sort((a, b) => b.eventCount - a.eventCount)

  return {
    generatedAt: new Date().toISOString(),
    windowMinutes: 5,
    stats: {
      totalEvents,
      totalIps,
      activeThreats: activeIps.length,
    },
    threats,
  }
})

function getMostFrequentPath(
  events: ReturnType<typeof getRecentEventsForIp>,
): string | null {
  const counts = new Map<string, number>()
  for (const event of events) {
    if (event.path) {
      counts.set(event.path, (counts.get(event.path) ?? 0) + 1)
    }
  }
  if (counts.size === 0) return null
  let top = ''
  let topCount = 0
  for (const [path, count] of counts) {
    if (count > topCount) {
      top = path
      topCount = count
    }
  }
  return top
}
