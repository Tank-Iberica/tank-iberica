/**
 * Tests for GET /api/admin/security-events
 *
 * Verifies admin-only access control and correct aggregation
 * of the security event store into the response.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SecurityEvent } from '~~/server/utils/securityEvents'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('~~/server/utils/rbac', () => ({
  requireRole: vi.fn().mockResolvedValue({ id: 'admin-user', roles: ['admin'] }),
}))

vi.mock('~~/server/utils/securityEvents', () => ({
  getActiveSecurityIps: vi.fn(() => ['1.2.3.4', '5.6.7.8']),
  getEventSummaryForIp: vi.fn((ip: string) => {
    if (ip === '1.2.3.4') return { rate_limit_exceeded: 3, bot_detected: 2 }
    return { rbac_failure: 1 }
  }),
  getRecentEventsForIp: vi.fn((ip: string): SecurityEvent[] => {
    const now = Date.now()
    if (ip === '1.2.3.4') {
      return [
        { type: 'rate_limit_exceeded', ip, path: '/api/stripe/checkout', timestamp: now - 3000 },
        { type: 'bot_detected', ip, path: '/api/search', timestamp: now - 2000 },
        { type: 'rate_limit_exceeded', ip, path: '/api/stripe/checkout', timestamp: now - 1000 },
      ]
    }
    return [{ type: 'rbac_failure', ip, path: '/api/admin/users', timestamp: now - 5000 }]
  }),
  getTotalEventCount: vi.fn(() => 4),
  getStoreSize: vi.fn(() => 2),
}))

import { requireRole } from '~~/server/utils/rbac'
import { getActiveSecurityIps, getRecentEventsForIp } from '~~/server/utils/securityEvents'

describe('GET /api/admin/security-events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function makeEvent() {
    return {
      path: '/api/admin/security-events',
      method: 'GET',
      node: { req: {}, res: {} },
    } as unknown as Parameters<
      (typeof import('~~/server/api/admin/security-events.get'))['default']
    >[0]
  }

  it('requires admin role', async () => {
    vi.mocked(requireRole).mockRejectedValueOnce(
      Object.assign(new Error('Forbidden'), { statusCode: 403 }),
    )
    const { default: handler } = await import('~~/server/api/admin/security-events.get')
    await expect(handler(makeEvent())).rejects.toThrow()
    expect(requireRole).toHaveBeenCalledWith(expect.anything(), 'admin')
  })

  it('returns threat map with active IPs', async () => {
    const { default: handler } = await import('~~/server/api/admin/security-events.get')
    const result = await handler(makeEvent())

    expect(result).toMatchObject({
      generatedAt: expect.any(String),
      windowMinutes: 5,
      stats: {
        totalEvents: 4,
        totalIps: 2,
        activeThreats: 2,
      },
      threats: expect.any(Array),
    })
  })

  it('sorts threats by event count descending', async () => {
    const { default: handler } = await import('~~/server/api/admin/security-events.get')
    const result = await handler(makeEvent())

    expect(result.threats[0]!.ip).toBe('1.2.3.4') // 3 events > 1 event
    expect(result.threats[0]!.eventCount).toBe(3)
    expect(result.threats[1]!.eventCount).toBe(1)
  })

  it('includes type summary per IP', async () => {
    const { default: handler } = await import('~~/server/api/admin/security-events.get')
    const result = await handler(makeEvent())

    const threat1 = result.threats.find((t) => t.ip === '1.2.3.4')
    expect(threat1?.typeSummary).toEqual({ rate_limit_exceeded: 3, bot_detected: 2 })
  })

  it('includes topPath (most frequent path)', async () => {
    const { default: handler } = await import('~~/server/api/admin/security-events.get')
    const result = await handler(makeEvent())

    const threat1 = result.threats.find((t) => t.ip === '1.2.3.4')
    // /api/stripe/checkout appears twice vs /api/search once
    expect(threat1?.topPath).toBe('/api/stripe/checkout')
  })

  it('includes lastEventAt as ISO string', async () => {
    const { default: handler } = await import('~~/server/api/admin/security-events.get')
    const result = await handler(makeEvent())

    const threat1 = result.threats.find((t) => t.ip === '1.2.3.4')
    expect(threat1?.lastEventAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('handles empty store gracefully', async () => {
    vi.mocked(getActiveSecurityIps).mockReturnValueOnce([])
    vi.mocked(getRecentEventsForIp).mockReturnValue([])

    const { default: handler } = await import('~~/server/api/admin/security-events.get')
    const result = await handler(makeEvent())

    expect(result.threats).toEqual([])
    expect(result.stats.activeThreats).toBe(0)
  })

  it('handles IP with no paths (topPath is null)', async () => {
    vi.mocked(getActiveSecurityIps).mockReturnValueOnce(['9.9.9.9'])
    vi.mocked(getRecentEventsForIp).mockReturnValueOnce([
      { type: 'bot_detected', ip: '9.9.9.9', timestamp: Date.now() },
    ])

    const { default: handler } = await import('~~/server/api/admin/security-events.get')
    const result = await handler(makeEvent())

    expect(result.threats[0]?.topPath).toBeNull()
  })
})
