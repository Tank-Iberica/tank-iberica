import { describe, it, expect, beforeEach } from 'vitest'

import {
  reportSuccess,
  reportFailure,
  getServiceHealth,
  isServiceAvailable,
  getFallbackStrategy,
  getAllServiceHealth,
  clearHealthStore,
  getImageUrlWithFallback,
  FALLBACK_STRATEGIES,
  type ExternalService,
} from '../../../server/utils/gracefulDegradation'

describe('Graceful degradation per external service (N31)', () => {
  beforeEach(() => {
    clearHealthStore()
  })

  describe('FALLBACK_STRATEGIES', () => {
    it('defines strategies for all 5 services', () => {
      const services: ExternalService[] = ['cloudinary', 'stripe', 'resend', 'ai', 'supabase']
      for (const s of services) {
        expect(FALLBACK_STRATEGIES[s]).toBeDefined()
        expect(FALLBACK_STRATEGIES[s].service).toBe(s)
      }
    })

    it('each strategy has retryable, maxRetries, retryDelayMs', () => {
      for (const strategy of Object.values(FALLBACK_STRATEGIES)) {
        expect(typeof strategy.retryable).toBe('boolean')
        expect(strategy.maxRetries).toBeGreaterThan(0)
        expect(strategy.retryDelayMs).toBeGreaterThan(0)
      }
    })

    it('stripe has higher retry count than cloudinary', () => {
      expect(FALLBACK_STRATEGIES.stripe.maxRetries).toBeGreaterThan(
        FALLBACK_STRATEGIES.cloudinary.maxRetries,
      )
    })
  })

  describe('reportSuccess', () => {
    it('sets service to healthy with zero failures', () => {
      reportSuccess('cloudinary')
      const health = getServiceHealth('cloudinary')
      expect(health.status).toBe('healthy')
      expect(health.failureCount).toBe(0)
    })

    it('resets failure count after previous failures', () => {
      reportFailure('stripe')
      reportFailure('stripe')
      reportFailure('stripe')
      expect(getServiceHealth('stripe').failureCount).toBe(3)

      reportSuccess('stripe')
      expect(getServiceHealth('stripe').failureCount).toBe(0)
      expect(getServiceHealth('stripe').status).toBe('healthy')
    })
  })

  describe('reportFailure', () => {
    it('increments failure count', () => {
      reportFailure('resend')
      expect(getServiceHealth('resend').failureCount).toBe(1)
      reportFailure('resend')
      expect(getServiceHealth('resend').failureCount).toBe(2)
    })

    it('returns "healthy" for < 3 failures', () => {
      const status = reportFailure('ai')
      expect(status).toBe('healthy')
    })

    it('returns "degraded" at 3 failures', () => {
      reportFailure('ai')
      reportFailure('ai')
      const status = reportFailure('ai')
      expect(status).toBe('degraded')
    })

    it('returns "down" at 5 failures', () => {
      for (let i = 0; i < 4; i++) reportFailure('supabase')
      const status = reportFailure('supabase')
      expect(status).toBe('down')
    })

    it('stores lastError message', () => {
      reportFailure('cloudinary', 'Connection timeout')
      expect(getServiceHealth('cloudinary').lastError).toBe('Connection timeout')
    })
  })

  describe('getServiceHealth', () => {
    it('returns default healthy state for unknown service', () => {
      const health = getServiceHealth('cloudinary')
      expect(health.status).toBe('healthy')
      expect(health.failureCount).toBe(0)
    })
  })

  describe('isServiceAvailable', () => {
    it('returns true for never-checked service', () => {
      expect(isServiceAvailable('cloudinary')).toBe(true)
    })

    it('returns true for healthy service', () => {
      reportSuccess('stripe')
      expect(isServiceAvailable('stripe')).toBe(true)
    })

    it('returns true for degraded service', () => {
      for (let i = 0; i < 3; i++) reportFailure('resend')
      expect(isServiceAvailable('resend')).toBe(true)
    })

    it('returns false for down service', () => {
      for (let i = 0; i < 5; i++) reportFailure('ai')
      expect(isServiceAvailable('ai')).toBe(false)
    })
  })

  describe('getFallbackStrategy', () => {
    it('returns correct strategy for cloudinary', () => {
      const strategy = getFallbackStrategy('cloudinary')
      expect(strategy.service).toBe('cloudinary')
      expect(strategy.fallbackDescription).toContain('original image')
    })
  })

  describe('getAllServiceHealth', () => {
    it('returns health for all 5 services', () => {
      const health = getAllServiceHealth()
      expect(Object.keys(health)).toHaveLength(5)
      expect(health.cloudinary).toBeDefined()
      expect(health.stripe).toBeDefined()
      expect(health.supabase).toBeDefined()
    })
  })

  describe('getImageUrlWithFallback', () => {
    it('returns cloudinary URL when service is available', () => {
      reportSuccess('cloudinary')
      const url = getImageUrlWithFallback('https://orig.jpg', 'https://cloudinary.jpg')
      expect(url).toBe('https://cloudinary.jpg')
    })

    it('returns original URL when cloudinary is down', () => {
      for (let i = 0; i < 5; i++) reportFailure('cloudinary')
      const url = getImageUrlWithFallback('https://orig.jpg', 'https://cloudinary.jpg')
      expect(url).toBe('https://orig.jpg')
    })

    it('returns original URL when cloudinary URL is null', () => {
      const url = getImageUrlWithFallback('https://orig.jpg', null)
      expect(url).toBe('https://orig.jpg')
    })
  })
})
