import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  recordSecurityEvent,
  getRecentEventsForIp,
  getEventSummaryForIp,
  getActiveSecurityIps,
  getTotalEventCount,
  clearSecurityEvents,
  getStoreSize,
  setSecurityAlertHandler,
  type SecurityEvent,
} from '../../../server/utils/securityEvents'

function makeEvent(
  overrides: Partial<SecurityEvent> = {},
): SecurityEvent {
  return {
    type: 'auth_failure',
    ip: '1.2.3.4',
    timestamp: Date.now(),
    ...overrides,
  }
}

beforeEach(() => {
  clearSecurityEvents()
})

// ── recordSecurityEvent ──────────────────────────────────────────────────────

describe('recordSecurityEvent', () => {
  it('stores an event for the given IP', () => {
    recordSecurityEvent(makeEvent({ ip: '1.2.3.4', type: 'auth_failure' }))
    expect(getRecentEventsForIp('1.2.3.4')).toHaveLength(1)
  })

  it('ignores events with no IP', () => {
    recordSecurityEvent(makeEvent({ ip: '' }))
    recordSecurityEvent(makeEvent({ ip: 'unknown' }))
    expect(getStoreSize()).toBe(0)
  })

  it('stores events from different IPs independently', () => {
    recordSecurityEvent(makeEvent({ ip: '1.1.1.1', type: 'bot_detected' }))
    recordSecurityEvent(makeEvent({ ip: '2.2.2.2', type: 'csp_violation' }))

    expect(getRecentEventsForIp('1.1.1.1')).toHaveLength(1)
    expect(getRecentEventsForIp('2.2.2.2')).toHaveLength(1)
    expect(getStoreSize()).toBe(2)
  })

  it('stores multiple events for the same IP', () => {
    const ip = '5.5.5.5'
    recordSecurityEvent(makeEvent({ ip, type: 'auth_failure' }))
    recordSecurityEvent(makeEvent({ ip, type: 'rate_limit_exceeded' }))
    recordSecurityEvent(makeEvent({ ip, type: 'rbac_failure' }))

    expect(getRecentEventsForIp(ip)).toHaveLength(3)
  })

  it('trims events older than 5 minutes from count', () => {
    const ip = '7.7.7.7'
    const OLD = Date.now() - 6 * 60 * 1000 // 6 minutes ago
    const NOW = Date.now()

    // Record old event then new event
    recordSecurityEvent(makeEvent({ ip, timestamp: OLD }))
    recordSecurityEvent(makeEvent({ ip, timestamp: NOW }))

    // Only the new event should appear in recent
    const recent = getRecentEventsForIp(ip)
    expect(recent).toHaveLength(1)
    expect(recent[0]!.timestamp).toBe(NOW)
  })

  it('caps events at MAX_EVENTS_PER_IP (500)', () => {
    const ip = '8.8.8.8'
    const now = Date.now()
    for (let i = 0; i < 510; i++) {
      recordSecurityEvent(makeEvent({ ip, timestamp: now + i }))
    }
    // After 510 inserts with cap of 500, should have at most 500
    // (trimmed as new events are added)
    const events = getRecentEventsForIp(ip)
    expect(events.length).toBeLessThanOrEqual(500)
  })
})

// ── getRecentEventsForIp ─────────────────────────────────────────────────────

describe('getRecentEventsForIp', () => {
  it('returns empty array for unknown IP', () => {
    expect(getRecentEventsForIp('9.9.9.9')).toEqual([])
  })

  it('returns only events within the 5-minute window', () => {
    const ip = '3.3.3.3'
    const NOW = Date.now()
    const OLD = NOW - 6 * 60 * 1000

    recordSecurityEvent(makeEvent({ ip, timestamp: OLD, type: 'auth_failure' }))
    recordSecurityEvent(makeEvent({ ip, timestamp: NOW, type: 'bot_detected' }))

    const recent = getRecentEventsForIp(ip)
    expect(recent).toHaveLength(1)
    expect(recent[0]!.type).toBe('bot_detected')
  })

  it('includes path and detail in returned events', () => {
    const ip = '4.4.4.4'
    recordSecurityEvent(
      makeEvent({ ip, path: '/api/stripe/checkout', detail: 'sqlmap', type: 'injection_detected' }),
    )
    const events = getRecentEventsForIp(ip)
    expect(events[0]!.path).toBe('/api/stripe/checkout')
    expect(events[0]!.detail).toBe('sqlmap')
  })
})

// ── getEventSummaryForIp ─────────────────────────────────────────────────────

describe('getEventSummaryForIp', () => {
  it('returns empty object for unknown IP', () => {
    expect(getEventSummaryForIp('unknown-ip')).toEqual({})
  })

  it('counts events grouped by type', () => {
    const ip = '6.6.6.6'
    const now = Date.now()
    recordSecurityEvent(makeEvent({ ip, type: 'auth_failure', timestamp: now }))
    recordSecurityEvent(makeEvent({ ip, type: 'auth_failure', timestamp: now + 1 }))
    recordSecurityEvent(makeEvent({ ip, type: 'bot_detected', timestamp: now + 2 }))
    recordSecurityEvent(makeEvent({ ip, type: 'rate_limit_exceeded', timestamp: now + 3 }))

    const summary = getEventSummaryForIp(ip)
    expect(summary.auth_failure).toBe(2)
    expect(summary.bot_detected).toBe(1)
    expect(summary.rate_limit_exceeded).toBe(1)
    expect(summary.csp_violation).toBeUndefined()
  })
})

// ── getActiveSecurityIps ─────────────────────────────────────────────────────

describe('getActiveSecurityIps', () => {
  it('returns empty array when no events', () => {
    expect(getActiveSecurityIps()).toEqual([])
  })

  it('returns IPs with recent events', () => {
    recordSecurityEvent(makeEvent({ ip: '10.0.0.1' }))
    recordSecurityEvent(makeEvent({ ip: '10.0.0.2' }))

    const active = getActiveSecurityIps()
    expect(active).toContain('10.0.0.1')
    expect(active).toContain('10.0.0.2')
  })

  it('does not return IPs with only old events', () => {
    const OLD = Date.now() - 6 * 60 * 1000
    recordSecurityEvent(makeEvent({ ip: '11.11.11.11', timestamp: OLD }))

    // Force store to have this old event without triggering cleanup
    // The getActiveSecurityIps function filters by current window
    const active = getActiveSecurityIps()
    expect(active).not.toContain('11.11.11.11')
  })
})

// ── getTotalEventCount ────────────────────────────────────────────────────────

describe('getTotalEventCount', () => {
  it('returns 0 when no events', () => {
    expect(getTotalEventCount()).toBe(0)
  })

  it('counts all events across all IPs', () => {
    recordSecurityEvent(makeEvent({ ip: '1.0.0.1' }))
    recordSecurityEvent(makeEvent({ ip: '1.0.0.2' }))
    recordSecurityEvent(makeEvent({ ip: '1.0.0.1' }))

    expect(getTotalEventCount()).toBe(3)
  })
})

// ── Alert threshold ───────────────────────────────────────────────────────────

describe('Alert handler — threshold-based alerting', () => {
  it('fires alert when IP exceeds 10 events in 5 minutes', () => {
    const alertFn = vi.fn()
    setSecurityAlertHandler(alertFn)

    const ip = '99.99.99.99'
    const now = Date.now()

    for (let i = 0; i < 10; i++) {
      recordSecurityEvent(makeEvent({ ip, timestamp: now + i }))
    }

    expect(alertFn).toHaveBeenCalledOnce()
    const [calledIp, calledEvents] = alertFn.mock.calls[0]!
    expect(calledIp).toBe(ip)
    expect(calledEvents).toHaveLength(10)
  })

  it('does not fire alert before threshold (9 events)', () => {
    const alertFn = vi.fn()
    setSecurityAlertHandler(alertFn)

    const ip = '88.88.88.88'
    const now = Date.now()
    for (let i = 0; i < 9; i++) {
      recordSecurityEvent(makeEvent({ ip, timestamp: now + i }))
    }

    expect(alertFn).not.toHaveBeenCalled()
  })

  it('does not re-fire alert during cooldown (10 min)', () => {
    const alertFn = vi.fn()
    setSecurityAlertHandler(alertFn)

    const ip = '77.77.77.77'
    const now = Date.now()

    // First batch — fires alert
    for (let i = 0; i < 10; i++) {
      recordSecurityEvent(makeEvent({ ip, timestamp: now + i }))
    }
    expect(alertFn).toHaveBeenCalledTimes(1)

    // Second batch (still within cooldown) — should NOT re-fire
    for (let i = 0; i < 5; i++) {
      recordSecurityEvent(makeEvent({ ip, timestamp: now + 100 + i }))
    }
    expect(alertFn).toHaveBeenCalledTimes(1)
  })

  it('re-fires alert after cooldown expires (>10 min later)', () => {
    const alertFn = vi.fn()
    setSecurityAlertHandler(alertFn)

    const ip = '66.66.66.66'
    const now = Date.now()

    // First batch
    for (let i = 0; i < 10; i++) {
      recordSecurityEvent(makeEvent({ ip, timestamp: now + i }))
    }
    expect(alertFn).toHaveBeenCalledTimes(1)

    // Second batch — 11 minutes later (past cooldown), within new window
    const later = now + 11 * 60 * 1000
    for (let i = 0; i < 10; i++) {
      recordSecurityEvent(makeEvent({ ip, timestamp: later + i }))
    }
    expect(alertFn).toHaveBeenCalledTimes(2)
  })

  it('passes a snapshot of events to the alert handler (not live array)', () => {
    const capturedEvents: SecurityEvent[] = []
    setSecurityAlertHandler((_ip, events) => {
      capturedEvents.push(...events)
    })

    const ip = '55.55.55.55'
    const now = Date.now()
    for (let i = 0; i < 10; i++) {
      recordSecurityEvent(makeEvent({ ip, timestamp: now + i }))
    }

    const lengthAtAlert = capturedEvents.length
    // Add more events after alert fired
    recordSecurityEvent(makeEvent({ ip, timestamp: now + 100 }))

    // Captured snapshot should not grow
    expect(capturedEvents.length).toBe(lengthAtAlert)
  })

  it('does not throw when alert handler throws', () => {
    setSecurityAlertHandler(() => {
      throw new Error('Alert handler crashed!')
    })

    const ip = '44.44.44.44'
    const now = Date.now()

    // Should not propagate the handler error
    expect(() => {
      for (let i = 0; i < 10; i++) {
        recordSecurityEvent(makeEvent({ ip, timestamp: now + i }))
      }
    }).not.toThrow()
  })

  it('does not fire if no alert handler is set', () => {
    // No setSecurityAlertHandler call — clearSecurityEvents removes it
    const ip = '33.33.33.33'
    const now = Date.now()

    expect(() => {
      for (let i = 0; i < 15; i++) {
        recordSecurityEvent(makeEvent({ ip, timestamp: now + i }))
      }
    }).not.toThrow()
  })
})

// ── clearSecurityEvents ───────────────────────────────────────────────────────

describe('clearSecurityEvents', () => {
  it('removes all events and resets store', () => {
    recordSecurityEvent(makeEvent({ ip: '1.2.3.4' }))
    recordSecurityEvent(makeEvent({ ip: '5.6.7.8' }))
    expect(getStoreSize()).toBe(2)

    clearSecurityEvents()
    expect(getStoreSize()).toBe(0)
    expect(getTotalEventCount()).toBe(0)
  })

  it('resets the alert handler', () => {
    const alertFn = vi.fn()
    setSecurityAlertHandler(alertFn)
    clearSecurityEvents()

    // Fire 10 events — handler should not be called (it was cleared)
    const ip = '22.22.22.22'
    const now = Date.now()
    for (let i = 0; i < 10; i++) {
      recordSecurityEvent(makeEvent({ ip, timestamp: now + i }))
    }
    expect(alertFn).not.toHaveBeenCalled()
  })
})

// ── All event types ────────────────────────────────────────────────────────────

describe('All SecurityEventType values are accepted', () => {
  const types = [
    'rate_limit_exceeded',
    'ip_banned',
    'bot_detected',
    'csp_violation',
    'session_anomaly',
    'auth_failure',
    'rbac_failure',
    'injection_detected',
  ] as const

  for (const type of types) {
    it(`accepts type: ${type}`, () => {
      recordSecurityEvent(makeEvent({ ip: '1.2.3.4', type }))
      const events = getRecentEventsForIp('1.2.3.4')
      expect(events.some((e) => e.type === type)).toBe(true)
    })
  }
})
