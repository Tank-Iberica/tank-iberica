import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock h3 createError ─────────────────────────────────────────────────────
vi.mock('h3', () => ({
  createError: (opts: { statusCode: number; statusMessage: string; data?: unknown }) => {
    const err = new Error(opts.statusMessage) as Error & {
      statusCode: number
      data?: unknown
    }
    err.statusCode = opts.statusCode
    err.data = opts.data
    return err
  },
  getRequestIP: vi.fn().mockReturnValue('127.0.0.1'),
}))

// ── Mock #supabase/server ───────────────────────────────────────────────────
const mockServerSupabaseUser = vi.fn()
const mockServerSupabaseServiceRole = vi.fn()

vi.mock('#supabase/server', () => ({
  serverSupabaseUser: (...args: unknown[]) => mockServerSupabaseUser(...args),
  serverSupabaseServiceRole: (...args: unknown[]) => mockServerSupabaseServiceRole(...args),
}))

import { getUserWithRoles, requireRole, requirePermission } from '../../../server/utils/rbac'

// ── Test helpers ─────────────────────────────────────────────────────────────

function makeSupabase(roleRows: Array<{ role: string }> = [], hasPermission = false) {
  const eqMock = vi.fn().mockResolvedValue({ data: roleRows, error: null })
  const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
  const fromMock = vi.fn().mockReturnValue({ select: selectMock })
  const rpcMock = vi.fn().mockResolvedValue({ data: hasPermission })
  return { from: fromMock, rpc: rpcMock }
}

const mockEvent = {} as never

// ── getUserWithRoles ─────────────────────────────────────────────────────────

describe('getUserWithRoles', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 401 when user is not authenticated', async () => {
    mockServerSupabaseUser.mockResolvedValue(null)
    await expect(getUserWithRoles(mockEvent)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns user with empty roles when no roles in DB', async () => {
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-123' })
    mockServerSupabaseServiceRole.mockReturnValue(makeSupabase([]))

    const result = await getUserWithRoles(mockEvent)
    expect(result.id).toBe('user-123')
    expect(result.roles).toEqual([])
  })

  it('returns user with single role from DB', async () => {
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-abc' })
    mockServerSupabaseServiceRole.mockReturnValue(makeSupabase([{ role: 'admin' }]))

    const result = await getUserWithRoles(mockEvent)
    expect(result.id).toBe('user-abc')
    expect(result.roles).toEqual(['admin'])
  })

  it('returns user with multiple roles from DB', async () => {
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-abc' })
    mockServerSupabaseServiceRole.mockReturnValue(
      makeSupabase([{ role: 'admin' }, { role: 'editor' }]),
    )

    const result = await getUserWithRoles(mockEvent)
    expect(result.roles).toContain('admin')
    expect(result.roles).toContain('editor')
    expect(result.roles).toHaveLength(2)
  })

  it('queries the user_roles table with the user id', async () => {
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-xyz' })
    const supabase = makeSupabase([{ role: 'viewer' }])
    mockServerSupabaseServiceRole.mockReturnValue(supabase)

    await getUserWithRoles(mockEvent)

    expect(supabase.from).toHaveBeenCalledWith('user_roles')
    const selectResult = supabase.from.mock.results[0]!.value
    expect(selectResult.select).toHaveBeenCalledWith('role')
    const eqResult = selectResult.select.mock.results[0]!.value
    expect(eqResult.eq).toHaveBeenCalledWith('user_id', 'user-xyz')
  })
})

// ── requireRole ──────────────────────────────────────────────────────────────

describe('requireRole', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 401 when not authenticated', async () => {
    mockServerSupabaseUser.mockResolvedValue(null)
    await expect(requireRole(mockEvent, 'admin')).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 403 when user has no roles', async () => {
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-123' })
    mockServerSupabaseServiceRole.mockReturnValue(makeSupabase([]))

    await expect(requireRole(mockEvent, 'viewer')).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 403 when user role is below required (viewer → admin)', async () => {
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-123' })
    mockServerSupabaseServiceRole.mockReturnValue(makeSupabase([{ role: 'viewer' }]))

    await expect(requireRole(mockEvent, 'admin')).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 403 when user role is below required (viewer → editor)', async () => {
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-123' })
    mockServerSupabaseServiceRole.mockReturnValue(makeSupabase([{ role: 'viewer' }]))

    await expect(requireRole(mockEvent, 'editor')).rejects.toMatchObject({ statusCode: 403 })
  })

  it('passes when user has exactly the required role (viewer → viewer)', async () => {
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-123' })
    mockServerSupabaseServiceRole.mockReturnValue(makeSupabase([{ role: 'viewer' }]))

    await expect(requireRole(mockEvent, 'viewer')).resolves.toBeDefined()
  })

  it('passes when user has the exact required role (admin → admin)', async () => {
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-123' })
    mockServerSupabaseServiceRole.mockReturnValue(makeSupabase([{ role: 'admin' }]))

    const result = await requireRole(mockEvent, 'admin')
    expect(result.id).toBe('user-123')
  })

  it('admin passes editor-level check (role hierarchy: 3 >= 2)', async () => {
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-123' })
    mockServerSupabaseServiceRole.mockReturnValue(makeSupabase([{ role: 'admin' }]))

    await expect(requireRole(mockEvent, 'editor')).resolves.toBeDefined()
  })

  it('admin passes viewer-level check', async () => {
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-123' })
    mockServerSupabaseServiceRole.mockReturnValue(makeSupabase([{ role: 'admin' }]))

    await expect(requireRole(mockEvent, 'viewer')).resolves.toBeDefined()
  })

  it('editor fails admin-level check', async () => {
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-123' })
    mockServerSupabaseServiceRole.mockReturnValue(makeSupabase([{ role: 'editor' }]))

    await expect(requireRole(mockEvent, 'admin')).rejects.toMatchObject({ statusCode: 403 })
  })

  it('editor passes viewer-level check', async () => {
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-123' })
    mockServerSupabaseServiceRole.mockReturnValue(makeSupabase([{ role: 'editor' }]))

    await expect(requireRole(mockEvent, 'viewer')).resolves.toBeDefined()
  })

  it('super_admin always passes any role check', async () => {
    mockServerSupabaseUser.mockResolvedValue({ id: 'super-user' })
    mockServerSupabaseServiceRole.mockReturnValue(makeSupabase([{ role: 'super_admin' }]))

    await expect(requireRole(mockEvent, 'admin')).resolves.toBeDefined()
    // Note: second call needs a fresh mock
  })

  it('super_admin passes even for super_admin requirement', async () => {
    mockServerSupabaseUser.mockResolvedValue({ id: 'super-user' })
    mockServerSupabaseServiceRole.mockReturnValue(makeSupabase([{ role: 'super_admin' }]))

    await expect(requireRole(mockEvent, 'super_admin')).resolves.toBeDefined()
  })

  it('returns the user object on success', async () => {
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-123' })
    mockServerSupabaseServiceRole.mockReturnValue(makeSupabase([{ role: 'admin' }]))

    const result = await requireRole(mockEvent, 'admin')
    expect(result).toEqual({
      id: 'user-123',
      roles: ['admin'],
    })
  })
})

// ── requirePermission ────────────────────────────────────────────────────────

describe('requirePermission', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 401 when not authenticated', async () => {
    mockServerSupabaseUser.mockResolvedValue(null)
    await expect(requirePermission(mockEvent, 'vehicles', 'read')).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('throws 403 when has_permission RPC returns false', async () => {
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-123' })
    mockServerSupabaseServiceRole.mockReturnValue(makeSupabase([{ role: 'editor' }], false))

    await expect(requirePermission(mockEvent, 'vehicles', 'delete')).rejects.toMatchObject({
      statusCode: 403,
    })
  })

  it('passes when has_permission RPC returns true', async () => {
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-123' })
    mockServerSupabaseServiceRole.mockReturnValue(makeSupabase([{ role: 'editor' }], true))

    const result = await requirePermission(mockEvent, 'vehicles', 'update')
    expect(result.id).toBe('user-123')
  })

  it('super_admin bypasses RPC permission check', async () => {
    mockServerSupabaseUser.mockResolvedValue({ id: 'super-user' })
    // Even with hasPermission=false, super_admin bypasses the RPC call
    mockServerSupabaseServiceRole.mockReturnValue(makeSupabase([{ role: 'super_admin' }], false))

    const result = await requirePermission(mockEvent, 'vehicles', 'delete')
    expect(result.id).toBe('super-user')
  })

  it('super_admin does not call has_permission RPC', async () => {
    mockServerSupabaseUser.mockResolvedValue({ id: 'super-user' })
    const supabase = makeSupabase([{ role: 'super_admin' }], false)
    mockServerSupabaseServiceRole.mockReturnValue(supabase)

    await requirePermission(mockEvent, 'any-resource', 'manage')

    // RPC should not be called for super_admin
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it('calls has_permission RPC with correct arguments', async () => {
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-abc' })
    const supabase = makeSupabase([{ role: 'editor' }], true)
    mockServerSupabaseServiceRole.mockReturnValue(supabase)

    await requirePermission(mockEvent, 'news', 'create')

    expect(supabase.rpc).toHaveBeenCalledWith('has_permission', {
      p_user_id: 'user-abc',
      p_resource: 'news',
      p_action: 'create',
    })
  })

  it('returns the user object on success', async () => {
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-abc' })
    mockServerSupabaseServiceRole.mockReturnValue(makeSupabase([{ role: 'editor' }], true))

    const result = await requirePermission(mockEvent, 'vehicles', 'update')
    expect(result).toEqual({
      id: 'user-abc',
      roles: ['editor'],
    })
  })
})
