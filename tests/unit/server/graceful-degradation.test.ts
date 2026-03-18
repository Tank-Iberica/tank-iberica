import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const SRC = readFileSync(resolve(ROOT, 'server/utils/gracefulDegradation.ts'), 'utf-8')

describe('Graceful degradation per external service (N31)', () => {
  describe('Source structure', () => {
    it('defines ExternalService type', () => {
      expect(SRC).toContain('ExternalService')
      expect(SRC).toContain("'cloudinary'")
      expect(SRC).toContain("'stripe'")
      expect(SRC).toContain("'resend'")
      expect(SRC).toContain("'ai'")
      expect(SRC).toContain("'supabase'")
    })

    it('defines ServiceStatus type', () => {
      expect(SRC).toContain("'healthy'")
      expect(SRC).toContain("'degraded'")
      expect(SRC).toContain("'down'")
    })

    it('has FALLBACK_STRATEGIES for all services', () => {
      expect(SRC).toContain('FALLBACK_STRATEGIES')
    })

    it('exports reportSuccess and reportFailure', () => {
      expect(SRC).toContain('export function reportSuccess')
      expect(SRC).toContain('export function reportFailure')
    })

    it('exports getServiceHealth and isServiceAvailable', () => {
      expect(SRC).toContain('export function getServiceHealth')
      expect(SRC).toContain('export function isServiceAvailable')
    })
  })

  describe('Fallback strategies', () => {
    it('Cloudinary falls back to original URL', () => {
      expect(SRC).toContain('Use original image URL without transforms')
    })

    it('Stripe queues payment for retry', () => {
      expect(SRC).toContain('Queue payment for retry')
    })

    it('Resend queues email via jobQueue', () => {
      expect(SRC).toContain('Queue email via jobQueue')
    })

    it('AI returns cached/default text', () => {
      expect(SRC).toContain('Return cached or default text')
    })

    it('Supabase returns cached data with stale indicator', () => {
      expect(SRC).toContain('Return cached data if available')
    })
  })

  describe('Health tracking (unit tests)', () => {
    let mod: typeof import('../../../server/utils/gracefulDegradation')

    beforeEach(async () => {
      mod = await import('../../../server/utils/gracefulDegradation')
      mod.clearHealthStore()
    })

    it('new service defaults to healthy', () => {
      const health = mod.getServiceHealth('cloudinary')
      expect(health.status).toBe('healthy')
      expect(health.failureCount).toBe(0)
    })

    it('reportSuccess resets to healthy', () => {
      mod.reportFailure('stripe')
      mod.reportFailure('stripe')
      mod.reportFailure('stripe')
      mod.reportSuccess('stripe')
      expect(mod.getServiceHealth('stripe').status).toBe('healthy')
      expect(mod.getServiceHealth('stripe').failureCount).toBe(0)
    })

    it('3 failures → degraded', () => {
      mod.reportFailure('resend')
      mod.reportFailure('resend')
      const status = mod.reportFailure('resend')
      expect(status).toBe('degraded')
    })

    it('5 failures → down', () => {
      for (let i = 0; i < 4; i++) mod.reportFailure('ai')
      const status = mod.reportFailure('ai')
      expect(status).toBe('down')
    })

    it('isServiceAvailable returns false when down', () => {
      for (let i = 0; i < 5; i++) mod.reportFailure('cloudinary')
      expect(mod.isServiceAvailable('cloudinary')).toBe(false)
    })

    it('isServiceAvailable returns true when healthy', () => {
      mod.reportSuccess('stripe')
      expect(mod.isServiceAvailable('stripe')).toBe(true)
    })

    it('isServiceAvailable returns true for never-checked service', () => {
      expect(mod.isServiceAvailable('supabase')).toBe(true)
    })

    it('getAllServiceHealth returns all services', () => {
      const all = mod.getAllServiceHealth()
      expect(Object.keys(all)).toEqual(
        expect.arrayContaining(['cloudinary', 'stripe', 'resend', 'ai', 'supabase']),
      )
    })

    it('reportFailure stores error message', () => {
      mod.reportFailure('resend', 'Connection timeout')
      expect(mod.getServiceHealth('resend').lastError).toBe('Connection timeout')
    })
  })

  describe('Cloudinary fallback helper', () => {
    let mod: typeof import('../../../server/utils/gracefulDegradation')

    beforeEach(async () => {
      mod = await import('../../../server/utils/gracefulDegradation')
      mod.clearHealthStore()
    })

    it('returns transform URL when healthy', () => {
      mod.reportSuccess('cloudinary')
      const url = mod.getImageUrlWithFallback(
        'https://example.com/image.jpg',
        'https://res.cloudinary.com/transformed.jpg',
      )
      expect(url).toBe('https://res.cloudinary.com/transformed.jpg')
    })

    it('returns original URL when Cloudinary is down', () => {
      for (let i = 0; i < 5; i++) mod.reportFailure('cloudinary')
      const url = mod.getImageUrlWithFallback(
        'https://example.com/image.jpg',
        'https://res.cloudinary.com/transformed.jpg',
      )
      expect(url).toBe('https://example.com/image.jpg')
    })

    it('returns original URL when no transform available', () => {
      const url = mod.getImageUrlWithFallback('https://example.com/image.jpg', null)
      expect(url).toBe('https://example.com/image.jpg')
    })
  })
})
