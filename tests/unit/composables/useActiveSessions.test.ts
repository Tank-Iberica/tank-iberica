import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, readonly, computed } from 'vue'

// ── Globals ──────────────────────────────────────────────────────────────────

vi.stubGlobal('ref', ref)
vi.stubGlobal('readonly', readonly)
vi.stubGlobal('computed', computed)

const mockUserId = ref<string | null>('user-xyz')

vi.stubGlobal(
  'useSupabaseUser',
  vi.fn(() => computed(() => (mockUserId.value ? { id: mockUserId.value } : null))),
)

// ── Supabase mock ────────────────────────────────────────────────────────────

let mockQueryResult: { data: unknown[] | null; error: unknown }
let mockDeleteResult: { error: unknown }

function createMockClient() {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn(),
    delete: vi.fn().mockReturnThis(),
    from: vi.fn(),
  }

  chain.order.mockImplementation(() => Promise.resolve(mockQueryResult))

  // For delete chains: delete().eq(id).eq(user_id) → thenable
  const deleteChain = {
    eq: vi.fn(),
  }
  const deleteEqChain = {
    eq: vi.fn(),
  }
  Object.defineProperty(deleteEqChain.eq, 'then', {
    value: (resolve: (v: unknown) => void) =>
      Promise.resolve().then(() => resolve(mockDeleteResult)),
    configurable: true,
  })
  deleteChain.eq.mockReturnValue(deleteEqChain)

  chain.from.mockImplementation(() => {
    return {
      select: chain.select.mockReturnValue({
        eq: chain.eq.mockReturnValue({
          order: chain.order,
        }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation(() => Promise.resolve(mockDeleteResult)),
        }),
      }),
    }
  })

  return { from: chain.from, _chain: chain }
}

let mockClient: ReturnType<typeof createMockClient>

vi.stubGlobal(
  'useSupabaseClient',
  vi.fn(() => {
    mockClient = createMockClient()
    return mockClient
  }),
)

import { useActiveSessions, parseDeviceLabel } from '~/composables/useActiveSessions'

// ── Tests ────────────────────────────────────────────────────────────────────

describe('parseDeviceLabel', () => {
  it('returns "Unknown device" for null', () => {
    expect(parseDeviceLabel(null)).toBe('Unknown device')
  })

  it('detects iPhone', () => {
    expect(parseDeviceLabel('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0')).toBe('iPhone')
  })

  it('detects iPad', () => {
    expect(parseDeviceLabel('Mozilla/5.0 (iPad; CPU OS 15_0 like Mac')).toBe('iPad')
  })

  it('detects Android Phone', () => {
    expect(parseDeviceLabel('Mozilla/5.0 (Linux; Android 12; Mobile)')).toBe('Android Phone')
  })

  it('detects Android Tablet (no Mobile)', () => {
    expect(parseDeviceLabel('Mozilla/5.0 (Linux; Android 12; Tablet)')).toBe('Android Tablet')
  })

  it('detects Chrome on desktop', () => {
    expect(parseDeviceLabel('Mozilla/5.0 (Windows NT 10.0) Chrome/120.0')).toBe('Google Chrome')
  })

  it('detects Edge (priority over Chrome)', () => {
    expect(parseDeviceLabel('Mozilla/5.0 (Windows NT 10.0) Chrome/120.0 Edg/120.0')).toBe(
      'Microsoft Edge',
    )
  })

  it('detects Firefox', () => {
    expect(parseDeviceLabel('Mozilla/5.0 (X11; Linux) Firefox/121.0')).toBe('Mozilla Firefox')
  })

  it('detects Safari (no Chrome marker)', () => {
    expect(parseDeviceLabel('Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari/605')).toBe('Safari')
  })

  it('falls back to Windows PC', () => {
    expect(parseDeviceLabel('Some-bot/1.0 (Windows)')).toBe('Windows PC')
  })

  it('falls back to Mac', () => {
    expect(parseDeviceLabel('Some-bot/1.0 (Macintosh)')).toBe('Mac')
  })

  it('falls back to Unknown device for unrecognized UA', () => {
    expect(parseDeviceLabel('CustomClient/1.0')).toBe('Unknown device')
  })
})

describe('useActiveSessions (F41)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserId.value = 'user-xyz'
    mockQueryResult = { data: [], error: null }
    mockDeleteResult = { error: null }
  })

  describe('fetchSessions', () => {
    it('returns empty array if no user', async () => {
      mockUserId.value = null
      const { fetchSessions } = useActiveSessions()
      const result = await fetchSessions()
      expect(result).toEqual([])
    })

    it('returns sessions with parsed device labels', async () => {
      mockQueryResult = {
        data: [
          {
            id: 'fp-1',
            fp_hash: 'abc123',
            ua_hint: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0',
            ip_hint: '93.184',
            first_seen: '2026-01-01T10:00:00Z',
            last_seen: '2026-03-01T10:00:00Z',
            request_count: 42,
          },
          {
            id: 'fp-2',
            fp_hash: 'def456',
            ua_hint: 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0',
            ip_hint: '10.0',
            first_seen: '2026-02-01T10:00:00Z',
            last_seen: '2026-03-15T10:00:00Z',
            request_count: 100,
          },
        ],
        error: null,
      }

      const { fetchSessions } = useActiveSessions()
      const result = await fetchSessions()

      expect(result).toHaveLength(2)
      expect(result[0].device_label).toBe('iPhone')
      expect(result[0].ip_hint).toBe('93.184')
      expect(result[0].request_count).toBe(42)
      expect(result[1].device_label).toBe('Google Chrome')
    })

    it('handles null ua_hint and ip_hint gracefully', async () => {
      mockQueryResult = {
        data: [
          {
            id: 'fp-1',
            fp_hash: 'abc',
            ua_hint: null,
            ip_hint: null,
            first_seen: '2026-01-01T10:00:00Z',
            last_seen: '2026-01-01T10:00:00Z',
            request_count: 1,
          },
        ],
        error: null,
      }

      const { fetchSessions } = useActiveSessions()
      const result = await fetchSessions()

      expect(result[0].device_label).toBe('Unknown device')
      expect(result[0].ip_hint).toBeNull()
    })

    it('queries user_fingerprints with explicit columns', async () => {
      mockQueryResult = { data: [], error: null }
      const { fetchSessions } = useActiveSessions()
      await fetchSessions()

      expect(mockClient.from).toHaveBeenCalledWith('user_fingerprints')
    })

    it('sets error on query failure', async () => {
      mockQueryResult = { data: null, error: new Error('Access denied') }
      const { fetchSessions, error } = useActiveSessions()
      await fetchSessions()

      expect(error.value).toBe('Access denied')
    })

    it('manages loading state', async () => {
      mockQueryResult = { data: [], error: null }
      const { fetchSessions, loading } = useActiveSessions()

      expect(loading.value).toBe(false)
      const promise = fetchSessions()
      expect(loading.value).toBe(true)
      await promise
      expect(loading.value).toBe(false)
    })

    it('stores sessions in reactive ref', async () => {
      mockQueryResult = {
        data: [
          {
            id: 'fp-1',
            fp_hash: 'abc',
            ua_hint: null,
            ip_hint: null,
            first_seen: '2026-01-01T10:00:00Z',
            last_seen: '2026-01-01T10:00:00Z',
            request_count: 1,
          },
        ],
        error: null,
      }

      const { fetchSessions, sessions } = useActiveSessions()
      expect(sessions.value).toEqual([])

      await fetchSessions()
      expect(sessions.value).toHaveLength(1)
    })
  })

  describe('removeSession', () => {
    it('returns false if no user', async () => {
      mockUserId.value = null
      const { removeSession } = useActiveSessions()
      const result = await removeSession('fp-1')
      expect(result).toBe(false)
    })

    it('removes session from local list on success', async () => {
      mockQueryResult = {
        data: [
          {
            id: 'fp-1',
            fp_hash: 'abc',
            ua_hint: null,
            ip_hint: null,
            first_seen: '2026-01-01T10:00:00Z',
            last_seen: '2026-01-01T10:00:00Z',
            request_count: 1,
          },
          {
            id: 'fp-2',
            fp_hash: 'def',
            ua_hint: null,
            ip_hint: null,
            first_seen: '2026-01-01T10:00:00Z',
            last_seen: '2026-01-01T10:00:00Z',
            request_count: 1,
          },
        ],
        error: null,
      }

      mockDeleteResult = { error: null }

      const { fetchSessions, removeSession, sessions } = useActiveSessions()
      await fetchSessions()
      expect(sessions.value).toHaveLength(2)

      const result = await removeSession('fp-1')
      expect(result).toBe(true)
      expect(sessions.value).toHaveLength(1)
      expect(sessions.value[0].id).toBe('fp-2')
    })
  })
})
