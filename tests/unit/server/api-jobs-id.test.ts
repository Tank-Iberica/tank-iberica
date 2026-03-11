import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGetRouterParam, mockServerUser, mockMaybeSingle } = vi.hoisted(() => ({
  mockGetRouterParam: vi.fn(),
  mockServerUser: vi.fn(),
  mockMaybeSingle: vi.fn(),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  getRouterParam: (...a: unknown[]) => mockGetRouterParam(...a),
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseUser: (...a: unknown[]) => mockServerUser(...a),
  serverSupabaseServiceRole: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: () => mockMaybeSingle() }) }),
    }),
  }),
}))

vi.mock('../../../server/utils/safeError', () => ({
  safeError: (_code: number, msg: string) => {
    const err = new Error(msg) as Error & { statusCode: number }
    err.statusCode = _code
    return err
  },
}))

import handler from '../../../server/api/jobs/[id].get'

describe('GET /api/jobs/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 401 when not authenticated', async () => {
    mockServerUser.mockResolvedValue(null)
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when no job ID', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockGetRouterParam.mockReturnValue(undefined)
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 for invalid UUID format', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockGetRouterParam.mockReturnValue('not-a-uuid')
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 404 when job not found', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockGetRouterParam.mockReturnValue('12345678-1234-1234-1234-123456789abc')
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 404 on DB error', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockGetRouterParam.mockReturnValue('12345678-1234-1234-1234-123456789abc')
    mockMaybeSingle.mockResolvedValue({ data: null, error: new Error('DB') })
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns completed job with result', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockGetRouterParam.mockReturnValue('12345678-1234-1234-1234-123456789abc')
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: '12345678-1234-1234-1234-123456789abc',
        job_type: 'email_send',
        status: 'completed',
        result: { sent: true },
        error_message: null,
        correlation_id: 'c1',
        created_at: '2026-01-01',
        completed_at: '2026-01-01',
      },
      error: null,
    })
    const result = await (handler as Function)({})
    expect(result.status).toBe('completed')
    expect(result.result).toEqual({ sent: true })
    expect(result.error).toBeNull()
  })

  it('returns dead job with error', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockGetRouterParam.mockReturnValue('12345678-1234-1234-1234-123456789abc')
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: '12345678-1234-1234-1234-123456789abc',
        job_type: 'email_send',
        status: 'dead',
        result: null,
        error_message: 'Max retries exceeded',
        correlation_id: null,
        created_at: '2026-01-01',
        completed_at: null,
      },
      error: null,
    })
    const result = await (handler as Function)({})
    expect(result.status).toBe('dead')
    expect(result.error).toBe('Max retries exceeded')
    expect(result.result).toBeNull()
  })

  it('hides result for pending job', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockGetRouterParam.mockReturnValue('12345678-1234-1234-1234-123456789abc')
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: '12345678-1234-1234-1234-123456789abc',
        job_type: 'email_send',
        status: 'pending',
        result: null,
        error_message: null,
        correlation_id: null,
        created_at: '2026-01-01',
        completed_at: null,
      },
      error: null,
    })
    const result = await (handler as Function)({})
    expect(result.status).toBe('pending')
    expect(result.result).toBeNull()
    expect(result.error).toBeNull()
  })
})
