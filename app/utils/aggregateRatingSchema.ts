/**
 * Build a Schema.org AggregateRating JSON-LD block.
 * Used to inject star ratings into SERPs for dealer pages.
 *
 * Spec: https://schema.org/AggregateRating
 * Google requirement: ratingValue + reviewCount (min 3 reviews to be eligible)
 */

export interface AggregateRatingInput {
  /** Dealer/business name */
  name: string
  /** Canonical URL of the page */
  url: string
  /** Average rating (e.g. 4.5) */
  ratingValue: number
  /** Number of approved reviews */
  reviewCount: number
}

export function buildAggregateRatingSchema(
  input: AggregateRatingInput,
): Record<string, unknown> | null {
  if (input.reviewCount < 1 || input.ratingValue <= 0) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: input.name,
    url: input.url,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: String(Math.round(input.ratingValue * 10) / 10),
      reviewCount: String(input.reviewCount),
      bestRating: '5',
      worstRating: '1',
    },
  }
}
