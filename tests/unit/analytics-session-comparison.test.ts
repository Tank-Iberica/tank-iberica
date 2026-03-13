/**
 * Tests for #40 — vehicle comparison tracking logic.
 *
 * The logic lives in vehiculo/[slug].vue (onMounted) but can be verified
 * by testing the pure detection algorithm independently.
 */

import { describe, it, expect, beforeEach } from 'vitest'

// ─── Pure logic extracted for testing ─────────────────────────────────────────

type SessionView = { id: string; category: string | null }

/**
 * Determines which vehicle IDs in the session are "similar" to the current one.
 * Similar = same non-null category, different ID.
 */
function findSimilarInSession(
  sessionViews: SessionView[],
  currentId: string,
  currentCategory: string | null,
): string[] {
  if (!currentCategory) return []
  return sessionViews
    .filter((v) => v.category === currentCategory && v.id !== currentId)
    .map((v) => v.id)
}

/**
 * Add a view to the session list (deduplicated by id).
 */
function addToSession(
  sessionViews: SessionView[],
  id: string,
  category: string | null,
): SessionView[] {
  if (sessionViews.some((v) => v.id === id)) return sessionViews
  return [...sessionViews, { id, category }]
}

// ─── findSimilarInSession ─────────────────────────────────────────────────────

describe('findSimilarInSession', () => {
  it('returns empty when session is empty', () => {
    expect(findSimilarInSession([], 'v-1', 'camion')).toEqual([])
  })

  it('returns empty when category is null', () => {
    const session: SessionView[] = [{ id: 'v-2', category: 'camion' }]
    expect(findSimilarInSession(session, 'v-1', null)).toEqual([])
  })

  it('returns matching ids when same category exists', () => {
    const session: SessionView[] = [
      { id: 'v-2', category: 'camion' },
      { id: 'v-3', category: 'camion' },
    ]
    expect(findSimilarInSession(session, 'v-1', 'camion')).toEqual(['v-2', 'v-3'])
  })

  it('excludes vehicles with a different category', () => {
    const session: SessionView[] = [
      { id: 'v-2', category: 'camion' },
      { id: 'v-3', category: 'remolque' },
    ]
    expect(findSimilarInSession(session, 'v-1', 'camion')).toEqual(['v-2'])
  })

  it('excludes current vehicle id from results', () => {
    const session: SessionView[] = [
      { id: 'v-1', category: 'camion' }, // same id as current
      { id: 'v-2', category: 'camion' },
    ]
    expect(findSimilarInSession(session, 'v-1', 'camion')).toEqual(['v-2'])
  })

  it('returns empty when only different categories exist', () => {
    const session: SessionView[] = [{ id: 'v-2', category: 'remolque' }]
    expect(findSimilarInSession(session, 'v-1', 'camion')).toEqual([])
  })

  it('handles session views with null categories', () => {
    const session: SessionView[] = [
      { id: 'v-2', category: null },
      { id: 'v-3', category: 'camion' },
    ]
    expect(findSimilarInSession(session, 'v-1', 'camion')).toEqual(['v-3'])
  })
})

// ─── addToSession ─────────────────────────────────────────────────────────────

describe('addToSession', () => {
  it('adds a new view to an empty session', () => {
    const result = addToSession([], 'v-1', 'camion')
    expect(result).toEqual([{ id: 'v-1', category: 'camion' }])
  })

  it('does not duplicate an existing id', () => {
    const existing: SessionView[] = [{ id: 'v-1', category: 'camion' }]
    const result = addToSession(existing, 'v-1', 'camion')
    expect(result).toHaveLength(1)
  })

  it('appends when id is different', () => {
    const existing: SessionView[] = [{ id: 'v-1', category: 'camion' }]
    const result = addToSession(existing, 'v-2', 'camion')
    expect(result).toHaveLength(2)
    expect(result[1]).toEqual({ id: 'v-2', category: 'camion' })
  })

  it('preserves null category', () => {
    const result = addToSession([], 'v-1', null)
    expect(result[0].category).toBeNull()
  })
})

// ─── Combined flow ────────────────────────────────────────────────────────────

describe('session comparison flow', () => {
  let session: SessionView[] = []

  beforeEach(() => {
    session = []
  })

  it('first visit — no comparison fired (no prior views)', () => {
    const similar = findSimilarInSession(session, 'v-1', 'camion')
    expect(similar).toHaveLength(0)
    session = addToSession(session, 'v-1', 'camion')
  })

  it('second visit same category — comparison fires with both ids', () => {
    // First visit
    session = addToSession(session, 'v-1', 'camion')

    // Second visit
    const similar = findSimilarInSession(session, 'v-2', 'camion')
    expect(similar).toEqual(['v-1'])
    // trackVehicleComparison would be called with [...similar, 'v-2'] = ['v-1', 'v-2']
    const comparisonIds = [...similar, 'v-2']
    expect(comparisonIds).toEqual(['v-1', 'v-2'])
    session = addToSession(session, 'v-2', 'camion')
  })

  it('third visit same category — comparison fires with all three', () => {
    session = addToSession(session, 'v-1', 'camion')
    session = addToSession(session, 'v-2', 'camion')

    const similar = findSimilarInSession(session, 'v-3', 'camion')
    expect(similar).toEqual(['v-1', 'v-2'])
  })

  it('different category visit — no comparison fired', () => {
    session = addToSession(session, 'v-1', 'camion')

    const similar = findSimilarInSession(session, 'v-2', 'remolque')
    expect(similar).toHaveLength(0)
  })

  it('revisiting same vehicle — deduplicated, no spurious comparison', () => {
    session = addToSession(session, 'v-1', 'camion')
    // Re-visit v-1: similar would be empty since it's excluded by id
    const similar = findSimilarInSession(session, 'v-1', 'camion')
    expect(similar).toHaveLength(0)
    // Session stays size 1 (dedup)
    session = addToSession(session, 'v-1', 'camion')
    expect(session).toHaveLength(1)
  })
})
