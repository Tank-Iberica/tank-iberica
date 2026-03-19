import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, readonly, computed } from 'vue'

// ── Supabase mock ────────────────────────────────────────────────────────────

interface MockChain {
  select: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  in: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  from: ReturnType<typeof vi.fn>
}

function createMockChain(resolvedData: unknown = null, resolvedError: unknown = null): MockChain {
  const chain: MockChain = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    single: vi.fn(),
    update: vi.fn(),
    from: vi.fn(),
  }

  // Each method returns the chain, so calls can be chained
  chain.from.mockReturnValue(chain)
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.in.mockReturnValue(chain)
  chain.update.mockReturnValue(chain)
  chain.single.mockResolvedValue({ data: resolvedData, error: resolvedError })

  // For non-single queries, resolve directly from eq/in
  const resultPromise = Promise.resolve({ data: resolvedData, error: resolvedError })
  // Make the chain thenable for non-single queries
  Object.assign(chain.eq, { then: resultPromise.then.bind(resultPromise) })
  Object.assign(chain.in, { then: resultPromise.then.bind(resultPromise) })

  return chain
}

let mockChain: MockChain
let mockRpc: ReturnType<typeof vi.fn>
let mockSignOut: ReturnType<typeof vi.fn>
const mockUserId = ref<string | null>('user-123')

vi.stubGlobal('ref', ref)
vi.stubGlobal('readonly', readonly)
vi.stubGlobal('computed', computed)

vi.stubGlobal(
  'useSupabaseUser',
  vi.fn(() => computed(() => (mockUserId.value ? { id: mockUserId.value } : null))),
)

vi.stubGlobal(
  'useSupabaseClient',
  vi.fn(() => {
    return {
      from: (...args: unknown[]) => mockChain.from(...args),
      rpc: mockRpc,
      auth: { signOut: mockSignOut },
    }
  }),
)

import { useUserProfile } from '~/composables/useUserProfile'

// ── Tests ────────────────────────────────────────────────────────────────────

describe('useUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserId.value = 'user-123'
    mockChain = createMockChain()
    mockRpc = vi.fn()
    mockSignOut = vi.fn().mockResolvedValue({})
  })

  // ── loadProfile ──────────────────────────────────────────────────────────

  describe('loadProfile', () => {
    it('returns null if no user', async () => {
      mockUserId.value = null
      const { loadProfile } = useUserProfile()
      const result = await loadProfile()
      expect(result).toBeNull()
    })

    it('queries users table with explicit columns', async () => {
      const profileData = { id: 'user-123', email: 'test@example.com', name: 'Test' }
      mockChain = createMockChain(profileData)
      const { loadProfile } = useUserProfile()

      await loadProfile()

      expect(mockChain.from).toHaveBeenCalledWith('users')
      const selectArg = mockChain.select.mock.calls[0][0] as string
      // Verify explicit columns, NOT select('*')
      expect(selectArg).not.toBe('*')
      expect(selectArg).toContain('id')
      expect(selectArg).toContain('email')
      expect(selectArg).toContain('name')
      expect(selectArg).toContain('phone')
      expect(selectArg).toContain('avatar_url')
      expect(selectArg).toContain('role')
      expect(selectArg).toContain('dealer_id')
      expect(selectArg).toContain('locale')
      expect(selectArg).toContain('created_at')
      expect(selectArg).toContain('subscription_tier')
      expect(selectArg).toContain('trust_score')
      expect(selectArg).toContain('company_name')
    })

    it('returns profile data on success', async () => {
      const profileData = { id: 'user-123', email: 'test@example.com' }
      mockChain = createMockChain(profileData)
      const { loadProfile } = useUserProfile()

      const result = await loadProfile()
      expect(result).toEqual(profileData)
    })

    it('sets error on failure', async () => {
      // Supabase errors are plain objects, not Error instances
      mockChain = createMockChain(null, { message: 'DB error' })
      const { loadProfile, error } = useUserProfile()

      await loadProfile()
      // Falls to generic message since Supabase error is not instanceof Error
      expect(error.value).toBe('Error loading profile')
    })

    it('manages loading state', async () => {
      mockChain = createMockChain({ id: 'user-123' })
      const { loadProfile, loading } = useUserProfile()

      expect(loading.value).toBe(false)
      const promise = loadProfile()
      // loading is set to true synchronously
      expect(loading.value).toBe(true)
      await promise
      expect(loading.value).toBe(false)
    })
  })

  // ── updateProfile ────────────────────────────────────────────────────────

  describe('updateProfile', () => {
    it('returns false if no user', async () => {
      mockUserId.value = null
      const { updateProfile } = useUserProfile()
      const result = await updateProfile({ name: 'New' })
      expect(result).toBe(false)
    })

    it('sends update to users table with fields', async () => {
      // For update, we need eq to resolve directly
      const updateResult = Promise.resolve({ error: null })
      mockChain.from.mockReturnValue(mockChain)
      mockChain.update.mockReturnValue(mockChain)
      Object.assign(mockChain.eq, { then: updateResult.then.bind(updateResult) })

      const { updateProfile } = useUserProfile()
      const fields = { name: 'Updated', phone: '+34600000000' }

      await updateProfile(fields)

      expect(mockChain.from).toHaveBeenCalledWith('users')
      expect(mockChain.update).toHaveBeenCalledWith(fields)
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'user-123')
    })

    it('returns true on success', async () => {
      const updateResult = Promise.resolve({ error: null })
      mockChain.from.mockReturnValue(mockChain)
      mockChain.update.mockReturnValue(mockChain)
      Object.assign(mockChain.eq, { then: updateResult.then.bind(updateResult) })

      const { updateProfile } = useUserProfile()
      const result = await updateProfile({ name: 'Updated' })
      expect(result).toBe(true)
    })

    it('sets error and returns false on failure', async () => {
      const errObj = { message: 'Update failed' }
      const thenable = {
        then: (resolve: (v: unknown) => void) =>
          Promise.resolve().then(() => resolve({ error: errObj })),
      }
      const chain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue(thenable),
      }
      mockChain.from.mockReturnValue(chain)

      const { updateProfile, error } = useUserProfile()
      const result = await updateProfile({ name: 'Updated' })
      expect(result).toBe(false)
      expect(error.value).toBe('Error updating profile')
    })
  })

  // ── deleteAccount ────────────────────────────────────────────────────────

  describe('deleteAccount', () => {
    it('returns false if no user', async () => {
      mockUserId.value = null
      const { deleteAccount } = useUserProfile()
      const result = await deleteAccount()
      expect(result).toBe(false)
    })

    it('calls RPC delete_own_account and signs out', async () => {
      mockRpc = vi.fn().mockResolvedValue({ error: null })
      const { deleteAccount } = useUserProfile()

      const result = await deleteAccount()
      expect(result).toBe(true)
      expect(mockSignOut).toHaveBeenCalled()
    })

    it('sets error on RPC failure', async () => {
      mockRpc = vi.fn().mockResolvedValue({ error: { message: 'RPC failed' } })
      const { deleteAccount, error } = useUserProfile()

      const result = await deleteAccount()
      expect(result).toBe(false)
      // Supabase error is not instanceof Error, falls to generic message
      expect(error.value).toBe('Error deleting account')
    })
  })

  // ── exportData ───────────────────────────────────────────────────────────

  describe('exportData', () => {
    it('returns null if no user', async () => {
      mockUserId.value = null
      const { exportData } = useUserProfile()
      const result = await exportData()
      expect(result).toBeNull()
    })

    it('queries 9 tables with explicit columns in parallel', async () => {
      // Track all from() calls
      const fromCalls: string[] = []
      const selectCalls: string[] = []

      const mockFrom = vi.fn((table: string) => {
        fromCalls.push(table)
        const chain = {
          select: vi.fn((cols: string) => {
            selectCalls.push(cols)
            return chain
          }),
          eq: vi.fn(() => chain),
          single: vi.fn().mockResolvedValue({ data: { id: '1' }, error: null }),
          then: (resolve: (v: unknown) => void) => resolve({ data: [], error: null }),
        }
        // Make chain thenable for non-single queries
        Object.defineProperty(chain.eq, 'then', {
          value: (resolve: (v: unknown) => void) => resolve({ data: [], error: null }),
          configurable: true,
        })
        return chain
      })

      vi.mocked(vi.fn()).mockImplementation(() => ({
        from: mockFrom,
        rpc: vi.fn(),
        auth: { signOut: vi.fn() },
      }))

      // Re-mock useSupabaseClient to use our tracking mock
      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: mockFrom,
          rpc: mockRpc,
          auth: { signOut: mockSignOut },
        })),
      )

      const { exportData } = useUserProfile()
      await exportData()

      // Verify all 9 tables are queried
      expect(fromCalls).toContain('users')
      expect(fromCalls).toContain('favorites')
      expect(fromCalls).toContain('leads')
      expect(fromCalls).toContain('user_vehicle_views')
      expect(fromCalls).toContain('messages')
      expect(fromCalls).toContain('search_alerts')
      expect(fromCalls).toContain('reservations')
      expect(fromCalls).toContain('transactions')
      expect(fromCalls).toContain('email_preferences')

      // Verify NO select('*') is used
      for (const selectArg of selectCalls) {
        expect(selectArg).not.toBe('*')
        // Each select should list explicit column names
        expect(selectArg).toContain('id')
      }
    })

    it('returns structured ExportedData with all required keys', async () => {
      // Create a mock that returns data for all tables
      const mockFrom = vi.fn(() => {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          single: vi
            .fn()
            .mockResolvedValue({ data: { id: '1', email: 'test@test.com' }, error: null }),
          then: (resolve: (v: unknown) => void) => resolve({ data: [{ id: '1' }], error: null }),
        }
        Object.defineProperty(chain.eq, 'then', {
          value: (resolve: (v: unknown) => void) => resolve({ data: [{ id: '1' }], error: null }),
          configurable: true,
        })
        return chain
      })

      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: mockFrom,
          rpc: mockRpc,
          auth: { signOut: mockSignOut },
        })),
      )

      const { exportData } = useUserProfile()
      const result = await exportData()

      expect(result).not.toBeNull()
      expect(result).toHaveProperty('profile')
      expect(result).toHaveProperty('favorites')
      expect(result).toHaveProperty('leads')
      expect(result).toHaveProperty('views')
      expect(result).toHaveProperty('messages')
      expect(result).toHaveProperty('search_alerts')
      expect(result).toHaveProperty('reservations')
      expect(result).toHaveProperty('transactions')
      expect(result).toHaveProperty('email_preferences')
    })

    it('returns empty arrays when tables have no data', async () => {
      const mockFrom = vi.fn(() => {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          then: (resolve: (v: unknown) => void) => resolve({ data: null, error: null }),
        }
        Object.defineProperty(chain.eq, 'then', {
          value: (resolve: (v: unknown) => void) => resolve({ data: null, error: null }),
          configurable: true,
        })
        return chain
      })

      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: mockFrom,
          rpc: mockRpc,
          auth: { signOut: mockSignOut },
        })),
      )

      const { exportData } = useUserProfile()
      const result = await exportData()

      expect(result).not.toBeNull()
      expect(result!.profile).toBeNull()
      expect(result!.favorites).toEqual([])
      expect(result!.leads).toEqual([])
      expect(result!.views).toEqual([])
      expect(result!.messages).toEqual([])
      expect(result!.search_alerts).toEqual([])
      expect(result!.reservations).toEqual([])
      expect(result!.transactions).toEqual([])
      expect(result!.email_preferences).toEqual([])
    })

    it('sets error on exception during export', async () => {
      const mockFrom = vi.fn(() => {
        throw new Error('Network error')
      })

      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: mockFrom,
          rpc: mockRpc,
          auth: { signOut: mockSignOut },
        })),
      )

      const { exportData, error } = useUserProfile()
      const result = await exportData()

      expect(result).toBeNull()
      expect(error.value).toBe('Network error')
    })
  })
})
