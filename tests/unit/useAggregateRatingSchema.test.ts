import { describe, it, expect } from 'vitest'
import { buildAggregateRatingSchema } from '../../app/utils/aggregateRatingSchema'

const base = {
  name: 'Transportes López',
  url: 'https://tracciona.com/transportes-lopez',
  ratingValue: 4.5,
  reviewCount: 12,
}

describe('buildAggregateRatingSchema', () => {
  it('returns null when reviewCount is 0', () => {
    expect(buildAggregateRatingSchema({ ...base, reviewCount: 0 })).toBeNull()
  })

  it('returns null when ratingValue is 0', () => {
    expect(buildAggregateRatingSchema({ ...base, ratingValue: 0 })).toBeNull()
  })

  it('returns null when ratingValue is negative', () => {
    expect(buildAggregateRatingSchema({ ...base, ratingValue: -1 })).toBeNull()
  })

  it('returns correct @context and @type', () => {
    const result = buildAggregateRatingSchema(base)
    expect(result?.['@context']).toBe('https://schema.org')
    expect(result?.['@type']).toBe('Organization')
  })

  it('includes name and url', () => {
    const result = buildAggregateRatingSchema(base)
    expect(result?.name).toBe('Transportes López')
    expect(result?.url).toBe('https://tracciona.com/transportes-lopez')
  })

  it('includes aggregateRating block', () => {
    const result = buildAggregateRatingSchema(base)
    const ar = result?.aggregateRating as Record<string, string>
    expect(ar['@type']).toBe('AggregateRating')
    expect(ar.ratingValue).toBe('4.5')
    expect(ar.reviewCount).toBe('12')
    expect(ar.bestRating).toBe('5')
    expect(ar.worstRating).toBe('1')
  })

  it('rounds ratingValue to 1 decimal', () => {
    const result = buildAggregateRatingSchema({ ...base, ratingValue: 4.456 })
    const ar = result?.aggregateRating as Record<string, string>
    expect(ar.ratingValue).toBe('4.5')
  })

  it('stores reviewCount as string', () => {
    const result = buildAggregateRatingSchema({ ...base, reviewCount: 7 })
    const ar = result?.aggregateRating as Record<string, string>
    expect(typeof ar.reviewCount).toBe('string')
    expect(ar.reviewCount).toBe('7')
  })

  it('works with reviewCount of 1', () => {
    const result = buildAggregateRatingSchema({ ...base, reviewCount: 1 })
    expect(result).not.toBeNull()
  })
})
