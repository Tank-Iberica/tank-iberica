/**
 * Security Events — Centralized security event tracking.
 *
 * Aggregates security signals from all 5 pillars into a unified store:
 *   Pillar 1: Rate limiting violations / IP bans
 *   Pillar 2: Bot / scanner detection
 *   Pillar 3: CSP violations
 *   Pillar 4: Session binding anomalies
 *   Pillar 5: RBAC / authorization failures
 *
 * Events are stored in-memory per IP.
 * Threshold-based alerting fires when an IP generates ≥10 security events
 * in a 5-minute window. Alert callback is fire-and-forget (never throws).
 *
 * Usage:
 *   recordSecurityEvent({ type: 'rate_limit_exceeded', ip: '1.2.3.4', path: '/api/stripe/checkout' })
 *   recordSecurityEvent({ type: 'bot_detected', ip: '5.6.7.8', detail: 'sqlmap' })
 *   setSecurityAlertHandler((ip, events) => logger.error('[SECURITY-ALERT]', { ip, count: events.length }))
 */

export type SecurityEventType =
  | 'rate_limit_exceeded'
  | 'ip_banned'
  | 'bot_detected'
  | 'csp_violation'
  | 'session_anomaly'
  | 'auth_failure'
  | 'rbac_failure'
  | 'injection_detected'

export interface SecurityEvent {
  type: SecurityEventType
  ip: string
  path?: string
  detail?: string
  timestamp: number
}

interface IpRecord {
  events: SecurityEvent[]
  alertFiredAt?: number
}

const store = new Map<string, IpRecord>()

// ── Thresholds ───────────────────────────────────────────────────────────────

/** Window for counting events to determine if alerting is needed */
const ALERT_WINDOW_MS = 5 * 60 * 1000 // 5 minutes
/** Number of security events within the window that triggers an alert */
const ALERT_THRESHOLD = 10
/** Maximum events stored per IP (prevents memory bloat on sustained attacks) */
const MAX_EVENTS_PER_IP = 500
/** Cooldown between repeated alerts for the same IP */
const ALERT_COOLDOWN_MS = 10 * 60 * 1000 // 10 minutes

// ── Alert handler ────────────────────────────────────────────────────────────

export type SecurityAlertHandler = (ip: string, events: SecurityEvent[]) => void
let alertHandler: SecurityAlertHandler | null = null

/**
 * Register a handler to call when an IP exceeds the alert threshold.
 * Called at most once per ALERT_COOLDOWN_MS per IP.
 * The handler must never throw — it is called fire-and-forget.
 */
export function setSecurityAlertHandler(handler: SecurityAlertHandler): void {
  alertHandler = handler
}

// ── Core API ──────────────────────────────────────────────────────────────────

/**
 * Record a security event for an IP.
 * Automatically fires the alert handler if the threshold is exceeded.
 */
export function recordSecurityEvent(event: SecurityEvent): void {
  const { ip } = event
  if (!ip || ip === 'unknown') return

  let record = store.get(ip)
  if (!record) {
    record = { events: [] }
    store.set(ip, record)
  }

  // Trim events outside the alert window
  const cutoff = event.timestamp - ALERT_WINDOW_MS
  record.events = record.events.filter((e) => e.timestamp >= cutoff)

  // Enforce per-IP memory cap
  while (record.events.length >= MAX_EVENTS_PER_IP) {
    record.events.shift()
  }

  record.events.push(event)

  // Fire alert if threshold exceeded and cooldown has passed
  if (
    alertHandler &&
    record.events.length >= ALERT_THRESHOLD &&
    (!record.alertFiredAt || event.timestamp - record.alertFiredAt > ALERT_COOLDOWN_MS)
  ) {
    record.alertFiredAt = event.timestamp
    try {
      alertHandler(ip, [...record.events])
    } catch {
      // Alert handler must never crash the server
    }
  }
}

/**
 * Get recent security events for an IP (within the alert window).
 */
export function getRecentEventsForIp(ip: string): SecurityEvent[] {
  const record = store.get(ip)
  if (!record) return []
  const cutoff = Date.now() - ALERT_WINDOW_MS
  return record.events.filter((e) => e.timestamp >= cutoff)
}

/**
 * Get event counts grouped by type for an IP (within the alert window).
 */
export function getEventSummaryForIp(ip: string): Partial<Record<SecurityEventType, number>> {
  const events = getRecentEventsForIp(ip)
  const summary: Partial<Record<SecurityEventType, number>> = {}
  for (const event of events) {
    summary[event.type] = (summary[event.type] ?? 0) + 1
  }
  return summary
}

/**
 * Get all IPs that have recent security events (within the alert window).
 * Useful for monitoring dashboards and admin views.
 */
export function getActiveSecurityIps(): string[] {
  const cutoff = Date.now() - ALERT_WINDOW_MS
  const active: string[] = []
  for (const [ip, record] of store.entries()) {
    if (record.events.some((e) => e.timestamp >= cutoff)) {
      active.push(ip)
    }
  }
  return active
}

/**
 * Get the total number of events across all IPs (for monitoring).
 */
export function getTotalEventCount(): number {
  let total = 0
  for (const record of store.values()) {
    total += record.events.length
  }
  return total
}

/**
 * Clear all events and reset the alert handler (for testing).
 */
export function clearSecurityEvents(): void {
  store.clear()
  alertHandler = null
}

/**
 * Get the number of distinct IPs in the store (for monitoring/testing).
 */
export function getStoreSize(): number {
  return store.size
}

// ── Cleanup ───────────────────────────────────────────────────────────────────

const CLEANUP_INTERVAL_MS = 10 * 60 * 1000 // every 10 minutes

const cleanupTimer = setInterval(() => {
  const cutoff = Date.now() - ALERT_WINDOW_MS
  for (const [ip, record] of store.entries()) {
    // Remove old events
    record.events = record.events.filter((e) => e.timestamp >= cutoff)
    // Remove IP entirely if no recent events
    if (record.events.length === 0) {
      store.delete(ip)
    }
  }
}, CLEANUP_INTERVAL_MS)

if (cleanupTimer && typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
  ;(cleanupTimer as { unref(): void }).unref()
}
