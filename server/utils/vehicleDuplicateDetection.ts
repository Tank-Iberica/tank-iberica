/**
 * Vehicle Duplicate Detection
 *
 * Detects potential duplicate vehicle listings using:
 * 1. Title fingerprint: normalized brand + model + year
 * 2. Image hash: SHA-256 of first image URL (same URL = same image)
 * 3. Composite similarity: combined score from title + image + price proximity
 *
 * Used during vehicle publish flow to warn sellers and flag for admin review.
 */
import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface DuplicateCandidate {
  id: string
  slug: string
  brand: string
  model: string
  year: number | null
  price: number | null
  cover_url: string | null
  dealer_id: string | null
  similarity: number
  matchReasons: string[]
}

export interface DuplicateCheckInput {
  brand: string
  model: string
  year?: number | null
  price?: number | null
  coverUrl?: string | null
  excludeId?: string
}

/**
 * Normalize text for comparison: lowercase, trim, remove extra whitespace and accents.
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Generate a title fingerprint from brand + model + year.
 */
export function titleFingerprint(brand: string, model: string, year?: number | null): string {
  const parts = [normalizeText(brand), normalizeText(model)]
  if (year) parts.push(String(year))
  return parts.join('|')
}

/**
 * Hash a URL to detect same-image reuse.
 */
export function hashImageUrl(url: string): string {
  return createHash('sha256').update(url.trim()).digest('hex').slice(0, 16)
}

/**
 * Calculate similarity score (0-100) between two vehicles.
 */
export function calculateSimilarity(
  input: DuplicateCheckInput,
  candidate: {
    brand: string
    model: string
    year: number | null
    price: number | null
    cover_url: string | null
  },
): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  // Title match (brand + model): 50 points
  const inputFp = titleFingerprint(input.brand, input.model)
  const candidateFp = titleFingerprint(candidate.brand, candidate.model)
  if (inputFp === candidateFp) {
    score += 50
    reasons.push('same_brand_model')
  }

  // Year match: 20 points
  if (input.year && candidate.year && input.year === candidate.year) {
    score += 20
    reasons.push('same_year')
  }

  // Price proximity (within 10%): 15 points
  if (input.price && candidate.price && input.price > 0 && candidate.price > 0) {
    const ratio = Math.abs(input.price - candidate.price) / Math.max(input.price, candidate.price)
    if (ratio <= 0.1) {
      score += 15
      reasons.push('similar_price')
    }
  }

  // Image URL match: 15 points
  if (input.coverUrl && candidate.cover_url) {
    if (hashImageUrl(input.coverUrl) === hashImageUrl(candidate.cover_url)) {
      score += 15
      reasons.push('same_image')
    }
  }

  return { score, reasons }
}

/**
 * Check for potential duplicate vehicles in the database.
 * Returns candidates with similarity >= threshold (default 50).
 */
export async function findDuplicates(
  supabase: SupabaseClient,
  input: DuplicateCheckInput,
  threshold = 50,
  limit = 5,
): Promise<DuplicateCandidate[]> {
  // Query vehicles with same brand (most efficient filter)
  let query = supabase
    .from('vehicles')
    .select('id, slug, brand, model, year, price, cover_url, dealer_id')
    .ilike('brand', normalizeText(input.brand))
    .eq('status', 'published')
    .limit(100)

  if (input.excludeId) {
    query = query.neq('id', input.excludeId)
  }

  const { data, error } = await query
  if (error || !data) return []

  const candidates: DuplicateCandidate[] = []

  for (const row of data as Array<{
    id: string
    slug: string
    brand: string
    model: string
    year: number | null
    price: number | null
    cover_url: string | null
    dealer_id: string | null
  }>) {
    const { score, reasons } = calculateSimilarity(input, row)
    if (score >= threshold) {
      candidates.push({
        id: row.id,
        slug: row.slug,
        brand: row.brand,
        model: row.model,
        year: row.year,
        price: row.price,
        cover_url: row.cover_url,
        dealer_id: row.dealer_id,
        similarity: score,
        matchReasons: reasons,
      })
    }
  }

  // Sort by similarity descending, take top N
  return candidates.sort((a, b) => b.similarity - a.similarity).slice(0, limit)
}
