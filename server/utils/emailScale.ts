/**
 * Email at scale — Resend primary + SES fallback with circuit breaker.
 *
 * Features:
 * - Primary: Resend API (existing infrastructure)
 * - Fallback: AWS SES (when Resend circuit opens)
 * - Bounce/complaint rate monitoring with alerting
 * - IP warming schedule for gradual volume ramp-up
 * - Rate limiting to stay within provider limits
 *
 * N81 — Email infrastructure at scale
 */
import { callWithCircuitBreaker, getCircuitState, CircuitOpenError } from './circuitBreaker'
import { logger } from './logger'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface EmailProvider {
  name: string
  send: (params: EmailSendParams) => Promise<string> // Returns message ID
}

export interface EmailSendParams {
  from: string
  to: string
  subject: string
  html: string
  headers?: Record<string, string>
}

export interface BounceRecord {
  email: string
  type: 'hard' | 'soft' | 'complaint'
  timestamp: number
  provider: string
}

export interface WarmingSchedule {
  day: number
  maxEmails: number
}

export interface EmailScaleStats {
  totalSent: number
  bounces: number
  complaints: number
  bounceRate: number
  complaintRate: number
  activeProvider: string
  circuitState: string
  warmingDay: number
  dailyLimit: number
  sentToday: number
}

// ── Constants ──────────────────────────────────────────────────────────────────

const BOUNCE_RATE_ALERT_THRESHOLD = 0.05 // 5%
const COMPLAINT_RATE_ALERT_THRESHOLD = 0.001 // 0.1%
const MAX_BOUNCES_STORED = 10_000

/**
 * Default warming schedule — ramp up over 14 days.
 * Conservative approach suitable for new IPs/domains.
 */
export const DEFAULT_WARMING_SCHEDULE: WarmingSchedule[] = [
  { day: 1, maxEmails: 50 },
  { day: 2, maxEmails: 100 },
  { day: 3, maxEmails: 200 },
  { day: 4, maxEmails: 500 },
  { day: 5, maxEmails: 1000 },
  { day: 6, maxEmails: 2000 },
  { day: 7, maxEmails: 5000 },
  { day: 8, maxEmails: 10_000 },
  { day: 9, maxEmails: 20_000 },
  { day: 10, maxEmails: 40_000 },
  { day: 11, maxEmails: 70_000 },
  { day: 12, maxEmails: 100_000 },
  { day: 13, maxEmails: 150_000 },
  { day: 14, maxEmails: 250_000 },
]

// ── In-memory state ────────────────────────────────────────────────────────────

const bounceLog: BounceRecord[] = []
let sentToday = 0
let lastResetDay = new Date().toDateString()
let warmingStartDate: Date | null = null

// Stats counters
let totalSent = 0
let totalBounces = 0
let totalComplaints = 0

// ── Provider Management ────────────────────────────────────────────────────────

/**
 * Send email using primary provider (Resend) with fallback to SES.
 * Wraps both calls in circuit breakers for resilience.
 */
export async function sendEmailWithFallback(
  params: EmailSendParams,
  primary: EmailProvider,
  fallback?: EmailProvider,
): Promise<{ messageId: string; provider: string }> {
  // Reset daily counter if new day
  const today = new Date().toDateString()
  if (today !== lastResetDay) {
    sentToday = 0
    lastResetDay = today
  }

  // Check warming schedule limit
  const dailyLimit = getDailyLimit()
  if (sentToday >= dailyLimit) {
    logger.warn('[emailScale] Daily warming limit reached', { sentToday, dailyLimit })
    throw new Error(`Daily email limit reached (${dailyLimit}). Resume tomorrow.`)
  }

  // Try primary provider
  try {
    const messageId = await callWithCircuitBreaker(
      `email:${primary.name}`,
      () => primary.send(params),
      { failureThreshold: 3, cooldownMs: 60_000 },
    )
    sentToday++
    totalSent++
    return { messageId, provider: primary.name }
  } catch (primaryError) {
    // If circuit is open and we have a fallback, try it
    if (fallback && primaryError instanceof CircuitOpenError) {
      logger.warn('[emailScale] Primary provider circuit open, trying fallback', {
        primary: primary.name,
        fallback: fallback.name,
      })

      try {
        const messageId = await callWithCircuitBreaker(
          `email:${fallback.name}`,
          () => fallback.send(params),
          { failureThreshold: 3, cooldownMs: 60_000 },
        )
        sentToday++
        totalSent++
        return { messageId, provider: fallback.name }
      } catch (fallbackError) {
        logger.error('[emailScale] Both providers failed', {
          primaryError: String(primaryError),
          fallbackError: String(fallbackError),
        })
        throw fallbackError
      }
    }

    // No fallback or non-circuit error
    throw primaryError
  }
}

// ── Bounce & Complaint Tracking ────────────────────────────────────────────────

/**
 * Record a bounce event. Called from webhook handlers.
 */
export function recordBounce(
  email: string,
  type: 'hard' | 'soft' | 'complaint',
  provider: string,
): void {
  // Evict oldest if at capacity
  if (bounceLog.length >= MAX_BOUNCES_STORED) {
    bounceLog.shift()
  }

  bounceLog.push({ email, type, timestamp: Date.now(), provider })

  if (type === 'complaint') {
    totalComplaints++
  } else {
    totalBounces++
  }

  // Check thresholds
  const stats = getBounceStats()
  if (stats.bounceRate > BOUNCE_RATE_ALERT_THRESHOLD) {
    logger.error('[emailScale] ALERT: Bounce rate exceeded threshold', {
      bounceRate: stats.bounceRate,
      threshold: BOUNCE_RATE_ALERT_THRESHOLD,
    })
  }
  if (stats.complaintRate > COMPLAINT_RATE_ALERT_THRESHOLD) {
    logger.error('[emailScale] ALERT: Complaint rate exceeded threshold', {
      complaintRate: stats.complaintRate,
      threshold: COMPLAINT_RATE_ALERT_THRESHOLD,
    })
  }
}

/**
 * Check if an email is on the bounce list (hard bounces).
 */
export function isEmailBounced(email: string): boolean {
  return bounceLog.some((b) => b.email === email && b.type === 'hard')
}

/**
 * Get bounce/complaint statistics.
 */
export function getBounceStats(): { bounceRate: number; complaintRate: number; total: number } {
  const total = totalSent || 1 // Avoid division by zero
  return {
    bounceRate: totalBounces / total,
    complaintRate: totalComplaints / total,
    total: totalSent,
  }
}

// ── Warming Schedule ───────────────────────────────────────────────────────────

/**
 * Start the IP warming schedule from today.
 */
export function startWarming(startDate?: Date): void {
  warmingStartDate = startDate || new Date()
}

/**
 * Get current warming day (1-based). Returns 15+ when warming is complete.
 */
export function getWarmingDay(): number {
  if (!warmingStartDate) return 15 // No warming = full capacity
  const diffMs = Date.now() - warmingStartDate.getTime()
  return Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1
}

/**
 * Get daily email limit based on warming schedule.
 */
export function getDailyLimit(schedule: WarmingSchedule[] = DEFAULT_WARMING_SCHEDULE): number {
  const day = getWarmingDay()
  const entry = schedule.find((s) => s.day === day)
  if (entry) return entry.maxEmails
  // Past the schedule = use last entry max (full capacity)
  const last = schedule[schedule.length - 1]
  return last?.maxEmails ?? 250_000
}

// ── Stats & Monitoring ─────────────────────────────────────────────────────────

/**
 * Get comprehensive email scale stats.
 */
export function getEmailScaleStats(): EmailScaleStats {
  const primaryCircuit = getCircuitState('email:resend')
  const bounceStats = getBounceStats()

  return {
    totalSent,
    bounces: totalBounces,
    complaints: totalComplaints,
    bounceRate: bounceStats.bounceRate,
    complaintRate: bounceStats.complaintRate,
    activeProvider: primaryCircuit.state === 'OPEN' ? 'ses_fallback' : 'resend',
    circuitState: primaryCircuit.state,
    warmingDay: getWarmingDay(),
    dailyLimit: getDailyLimit(),
    sentToday,
  }
}

/**
 * Get recent bounces (for admin dashboard).
 */
export function getRecentBounces(limit = 50): BounceRecord[] {
  return bounceLog.slice(-limit).reverse()
}

/**
 * Reset all email scale state (for testing).
 */
export function resetEmailScaleState(): void {
  bounceLog.length = 0
  sentToday = 0
  totalSent = 0
  totalBounces = 0
  totalComplaints = 0
  warmingStartDate = null
  lastResetDay = new Date().toDateString()
}
