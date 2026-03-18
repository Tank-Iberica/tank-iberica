/**
 * Tests for server/utils/timingSafeCompare.ts
 * Timing-safe string comparison for secrets and tokens.
 */
import { describe, it, expect } from 'vitest'
import { timingSafeCompare } from '../../../server/utils/timingSafeCompare'

describe('timingSafeCompare', () => {
  it('returns true for identical strings', () => {
    expect(timingSafeCompare('secret123', 'secret123')).toBe(true)
  })

  it('returns false for different strings', () => {
    expect(timingSafeCompare('secret123', 'wrong456')).toBe(false)
  })

  it('returns false for different length strings', () => {
    expect(timingSafeCompare('short', 'longer-string')).toBe(false)
  })

  it('returns false when first arg is null', () => {
    expect(timingSafeCompare(null, 'secret')).toBe(false)
  })

  it('returns false when second arg is null', () => {
    expect(timingSafeCompare('secret', null)).toBe(false)
  })

  it('returns false when first arg is undefined', () => {
    expect(timingSafeCompare(undefined, 'secret')).toBe(false)
  })

  it('returns false when second arg is undefined', () => {
    expect(timingSafeCompare('secret', undefined)).toBe(false)
  })

  it('returns false when both are null', () => {
    expect(timingSafeCompare(null, null)).toBe(false)
  })

  it('returns false when first arg is empty string', () => {
    expect(timingSafeCompare('', 'secret')).toBe(false)
  })

  it('returns false when second arg is empty string', () => {
    expect(timingSafeCompare('secret', '')).toBe(false)
  })

  it('works with Bearer token format', () => {
    expect(timingSafeCompare('Bearer my-cron-secret', 'Bearer my-cron-secret')).toBe(true)
    expect(timingSafeCompare('Bearer wrong-secret', 'Bearer my-cron-secret')).toBe(false)
  })

  it('works with long secrets', () => {
    const longSecret = 'a'.repeat(256)
    expect(timingSafeCompare(longSecret, longSecret)).toBe(true)
    expect(timingSafeCompare(longSecret, 'b'.repeat(256))).toBe(false)
  })

  it('works with unicode strings', () => {
    expect(timingSafeCompare('clave-secreta-ñ', 'clave-secreta-ñ')).toBe(true)
    expect(timingSafeCompare('clave-secreta-ñ', 'clave-secreta-n')).toBe(false)
  })
})
