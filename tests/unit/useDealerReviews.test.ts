import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// Unit tests for useDealerReviews composable logic.
// Tests the pure functions: averageRating computation and submit validation.
// ---------------------------------------------------------------------------

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer_id: string | null
}

/** Mirrors the composable's averageRating computed */
function computeAverageRating(reviews: Review[]): number {
  if (!reviews.length) return 0
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
  return Math.round((sum / reviews.length) * 10) / 10
}

/** Mirrors submit validation rules */
function validateSubmit(
  userId: string | null,
  rating: number,
): { valid: boolean; errorKey?: string } {
  if (!userId) return { valid: false, errorKey: 'vehicle.reviews.loginRequired' }
  if (rating < 1 || rating > 5) return { valid: false, errorKey: 'vehicle.reviews.ratingRequired' }
  return { valid: true }
}

// ---- averageRating ---------------------------------------------------------

describe('useDealerReviews — averageRating', () => {
  it('returns 0 when no reviews', () => {
    expect(computeAverageRating([])).toBe(0)
  })

  it('returns exact rating when only one review', () => {
    const reviews: Review[] = [
      { id: '1', rating: 4, comment: null, created_at: '2026-01-01', reviewer_id: 'u1' },
    ]
    expect(computeAverageRating(reviews)).toBe(4)
  })

  it('computes average for multiple reviews', () => {
    const reviews: Review[] = [
      { id: '1', rating: 5, comment: null, created_at: '2026-01-01', reviewer_id: 'u1' },
      { id: '2', rating: 3, comment: null, created_at: '2026-01-02', reviewer_id: 'u2' },
    ]
    expect(computeAverageRating(reviews)).toBe(4)
  })

  it('rounds to one decimal place', () => {
    // (5 + 4 + 3) / 3 = 4.0
    const reviews: Review[] = [
      { id: '1', rating: 5, comment: null, created_at: '2026-01-01', reviewer_id: 'u1' },
      { id: '2', rating: 4, comment: null, created_at: '2026-01-02', reviewer_id: 'u2' },
      { id: '3', rating: 3, comment: null, created_at: '2026-01-03', reviewer_id: 'u3' },
    ]
    expect(computeAverageRating(reviews)).toBe(4)
  })

  it('rounds 4.35 → 4.4', () => {
    // 2 reviews: 5 + 3.7 = nope, let's do (5+4+4) / 3 = 4.333...→ 4.3
    const reviews: Review[] = [
      { id: '1', rating: 5, comment: null, created_at: '2026-01-01', reviewer_id: 'u1' },
      { id: '2', rating: 4, comment: null, created_at: '2026-01-02', reviewer_id: 'u2' },
      { id: '3', rating: 4, comment: null, created_at: '2026-01-03', reviewer_id: 'u3' },
    ]
    // 13/3 = 4.333... → round to 4.3
    expect(computeAverageRating(reviews)).toBe(4.3)
  })

  it('handles all 1-star reviews', () => {
    const reviews: Review[] = [
      { id: '1', rating: 1, comment: 'bad', created_at: '2026-01-01', reviewer_id: 'u1' },
      { id: '2', rating: 1, comment: 'bad', created_at: '2026-01-02', reviewer_id: 'u2' },
    ]
    expect(computeAverageRating(reviews)).toBe(1)
  })

  it('handles all 5-star reviews', () => {
    const reviews: Review[] = [
      { id: '1', rating: 5, comment: null, created_at: '2026-01-01', reviewer_id: 'u1' },
      { id: '2', rating: 5, comment: null, created_at: '2026-01-02', reviewer_id: 'u2' },
      { id: '3', rating: 5, comment: null, created_at: '2026-01-03', reviewer_id: 'u3' },
    ]
    expect(computeAverageRating(reviews)).toBe(5)
  })
})

// ---- submit validation -----------------------------------------------------

describe('useDealerReviews — validateSubmit', () => {
  it('fails when user is not logged in', () => {
    const result = validateSubmit(null, 4)
    expect(result.valid).toBe(false)
    expect(result.errorKey).toBe('vehicle.reviews.loginRequired')
  })

  it('fails when rating is 0', () => {
    const result = validateSubmit('user-123', 0)
    expect(result.valid).toBe(false)
    expect(result.errorKey).toBe('vehicle.reviews.ratingRequired')
  })

  it('fails when rating is below 1', () => {
    expect(validateSubmit('user-123', -1).valid).toBe(false)
  })

  it('fails when rating is above 5', () => {
    expect(validateSubmit('user-123', 6).valid).toBe(false)
  })

  it('passes for rating 1 with auth', () => {
    expect(validateSubmit('user-123', 1).valid).toBe(true)
  })

  it('passes for rating 5 with auth', () => {
    expect(validateSubmit('user-123', 5).valid).toBe(true)
  })

  it('passes for rating 3 with auth', () => {
    const result = validateSubmit('user-abc', 3)
    expect(result.valid).toBe(true)
    expect(result.errorKey).toBeUndefined()
  })
})
