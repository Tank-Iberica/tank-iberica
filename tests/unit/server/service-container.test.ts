import { describe, it, expect, beforeEach } from 'vitest'
import {
  registerService,
  getService,
  hasService,
  clearServices,
} from '../../../server/services/container'
import type { IEmailService, ICacheService } from '../../../server/services/interfaces'

const mockEmail: IEmailService = {
  send: async () => ({ id: 'msg-123' }),
  sendBatch: async () => ({ sent: 2, failed: 0 }),
}

const mockCache: ICacheService = {
  get: async () => null,
  set: async () => {},
  delete: async () => {},
  flush: async () => {},
}

describe('Service Container', () => {
  beforeEach(() => {
    clearServices()
  })

  it('registers and retrieves a service', () => {
    registerService('email', mockEmail)
    const email = getService('email')
    expect(email).toBe(mockEmail)
  })

  it('throws when service not registered', () => {
    expect(() => getService('email')).toThrow('Service "email" not registered')
  })

  it('hasService returns true for registered', () => {
    registerService('cache', mockCache)
    expect(hasService('cache')).toBe(true)
    expect(hasService('email')).toBe(false)
  })

  it('clearServices removes all services', () => {
    registerService('email', mockEmail)
    registerService('cache', mockCache)
    clearServices()
    expect(hasService('email')).toBe(false)
    expect(hasService('cache')).toBe(false)
  })

  it('allows overriding a service', () => {
    registerService('email', mockEmail)
    const newEmail: IEmailService = {
      send: async () => ({ id: 'new-123' }),
      sendBatch: async () => ({ sent: 0, failed: 0 }),
    }
    registerService('email', newEmail)
    expect(getService('email')).toBe(newEmail)
  })

  it('services work independently', () => {
    registerService('email', mockEmail)
    registerService('cache', mockCache)
    expect(getService('email')).toBe(mockEmail)
    expect(getService('cache')).toBe(mockCache)
  })

  it('email service mock returns expected values', async () => {
    registerService('email', mockEmail)
    const email = getService('email')
    const result = await email.send({ to: 'test@test.com', subject: 'Hi', html: '<p>Test</p>' })
    expect(result.id).toBe('msg-123')
  })

  it('cache service mock returns null for get', async () => {
    registerService('cache', mockCache)
    const cache = getService('cache')
    const result = await cache.get('nonexistent')
    expect(result).toBeNull()
  })
})
