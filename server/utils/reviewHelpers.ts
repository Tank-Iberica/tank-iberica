/**
 * Pure helper functions for seller review dimensions and NPS.
 * Used by server routes and tested directly.
 *
 * #52 — Review Dimensions (JSONB with 4 keys, each 1-5)
 * #53 — NPS Score (0-10 Net Promoter Score)
 */

export const REVIEW_DIMENSIONS = ['communication', 'accuracy', 'condition', 'logistics'] as const
export type ReviewDimensionKey = (typeof REVIEW_DIMENSIONS)[number]

export interface ReviewDimensions {
  communication: number
  accuracy: number
  condition: number
  logistics: number
}

/**
 * Validate that all required dimension keys are present and values are integers 1-5.
 */
export function validateDimensions(dims: Record<string, number>): boolean {
  return REVIEW_DIMENSIONS.every((k) => {
    const v = dims[k]
    return v !== undefined && Number.isInteger(v) && v >= 1 && v <= 5
  })
}

/**
 * Classify an NPS score (0-10) into promoter, passive, or detractor.
 */
export function classifyNPS(score: number): 'promoter' | 'passive' | 'detractor' {
  if (score >= 9) return 'promoter'
  if (score >= 7) return 'passive'
  return 'detractor'
}

/**
 * Calculate Net Promoter Score from an array of NPS scores (0-10).
 * Returns percentage (-100 to 100) or null if no valid scores.
 */
export function calculateNetNPS(scores: number[]): number | null {
  const valid = scores.filter((s) => s >= 0 && s <= 10)
  if (!valid.length) return null
  const promoters = valid.filter((s) => s >= 9).length
  const detractors = valid.filter((s) => s <= 6).length
  return Math.round(((promoters - detractors) / valid.length) * 1000) / 10
}
