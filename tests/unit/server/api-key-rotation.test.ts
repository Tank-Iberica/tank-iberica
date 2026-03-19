import { describe, it, expect, vi, afterEach } from 'vitest'

import {
  generateApiKey,
  hashApiKey,
  isValidKeyFormat,
  getGracePeriodExpiry,
  isWithinGracePeriod,
  isKeyActive,
  GRACE_PERIOD_HOURS,
  KEY_PREFIX,
} from '../../../server/utils/apiKeyRotation'

describe('API key rotation dealer keys (N34)', () => {
  describe('Constants', () => {
    it('GRACE_PERIOD_HOURS is 48', () => {
      expect(GRACE_PERIOD_HOURS).toBe(48)
    })

    it('KEY_PREFIX is trc_', () => {
      expect(KEY_PREFIX).toBe('trc_')
    })
  })

  describe('Key generation', () => {
    it('generateApiKey returns rawKey and keyHash', () => {
      const { rawKey, keyHash } = generateApiKey()
      expect(rawKey).toBeTruthy()
      expect(keyHash).toBeTruthy()
    })

    it('rawKey starts with trc_ prefix', () => {
      const { rawKey } = generateApiKey()
      expect(rawKey.startsWith('trc_')).toBe(true)
    })

    it('rawKey has correct length (prefix + 64 hex chars)', () => {
      const { rawKey } = generateApiKey()
      expect(rawKey.length).toBe(4 + 64)
    })

    it('each generated key is unique', () => {
      const key1 = generateApiKey()
      const key2 = generateApiKey()
      expect(key1.rawKey).not.toBe(key2.rawKey)
      expect(key1.keyHash).not.toBe(key2.keyHash)
    })

    it('hashApiKey produces consistent hash for same input', () => {
      const hash1 = hashApiKey('trc_abc123')
      const hash2 = hashApiKey('trc_abc123')
      expect(hash1).toBe(hash2)
    })

    it('hashApiKey produces different hash for different input', () => {
      const hash1 = hashApiKey('trc_abc123')
      const hash2 = hashApiKey('trc_def456')
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('Key format validation', () => {
    it('validates correct key format', () => {
      const { rawKey } = generateApiKey()
      expect(isValidKeyFormat(rawKey)).toBe(true)
    })

    it('rejects key without trc_ prefix', () => {
      expect(isValidKeyFormat('abc_' + '1'.repeat(64))).toBe(false)
    })

    it('rejects key with wrong length', () => {
      expect(isValidKeyFormat('trc_short')).toBe(false)
    })

    it('rejects key with non-hex characters', () => {
      expect(isValidKeyFormat('trc_' + 'g'.repeat(64))).toBe(false)
    })
  })

  describe('Grace period logic', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('getGracePeriodExpiry returns date 48h in the future', () => {
      const now = new Date('2026-01-15T12:00:00Z')
      const expiry = getGracePeriodExpiry(now)
      const diffHours = (expiry.getTime() - now.getTime()) / (60 * 60 * 1000)
      expect(diffHours).toBe(48)
    })

    it('isWithinGracePeriod returns true for future date', () => {
      const future = new Date(Date.now() + 60 * 60 * 1000)
      expect(isWithinGracePeriod(future)).toBe(true)
    })

    it('isWithinGracePeriod returns false for past date', () => {
      const past = new Date(Date.now() - 60 * 60 * 1000)
      expect(isWithinGracePeriod(past)).toBe(false)
    })

    it('isWithinGracePeriod accepts string dates', () => {
      const future = new Date(Date.now() + 60 * 60 * 1000).toISOString()
      expect(isWithinGracePeriod(future)).toBe(true)
    })
  })

  describe('Key active check', () => {
    it('active key with no expiry and no revocation', () => {
      expect(isKeyActive({ revoked_at: null, expires_at: null })).toBe(true)
    })

    it('revoked key is not active', () => {
      expect(isKeyActive({ revoked_at: '2026-01-01T00:00:00Z', expires_at: null })).toBe(false)
    })

    it('expired key is not active', () => {
      const past = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      expect(isKeyActive({ revoked_at: null, expires_at: past })).toBe(false)
    })

    it('key within grace period is active', () => {
      const future = new Date(Date.now() + 60 * 60 * 1000).toISOString()
      expect(isKeyActive({ revoked_at: null, expires_at: future })).toBe(true)
    })
  })
})
