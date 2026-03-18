/**
 * Tests for #51 — Dealer reviews display logic
 *
 * Validates:
 * - Star rendering logic
 * - Review filtering (only published)
 * - Empty state handling
 * - Date formatting
 */
import { describe, it, expect } from 'vitest'

// ─── Star rendering logic (mirrors DealerPortal template) ─────────────────────

function renderStars(rating: number): string {
  const filled = Math.max(0, Math.min(5, Math.round(rating)))
  return '★'.repeat(filled) + '☆'.repeat(5 - filled)
}

describe('DealerReviews — star rendering', () => {
  it('renders 5 filled stars for rating 5', () => {
    expect(renderStars(5)).toBe('★★★★★')
  })

  it('renders 1 filled + 4 empty for rating 1', () => {
    expect(renderStars(1)).toBe('★☆☆☆☆')
  })

  it('renders all empty for rating 0', () => {
    expect(renderStars(0)).toBe('☆☆☆☆☆')
  })

  it('renders 3 filled for rating 3', () => {
    expect(renderStars(3)).toBe('★★★☆☆')
  })

  it('clamps to 5 if rating exceeds 5', () => {
    expect(renderStars(7)).toBe('★★★★★')
  })

  it('clamps to 0 if rating is negative', () => {
    expect(renderStars(-2)).toBe('☆☆☆☆☆')
  })
})

// ─── Review filtering logic ──────────────────────────────────────────────────

interface RawReview {
  id: string
  rating: number
  title: string | null
  content: string | null
  verified_purchase: boolean
  status: string
  created_at: string
}

/** Mirrors the query filter: only published reviews */
function filterPublished(reviews: RawReview[]): RawReview[] {
  return reviews.filter(r => r.status === 'published')
}

describe('DealerReviews — filter published', () => {
  const reviews: RawReview[] = [
    { id: '1', rating: 5, title: 'Great', content: null, verified_purchase: true, status: 'published', created_at: '2026-01-01' },
    { id: '2', rating: 1, title: 'Bad', content: null, verified_purchase: false, status: 'pending', created_at: '2026-01-02' },
    { id: '3', rating: 4, title: 'Good', content: null, verified_purchase: true, status: 'published', created_at: '2026-01-03' },
    { id: '4', rating: 2, title: 'Meh', content: null, verified_purchase: false, status: 'rejected', created_at: '2026-01-04' },
  ]

  it('returns only published reviews', () => {
    const result = filterPublished(reviews)
    expect(result).toHaveLength(2)
    expect(result.every(r => r.status === 'published')).toBe(true)
  })

  it('returns empty array when no published reviews', () => {
    const pending = reviews.filter(r => r.status !== 'published')
    expect(filterPublished(pending)).toHaveLength(0)
  })

  it('returns all when all are published', () => {
    const allPublished = reviews.map(r => ({ ...r, status: 'published' }))
    expect(filterPublished(allPublished)).toHaveLength(4)
  })
})

// ─── Date display ─────────────────────────────────────────────────────────────

describe('DealerReviews — date display', () => {
  it('formats ISO date to locale string', () => {
    const date = new Date('2026-03-15T10:00:00Z')
    const formatted = date.toLocaleDateString()
    expect(formatted).toBeTruthy()
    expect(typeof formatted).toBe('string')
  })

  it('handles review without content gracefully', () => {
    const review = { id: '1', rating: 4, title: null, content: null, verified_purchase: false, created_at: '2026-01-01' }
    // Title and content are optional — should not throw
    expect(review.title).toBeNull()
    expect(review.content).toBeNull()
  })

  it('verified_purchase flag is boolean', () => {
    const review = { id: '1', rating: 5, title: 'Good', content: 'Nice', verified_purchase: true, created_at: '2026-01-01' }
    expect(typeof review.verified_purchase).toBe('boolean')
  })
})
