import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUserProfile } from '../../app/composables/useUserProfile'

// ─── Stub helpers ──────────────────────────────────────────────────────────────

function stubUser(id: string | null = 'user-1') {
  vi.stubGlobal('useSupabaseUser', () => ({
    value: id ? { id } : null,
  }))
}

function stubClient({
  singleData = null as unknown,
  singleError = null as unknown,
  updateError = null as unknown,
  rpcError = null as unknown,
} = {}) {
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: singleData, error: singleError }),
          eq: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: updateError }),
      }),
    }),
    rpc: (_fn: string) => Promise.resolve({ data: null, error: rpcError }),
    auth: {
      signOut: vi.fn().mockResolvedValue({}),
    },
  }))
}

beforeEach(() => {
  vi.clearAllMocks()
  stubUser()
  stubClient()
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('loading starts as false', () => {
    const c = useUserProfile()
    expect(c.loading.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useUserProfile()
    expect(c.error.value).toBeNull()
  })
})

// ─── loadProfile ──────────────────────────────────────────────────────────────

describe('loadProfile', () => {
  it('returns null when no user', async () => {
    stubUser(null)
    const c = useUserProfile()
    const result = await c.loadProfile()
    expect(result).toBeNull()
  })

  it('returns profile data on success', async () => {
    stubClient({ singleData: { id: 'user-1', name: 'John' } })
    const c = useUserProfile()
    const result = await c.loadProfile()
    expect(result).not.toBeNull()
    expect((result as Record<string, unknown>)?.name).toBe('John')
  })

  it('sets loading to false after success', async () => {
    const c = useUserProfile()
    await c.loadProfile()
    expect(c.loading.value).toBe(false)
  })

  it('sets error on DB failure', async () => {
    stubClient({ singleError: new Error('DB error') })
    const c = useUserProfile()
    await c.loadProfile()
    expect(c.error.value).toBeTruthy()
  })

  it('returns null on DB failure', async () => {
    stubClient({ singleError: new Error('DB error') })
    const c = useUserProfile()
    const result = await c.loadProfile()
    expect(result).toBeNull()
  })

  it('sets loading to false after error', async () => {
    stubClient({ singleError: new Error('DB error') })
    const c = useUserProfile()
    await c.loadProfile()
    expect(c.loading.value).toBe(false)
  })
})

// ─── updateProfile ────────────────────────────────────────────────────────────

describe('updateProfile', () => {
  it('returns false when no user', async () => {
    stubUser(null)
    const c = useUserProfile()
    const result = await c.updateProfile({ name: 'John' })
    expect(result).toBe(false)
  })

  it('returns true on successful update', async () => {
    const c = useUserProfile()
    const result = await c.updateProfile({ name: 'John' })
    expect(result).toBe(true)
  })

  it('sets loading to false after success', async () => {
    const c = useUserProfile()
    await c.updateProfile({ name: 'John' })
    expect(c.loading.value).toBe(false)
  })

  it('returns false on DB error', async () => {
    stubClient({ updateError: new Error('Update failed') })
    const c = useUserProfile()
    const result = await c.updateProfile({ name: 'John' })
    expect(result).toBe(false)
  })

  it('sets error on DB failure', async () => {
    stubClient({ updateError: new Error('Update failed') })
    const c = useUserProfile()
    await c.updateProfile({ name: 'John' })
    expect(c.error.value).toBeTruthy()
  })

  it('sets loading to false after error', async () => {
    stubClient({ updateError: new Error('Update failed') })
    const c = useUserProfile()
    await c.updateProfile({ name: 'John' })
    expect(c.loading.value).toBe(false)
  })
})

// ─── deleteAccount ────────────────────────────────────────────────────────────

describe('deleteAccount', () => {
  it('returns false when no user', async () => {
    stubUser(null)
    const c = useUserProfile()
    const result = await c.deleteAccount()
    expect(result).toBe(false)
  })

  it('returns true on successful deletion', async () => {
    const c = useUserProfile()
    const result = await c.deleteAccount()
    expect(result).toBe(true)
  })

  it('returns false on RPC error', async () => {
    stubClient({ rpcError: new Error('RPC failed') })
    const c = useUserProfile()
    const result = await c.deleteAccount()
    expect(result).toBe(false)
  })

  it('sets error on RPC failure', async () => {
    stubClient({ rpcError: new Error('RPC failed') })
    const c = useUserProfile()
    await c.deleteAccount()
    expect(c.error.value).toBeTruthy()
  })

  it('sets loading to false after success', async () => {
    const c = useUserProfile()
    await c.deleteAccount()
    expect(c.loading.value).toBe(false)
  })
})

// ─── exportData ───────────────────────────────────────────────────────────────

describe('exportData', () => {
  it('returns null when no user', async () => {
    stubUser(null)
    const c = useUserProfile()
    const result = await c.exportData()
    expect(result).toBeNull()
  })

  it('returns object with profile, favorites, leads, views', async () => {
    const c = useUserProfile()
    const result = await c.exportData()
    expect(result).not.toBeNull()
    expect(result).toHaveProperty('profile')
    expect(result).toHaveProperty('favorites')
    expect(result).toHaveProperty('leads')
    expect(result).toHaveProperty('views')
  })

  it('sets loading to false after success', async () => {
    const c = useUserProfile()
    await c.exportData()
    expect(c.loading.value).toBe(false)
  })
})
