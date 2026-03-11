import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockGetQuery, mockSafeError, mockServiceRole } = vi.hoisted(() => {
  const mockSafeError = vi.fn((status: number, msg: string) => {
    const err = new Error(msg)
    ;(err as any).statusCode = status
    return err
  })

  const makeSupabase = () => {
    const singleFn = vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } })
    const maybeSingleFn = vi.fn().mockResolvedValue({ data: null, error: null })
    const eqFn = vi.fn().mockReturnThis() as any
    eqFn.single = singleFn
    eqFn.maybeSingle = maybeSingleFn
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn })
    const updateFn = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnThis() })
    const insertFn = vi.fn().mockResolvedValue({ data: null, error: null })
    return {
      from: vi.fn().mockReturnValue({
        select: selectFn,
        update: updateFn,
        insert: insertFn,
      }),
    }
  }

  return {
    mockGetQuery: vi.fn().mockReturnValue({ token: 'abc', type: 'marketing' }),
    mockSafeError,
    mockServiceRole: vi.fn().mockReturnValue(makeSupabase()),
  }
})

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  getQuery: mockGetQuery,
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: mockServiceRole,
}))

vi.mock('../../../server/utils/safeError', () => ({
  safeError: mockSafeError,
}))

import handler from '../../../server/api/email/unsubscribe.get'

function makeEvent() {
  return { node: { res: { setHeader: vi.fn() } } } as any
}

describe('GET /api/email/unsubscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetQuery.mockReturnValue({ token: 'abc', type: 'marketing' })
  })

  it('throws 400 when token is missing', async () => {
    mockGetQuery.mockReturnValue({ type: 'marketing' })
    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 400 })
    expect(mockSafeError).toHaveBeenCalledWith(400, expect.any(String))
  })

  it('throws 400 when type is missing', async () => {
    mockGetQuery.mockReturnValue({ token: 'abc' })
    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns HTML with invalid link message when user not found', async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
          }),
        }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnThis() }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }
    mockServiceRole.mockReturnValue(supabase)
    const event = makeEvent()
    const result = await handler(event)
    expect(result).toContain('<!DOCTYPE html>')
    expect(result).toContain('no valido')
  })

  it('sets Content-Type to text/html', async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
          }),
        }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnThis() }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }
    mockServiceRole.mockReturnValue(supabase)
    const event = makeEvent()
    await handler(event)
    expect(event.node.res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html; charset=utf-8')
  })

  it('returns success HTML when user found and preference updated (existing row)', async () => {
    let callCount = 0
    const supabase = {
      from: vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // users lookup
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'user-1', email: 'user@example.com', name: 'Juan' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (callCount === 2) {
          // check existing preference
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: { id: 'pref-1' }, error: null }),
                }),
              }),
            }),
          }
        }
        // update preference
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }
      }),
    }
    mockServiceRole.mockReturnValue(supabase)
    const event = makeEvent()
    const result = await handler(event)
    expect(result).toContain('<!DOCTYPE html>')
    expect(result).toContain('cancelada')
  })

  it('inserts new preference when none exists', async () => {
    let callCount = 0
    const insertFn = vi.fn().mockResolvedValue({ data: null, error: null })
    const supabase = {
      from: vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'user-1', email: 'user@example.com', name: null },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (callCount === 2) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
                }),
              }),
            }),
          }
        }
        return { insert: insertFn }
      }),
    }
    mockServiceRole.mockReturnValue(supabase)
    const event = makeEvent()
    const result = await handler(event)
    expect(insertFn).toHaveBeenCalled()
    expect(result).toContain('<!DOCTYPE html>')
  })

  it('displays email when name is null', async () => {
    let callCount = 0
    const supabase = {
      from: vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'user-1', email: 'noreply@example.com', name: null },
                  error: null,
                }),
              }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'p1' }, error: null }),
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnThis() }),
        }
      }),
    }
    mockServiceRole.mockReturnValue(supabase)
    const event = makeEvent()
    const result = await handler(event)
    expect(result).toContain('noreply@example.com')
  })
})
