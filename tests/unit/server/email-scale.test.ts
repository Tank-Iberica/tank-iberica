import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock logger (only external dependency)
vi.mock('../../../server/utils/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

import {
  sendEmailWithFallback,
  recordBounce,
  isEmailBounced,
  getBounceStats,
  startWarming,
  getWarmingDay,
  getDailyLimit,
  getEmailScaleStats,
  getRecentBounces,
  resetEmailScaleState,
  DEFAULT_WARMING_SCHEDULE,
  type EmailProvider,
  type EmailSendParams,
} from '../../../server/utils/emailScale'
import { resetCircuit } from '../../../server/utils/circuitBreaker'

// ── Helpers ────────────────────────────────────────────────────────────────────

const params: EmailSendParams = {
  from: 'noreply@tracciona.com',
  to: 'buyer@example.com',
  subject: 'Test email',
  html: '<p>Hello</p>',
}

function mockProvider(name: string, messageId = 'msg-ok'): EmailProvider {
  return { name, send: vi.fn().mockResolvedValue(messageId) }
}

function failingProvider(name: string): EmailProvider {
  return { name, send: vi.fn().mockRejectedValue(new Error(`${name} is down`)) }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Email at Scale (N81) — Behavioral', () => {
  beforeEach(() => {
    resetEmailScaleState()
    resetCircuit('email:resend')
    resetCircuit('email:ses')
  })

  describe('DEFAULT_WARMING_SCHEDULE', () => {
    it('has 14 entries ramping from 50 to 250k', () => {
      expect(DEFAULT_WARMING_SCHEDULE).toHaveLength(14)
      expect(DEFAULT_WARMING_SCHEDULE[0]).toEqual({ day: 1, maxEmails: 50 })
      expect(DEFAULT_WARMING_SCHEDULE[13]).toEqual({ day: 14, maxEmails: 250_000 })
    })

    it('is monotonically increasing', () => {
      for (let i = 1; i < DEFAULT_WARMING_SCHEDULE.length; i++) {
        expect(DEFAULT_WARMING_SCHEDULE[i].maxEmails).toBeGreaterThan(
          DEFAULT_WARMING_SCHEDULE[i - 1].maxEmails,
        )
      }
    })
  })

  describe('Bounce tracking', () => {
    it('hard bounces are detected by isEmailBounced', () => {
      recordBounce('bad@example.com', 'hard', 'resend')
      expect(isEmailBounced('bad@example.com')).toBe(true)
    })

    it('soft bounces do NOT mark email as bounced', () => {
      recordBounce('soft@example.com', 'soft', 'resend')
      expect(isEmailBounced('soft@example.com')).toBe(false)
    })

    it('complaints do NOT mark email as bounced', () => {
      recordBounce('complainer@example.com', 'complaint', 'resend')
      expect(isEmailBounced('complainer@example.com')).toBe(false)
    })

    it('unknown emails are not bounced', () => {
      expect(isEmailBounced('unknown@example.com')).toBe(false)
    })

    it('getBounceStats counts bounces vs complaints separately', () => {
      recordBounce('a@x.com', 'hard', 'resend')
      recordBounce('b@x.com', 'soft', 'resend')
      recordBounce('c@x.com', 'complaint', 'resend')

      const stats = getBounceStats()
      // totalSent is 0 → uses 1 for div-by-zero protection
      expect(stats.bounceRate).toBe(2) // 2 bounces / 1
      expect(stats.complaintRate).toBe(1) // 1 complaint / 1
    })

    it('getRecentBounces returns reverse chronological order', () => {
      recordBounce('first@x.com', 'hard', 'resend')
      recordBounce('second@x.com', 'soft', 'resend')
      recordBounce('third@x.com', 'complaint', 'resend')

      const recent = getRecentBounces()
      expect(recent).toHaveLength(3)
      expect(recent[0].email).toBe('third@x.com')
      expect(recent[2].email).toBe('first@x.com')
    })

    it('getRecentBounces limits output', () => {
      for (let i = 0; i < 10; i++) recordBounce(`b${i}@x.com`, 'hard', 'resend')
      expect(getRecentBounces(3)).toHaveLength(3)
    })
  })

  describe('Warming schedule', () => {
    it('getWarmingDay returns 15 (post-warming) when not started', () => {
      expect(getWarmingDay()).toBe(15)
    })

    it('getWarmingDay returns 1 on start day', () => {
      startWarming(new Date())
      expect(getWarmingDay()).toBe(1)
    })

    it('getDailyLimit returns full capacity (250k) when not warming', () => {
      expect(getDailyLimit()).toBe(250_000)
    })

    it('getDailyLimit returns day 1 limit when warming starts today', () => {
      startWarming(new Date())
      expect(getDailyLimit()).toBe(50)
    })

    it('getDailyLimit accepts custom schedule', () => {
      startWarming(new Date())
      expect(getDailyLimit([{ day: 1, maxEmails: 999 }])).toBe(999)
    })

    it('getDailyLimit returns last entry when past schedule', () => {
      // Start warming 30 days ago → day 31, past schedule
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      startWarming(thirtyDaysAgo)
      expect(getDailyLimit()).toBe(250_000)
    })
  })

  describe('sendEmailWithFallback', () => {
    it('sends via primary provider and returns result', async () => {
      const primary = mockProvider('resend', 'msg-abc')
      const result = await sendEmailWithFallback(params, primary)
      expect(result).toEqual({ messageId: 'msg-abc', provider: 'resend' })
      expect(primary.send).toHaveBeenCalledWith(params)
    })

    it('increments sent counters after each send', async () => {
      const primary = mockProvider('resend')
      await sendEmailWithFallback(params, primary)
      await sendEmailWithFallback(params, primary)

      const stats = getEmailScaleStats()
      expect(stats.totalSent).toBe(2)
      expect(stats.sentToday).toBe(2)
    })

    it('throws when daily warming limit is reached', async () => {
      startWarming(new Date()) // day 1 = 50 max
      const primary = mockProvider('resend')
      for (let i = 0; i < 50; i++) await sendEmailWithFallback(params, primary)

      await expect(sendEmailWithFallback(params, primary)).rejects.toThrow(
        'Daily email limit reached',
      )
    })

    it('falls back to secondary after circuit opens (3 consecutive failures)', async () => {
      const primary = failingProvider('resend')
      const fallback = mockProvider('ses', 'ses-msg-123')

      // Fail 3 times to trip the circuit breaker (threshold=3 in emailScale)
      for (let i = 0; i < 3; i++) {
        await expect(sendEmailWithFallback(params, primary, fallback)).rejects.toThrow(
          'resend is down',
        )
      }

      // 4th call: circuit is OPEN → CircuitOpenError → tries fallback
      const result = await sendEmailWithFallback(params, primary, fallback)
      expect(result).toEqual({ messageId: 'ses-msg-123', provider: 'ses' })
    })

    it('throws original error when primary fails without fallback', async () => {
      const primary = failingProvider('resend')
      await expect(sendEmailWithFallback(params, primary)).rejects.toThrow('resend is down')
    })
  })

  describe('getEmailScaleStats', () => {
    it('returns clean initial state', () => {
      const stats = getEmailScaleStats()
      expect(stats.totalSent).toBe(0)
      expect(stats.bounces).toBe(0)
      expect(stats.complaints).toBe(0)
      expect(stats.bounceRate).toBe(0)
      expect(stats.complaintRate).toBe(0)
      expect(stats.sentToday).toBe(0)
      expect(stats.circuitState).toBe('CLOSED')
      expect(stats.activeProvider).toBe('resend')
    })

    it('reflects stats after operations', async () => {
      const primary = mockProvider('resend')
      await sendEmailWithFallback(params, primary)
      recordBounce('x@x.com', 'hard', 'resend')

      const stats = getEmailScaleStats()
      expect(stats.totalSent).toBe(1)
      expect(stats.bounces).toBe(1)
      expect(stats.bounceRate).toBe(1) // 1 bounce / 1 sent
    })

    it('detects open circuit and switches activeProvider', async () => {
      const primary = failingProvider('resend')
      const fallback = mockProvider('ses')

      // Trip the circuit
      for (let i = 0; i < 3; i++) {
        await sendEmailWithFallback(params, primary, fallback).catch(() => {})
      }

      const stats = getEmailScaleStats()
      expect(stats.circuitState).toBe('OPEN')
      expect(stats.activeProvider).toBe('ses_fallback')
    })
  })

  describe('resetEmailScaleState', () => {
    it('resets all counters and logs', async () => {
      const primary = mockProvider('resend')
      await sendEmailWithFallback(params, primary)
      recordBounce('x@x.com', 'hard', 'resend')
      startWarming(new Date())

      resetEmailScaleState()

      const stats = getEmailScaleStats()
      expect(stats.totalSent).toBe(0)
      expect(stats.bounces).toBe(0)
      expect(stats.sentToday).toBe(0)
      expect(getRecentBounces()).toHaveLength(0)
      expect(isEmailBounced('x@x.com')).toBe(false)
      // Warming reset → no warming → full capacity
      expect(getWarmingDay()).toBe(15)
    })
  })
})
