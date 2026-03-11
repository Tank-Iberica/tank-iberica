import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — must be hoisted before any imports
// ---------------------------------------------------------------------------

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  createError: vi.fn((args: unknown) => args),
  readBody: vi.fn(),
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseUser: vi.fn(),
}))

vi.mock('~~/server/services/aiProvider', () => ({
  callAI: vi.fn(),
}))

vi.mock('~~/server/utils/validateBody', () => ({
  validateBody: vi.fn(),
}))

vi.mock('~~/server/utils/sanitizeInput', () => ({
  sanitizeText: vi.fn((str: string) => str),
}))

vi.mock('~~/server/utils/safeError', () => ({
  safeError: vi.fn((status: number, msg: string) => {
    const err = new Error(msg) as Error & { statusCode: number }
    err.statusCode = status
    return err
  }),
}))

vi.mock('~~/server/utils/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

// ---------------------------------------------------------------------------
// Static imports (after mocks)
// ---------------------------------------------------------------------------

import { serverSupabaseUser } from '#supabase/server'
import { callAI } from '~~/server/services/aiProvider'
import { validateBody } from '~~/server/utils/validateBody'
import handler from '~~/server/api/generate-description.post'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const mockEvent = {} as Parameters<typeof handler>[0]

const mockUser = { id: 'user-1', email: 'dealer@test.com' } as Awaited<
  ReturnType<typeof serverSupabaseUser>
>

const defaultBody = {
  brand: 'Volvo',
  model: 'FH16',
  year: 2020,
  km: 150000,
  category: 'Camión',
  subcategory: 'Tractor',
  attributes: { motor: 'D13', cv: '500' },
}

const mockAiResponse = {
  text: '  Excelente camión Volvo FH16 del año 2020.  ',
  provider: 'anthropic',
  model: 'claude-haiku-4-5',
  latencyMs: 420,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/generate-description', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --- Authentication ---

  it('throws 401 when user is not authenticated', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValueOnce(null)

    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 401 })
  })

  // --- Successful generation ---

  it('returns trimmed description from AI on success', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValueOnce(mockUser)
    vi.mocked(validateBody).mockResolvedValueOnce(defaultBody)
    vi.mocked(callAI).mockResolvedValueOnce(mockAiResponse)

    const result = await handler(mockEvent)

    expect(result.description).toBe('Excelente camión Volvo FH16 del año 2020.')
    expect(result.aiUnavailable).toBeUndefined()
  })

  it('calls callAI with realtime preset and fast model', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValueOnce(mockUser)
    vi.mocked(validateBody).mockResolvedValueOnce({ brand: 'MAN', model: 'TGX' })
    vi.mocked(callAI).mockResolvedValueOnce(mockAiResponse)

    await handler(mockEvent)

    expect(vi.mocked(callAI)).toHaveBeenCalledWith(
      expect.objectContaining({ messages: expect.any(Array), maxTokens: 500 }),
      'realtime',
      'fast',
    )
  })

  it('builds prompt with vehicle data', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValueOnce(mockUser)
    vi.mocked(validateBody).mockResolvedValueOnce(defaultBody)
    vi.mocked(callAI).mockResolvedValueOnce(mockAiResponse)

    await handler(mockEvent)

    const calledWith = vi.mocked(callAI).mock.calls[0]![0]
    const prompt = (calledWith.messages[0] as { content: string }).content
    expect(prompt).toContain('Volvo')
    expect(prompt).toContain('FH16')
    expect(prompt).toContain('2020')
  })

  // --- Graceful AI fallback ---

  it('returns empty description and aiUnavailable=true when AI throws', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValueOnce(mockUser)
    vi.mocked(validateBody).mockResolvedValueOnce(defaultBody)
    vi.mocked(callAI).mockRejectedValueOnce(new Error('Circuit open'))

    const result = await handler(mockEvent)

    expect(result.description).toBe('')
    expect(result.aiUnavailable).toBe(true)
  })

  it('returns empty description when AI returns timeout error', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValueOnce(mockUser)
    vi.mocked(validateBody).mockResolvedValueOnce({ brand: 'Scania', model: 'R500' })
    vi.mocked(callAI).mockRejectedValueOnce(new Error('AbortError: timeout'))

    const result = await handler(mockEvent)

    expect(result.description).toBe('')
    expect(result.aiUnavailable).toBe(true)
  })

  it('returns empty description when all providers fail', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValueOnce(mockUser)
    vi.mocked(validateBody).mockResolvedValueOnce({ brand: 'DAF', model: 'XF' })
    vi.mocked(callAI).mockRejectedValueOnce(new Error('All AI providers failed: anthropic: timeout; openai: 503'))

    const result = await handler(mockEvent)

    expect(result.description).toBe('')
    expect(result.aiUnavailable).toBe(true)
  })

  // --- Edge cases ---

  it('works with minimal body (only brand + model)', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValueOnce(mockUser)
    vi.mocked(validateBody).mockResolvedValueOnce({ brand: 'Mercedes', model: 'Actros' })
    vi.mocked(callAI).mockResolvedValueOnce({ ...mockAiResponse, text: 'Descripción básica.' })

    const result = await handler(mockEvent)

    expect(result.description).toBe('Descripción básica.')
  })

  it('does not throw even if non-Error is thrown by AI', async () => {
    vi.mocked(serverSupabaseUser).mockResolvedValueOnce(mockUser)
    vi.mocked(validateBody).mockResolvedValueOnce({ brand: 'Iveco', model: 'S-Way' })
    vi.mocked(callAI).mockRejectedValueOnce('string error')

    const result = await handler(mockEvent)

    expect(result.description).toBe('')
    expect(result.aiUnavailable).toBe(true)
  })
})
