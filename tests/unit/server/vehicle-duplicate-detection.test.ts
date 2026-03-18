/**
 * Tests for vehicle duplicate detection utility.
 */
import { describe, it, expect, vi } from 'vitest'
import {
  normalizeText,
  titleFingerprint,
  hashImageUrl,
  calculateSimilarity,
  findDuplicates,
} from '../../../server/utils/vehicleDuplicateDetection'

// ─── normalizeText ───────────────────────────────────────────────────────────

describe('normalizeText', () => {
  it('lowercases text', () => {
    expect(normalizeText('VOLVO')).toBe('volvo')
  })

  it('removes accents', () => {
    expect(normalizeText('camión')).toBe('camion')
  })

  it('removes special characters', () => {
    expect(normalizeText('Volvo-FH16')).toBe('volvofh16')
  })

  it('collapses whitespace', () => {
    expect(normalizeText('  Volvo   FH  ')).toBe('volvo fh')
  })

  it('handles empty string', () => {
    expect(normalizeText('')).toBe('')
  })
})

// ─── titleFingerprint ────────────────────────────────────────────────────────

describe('titleFingerprint', () => {
  it('creates fingerprint from brand and model', () => {
    expect(titleFingerprint('Volvo', 'FH16')).toBe('volvo|fh16')
  })

  it('includes year when provided', () => {
    expect(titleFingerprint('Volvo', 'FH16', 2020)).toBe('volvo|fh16|2020')
  })

  it('excludes year when null', () => {
    expect(titleFingerprint('Volvo', 'FH16', null)).toBe('volvo|fh16')
  })

  it('normalizes accents and case', () => {
    expect(titleFingerprint('SCÁNIA', 'R-450')).toBe('scania|r450')
  })
})

// ─── hashImageUrl ────────────────────────────────────────────────────────────

describe('hashImageUrl', () => {
  it('returns 16-char hex hash', () => {
    const hash = hashImageUrl('https://cdn.example.com/truck.jpg')
    expect(hash).toHaveLength(16)
    expect(hash).toMatch(/^[a-f0-9]+$/)
  })

  it('same URL produces same hash', () => {
    const url = 'https://cdn.example.com/image.webp'
    expect(hashImageUrl(url)).toBe(hashImageUrl(url))
  })

  it('different URLs produce different hashes', () => {
    expect(hashImageUrl('https://a.com/1.jpg')).not.toBe(hashImageUrl('https://a.com/2.jpg'))
  })

  it('trims whitespace', () => {
    expect(hashImageUrl('  https://a.com/1.jpg  ')).toBe(hashImageUrl('https://a.com/1.jpg'))
  })
})

// ─── calculateSimilarity ─────────────────────────────────────────────────────

describe('calculateSimilarity', () => {
  const baseInput = { brand: 'Volvo', model: 'FH16', year: 2020, price: 50000, coverUrl: 'https://cdn.example.com/truck.jpg' }

  it('returns 100 for identical vehicle', () => {
    const candidate = { brand: 'Volvo', model: 'FH16', year: 2020, price: 50000, cover_url: 'https://cdn.example.com/truck.jpg' }
    const { score, reasons } = calculateSimilarity(baseInput, candidate)
    expect(score).toBe(100)
    expect(reasons).toContain('same_brand_model')
    expect(reasons).toContain('same_year')
    expect(reasons).toContain('similar_price')
    expect(reasons).toContain('same_image')
  })

  it('returns 50 for same brand+model only', () => {
    const candidate = { brand: 'Volvo', model: 'FH16', year: 2018, price: 30000, cover_url: 'https://other.com/img.jpg' }
    const { score, reasons } = calculateSimilarity(baseInput, candidate)
    expect(score).toBe(50)
    expect(reasons).toEqual(['same_brand_model'])
  })

  it('returns 70 for same brand+model+year', () => {
    const candidate = { brand: 'Volvo', model: 'FH16', year: 2020, price: 30000, cover_url: 'https://other.com/img.jpg' }
    const { score } = calculateSimilarity(baseInput, candidate)
    expect(score).toBe(70)
  })

  it('returns 0 for completely different vehicle', () => {
    const candidate = { brand: 'Scania', model: 'R450', year: 2018, price: 30000, cover_url: 'https://other.com/img.jpg' }
    const { score } = calculateSimilarity(baseInput, candidate)
    expect(score).toBe(0)
  })

  it('detects similar price within 10%', () => {
    const candidate = { brand: 'Volvo', model: 'FH16', year: 2019, price: 48000, cover_url: null }
    const { reasons } = calculateSimilarity(baseInput, candidate)
    expect(reasons).toContain('similar_price')
  })

  it('does not match price beyond 10%', () => {
    const candidate = { brand: 'Volvo', model: 'FH16', year: 2019, price: 40000, cover_url: null }
    const { reasons } = calculateSimilarity(baseInput, candidate)
    expect(reasons).not.toContain('similar_price')
  })

  it('handles null fields gracefully', () => {
    const input = { brand: 'Volvo', model: 'FH16' }
    const candidate = { brand: 'Volvo', model: 'FH16', year: null, price: null, cover_url: null }
    const { score } = calculateSimilarity(input, candidate)
    expect(score).toBe(50) // Only brand+model match
  })
})

// ─── findDuplicates ──────────────────────────────────────────────────────────

describe('findDuplicates', () => {
  function makeSupabaseMock(data: unknown[] = []) {
    const chain: Record<string, (..._args: unknown[]) => unknown> = {}
    for (const m of ['select', 'eq', 'neq', 'ilike', 'limit', 'not', 'gte', 'lte']) {
      chain[m] = () => chain
    }
    Object.assign(chain, { then: (resolve: (v: unknown) => unknown) => resolve({ data, error: null }) })
    return { from: () => chain } as unknown as import('@supabase/supabase-js').SupabaseClient
  }

  it('returns empty array when no matches', async () => {
    const supabase = makeSupabaseMock([])
    const result = await findDuplicates(supabase, { brand: 'Volvo', model: 'FH16' })
    expect(result).toEqual([])
  })

  it('returns candidates above threshold', async () => {
    const supabase = makeSupabaseMock([
      { id: '1', slug: 'volvo-fh16', brand: 'volvo', model: 'fh16', year: 2020, price: 50000, cover_url: null, dealer_id: 'd1' },
      { id: '2', slug: 'volvo-fh', brand: 'volvo', model: 'fh', year: 2020, price: 50000, cover_url: null, dealer_id: 'd2' },
    ])
    const result = await findDuplicates(supabase, { brand: 'Volvo', model: 'FH16', year: 2020, price: 50000 })
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].similarity).toBeGreaterThanOrEqual(50)
  })

  it('sorts by similarity descending', async () => {
    const supabase = makeSupabaseMock([
      { id: '1', slug: 'v1', brand: 'volvo', model: 'fh16', year: 2018, price: 30000, cover_url: null, dealer_id: null },
      { id: '2', slug: 'v2', brand: 'volvo', model: 'fh16', year: 2020, price: 50000, cover_url: null, dealer_id: null },
    ])
    const result = await findDuplicates(supabase, { brand: 'Volvo', model: 'FH16', year: 2020, price: 50000 })
    if (result.length > 1) {
      expect(result[0].similarity).toBeGreaterThanOrEqual(result[1].similarity)
    }
  })

  it('respects limit parameter', async () => {
    const many = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      slug: `v${i}`,
      brand: 'volvo',
      model: 'fh16',
      year: 2020,
      price: 50000,
      cover_url: null,
      dealer_id: null,
    }))
    const supabase = makeSupabaseMock(many)
    const result = await findDuplicates(supabase, { brand: 'Volvo', model: 'FH16', year: 2020, price: 50000 }, 50, 3)
    expect(result.length).toBeLessThanOrEqual(3)
  })

  it('handles supabase error gracefully', async () => {
    const chain: Record<string, (..._args: unknown[]) => unknown> = {}
    for (const m of ['select', 'eq', 'neq', 'ilike', 'limit', 'not', 'gte', 'lte']) {
      chain[m] = () => chain
    }
    Object.assign(chain, { then: (resolve: (v: unknown) => unknown) => resolve({ data: null, error: { message: 'fail' } }) })
    const supabase = { from: () => chain } as unknown as import('@supabase/supabase-js').SupabaseClient

    const result = await findDuplicates(supabase, { brand: 'Volvo', model: 'FH16' })
    expect(result).toEqual([])
  })
})
