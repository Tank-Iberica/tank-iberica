/**
 * Trust Score calculator for dealers (0-100).
 *
 * 9 criteria, pure TypeScript — no I/O, fully testable.
 *
 * Score thresholds:
 *   < 60  → no badge
 *   60-79 → 'verified' badge (blue checkmark)
 *   >= 80 → 'top' badge (gold star)
 *
 * Criterion breakdown (100 pts total):
 *   has_logo         5  pts  — logo_url present
 *   has_bio          5  pts  — bio JSONB non-empty
 *   has_contact      5  pts  — phone + email present
 *   has_legal        5  pts  — cif_nif present
 *   account_age      15 pts  — ≥30d → +10, ≥90d → +5 more
 *   listing_activity 15 pts  — ≥1 active → +10, ≥5 active → +5 more
 *   responsiveness   15 pts  — rate≥50% → +10, rate≥80% → +5 more
 *   reviews          20 pts  — ≥1 review → +10, rating≥4.0 → +10 more
 *   verified_docs    15 pts  — verified=true
 */

export interface TrustScoreBreakdown {
  has_logo: number
  has_bio: number
  has_contact: number
  has_legal: number
  account_age: number
  listing_activity: number
  responsiveness: number
  reviews: number
  verified_docs: number
}

export interface DealerForTrustScore {
  logo_url?: string | null
  bio?: unknown
  phone?: string | null
  email?: string | null
  cif_nif?: string | null
  created_at?: string | null
  active_listings?: number | null
  response_rate_pct?: number | null
  total_reviews?: number | null
  rating?: number | null
  verified?: boolean | null
}

export interface TrustScoreResult {
  score: number
  breakdown: TrustScoreBreakdown
}

/** Badge tier derived from score */
export type TrustBadgeTier = 'top' | 'verified' | null

export function trustBadge(score: number): TrustBadgeTier {
  if (score >= 80) return 'top'
  if (score >= 60) return 'verified'
  return null
}

function isBioNonEmpty(bio: unknown): boolean {
  if (!bio) return false
  if (typeof bio === 'string') return bio.trim().length > 0
  if (typeof bio === 'object') {
    return Object.values(bio as Record<string, unknown>).some(
      (v) => typeof v === 'string' && v.trim().length > 0,
    )
  }
  return false
}

/**
 * Calculate trust score for a dealer.
 * All inputs are optional/nullable — defaults to 0 for any missing field.
 */
export function calculateTrustScore(
  dealer: DealerForTrustScore,
  nowOverride?: Date,
): TrustScoreResult {
  const bd: TrustScoreBreakdown = {
    has_logo: 0,
    has_bio: 0,
    has_contact: 0,
    has_legal: 0,
    account_age: 0,
    listing_activity: 0,
    responsiveness: 0,
    reviews: 0,
    verified_docs: 0,
  }

  // 1. Logo (5 pts)
  if (dealer.logo_url) bd.has_logo = 5

  // 2. Bio (5 pts)
  if (isBioNonEmpty(dealer.bio)) bd.has_bio = 5

  // 3. Contact: phone + email (5 pts)
  if (dealer.phone && dealer.email) bd.has_contact = 5

  // 4. Legal ID (5 pts)
  if (dealer.cif_nif) bd.has_legal = 5

  // 5. Account age (0-15 pts)
  const ageMs = nowOverride
    ? dealer.created_at
      ? nowOverride.getTime() - new Date(dealer.created_at).getTime()
      : 0
    : dealer.created_at
      ? Date.now() - new Date(dealer.created_at).getTime()
      : 0
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24))
  if (ageDays >= 90) bd.account_age = 15
  else if (ageDays >= 30) bd.account_age = 10

  // 6. Listing activity (0-15 pts)
  const activeListings = dealer.active_listings ?? 0
  if (activeListings >= 5) bd.listing_activity = 15
  else if (activeListings >= 1) bd.listing_activity = 10

  // 7. Responsiveness (0-15 pts)
  const responseRate = dealer.response_rate_pct ?? 0
  if (responseRate >= 80) bd.responsiveness = 15
  else if (responseRate >= 50) bd.responsiveness = 10

  // 8. Reviews (0-20 pts)
  const totalReviews = dealer.total_reviews ?? 0
  const rating = dealer.rating ?? 0
  if (totalReviews >= 1) {
    bd.reviews = 10
    if (rating >= 4.0) bd.reviews = 20
  }

  // 9. Verification documents (15 pts)
  if (dealer.verified === true) bd.verified_docs = 15

  const score =
    bd.has_logo +
    bd.has_bio +
    bd.has_contact +
    bd.has_legal +
    bd.account_age +
    bd.listing_activity +
    bd.responsiveness +
    bd.reviews +
    bd.verified_docs

  return { score, breakdown: bd }
}
