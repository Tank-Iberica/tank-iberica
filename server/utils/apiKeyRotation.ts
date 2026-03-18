/**
 * API Key Rotation for Dealer Keys
 *
 * Manages dealer API keys with graceful rotation:
 * - Generate new key → old key remains valid for GRACE_PERIOD_HOURS (48h)
 * - Both keys accepted during grace period
 * - Old key auto-expires after grace period
 *
 * Table: dealer_api_keys (dealer_id, key_hash, created_at, expires_at, revoked_at, is_primary)
 *
 * Roadmap: N34 — API key rotation dealer keys
 */

import { createHmac, randomBytes } from 'node:crypto'

// ── Configuration ─────────────────────────────────────────────────────────────

export const GRACE_PERIOD_HOURS = 48
export const KEY_PREFIX = 'trc_'
export const KEY_LENGTH = 32 // bytes → 64 hex chars + prefix

// ── Key generation ────────────────────────────────────────────────────────────

/**
 * Generate a new API key with the trc_ prefix.
 * Returns the raw key (show to dealer once) and the hash (store in DB).
 */
export function generateApiKey(): { rawKey: string; keyHash: string } {
  const rawBytes = randomBytes(KEY_LENGTH)
  const rawKey = `${KEY_PREFIX}${rawBytes.toString('hex')}`
  const keyHash = hashApiKey(rawKey)
  return { rawKey, keyHash }
}

/**
 * Hash an API key for storage. Uses HMAC-SHA256 with a stable salt.
 */
export function hashApiKey(rawKey: string): string {
  const salt = process.env.API_KEY_SALT || 'tracciona-api-key-salt'
  return createHmac('sha256', salt).update(rawKey).digest('hex')
}

// ── Validation ────────────────────────────────────────────────────────────────

/**
 * Validate an API key format (must start with trc_ and be correct length).
 */
export function isValidKeyFormat(key: string): boolean {
  if (!key.startsWith(KEY_PREFIX)) return false
  const hexPart = key.slice(KEY_PREFIX.length)
  return hexPart.length === KEY_LENGTH * 2 && /^[0-9a-f]+$/i.test(hexPart)
}

// ── Rotation logic ────────────────────────────────────────────────────────────

/**
 * Calculate the expiry date for the old key during rotation.
 */
export function getGracePeriodExpiry(fromDate: Date = new Date()): Date {
  return new Date(fromDate.getTime() + GRACE_PERIOD_HOURS * 60 * 60 * 1000)
}

/**
 * Check if a key is within its grace period (not yet expired).
 */
export function isWithinGracePeriod(expiresAt: Date | string): boolean {
  const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt
  return expiry.getTime() > Date.now()
}

/**
 * Check if a key is revoked or expired.
 */
export function isKeyActive(key: {
  revoked_at: string | null
  expires_at: string | null
}): boolean {
  if (key.revoked_at) return false
  if (key.expires_at && !isWithinGracePeriod(key.expires_at)) return false
  return true
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DealerApiKey {
  id: string
  dealer_id: string
  key_hash: string
  key_prefix: string // First 8 chars for identification (trc_xxxx)
  is_primary: boolean
  created_at: string
  expires_at: string | null
  revoked_at: string | null
}

export interface RotationResult {
  newKey: string // Raw key — show to dealer ONCE
  newKeyPrefix: string
  oldKeyExpiresAt: Date
  gracePeriodHours: number
}
