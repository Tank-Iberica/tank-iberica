import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminUsers, USER_ROLES } from '../../app/composables/admin/useAdminUsers'

// ─── Chain builder ────────────────────────────────────────────────────────

const CHAIN_METHODS = ['select', 'eq', 'or', 'order', 'range', 'update', 'delete']

function makeChain(result: { data?: unknown; error?: unknown; count?: number | null } = {}) {
  const resolved = { data: result.data ?? null, error: result.error ?? null, count: result.count ?? null }
  const chain: Record<string, unknown> = {}
  for (const m of CHAIN_METHODS) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  chain.then = (resolve: (v: typeof resolved) => unknown) =>
    Promise.resolve(resolve(resolved))
  return chain
}

// ─── Fixtures ─────────────────────────────────────────────────────────────

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'u-1',
    email: 'user@example.com',
    pseudonimo: 'JohnD',
    name: 'John',
    apellidos: 'Doe',
    avatar_url: null,
    provider: 'email',
    role: 'user' as const,
    phone: null,
    lang: 'es',
    created_at: '2026-01-01',
    ...overrides,
  }
}

// ─── Setup ────────────────────────────────────────────────────────────────

const mockFrom = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom.mockReturnValue(makeChain())
  vi.stubGlobal('useSupabaseClient', () => ({ from: mockFrom }))
})

// ─── USER_ROLES constant ──────────────────────────────────────────────────

describe('USER_ROLES', () => {
  it('has 3 entries', () => {
    expect(USER_ROLES).toHaveLength(3)
  })

  it('contains visitor, user, admin values', () => {
    const values = USER_ROLES.map((r) => r.value)
    expect(values).toContain('visitor')
    expect(values).toContain('user')
    expect(values).toContain('admin')
  })

  it('each entry has value, label, color', () => {
    for (const entry of USER_ROLES) {
      expect(entry).toHaveProperty('value')
      expect(entry).toHaveProperty('label')
      expect(entry).toHaveProperty('color')
    }
  })
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('users starts as empty array', () => {
    const c = useAdminUsers()
    expect(c.users.value).toEqual([])
  })

  it('loading starts as false', () => {
    const c = useAdminUsers()
    expect(c.loading.value).toBe(false)
  })

  it('saving starts as false', () => {
    const c = useAdminUsers()
    expect(c.saving.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useAdminUsers()
    expect(c.error.value).toBeNull()
  })

  it('total starts as 0', () => {
    const c = useAdminUsers()
    expect(c.total.value).toBe(0)
  })
})

// ─── fetchUsers ───────────────────────────────────────────────────────────

describe('fetchUsers', () => {
  it('sets users and total on success', async () => {
    const user = makeUser()
    mockFrom.mockReturnValue(makeChain({ data: [user], error: null, count: 1 }))
    const c = useAdminUsers()
    await c.fetchUsers()
    expect(c.users.value).toHaveLength(1)
    expect(c.total.value).toBe(1)
    expect(c.loading.value).toBe(false)
  })

  it('sets error and empties users on failure (Pattern B)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'DB error' }, count: null }))
    const c = useAdminUsers()
    await c.fetchUsers()
    expect(c.error.value).toBe('Error fetching users')
    expect(c.users.value).toEqual([])
  })

  it('applies role filter (eq)', async () => {
    const chain = makeChain({ data: [], error: null, count: 0 })
    mockFrom.mockReturnValue(chain)
    const c = useAdminUsers()
    await c.fetchUsers({ role: 'admin' })
    expect(chain.eq).toHaveBeenCalledWith('role', 'admin')
  })

  it('applies search filter (or)', async () => {
    const chain = makeChain({ data: [], error: null, count: 0 })
    mockFrom.mockReturnValue(chain)
    const c = useAdminUsers()
    await c.fetchUsers({ search: 'juan' })
    expect(chain.or).toHaveBeenCalledWith(expect.stringContaining('email.ilike.%juan%'))
  })

  it('defaults total to 0 when count is null', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null, count: null }))
    const c = useAdminUsers()
    await c.fetchUsers()
    expect(c.total.value).toBe(0)
  })
})

// ─── updateRole ───────────────────────────────────────────────────────────

describe('updateRole', () => {
  it('returns true and updates local user role', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminUsers()
    c.users.value.push(makeUser({ id: 'u-1', role: 'user' }) as never)
    const ok = await c.updateRole('u-1', 'admin')
    expect(ok).toBe(true)
    expect(c.users.value[0]!.role).toBe('admin')
    expect(c.saving.value).toBe(false)
  })

  it('returns false on error (Pattern B)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Forbidden' } }))
    const c = useAdminUsers()
    const ok = await c.updateRole('u-1', 'admin')
    expect(ok).toBe(false)
    expect(c.error.value).toBe('Error updating role')
  })

  it('does not update local list when user id not found', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminUsers()
    c.users.value.push(makeUser({ id: 'u-1', role: 'user' }) as never)
    await c.updateRole('u-999', 'admin')
    expect(c.users.value[0]!.role).toBe('user') // unchanged
  })
})

// ─── deleteUser ───────────────────────────────────────────────────────────

describe('deleteUser', () => {
  it('returns true and removes user from local list', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const c = useAdminUsers()
    c.users.value.push(makeUser({ id: 'u-1' }) as never)
    c.users.value.push(makeUser({ id: 'u-2' }) as never)
    c.total.value = 2
    const ok = await c.deleteUser('u-1')
    expect(ok).toBe(true)
    expect(c.users.value).toHaveLength(1)
    expect(c.users.value[0]!.id).toBe('u-2')
    expect(c.total.value).toBe(1)
  })

  it('returns false on error (Pattern B)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'err' } }))
    const c = useAdminUsers()
    const ok = await c.deleteUser('u-1')
    expect(ok).toBe(false)
    expect(c.error.value).toBe('Error deleting user')
  })
})
