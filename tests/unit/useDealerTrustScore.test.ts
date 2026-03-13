/**
 * Tests for app/composables/useDealerTrustScore.ts
 *
 * NOTE: tests/setup.ts stubs ref/computed/watch as static objects (no Vue reactivity).
 * So we test:
 *  - Initial state
 *  - fetchTrustScore() populates score/breakdown/updatedAt correctly
 *  - fetchTrustScore() sets error on failure
 *  - fetchTrustScore() skips fetch when dealerId.value is null
 *  - fetchTrustScore() sets loading correctly
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDealerTrustScore } from '../../app/composables/useDealerTrustScore'

// ── Stub helpers ──────────────────────────────────────────────────────────────

function stubSupabase(
  data: Record<string, unknown> | null,
  error: { message: string } | null = null,
) {
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data, error }),
        }),
      }),
    }),
  }))
}

beforeEach(() => {
  vi.clearAllMocks()
  stubSupabase(null) // default: no data, no error
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useDealerTrustScore — initial state', () => {
  it('score starts at 0', () => {
    const { score } = useDealerTrustScore({ value: 'dealer-1' } as { value: string | null })
    expect(score.value).toBe(0)
  })

  it('loading starts as false', () => {
    const { loading } = useDealerTrustScore({ value: 'dealer-1' } as { value: string | null })
    expect(loading.value).toBe(false)
  })

  it('error starts as null', () => {
    const { error } = useDealerTrustScore({ value: 'dealer-1' } as { value: string | null })
    expect(error.value).toBeNull()
  })

  it('breakdown starts as null', () => {
    const { breakdown } = useDealerTrustScore({ value: 'dealer-1' } as { value: string | null })
    expect(breakdown.value).toBeNull()
  })

  it('updatedAt starts as null', () => {
    const { updatedAt } = useDealerTrustScore({ value: 'dealer-1' } as { value: string | null })
    expect(updatedAt.value).toBeNull()
  })
})

describe('useDealerTrustScore — fetchTrustScore()', () => {
  it('populates score from DB response', async () => {
    stubSupabase({
      trust_score: 75,
      trust_score_breakdown: { has_logo: 5, has_bio: 5 },
      trust_score_updated_at: '2026-03-13T10:00:00Z',
    })

    const { score, fetchTrustScore } = useDealerTrustScore({
      value: 'dealer-abc',
    } as { value: string | null })
    await fetchTrustScore()
    expect(score.value).toBe(75)
  })

  it('populates breakdown from DB response', async () => {
    const bd = { has_logo: 5, has_bio: 5, has_contact: 5, has_legal: 5, account_age: 15, listing_activity: 15, responsiveness: 15, reviews: 20, verified_docs: 10 }
    stubSupabase({ trust_score: 95, trust_score_breakdown: bd, trust_score_updated_at: null })

    const { breakdown, fetchTrustScore } = useDealerTrustScore({
      value: 'dealer-abc',
    } as { value: string | null })
    await fetchTrustScore()
    expect(breakdown.value).toEqual(bd)
  })

  it('populates updatedAt from DB response', async () => {
    stubSupabase({ trust_score: 60, trust_score_breakdown: {}, trust_score_updated_at: '2026-03-13T10:00:00Z' })

    const { updatedAt, fetchTrustScore } = useDealerTrustScore({
      value: 'dealer-abc',
    } as { value: string | null })
    await fetchTrustScore()
    expect(updatedAt.value).toBe('2026-03-13T10:00:00Z')
  })

  it('sets loading to false after fetch completes', async () => {
    stubSupabase({ trust_score: 50, trust_score_breakdown: {}, trust_score_updated_at: null })

    const { loading, fetchTrustScore } = useDealerTrustScore({
      value: 'dealer-abc',
    } as { value: string | null })
    await fetchTrustScore()
    expect(loading.value).toBe(false)
  })

  it('does not call supabase when dealerId.value is null', async () => {
    const fromSpy = vi.fn()
    vi.stubGlobal('useSupabaseClient', () => ({ from: fromSpy }))

    const { fetchTrustScore } = useDealerTrustScore({ value: null } as { value: string | null })
    await fetchTrustScore()
    expect(fromSpy).not.toHaveBeenCalled()
  })

  it('sets error.value when fetch fails', async () => {
    stubSupabase(null, { message: 'Not found' })

    const { error, score, fetchTrustScore } = useDealerTrustScore({
      value: 'dealer-err',
    } as { value: string | null })
    await fetchTrustScore()
    expect(error.value).toBe('Not found')
    expect(score.value).toBe(0)
  })

  it('clears a stale error before a successful fetch', async () => {
    // Create composable with success stub already in place
    stubSupabase({ trust_score: 80, trust_score_breakdown: {}, trust_score_updated_at: null })
    const { error, fetchTrustScore } = useDealerTrustScore({
      value: 'dealer-x',
    } as { value: string | null })

    // Manually inject a stale error (simulates a previous failed fetch)
    ;(error as { value: string | null }).value = 'Stale error'
    expect((error as { value: string | null }).value).toBe('Stale error')

    await fetchTrustScore()
    expect((error as { value: string | null }).value).toBeNull()
  })

  it('score is 0 when DB returns null data without error', async () => {
    stubSupabase(null, null)

    const { score, fetchTrustScore } = useDealerTrustScore({
      value: 'dealer-null',
    } as { value: string | null })
    await fetchTrustScore()
    expect(score.value).toBe(0)
  })
})
