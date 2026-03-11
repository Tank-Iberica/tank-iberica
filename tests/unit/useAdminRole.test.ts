import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminRole } from '../../app/composables/useAdminRole'

// ─── Supabase mock helpers ────────────────────────────────────────────────────

function stubSupabaseRole(role: string | null, error = false) {
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve(
              error
                ? { data: null, error: { message: 'DB error' } }
                : { data: role ? { role } : null, error: null },
            ),
        }),
      }),
    }),
  }))
}

beforeEach(() => {
  vi.clearAllMocks()
  stubSupabaseRole('non-admin') // safe default
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('isAdmin starts as null', () => {
    const c = useAdminRole()
    expect(c.isAdmin.value).toBeNull()
  })
})

// ─── checkAdmin ───────────────────────────────────────────────────────────────

describe('checkAdmin', () => {
  it('returns true when user has admin role', async () => {
    stubSupabaseRole('admin')
    const c = useAdminRole()
    const result = await c.checkAdmin('user-1')
    expect(result).toBe(true)
  })

  it('sets isAdmin to true for admin role', async () => {
    stubSupabaseRole('admin')
    const c = useAdminRole()
    await c.checkAdmin('user-1')
    expect(c.isAdmin.value).toBe(true)
  })

  it('returns false when user has non-admin role', async () => {
    stubSupabaseRole('dealer')
    const c = useAdminRole()
    const result = await c.checkAdmin('user-1')
    expect(result).toBe(false)
  })

  it('sets isAdmin to false for non-admin role', async () => {
    stubSupabaseRole('dealer')
    const c = useAdminRole()
    await c.checkAdmin('user-1')
    expect(c.isAdmin.value).toBe(false)
  })

  it('returns false on supabase error', async () => {
    stubSupabaseRole(null, true)
    const c = useAdminRole()
    const result = await c.checkAdmin('user-1')
    expect(result).toBe(false)
  })

  it('sets isAdmin to false on supabase error', async () => {
    stubSupabaseRole(null, true)
    const c = useAdminRole()
    await c.checkAdmin('user-1')
    expect(c.isAdmin.value).toBe(false)
  })

  it('returns false when data is null (user not found)', async () => {
    stubSupabaseRole(null, false)
    const c = useAdminRole()
    const result = await c.checkAdmin('user-1')
    expect(result).toBe(false)
  })
})

// ─── TTL cache ────────────────────────────────────────────────────────────────

describe('TTL cache', () => {
  it('returns cached result without extra DB call', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({
          eq: () => ({ single: mockSingle }),
        }),
      }),
    }))

    const c = useAdminRole()
    await c.checkAdmin('user-1') // first call — DB hit
    await c.checkAdmin('user-1') // second call — cache hit

    expect(mockSingle).toHaveBeenCalledTimes(1)
  })

  it('returns cached value on second call', async () => {
    stubSupabaseRole('admin')
    const c = useAdminRole()
    await c.checkAdmin('user-1')
    const result = await c.checkAdmin('user-1')
    expect(result).toBe(true)
  })
})

// ─── clearCache ───────────────────────────────────────────────────────────────

describe('clearCache', () => {
  it('resets isAdmin to null', async () => {
    stubSupabaseRole('admin')
    const c = useAdminRole()
    await c.checkAdmin('user-1')
    expect(c.isAdmin.value).toBe(true)
    c.clearCache()
    expect(c.isAdmin.value).toBeNull()
  })

  it('forces DB call on next checkAdmin after clearCache', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({
          eq: () => ({ single: mockSingle }),
        }),
      }),
    }))

    const c = useAdminRole()
    await c.checkAdmin('user-1') // first call
    c.clearCache()
    await c.checkAdmin('user-1') // second call after cache cleared

    expect(mockSingle).toHaveBeenCalledTimes(2)
  })
})
