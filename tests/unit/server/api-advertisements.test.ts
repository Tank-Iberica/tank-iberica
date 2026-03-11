import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'

const { mockSafeError, mockServiceRole, mockSupabaseUser, mockReadBody } = vi.hoisted(() => {
  const mockSafeError = vi.fn((status: number, msg: string) => {
    const err = new Error(msg)
    ;(err as any).statusCode = status
    return err
  })
  return {
    mockSafeError,
    mockServiceRole: vi.fn(),
    mockSupabaseUser: vi.fn().mockResolvedValue(null),
    mockReadBody: vi.fn(),
  }
})

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: (...a: unknown[]) => mockReadBody(...a),
  getRequestIP: vi.fn().mockReturnValue('1.2.3.4'),
  createError: (opts: { statusCode?: number; statusMessage?: string; data?: unknown }) => {
    const err = new Error(opts.statusMessage ?? 'Error')
    ;(err as any).statusCode = opts.statusCode
    return err
  },
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: mockServiceRole,
  serverSupabaseUser: mockSupabaseUser,
}))

vi.mock('../utils/safeError', () => ({ safeError: mockSafeError }))
vi.mock('../../../server/utils/safeError', () => ({ safeError: mockSafeError }))

vi.stubGlobal('defineEventHandler', (fn: Function) => fn)

let handler: Function

const validBody = {
  brand: 'Volvo',
  model: 'FH16',
  year: 2020,
  price: 80000,
  location: 'Madrid',
  description: 'Good condition truck',
  contact_name: 'Juan',
  contact_email: 'juan@test.com',
  contact_phone: '612345678',
}

function makeSupabase(id = 'adv-1', error: unknown = null) {
  return {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: error ? null : { id }, error }),
        }),
      }),
    }),
  }
}

describe('POST /api/advertisements', () => {
  beforeAll(async () => {
    mockReadBody.mockResolvedValue(validBody)
    vi.stubGlobal('verifyTurnstile', vi.fn().mockResolvedValue(true))
    vi.stubGlobal('getHeader', vi.fn().mockReturnValue(undefined))
    vi.resetModules()
    const mod = await import('../../../server/api/advertisements.post')
    handler = mod.default as Function
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    mockReadBody.mockResolvedValue({ ...validBody })
    vi.stubGlobal('verifyTurnstile', vi.fn().mockResolvedValue(true))
    mockServiceRole.mockReturnValue(makeSupabase())
  })

  it('throws 401 when user not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when required fields missing', async () => {
    mockReadBody.mockResolvedValue({ brand: 'Volvo' })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when year out of range', async () => {
    mockReadBody.mockResolvedValue({ ...validBody, year: 1900 })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when email is invalid', async () => {
    mockReadBody.mockResolvedValue({ ...validBody, contact_email: 'not-an-email' })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when price is 0 or negative', async () => {
    mockReadBody.mockResolvedValue({ ...validBody, price: 0 })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 403 when turnstile fails', async () => {
    mockReadBody.mockResolvedValue({ ...validBody, turnstileToken: 'bad-token' })
    vi.stubGlobal('verifyTurnstile', vi.fn().mockResolvedValue(false))
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 500 when DB insert fails', async () => {
    mockServiceRole.mockReturnValue(makeSupabase('', { message: 'DB error' }))
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('returns success and id on valid body', async () => {
    const result = await handler({} as any)
    expect(result).toEqual({ success: true, id: 'adv-1' })
  })

  it('throws 400 when contact_preference is invalid', async () => {
    mockReadBody.mockResolvedValue({ ...validBody, contact_preference: 'fax' })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when category_id is not a UUID', async () => {
    mockReadBody.mockResolvedValue({ ...validBody, category_id: 'not-uuid' })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })
})
