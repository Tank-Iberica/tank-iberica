/**
 * Tests for GDPR account endpoints:
 * - POST /api/account/delete
 * - GET /api/account/export
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockSafeError, mockServiceRole, mockSupabaseUser, mockVerifyCsrf } = vi.hoisted(() => {
  const mockSafeError = vi.fn((status: number, msg: string) => {
    const err = new Error(msg)
    ;(err as any).statusCode = status
    return err
  })
  return {
    mockSafeError,
    mockServiceRole: vi.fn(),
    mockSupabaseUser: vi.fn().mockResolvedValue(null),
    mockVerifyCsrf: vi.fn(),
  }
})

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  setResponseHeaders: vi.fn(),
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: mockServiceRole,
  serverSupabaseUser: mockSupabaseUser,
}))

vi.mock('../../utils/safeError', () => ({ safeError: mockSafeError }))
vi.mock('../../utils/verifyCsrf', () => ({ verifyCsrf: mockVerifyCsrf }))
vi.mock('../../../server/utils/verifyCsrf', () => ({ verifyCsrf: mockVerifyCsrf }))
vi.mock('../../../server/utils/safeError', () => ({ safeError: mockSafeError }))

vi.stubGlobal('useRuntimeConfig', () => ({ cronSecret: 'test', public: {} }))
vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ ok: true }))

// ── DELETE account ────────────────────────────────────────────────────────────

import deleteHandler from '../../../server/api/account/delete.post'

function makeDeleteSupabase() {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
  // Make insert return a resolved promise
  chain.insert = vi.fn().mockResolvedValue({ data: null, error: null })
  // Allow chaining update
  chain.update = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ data: null, error: null }),
  })
  chain.delete = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
  })

  return {
    from: vi.fn().mockReturnValue(chain),
    auth: {
      admin: {
        deleteUser: vi.fn().mockResolvedValue({ error: null }),
      },
    },
  }
}

describe('POST /api/account/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'user@test.com' })
    mockVerifyCsrf.mockReturnValue(undefined)
    mockServiceRole.mockReturnValue(makeDeleteSupabase())
  })

  it('throws 401 when user not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(deleteHandler({ node: { req: { headers: {} } } } as any)).rejects.toMatchObject({ statusCode: 401 })

  })

  it('calls verifyCsrf', async () => {
    await deleteHandler({ node: { req: { headers: {} } } } as any)
    expect(mockVerifyCsrf).toHaveBeenCalled()
  })

  it('returns success when user has no dealer', async () => {
    const result = await deleteHandler({ node: { req: { headers: {} } } } as any)
    expect(result).toEqual({ success: true })
  })

  it('anonymizes dealer when dealer exists', async () => {
    let dealerUpdated = false
    const supabase = makeDeleteSupabase()
    supabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'dealers') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'dealer-1' }, error: null }),
            }),
          }),
          update: vi.fn().mockImplementation(() => {
            dealerUpdated = true
            return { eq: vi.fn().mockResolvedValue({ data: null, error: null }) }
          }),
          delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnThis(), in: vi.fn().mockResolvedValue({ data: null, error: null }) }),
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    })
    supabase.auth = { admin: { deleteUser: vi.fn().mockResolvedValue({ error: null }) } }
    mockServiceRole.mockReturnValue(supabase)
    const result = await deleteHandler({ node: { req: { headers: {} } } } as any)
    expect(result.success).toBe(true)
    expect(dealerUpdated).toBe(true)
  })

  it('returns success even if auth deletion fails', async () => {
    const supabase = makeDeleteSupabase()
    supabase.auth.admin.deleteUser.mockResolvedValue({ error: { message: 'user not found' } })
    mockServiceRole.mockReturnValue(supabase)
    const result = await deleteHandler({ node: { req: { headers: {} } } } as any)
    expect(result.success).toBe(true)
  })
})

// ── EXPORT account ────────────────────────────────────────────────────────────

import exportHandler from '../../../server/api/account/export.get'

function makeExportSupabase() {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: 'user-1', name: 'Test', email: 'test@test.com' }, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
  return { from: vi.fn().mockReturnValue(chain) }
}

const eventWithHeaders = { node: { req: { headers: {} } } } as any

describe('GET /api/account/export', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'user@test.com' })
    mockServiceRole.mockReturnValue(makeExportSupabase())
  })

  it('throws 401 when user not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(exportHandler(eventWithHeaders)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns export data with userId and exportDate', async () => {
    const result = await exportHandler(eventWithHeaders)
    expect(result.userId).toBe('user-1')
    expect(result.exportDate).toBeTruthy()
    expect(result.platform).toBe('Tracciona')
  })

  it('includes user profile in export', async () => {
    const result = await exportHandler(eventWithHeaders)
    expect(result.profile).toBeTruthy()
  })
})
