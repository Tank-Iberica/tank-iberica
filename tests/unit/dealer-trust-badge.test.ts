/**
 * Tests for #54 — Top-Rated badge logic
 *
 * Validates:
 * - Trust score → badge tier derivation (top ≥ 80, verified ≥ 60)
 * - Edge cases at thresholds
 */
import { describe, it, expect } from 'vitest'

// ── Badge derivation (mirrors useDealerTrustScore.ts) ─────────────────────────

type TrustBadgeTier = 'top' | 'verified' | null

const BADGE_THRESHOLDS = { top: 80, verified: 60 } as const

function deriveBadge(score: number): TrustBadgeTier {
  if (score >= BADGE_THRESHOLDS.top) return 'top'
  if (score >= BADGE_THRESHOLDS.verified) return 'verified'
  return null
}

describe('deriveBadge — trust score → badge tier (#54)', () => {
  it('returns "top" for score 80', () => {
    expect(deriveBadge(80)).toBe('top')
  })

  it('returns "top" for score 100', () => {
    expect(deriveBadge(100)).toBe('top')
  })

  it('returns "top" for score 95', () => {
    expect(deriveBadge(95)).toBe('top')
  })

  it('returns "verified" for score 79', () => {
    expect(deriveBadge(79)).toBe('verified')
  })

  it('returns "verified" for score 60', () => {
    expect(deriveBadge(60)).toBe('verified')
  })

  it('returns null for score 59', () => {
    expect(deriveBadge(59)).toBeNull()
  })

  it('returns null for score 0', () => {
    expect(deriveBadge(0)).toBeNull()
  })

  it('returns null for negative score', () => {
    expect(deriveBadge(-10)).toBeNull()
  })

  it('threshold boundary: 80 is top, 79 is verified', () => {
    expect(deriveBadge(80)).toBe('top')
    expect(deriveBadge(79)).toBe('verified')
  })

  it('threshold boundary: 60 is verified, 59 is null', () => {
    expect(deriveBadge(60)).toBe('verified')
    expect(deriveBadge(59)).toBeNull()
  })
})
