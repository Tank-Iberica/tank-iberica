import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock h3
vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: vi.fn(),
  createError: (opts: { statusCode: number; statusMessage: string }) => {
    const e = new Error(opts.statusMessage) as Error & { statusCode: number }
    e.statusCode = opts.statusCode
    return e
  },
}))

const mockSingle = vi.fn()
const mockEq = vi.fn(() => ({ single: mockSingle }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockUpsert = vi.fn().mockResolvedValue({ error: null })
const mockDeleteEq = vi.fn().mockResolvedValue({ error: null })
const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }))
const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  upsert: mockUpsert,
  delete: mockDelete,
}))

vi.stubGlobal('useSupabaseServiceClient', () => ({ from: mockFrom }))
vi.stubGlobal('useRuntimeConfig', () => ({ turnstileSecretKey: '' }))

const { readBody } = await import('h3')
const handler = (await import('../../server/api/auth/check-lockout.post')).default

describe('POST /api/auth/check-lockout', () => {
  const mockEvent = { node: { req: { headers: {} } } }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects request without email or action', async () => {
    vi.mocked(readBody).mockResolvedValue({})
    await expect(handler(mockEvent as never)).rejects.toThrow('email and action')
  })

  it('rejects invalid action', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: 'test@test.com', action: 'invalid' })
    await expect(handler(mockEvent as never)).rejects.toThrow('email and action')
  })

  it('returns unlocked when no record exists (check)', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: 'test@test.com', action: 'check' })
    mockSingle.mockResolvedValue({ data: null, error: null })

    const result = await handler(mockEvent as never)
    expect(result).toEqual({ locked: false, attemptsRemaining: 5 })
  })

  it('returns locked when locked_until is in the future (check)', async () => {
    const futureDate = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    vi.mocked(readBody).mockResolvedValue({ email: 'test@test.com', action: 'check' })
    mockSingle.mockResolvedValue({
      data: { attempts: 5, first_attempt_at: new Date().toISOString(), locked_until: futureDate },
      error: null,
    })

    const result = await handler(mockEvent as never) as { locked: boolean; retryAfterSeconds: number }
    expect(result.locked).toBe(true)
    expect(result.retryAfterSeconds).toBeGreaterThan(0)
    expect(result.attemptsRemaining).toBe(0)
  })

  it('resets when lock has expired (check)', async () => {
    const pastDate = new Date(Date.now() - 1000).toISOString()
    vi.mocked(readBody).mockResolvedValue({ email: 'test@test.com', action: 'check' })
    mockSingle.mockResolvedValue({
      data: { attempts: 5, first_attempt_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), locked_until: pastDate },
      error: null,
    })

    const result = await handler(mockEvent as never)
    expect(result.locked).toBe(false)
    expect(mockDelete).toHaveBeenCalled()
  })

  it('resets when window has expired (check)', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: 'test@test.com', action: 'check' })
    mockSingle.mockResolvedValue({
      data: {
        attempts: 3,
        first_attempt_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        locked_until: null,
      },
      error: null,
    })

    const result = await handler(mockEvent as never)
    expect(result.locked).toBe(false)
    expect(mockDelete).toHaveBeenCalled()
  })

  it('returns correct attemptsRemaining within window (check)', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: 'test@test.com', action: 'check' })
    mockSingle.mockResolvedValue({
      data: { attempts: 3, first_attempt_at: new Date().toISOString(), locked_until: null },
      error: null,
    })

    const result = await handler(mockEvent as never)
    expect(result).toEqual({ locked: false, attemptsRemaining: 2 })
  })

  it('creates new record on first failure (record_failure)', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: 'new@test.com', action: 'record_failure' })
    mockSingle.mockResolvedValue({ data: null, error: null })

    const result = await handler(mockEvent as never)
    expect(result.locked).toBe(false)
    expect(result.attemptsRemaining).toBe(4)
    expect(mockInsert).toHaveBeenCalled()
  })

  it('increments attempts on subsequent failure (record_failure)', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: 'test@test.com', action: 'record_failure' })
    mockSingle.mockResolvedValue({
      data: { attempts: 3, first_attempt_at: new Date().toISOString() },
      error: null,
    })

    const result = await handler(mockEvent as never)
    expect(result.locked).toBe(false)
    expect(result.attemptsRemaining).toBe(1)
    expect(mockUpsert).toHaveBeenCalled()
  })

  it('locks account at 5th failure (record_failure)', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: 'test@test.com', action: 'record_failure' })
    mockSingle.mockResolvedValue({
      data: { attempts: 4, first_attempt_at: new Date().toISOString() },
      error: null,
    })

    const result = await handler(mockEvent as never) as { locked: boolean; retryAfterSeconds: number }
    expect(result.locked).toBe(true)
    expect(result.retryAfterSeconds).toBeGreaterThan(0)
    expect(result.attemptsRemaining).toBe(0)
    // Verify upsert was called with locked_until
    const upsertArg = mockUpsert.mock.calls[0][0]
    expect(upsertArg.locked_until).toBeTruthy()
  })

  it('resets window on expired failure (record_failure)', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: 'test@test.com', action: 'record_failure' })
    mockSingle.mockResolvedValue({
      data: { attempts: 4, first_attempt_at: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
      error: null,
    })

    const result = await handler(mockEvent as never)
    expect(result.locked).toBe(false)
    expect(result.attemptsRemaining).toBe(4) // Reset to 1 attempt, so 4 remaining
  })

  it('normalizes email to lowercase (check)', async () => {
    vi.mocked(readBody).mockResolvedValue({ email: ' Test@Test.COM ', action: 'check' })
    mockSingle.mockResolvedValue({ data: null, error: null })

    await handler(mockEvent as never)
    expect(mockEq).toHaveBeenCalledWith('email', 'test@test.com')
  })
})
