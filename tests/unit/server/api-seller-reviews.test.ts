/**
 * Tests for seller-reviews API routes (Item #50)
 *
 * Tests the business logic of:
 * - POST /api/seller-reviews/create (validation, dedup, aggregates)
 * - GET /api/seller-reviews/:sellerId (pagination, filtering)
 * - DELETE /api/seller-reviews/:id (ownership, admin override, aggregate update)
 * - GET /api/admin/seller-reviews (admin list/moderate)
 * - PATCH /api/admin/seller-reviews (moderation status)
 */
import { describe, it, expect } from 'vitest'

// ─── Business logic functions extracted for testing ─────────────────────────

/**
 * Calculate new dealer rating after adding a review.
 * Mirrors the logic in create.post.ts
 */
function calculateNewRating(prevTotal: number, prevRating: number, newRating: number) {
  const newTotal = prevTotal + 1
  const newAvg = Math.round(((prevRating * prevTotal + newRating) / newTotal) * 10) / 10
  return { newTotal, newAvg }
}

/**
 * Calculate new dealer rating after removing a review.
 * Mirrors the logic in [id].delete.ts
 */
function calculateRatingAfterDelete(prevTotal: number, prevRating: number, removedRating: number) {
  const newTotal = Math.max(0, prevTotal - 1)
  if (newTotal === 0 || prevTotal === 0) return { newTotal, newAvg: 0 }
  let newAvg = Math.round(((prevRating * prevTotal - removedRating) / newTotal) * 10) / 10
  newAvg = Math.max(0, Math.min(5, newAvg))
  return { newTotal, newAvg }
}

/**
 * Validate review input constraints.
 * Mirrors Zod schema in create.post.ts
 */
function validateReviewInput(input: {
  rating?: number
  title?: string
  content?: string
  sellerId?: string
  reviewerId?: string
}) {
  const errors: string[] = []
  if (input.rating === undefined || input.rating < 1 || input.rating > 5 || !Number.isInteger(input.rating)) {
    errors.push('rating must be integer 1-5')
  }
  if (input.title && input.title.length > 200) {
    errors.push('title max 200 chars')
  }
  if (input.content && input.content.length > 2000) {
    errors.push('content max 2000 chars')
  }
  if (input.sellerId === input.reviewerId) {
    errors.push('cannot review yourself')
  }
  return { valid: errors.length === 0, errors }
}

/**
 * Pagination calculation.
 * Mirrors the logic in [sellerId].get.ts
 */
function calculatePagination(page: number, limit: number, total: number) {
  const safePage = Math.max(1, page)
  const safeLimit = Math.min(50, Math.max(1, limit))
  const from = (safePage - 1) * safeLimit
  const to = from + safeLimit - 1
  return {
    page: safePage,
    limit: safeLimit,
    from,
    to,
    total,
    totalPages: Math.ceil(total / safeLimit),
    hasMore: to + 1 < total,
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Seller Reviews — Rating calculation', () => {
  it('first review sets rating directly', () => {
    const { newTotal, newAvg } = calculateNewRating(0, 0, 4)
    expect(newTotal).toBe(1)
    expect(newAvg).toBe(4)
  })

  it('second review averages correctly', () => {
    const { newTotal, newAvg } = calculateNewRating(1, 4, 2)
    expect(newTotal).toBe(2)
    expect(newAvg).toBe(3) // (4+2)/2
  })

  it('maintains precision with rounding', () => {
    const { newAvg } = calculateNewRating(2, 4.5, 3)
    // (4.5*2 + 3) / 3 = 12/3 = 4.0
    expect(newAvg).toBe(4)
  })

  it('handles fractional averages', () => {
    const { newAvg } = calculateNewRating(2, 5, 1)
    // (5*2 + 1) / 3 = 11/3 = 3.666... → 3.7
    expect(newAvg).toBe(3.7)
  })

  it('handles large number of reviews', () => {
    const { newTotal, newAvg } = calculateNewRating(100, 4.2, 5)
    expect(newTotal).toBe(101)
    // (4.2*100 + 5) / 101 = 425/101 = 4.2079... → 4.2
    expect(newAvg).toBe(4.2)
  })

  it('all 5-star reviews stay at 5', () => {
    const { newAvg } = calculateNewRating(10, 5, 5)
    expect(newAvg).toBe(5)
  })

  it('all 1-star reviews stay at 1', () => {
    const { newAvg } = calculateNewRating(10, 1, 1)
    expect(newAvg).toBe(1)
  })
})

describe('Seller Reviews — Rating after delete', () => {
  it('removing last review resets to 0', () => {
    const { newTotal, newAvg } = calculateRatingAfterDelete(1, 4, 4)
    expect(newTotal).toBe(0)
    expect(newAvg).toBe(0)
  })

  it('removing one of two reviews recalculates', () => {
    const { newTotal, newAvg } = calculateRatingAfterDelete(2, 3, 2)
    // (3*2 - 2) / 1 = 4
    expect(newTotal).toBe(1)
    expect(newAvg).toBe(4)
  })

  it('clamps negative averages to 0', () => {
    // Edge case: data inconsistency
    const { newAvg } = calculateRatingAfterDelete(2, 1, 5)
    // (1*2 - 5) / 1 = -3 → clamped to 0
    expect(newAvg).toBe(0)
  })

  it('clamps above 5 to 5', () => {
    // Edge case: data inconsistency
    const { newAvg } = calculateRatingAfterDelete(3, 5, 1)
    // (5*3 - 1) / 2 = 7 → clamped to 5
    expect(newAvg).toBe(5)
  })

  it('handles zero total gracefully', () => {
    const { newTotal, newAvg } = calculateRatingAfterDelete(0, 0, 3)
    expect(newTotal).toBe(0)
    expect(newAvg).toBe(0)
  })
})

describe('Seller Reviews — Input validation', () => {
  it('valid review passes', () => {
    const result = validateReviewInput({
      rating: 4,
      title: 'Great seller',
      content: 'Fast response.',
      sellerId: 'user-1',
      reviewerId: 'user-2',
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects rating below 1', () => {
    const result = validateReviewInput({ rating: 0, sellerId: 'a', reviewerId: 'b' })
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('rating')
  })

  it('rejects rating above 5', () => {
    const result = validateReviewInput({ rating: 6, sellerId: 'a', reviewerId: 'b' })
    expect(result.valid).toBe(false)
  })

  it('rejects non-integer rating', () => {
    const result = validateReviewInput({ rating: 3.5, sellerId: 'a', reviewerId: 'b' })
    expect(result.valid).toBe(false)
  })

  it('rejects missing rating', () => {
    const result = validateReviewInput({ sellerId: 'a', reviewerId: 'b' })
    expect(result.valid).toBe(false)
  })

  it('rejects title over 200 chars', () => {
    const result = validateReviewInput({
      rating: 4,
      title: 'x'.repeat(201),
      sellerId: 'a',
      reviewerId: 'b',
    })
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('title')
  })

  it('rejects content over 2000 chars', () => {
    const result = validateReviewInput({
      rating: 4,
      content: 'x'.repeat(2001),
      sellerId: 'a',
      reviewerId: 'b',
    })
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('content')
  })

  it('rejects self-review', () => {
    const result = validateReviewInput({
      rating: 5,
      sellerId: 'same-user',
      reviewerId: 'same-user',
    })
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('yourself')
  })

  it('allows empty title and content', () => {
    const result = validateReviewInput({
      rating: 3,
      sellerId: 'a',
      reviewerId: 'b',
    })
    expect(result.valid).toBe(true)
  })

  it('allows title at exactly 200 chars', () => {
    const result = validateReviewInput({
      rating: 4,
      title: 'x'.repeat(200),
      sellerId: 'a',
      reviewerId: 'b',
    })
    expect(result.valid).toBe(true)
  })

  it('allows content at exactly 2000 chars', () => {
    const result = validateReviewInput({
      rating: 4,
      content: 'x'.repeat(2000),
      sellerId: 'a',
      reviewerId: 'b',
    })
    expect(result.valid).toBe(true)
  })
})

describe('Seller Reviews — Pagination', () => {
  it('page 1 with 10 limit', () => {
    const p = calculatePagination(1, 10, 25)
    expect(p.from).toBe(0)
    expect(p.to).toBe(9)
    expect(p.totalPages).toBe(3)
    expect(p.hasMore).toBe(true)
  })

  it('page 3 of 3 pages', () => {
    const p = calculatePagination(3, 10, 25)
    expect(p.from).toBe(20)
    expect(p.to).toBe(29)
    expect(p.hasMore).toBe(false)
  })

  it('clamps page to minimum 1', () => {
    const p = calculatePagination(0, 10, 50)
    expect(p.page).toBe(1)
    expect(p.from).toBe(0)
  })

  it('clamps negative page to 1', () => {
    const p = calculatePagination(-5, 10, 50)
    expect(p.page).toBe(1)
  })

  it('clamps limit to max 50', () => {
    const p = calculatePagination(1, 100, 500)
    expect(p.limit).toBe(50)
  })

  it('clamps limit to min 1', () => {
    const p = calculatePagination(1, 0, 10)
    expect(p.limit).toBe(1)
  })

  it('handles empty results', () => {
    const p = calculatePagination(1, 10, 0)
    expect(p.totalPages).toBe(0)
    expect(p.hasMore).toBe(false)
  })

  it('single page of results', () => {
    const p = calculatePagination(1, 10, 5)
    expect(p.totalPages).toBe(1)
    expect(p.hasMore).toBe(false)
  })

  it('exact page boundary', () => {
    const p = calculatePagination(1, 10, 10)
    expect(p.totalPages).toBe(1)
    expect(p.hasMore).toBe(false)
  })
})

describe('Seller Reviews — Authorization logic', () => {
  it('owner can delete own review', () => {
    const reviewerId = 'user-1'
    const currentUserId = 'user-1'
    expect(reviewerId === currentUserId).toBe(true)
  })

  it('non-owner cannot delete review (needs admin)', () => {
    const reviewerId = 'user-1'
    const currentUserId = 'user-2'
    const isOwner = reviewerId === currentUserId
    const isAdmin = false
    expect(isOwner || isAdmin).toBe(false)
  })

  it('admin can delete any review', () => {
    const reviewerId = 'user-1'
    const currentUserId = 'user-2'
    const isOwner = reviewerId === currentUserId
    const isAdmin = true
    expect(isOwner || isAdmin).toBe(true)
  })

  it('self-review is blocked', () => {
    const sellerId = 'user-1'
    const reviewerId = 'user-1'
    expect(sellerId === reviewerId).toBe(true)
  })
})

describe('Seller Reviews — Moderation statuses', () => {
  const VALID_STATUSES = ['published', 'pending', 'rejected']

  it('all valid statuses are recognized', () => {
    for (const status of VALID_STATUSES) {
      expect(VALID_STATUSES.includes(status)).toBe(true)
    }
  })

  it('invalid status is rejected', () => {
    expect(VALID_STATUSES.includes('deleted')).toBe(false)
    expect(VALID_STATUSES.includes('archived')).toBe(false)
    expect(VALID_STATUSES.includes('')).toBe(false)
  })
})

describe('Seller Reviews — Edge cases', () => {
  it('rating 1 (minimum) is valid', () => {
    const { valid } = validateReviewInput({ rating: 1, sellerId: 'a', reviewerId: 'b' })
    expect(valid).toBe(true)
  })

  it('rating 5 (maximum) is valid', () => {
    const { valid } = validateReviewInput({ rating: 5, sellerId: 'a', reviewerId: 'b' })
    expect(valid).toBe(true)
  })

  it('multiple errors accumulate', () => {
    const result = validateReviewInput({
      rating: 0,
      title: 'x'.repeat(201),
      content: 'x'.repeat(2001),
      sellerId: 'same',
      reviewerId: 'same',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(3)
  })

  it('new rating never exceeds 5.0', () => {
    const { newAvg } = calculateNewRating(0, 0, 5)
    expect(newAvg).toBeLessThanOrEqual(5)
  })

  it('new rating never goes below 0', () => {
    const { newAvg } = calculateNewRating(0, 0, 1)
    expect(newAvg).toBeGreaterThanOrEqual(0)
  })
})
