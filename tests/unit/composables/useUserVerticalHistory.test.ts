import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, readonly, computed } from 'vue'

// ── Globals ──────────────────────────────────────────────────────────────────

vi.stubGlobal('ref', ref)
vi.stubGlobal('readonly', readonly)
vi.stubGlobal('computed', computed)

const mockUserId = ref<string | null>('user-abc')

vi.stubGlobal(
  'useSupabaseUser',
  vi.fn(() => computed(() => (mockUserId.value ? { id: mockUserId.value } : null))),
)

// ── Supabase mock ────────────────────────────────────────────────────────────

let mockQueryResult: { data: unknown[] | null; error: unknown }

function createMockClient() {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn(),
  }
  chain.order.mockImplementation(() => {
    return Promise.resolve(mockQueryResult)
  })
  // Also make eq thenable for queries that don't call order
  Object.defineProperty(chain.eq, 'then', {
    value: (resolve: (v: unknown) => void) =>
      Promise.resolve().then(() => resolve(mockQueryResult)),
    configurable: true,
  })

  return {
    from: vi.fn(() => chain),
    _chain: chain,
  }
}

let mockClient: ReturnType<typeof createMockClient>

vi.stubGlobal(
  'useSupabaseClient',
  vi.fn(() => {
    mockClient = createMockClient()
    return mockClient
  }),
)

import { useUserVerticalHistory } from '~/composables/useUserVerticalHistory'

// ── Tests ────────────────────────────────────────────────────────────────────

describe('useUserVerticalHistory (#46)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserId.value = 'user-abc'
    mockQueryResult = { data: [], error: null }
  })

  // ── fetchHistory ─────────────────────────────────────────────────────────

  describe('fetchHistory', () => {
    it('returns null if no user is logged in', async () => {
      mockUserId.value = null
      const { fetchHistory } = useUserVerticalHistory()
      const result = await fetchHistory()
      expect(result).toBeNull()
    })

    it('returns empty history when no events exist', async () => {
      mockQueryResult = { data: [], error: null }
      const { fetchHistory } = useUserVerticalHistory()
      const result = await fetchHistory()

      expect(result).not.toBeNull()
      expect(result!.verticals).toEqual([])
      expect(result!.isMultiVertical).toBe(false)
      expect(result!.primaryVertical).toBeNull()
      expect(result!.totalEvents).toBe(0)
    })

    it('aggregates events by vertical', async () => {
      mockQueryResult = {
        data: [
          { vertical: 'tracciona', created_at: '2026-01-01T10:00:00Z' },
          { vertical: 'tracciona', created_at: '2026-01-02T10:00:00Z' },
          { vertical: 'tracciona', created_at: '2026-01-03T10:00:00Z' },
          { vertical: 'motomarket', created_at: '2026-02-01T10:00:00Z' },
        ],
        error: null,
      }

      const { fetchHistory } = useUserVerticalHistory()
      const result = await fetchHistory()

      expect(result!.verticals).toHaveLength(2)
      expect(result!.totalEvents).toBe(4)

      const tracciona = result!.verticals.find((v) => v.vertical === 'tracciona')
      expect(tracciona!.event_count).toBe(3)
      expect(tracciona!.first_seen).toBe('2026-01-01T10:00:00Z')
      expect(tracciona!.last_seen).toBe('2026-01-03T10:00:00Z')

      const motomarket = result!.verticals.find((v) => v.vertical === 'motomarket')
      expect(motomarket!.event_count).toBe(1)
    })

    it('detects multi-vertical users', async () => {
      mockQueryResult = {
        data: [
          { vertical: 'tracciona', created_at: '2026-01-01T10:00:00Z' },
          { vertical: 'motomarket', created_at: '2026-02-01T10:00:00Z' },
        ],
        error: null,
      }

      const { fetchHistory } = useUserVerticalHistory()
      const result = await fetchHistory()

      expect(result!.isMultiVertical).toBe(true)
    })

    it('detects single-vertical users', async () => {
      mockQueryResult = {
        data: [
          { vertical: 'tracciona', created_at: '2026-01-01T10:00:00Z' },
          { vertical: 'tracciona', created_at: '2026-01-02T10:00:00Z' },
        ],
        error: null,
      }

      const { fetchHistory } = useUserVerticalHistory()
      const result = await fetchHistory()

      expect(result!.isMultiVertical).toBe(false)
    })

    it('identifies primary vertical as the one with most events', async () => {
      mockQueryResult = {
        data: [
          { vertical: 'motomarket', created_at: '2026-01-01T10:00:00Z' },
          { vertical: 'tracciona', created_at: '2026-01-02T10:00:00Z' },
          { vertical: 'tracciona', created_at: '2026-01-03T10:00:00Z' },
          { vertical: 'tracciona', created_at: '2026-01-04T10:00:00Z' },
        ],
        error: null,
      }

      const { fetchHistory } = useUserVerticalHistory()
      const result = await fetchHistory()

      expect(result!.primaryVertical).toBe('tracciona')
    })

    it('sorts verticals by event_count descending', async () => {
      mockQueryResult = {
        data: [
          { vertical: 'alpha', created_at: '2026-01-01T10:00:00Z' },
          { vertical: 'beta', created_at: '2026-01-01T10:00:00Z' },
          { vertical: 'beta', created_at: '2026-01-02T10:00:00Z' },
          { vertical: 'beta', created_at: '2026-01-03T10:00:00Z' },
          { vertical: 'gamma', created_at: '2026-01-01T10:00:00Z' },
          { vertical: 'gamma', created_at: '2026-01-02T10:00:00Z' },
        ],
        error: null,
      }

      const { fetchHistory } = useUserVerticalHistory()
      const result = await fetchHistory()

      expect(result!.verticals[0].vertical).toBe('beta')
      expect(result!.verticals[0].event_count).toBe(3)
      expect(result!.verticals[1].vertical).toBe('gamma')
      expect(result!.verticals[1].event_count).toBe(2)
      expect(result!.verticals[2].vertical).toBe('alpha')
      expect(result!.verticals[2].event_count).toBe(1)
    })

    it('queries analytics_events with explicit columns', async () => {
      mockQueryResult = { data: [], error: null }
      const { fetchHistory } = useUserVerticalHistory()
      await fetchHistory()

      expect(mockClient.from).toHaveBeenCalledWith('analytics_events')
      expect(mockClient._chain.select).toHaveBeenCalledWith('vertical, created_at')
      expect(mockClient._chain.eq).toHaveBeenCalledWith('user_id', 'user-abc')
    })

    it('sets error on query failure', async () => {
      mockQueryResult = { data: null, error: new Error('Query failed') }
      const { fetchHistory, error } = useUserVerticalHistory()
      const result = await fetchHistory()

      expect(result).toBeNull()
      expect(error.value).toBe('Query failed')
    })

    it('manages loading state correctly', async () => {
      mockQueryResult = { data: [], error: null }
      const { fetchHistory, loading } = useUserVerticalHistory()

      expect(loading.value).toBe(false)
      const promise = fetchHistory()
      expect(loading.value).toBe(true)
      await promise
      expect(loading.value).toBe(false)
    })

    it('stores result in reactive history ref', async () => {
      mockQueryResult = {
        data: [{ vertical: 'tracciona', created_at: '2026-01-01T10:00:00Z' }],
        error: null,
      }

      const { fetchHistory, history } = useUserVerticalHistory()
      expect(history.value).toBeNull()

      await fetchHistory()
      expect(history.value).not.toBeNull()
      expect(history.value!.totalEvents).toBe(1)
    })
  })

  // ── hasVerticalActivity ──────────────────────────────────────────────────

  describe('hasVerticalActivity', () => {
    it('returns false if history not loaded', () => {
      const { hasVerticalActivity } = useUserVerticalHistory()
      expect(hasVerticalActivity('tracciona')).toBe(false)
    })

    it('returns true for a vertical with activity', async () => {
      mockQueryResult = {
        data: [{ vertical: 'tracciona', created_at: '2026-01-01T10:00:00Z' }],
        error: null,
      }

      const { fetchHistory, hasVerticalActivity } = useUserVerticalHistory()
      await fetchHistory()

      expect(hasVerticalActivity('tracciona')).toBe(true)
    })

    it('returns false for a vertical without activity', async () => {
      mockQueryResult = {
        data: [{ vertical: 'tracciona', created_at: '2026-01-01T10:00:00Z' }],
        error: null,
      }

      const { fetchHistory, hasVerticalActivity } = useUserVerticalHistory()
      await fetchHistory()

      expect(hasVerticalActivity('motomarket')).toBe(false)
    })
  })

  // ── fetchLeadsWithVertical ───────────────────────────────────────────────

  describe('fetchLeadsWithVertical', () => {
    it('returns null if no user is logged in', async () => {
      mockUserId.value = null
      const { fetchLeadsWithVertical } = useUserVerticalHistory()
      const result = await fetchLeadsWithVertical()
      expect(result).toBeNull()
    })

    it('queries leads with source_vertical column', async () => {
      mockQueryResult = {
        data: [{ id: 'lead-1', source_vertical: 'tracciona', created_at: '2026-01-01T10:00:00Z' }],
        error: null,
      }

      const { fetchLeadsWithVertical } = useUserVerticalHistory()
      const result = await fetchLeadsWithVertical()

      expect(result).not.toBeNull()
      expect(result).toHaveLength(1)
      expect(result![0].source_vertical).toBe('tracciona')
    })

    it('handles leads with null source_vertical', async () => {
      mockQueryResult = {
        data: [{ id: 'lead-1', source_vertical: null, created_at: '2026-01-01T10:00:00Z' }],
        error: null,
      }

      const { fetchLeadsWithVertical } = useUserVerticalHistory()
      const result = await fetchLeadsWithVertical()

      expect(result).not.toBeNull()
      expect(result![0].source_vertical).toBeNull()
    })
  })
})
