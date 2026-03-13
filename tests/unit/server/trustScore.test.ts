/**
 * Tests for server/utils/trustScore.ts
 *
 * Pure unit tests — no I/O, no mocks needed.
 * Tests: criteria scoring, score totals, badge thresholds, edge cases.
 */
import { describe, it, expect } from 'vitest'
import { calculateTrustScore, trustBadge, type DealerForTrustScore } from '~~/server/utils/trustScore'

// Fixed "now" for deterministic age calculations
const NOW = new Date('2026-03-13T12:00:00Z')

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
}

const BASE_DEALER: DealerForTrustScore = {
  logo_url: null,
  bio: null,
  phone: null,
  email: null,
  cif_nif: null,
  created_at: null,
  active_listings: null,
  response_rate_pct: null,
  total_reviews: null,
  rating: null,
  verified: null,
}

describe('calculateTrustScore', () => {
  it('returns 0 for a completely empty dealer', () => {
    const { score, breakdown } = calculateTrustScore(BASE_DEALER, NOW)
    expect(score).toBe(0)
    expect(Object.values(breakdown).every((v) => v === 0)).toBe(true)
  })

  // ── Individual criteria ──────────────────────────────────────────────────

  it('awards 5 pts for has_logo', () => {
    const { breakdown } = calculateTrustScore({ ...BASE_DEALER, logo_url: 'https://cdn/logo.png' }, NOW)
    expect(breakdown.has_logo).toBe(5)
  })

  it('awards 5 pts for has_bio (string)', () => {
    const { breakdown } = calculateTrustScore({ ...BASE_DEALER, bio: 'Somos un concesionario' }, NOW)
    expect(breakdown.has_bio).toBe(5)
  })

  it('awards 5 pts for has_bio (JSONB object with es key)', () => {
    const { breakdown } = calculateTrustScore({ ...BASE_DEALER, bio: { es: 'Descripción', en: '' } }, NOW)
    expect(breakdown.has_bio).toBe(5)
  })

  it('awards 0 pts for has_bio when all bio values are empty', () => {
    const { breakdown } = calculateTrustScore({ ...BASE_DEALER, bio: { es: '   ', en: '' } }, NOW)
    expect(breakdown.has_bio).toBe(0)
  })

  it('awards 5 pts for has_contact when both phone and email present', () => {
    const { breakdown } = calculateTrustScore({ ...BASE_DEALER, phone: '612345678', email: 'test@example.com' }, NOW)
    expect(breakdown.has_contact).toBe(5)
  })

  it('awards 0 pts for has_contact when only phone present', () => {
    const { breakdown } = calculateTrustScore({ ...BASE_DEALER, phone: '612345678' }, NOW)
    expect(breakdown.has_contact).toBe(0)
  })

  it('awards 5 pts for has_legal (cif_nif present)', () => {
    const { breakdown } = calculateTrustScore({ ...BASE_DEALER, cif_nif: 'B12345678' }, NOW)
    expect(breakdown.has_legal).toBe(5)
  })

  // ── Account age ──────────────────────────────────────────────────────────

  it('awards 10 pts for account age ≥ 30 days', () => {
    const { breakdown } = calculateTrustScore({ ...BASE_DEALER, created_at: daysAgo(45) }, NOW)
    expect(breakdown.account_age).toBe(10)
  })

  it('awards 15 pts for account age ≥ 90 days', () => {
    const { breakdown } = calculateTrustScore({ ...BASE_DEALER, created_at: daysAgo(120) }, NOW)
    expect(breakdown.account_age).toBe(15)
  })

  it('awards 0 pts for account age < 30 days', () => {
    const { breakdown } = calculateTrustScore({ ...BASE_DEALER, created_at: daysAgo(20) }, NOW)
    expect(breakdown.account_age).toBe(0)
  })

  it('awards 0 pts when created_at is null', () => {
    const { breakdown } = calculateTrustScore({ ...BASE_DEALER, created_at: null }, NOW)
    expect(breakdown.account_age).toBe(0)
  })

  // ── Listing activity ─────────────────────────────────────────────────────

  it('awards 10 pts for 1 active listing', () => {
    const { breakdown } = calculateTrustScore({ ...BASE_DEALER, active_listings: 1 }, NOW)
    expect(breakdown.listing_activity).toBe(10)
  })

  it('awards 15 pts for 5+ active listings', () => {
    const { breakdown } = calculateTrustScore({ ...BASE_DEALER, active_listings: 5 }, NOW)
    expect(breakdown.listing_activity).toBe(15)
  })

  it('awards 15 pts for 10 active listings', () => {
    const { breakdown } = calculateTrustScore({ ...BASE_DEALER, active_listings: 10 }, NOW)
    expect(breakdown.listing_activity).toBe(15)
  })

  // ── Responsiveness ───────────────────────────────────────────────────────

  it('awards 10 pts for response_rate_pct ≥ 50', () => {
    const { breakdown } = calculateTrustScore({ ...BASE_DEALER, response_rate_pct: 65 }, NOW)
    expect(breakdown.responsiveness).toBe(10)
  })

  it('awards 15 pts for response_rate_pct ≥ 80', () => {
    const { breakdown } = calculateTrustScore({ ...BASE_DEALER, response_rate_pct: 90 }, NOW)
    expect(breakdown.responsiveness).toBe(15)
  })

  it('awards 0 pts for response_rate_pct < 50', () => {
    const { breakdown } = calculateTrustScore({ ...BASE_DEALER, response_rate_pct: 30 }, NOW)
    expect(breakdown.responsiveness).toBe(0)
  })

  // ── Reviews ──────────────────────────────────────────────────────────────

  it('awards 10 pts for having at least 1 review (rating < 4)', () => {
    const { breakdown } = calculateTrustScore({ ...BASE_DEALER, total_reviews: 1, rating: 3.5 }, NOW)
    expect(breakdown.reviews).toBe(10)
  })

  it('awards 20 pts for reviews with rating ≥ 4.0', () => {
    const { breakdown } = calculateTrustScore({ ...BASE_DEALER, total_reviews: 3, rating: 4.5 }, NOW)
    expect(breakdown.reviews).toBe(20)
  })

  it('awards 0 pts when total_reviews is 0', () => {
    const { breakdown } = calculateTrustScore({ ...BASE_DEALER, total_reviews: 0, rating: 5.0 }, NOW)
    expect(breakdown.reviews).toBe(0)
  })

  // ── Verification ─────────────────────────────────────────────────────────

  it('awards 15 pts for verified = true', () => {
    const { breakdown } = calculateTrustScore({ ...BASE_DEALER, verified: true }, NOW)
    expect(breakdown.verified_docs).toBe(15)
  })

  it('awards 0 pts for verified = false', () => {
    const { breakdown } = calculateTrustScore({ ...BASE_DEALER, verified: false }, NOW)
    expect(breakdown.verified_docs).toBe(0)
  })

  // ── Score totals ─────────────────────────────────────────────────────────

  it('sums all criteria correctly for a fully complete dealer', () => {
    const fullDealer: DealerForTrustScore = {
      logo_url: 'https://cdn/logo.png',
      bio: { es: 'Descripción completa', en: 'Full description' },
      phone: '612345678',
      email: 'dealer@example.com',
      cif_nif: 'B12345678',
      created_at: daysAgo(200),
      active_listings: 10,
      response_rate_pct: 90,
      total_reviews: 15,
      rating: 4.8,
      verified: true,
    }
    const { score, breakdown } = calculateTrustScore(fullDealer, NOW)
    expect(score).toBe(100)
    expect(breakdown.has_logo).toBe(5)
    expect(breakdown.has_bio).toBe(5)
    expect(breakdown.has_contact).toBe(5)
    expect(breakdown.has_legal).toBe(5)
    expect(breakdown.account_age).toBe(15)
    expect(breakdown.listing_activity).toBe(15)
    expect(breakdown.responsiveness).toBe(15)
    expect(breakdown.reviews).toBe(20)
    expect(breakdown.verified_docs).toBe(15)
  })

  it('score never exceeds 100', () => {
    const fullDealer: DealerForTrustScore = {
      logo_url: 'x',
      bio: 'x',
      phone: 'x',
      email: 'x',
      cif_nif: 'x',
      created_at: daysAgo(365),
      active_listings: 100,
      response_rate_pct: 100,
      total_reviews: 100,
      rating: 5,
      verified: true,
    }
    const { score } = calculateTrustScore(fullDealer, NOW)
    expect(score).toBeLessThanOrEqual(100)
  })
})

describe('trustBadge', () => {
  it('returns null for score < 60', () => {
    expect(trustBadge(0)).toBeNull()
    expect(trustBadge(59)).toBeNull()
  })

  it('returns "verified" for score 60-79', () => {
    expect(trustBadge(60)).toBe('verified')
    expect(trustBadge(79)).toBe('verified')
  })

  it('returns "top" for score ≥ 80', () => {
    expect(trustBadge(80)).toBe('top')
    expect(trustBadge(100)).toBe('top')
  })
})
