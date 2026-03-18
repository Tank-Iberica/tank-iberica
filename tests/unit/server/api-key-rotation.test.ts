import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const SRC = readFileSync(resolve(ROOT, 'server/utils/apiKeyRotation.ts'), 'utf-8')

describe('API key rotation dealer keys (N34)', () => {
  describe('Source structure', () => {
    it('exports generateApiKey', () => {
      expect(SRC).toContain('export function generateApiKey')
    })

    it('exports hashApiKey', () => {
      expect(SRC).toContain('export function hashApiKey')
    })

    it('exports isValidKeyFormat', () => {
      expect(SRC).toContain('export function isValidKeyFormat')
    })

    it('exports getGracePeriodExpiry', () => {
      expect(SRC).toContain('export function getGracePeriodExpiry')
    })

    it('exports isWithinGracePeriod', () => {
      expect(SRC).toContain('export function isWithinGracePeriod')
    })

    it('exports isKeyActive', () => {
      expect(SRC).toContain('export function isKeyActive')
    })

    it('has GRACE_PERIOD_HOURS = 48', () => {
      expect(SRC).toContain('GRACE_PERIOD_HOURS = 48')
    })

    it('uses trc_ prefix', () => {
      expect(SRC).toContain("KEY_PREFIX = 'trc_'")
    })

    it('defines DealerApiKey interface', () => {
      expect(SRC).toContain('export interface DealerApiKey')
    })

    it('defines RotationResult interface', () => {
      expect(SRC).toContain('export interface RotationResult')
    })
  })

  describe('Key generation (unit tests)', () => {
    let mod: typeof import('../../../server/utils/apiKeyRotation')

    beforeEach(async () => {
      mod = await import('../../../server/utils/apiKeyRotation')
    })

    it('generateApiKey returns rawKey and keyHash', () => {
      const { rawKey, keyHash } = mod.generateApiKey()
      expect(rawKey).toBeTruthy()
      expect(keyHash).toBeTruthy()
    })

    it('rawKey starts with trc_ prefix', () => {
      const { rawKey } = mod.generateApiKey()
      expect(rawKey.startsWith('trc_')).toBe(true)
    })

    it('rawKey has correct length (prefix + 64 hex chars)', () => {
      const { rawKey } = mod.generateApiKey()
      expect(rawKey.length).toBe(4 + 64) // trc_ + 32 bytes hex
    })

    it('each generated key is unique', () => {
      const key1 = mod.generateApiKey()
      const key2 = mod.generateApiKey()
      expect(key1.rawKey).not.toBe(key2.rawKey)
      expect(key1.keyHash).not.toBe(key2.keyHash)
    })

    it('hashApiKey produces consistent hash for same input', () => {
      const hash1 = mod.hashApiKey('trc_abc123')
      const hash2 = mod.hashApiKey('trc_abc123')
      expect(hash1).toBe(hash2)
    })

    it('hashApiKey produces different hash for different input', () => {
      const hash1 = mod.hashApiKey('trc_abc123')
      const hash2 = mod.hashApiKey('trc_def456')
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('Key format validation', () => {
    let mod: typeof import('../../../server/utils/apiKeyRotation')

    beforeEach(async () => {
      mod = await import('../../../server/utils/apiKeyRotation')
    })

    it('validates correct key format', () => {
      const { rawKey } = mod.generateApiKey()
      expect(mod.isValidKeyFormat(rawKey)).toBe(true)
    })

    it('rejects key without trc_ prefix', () => {
      expect(mod.isValidKeyFormat('abc_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')).toBe(false)
    })

    it('rejects key with wrong length', () => {
      expect(mod.isValidKeyFormat('trc_short')).toBe(false)
    })

    it('rejects key with non-hex characters', () => {
      expect(mod.isValidKeyFormat('trc_' + 'g'.repeat(64))).toBe(false)
    })
  })

  describe('Grace period logic', () => {
    let mod: typeof import('../../../server/utils/apiKeyRotation')

    beforeEach(async () => {
      mod = await import('../../../server/utils/apiKeyRotation')
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('getGracePeriodExpiry returns date 48h in the future', () => {
      const now = new Date('2026-01-15T12:00:00Z')
      const expiry = mod.getGracePeriodExpiry(now)
      const diffHours = (expiry.getTime() - now.getTime()) / (60 * 60 * 1000)
      expect(diffHours).toBe(48)
    })

    it('isWithinGracePeriod returns true for future date', () => {
      const future = new Date(Date.now() + 60 * 60 * 1000) // 1h in future
      expect(mod.isWithinGracePeriod(future)).toBe(true)
    })

    it('isWithinGracePeriod returns false for past date', () => {
      const past = new Date(Date.now() - 60 * 60 * 1000) // 1h in past
      expect(mod.isWithinGracePeriod(past)).toBe(false)
    })

    it('isWithinGracePeriod accepts string dates', () => {
      const future = new Date(Date.now() + 60 * 60 * 1000).toISOString()
      expect(mod.isWithinGracePeriod(future)).toBe(true)
    })
  })

  describe('Key active check', () => {
    let mod: typeof import('../../../server/utils/apiKeyRotation')

    beforeEach(async () => {
      mod = await import('../../../server/utils/apiKeyRotation')
    })

    it('active key with no expiry and no revocation', () => {
      expect(mod.isKeyActive({ revoked_at: null, expires_at: null })).toBe(true)
    })

    it('revoked key is not active', () => {
      expect(mod.isKeyActive({ revoked_at: '2026-01-01T00:00:00Z', expires_at: null })).toBe(false)
    })

    it('expired key is not active', () => {
      const past = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      expect(mod.isKeyActive({ revoked_at: null, expires_at: past })).toBe(false)
    })

    it('key within grace period is active', () => {
      const future = new Date(Date.now() + 60 * 60 * 1000).toISOString()
      expect(mod.isKeyActive({ revoked_at: null, expires_at: future })).toBe(true)
    })
  })
})
