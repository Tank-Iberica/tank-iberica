/**
 * Tests for #52 (Review Dimensions JSONB) and #53 (NPS 0-10)
 * Imports real functions from server/utils/reviewHelpers.ts
 */
import { describe, it, expect } from 'vitest'
import {
  validateDimensions,
  classifyNPS,
  calculateNetNPS,
  REVIEW_DIMENSIONS,
  type ReviewDimensions,
} from '../../server/utils/reviewHelpers'

// ─── #52 — Review Dimensions ────────────────────────────────────────────────

describe('Review Dimensions JSONB (#52)', () => {
  describe('REVIEW_DIMENSIONS constant', () => {
    it('has exactly 4 dimensions', () => {
      expect(REVIEW_DIMENSIONS).toHaveLength(4)
    })

    it('contains expected keys', () => {
      expect(REVIEW_DIMENSIONS).toContain('communication')
      expect(REVIEW_DIMENSIONS).toContain('accuracy')
      expect(REVIEW_DIMENSIONS).toContain('condition')
      expect(REVIEW_DIMENSIONS).toContain('logistics')
    })

    it('all keys are snake_case', () => {
      REVIEW_DIMENSIONS.forEach((k) => expect(k).toMatch(/^[a-z_]+$/))
    })
  })

  describe('validateDimensions', () => {
    it('accepts valid dimensions (all 1-5)', () => {
      const dims: ReviewDimensions = { communication: 4, accuracy: 5, condition: 3, logistics: 4 }
      expect(validateDimensions(dims)).toBe(true)
    })

    it('accepts all dimensions at minimum (1)', () => {
      const dims: ReviewDimensions = { communication: 1, accuracy: 1, condition: 1, logistics: 1 }
      expect(validateDimensions(dims)).toBe(true)
    })

    it('accepts all dimensions at maximum (5)', () => {
      const dims: ReviewDimensions = { communication: 5, accuracy: 5, condition: 5, logistics: 5 }
      expect(validateDimensions(dims)).toBe(true)
    })

    it('rejects dimension value 0', () => {
      expect(validateDimensions({ communication: 0, accuracy: 5, condition: 3, logistics: 4 })).toBe(false)
    })

    it('rejects dimension value 6', () => {
      expect(validateDimensions({ communication: 4, accuracy: 6, condition: 3, logistics: 4 })).toBe(false)
    })

    it('rejects negative dimension value', () => {
      expect(validateDimensions({ communication: -1, accuracy: 5, condition: 3, logistics: 4 })).toBe(false)
    })

    it('rejects non-integer dimension value', () => {
      expect(validateDimensions({ communication: 4.5, accuracy: 5, condition: 3, logistics: 4 })).toBe(false)
    })

    it('rejects missing required dimension', () => {
      expect(validateDimensions({ communication: 4, accuracy: 5, condition: 3 })).toBe(false)
    })

    it('rejects completely empty object', () => {
      expect(validateDimensions({})).toBe(false)
    })

    it('ignores extra keys but validates required ones', () => {
      expect(validateDimensions({
        communication: 4, accuracy: 5, condition: 3, logistics: 4, extra: 10,
      })).toBe(true)
    })
  })

  describe('dimension averages (pure calculation)', () => {
    it('computes per-dimension average', () => {
      const reviews: ReviewDimensions[] = [
        { communication: 4, accuracy: 5, condition: 3, logistics: 4 },
        { communication: 5, accuracy: 3, condition: 4, logistics: 5 },
        { communication: 3, accuracy: 4, condition: 5, logistics: 3 },
      ]
      const avgComm = reviews.reduce((s, r) => s + r.communication, 0) / reviews.length
      expect(Math.round(avgComm * 10) / 10).toBe(4)
    })

    it('handles single review', () => {
      const reviews: ReviewDimensions[] = [{ communication: 5, accuracy: 5, condition: 5, logistics: 5 }]
      const avg = reviews.reduce((s, r) => s + r.communication, 0) / reviews.length
      expect(avg).toBe(5)
    })
  })
})

// ─── #53 — NPS 0-10 ────────────────────────────────────────────────────────

describe('NPS Score (#53)', () => {
  describe('classifyNPS', () => {
    it('scores 9-10 are promoters', () => {
      expect(classifyNPS(9)).toBe('promoter')
      expect(classifyNPS(10)).toBe('promoter')
    })

    it('scores 7-8 are passives', () => {
      expect(classifyNPS(7)).toBe('passive')
      expect(classifyNPS(8)).toBe('passive')
    })

    it('scores 0-6 are detractors', () => {
      for (let i = 0; i <= 6; i++) {
        expect(classifyNPS(i)).toBe('detractor')
      }
    })
  })

  describe('NPS validation boundaries', () => {
    it('score 0 is valid NPS', () => {
      expect(classifyNPS(0)).toBe('detractor')
    })

    it('score 10 is valid NPS', () => {
      expect(classifyNPS(10)).toBe('promoter')
    })
  })

  describe('calculateNetNPS', () => {
    it('returns 100 when all scores are 9+', () => {
      expect(calculateNetNPS([9, 10, 9, 10, 10])).toBe(100)
    })

    it('returns -100 when all scores are 0-6', () => {
      expect(calculateNetNPS([1, 2, 3, 4, 5])).toBe(-100)
    })

    it('returns 0 when promoters equal detractors', () => {
      // 2 promoters, 2 passive, 2 detractors
      expect(calculateNetNPS([10, 10, 8, 8, 5, 5])).toBe(0)
    })

    it('returns null for empty scores', () => {
      expect(calculateNetNPS([])).toBeNull()
    })

    it('computes correct NPS for mixed scores', () => {
      // 3 promoters (9,10,9), 1 passive (8), 1 detractor (5) → (3-1)/5 = 40%
      expect(calculateNetNPS([9, 10, 9, 8, 5])).toBe(40)
    })

    it('handles all passives (7-8) → NPS = 0', () => {
      expect(calculateNetNPS([7, 8, 7, 8])).toBe(0)
    })

    it('handles single promoter → NPS = 100', () => {
      expect(calculateNetNPS([10])).toBe(100)
    })

    it('handles single detractor → NPS = -100', () => {
      expect(calculateNetNPS([3])).toBe(-100)
    })

    it('filters out-of-range scores', () => {
      // -1 and 11 are filtered out, only [9, 5] remain → (1-1)/2 = 0
      expect(calculateNetNPS([-1, 9, 5, 11])).toBe(0)
    })

    it('returns null when all scores are out of range', () => {
      expect(calculateNetNPS([-5, 15, 20])).toBeNull()
    })
  })

  describe('DB constraint mirror', () => {
    it('CHECK constraint: nps_score IS NULL OR (nps_score >= 0 AND nps_score <= 10)', () => {
      const checkConstraint = (score: number | null) => {
        return score === null || (score >= 0 && score <= 10)
      }
      expect(checkConstraint(null)).toBe(true)
      expect(checkConstraint(0)).toBe(true)
      expect(checkConstraint(10)).toBe(true)
      expect(checkConstraint(5)).toBe(true)
      expect(checkConstraint(-1)).toBe(false)
      expect(checkConstraint(11)).toBe(false)
    })
  })
})
