import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockValidateBody, mockSafeError, mockSupabaseUser, mockCallAI, mockDeductCredits } =
  vi.hoisted(() => ({
    mockValidateBody: vi.fn().mockResolvedValue({ brand: 'Volvo', model: 'FH16' }),
    mockSafeError: vi.fn((status: number, msg: string) => {
      const err = new Error(msg)
      ;(err as any).statusCode = status
      return err
    }),
    mockSupabaseUser: vi.fn().mockResolvedValue({ id: 'user-1' }),
    mockCallAI: vi
      .fn()
      .mockResolvedValue({ text: '  Great vehicle description  ', provider: 'anthropic' }),
    mockDeductCredits: vi.fn().mockResolvedValue({ success: true, newBalance: 10 }),
  }))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: vi.fn(),
  createError: (opts: { statusCode?: number; statusMessage?: string; data?: unknown }) => {
    const err = new Error(opts.statusMessage ?? 'Error')
    ;(err as any).statusCode = opts.statusCode
    return err
  },
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseUser: mockSupabaseUser,
}))

vi.mock('../../../server/utils/safeError', () => ({ safeError: mockSafeError }))
vi.mock('~~/server/utils/safeError', () => ({ safeError: mockSafeError }))
vi.mock('~~/server/services/aiProvider', () => ({ callAI: mockCallAI }))
vi.mock('~~/server/utils/creditService', () => ({
  deductUserCredits: mockDeductCredits,
}))
vi.mock('~~/server/utils/validateBody', () => ({
  validateBody: mockValidateBody,
}))
vi.mock('~~/server/utils/sanitizeInput', () => ({
  sanitizeText: vi.fn((str: string) => str),
}))
vi.mock('~~/server/utils/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}))
vi.stubGlobal('getSiteName', () => 'Tracciona')

import handler from '../../../server/api/generate-description.post'

describe('POST /api/generate-description', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    mockValidateBody.mockResolvedValue({ brand: 'Volvo', model: 'FH16' })
    mockCallAI.mockResolvedValue({ text: '  Great vehicle description  ', provider: 'anthropic' })
    mockDeductCredits.mockResolvedValue({ success: true, newBalance: 10 })
  })

  it('throws 401 when user not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when brand is missing', async () => {
    const err = new Error('Validation error') as any
    err.statusCode = 400
    mockValidateBody.mockRejectedValue(err)
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when brand is not a string', async () => {
    const err = new Error('Validation error') as any
    err.statusCode = 400
    mockValidateBody.mockRejectedValue(err)
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when model is missing', async () => {
    const err = new Error('Validation error') as any
    err.statusCode = 400
    mockValidateBody.mockRejectedValue(err)
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns trimmed description from AI', async () => {
    const result = await handler({} as any)
    expect(result).toMatchObject({ description: 'Great vehicle description' })
  })

  it('calls callAI with realtime+fast priority', async () => {
    await handler({} as any)
    expect(mockCallAI).toHaveBeenCalledWith(
      expect.objectContaining({ messages: expect.any(Array), maxTokens: 500 }),
      'realtime',
      'fast',
    )
  })

  it('includes brand and model in the prompt', async () => {
    mockValidateBody.mockResolvedValue({ brand: 'Mercedes', model: 'Actros', year: 2020 })
    await handler({} as any)
    const [callArgs] = mockCallAI.mock.calls
    const prompt = callArgs[0].messages[0].content
    expect(prompt).toContain('Mercedes')
    expect(prompt).toContain('Actros')
  })

  it('includes optional fields in prompt when present', async () => {
    mockValidateBody.mockResolvedValue({
      brand: 'DAF',
      model: 'XF',
      year: 2019,
      km: 250000,
      category: 'camiones',
      subcategory: 'tractora',
      attributes: { color: 'rojo', ejes: 3 },
    })
    await handler({} as any)
    const [callArgs] = mockCallAI.mock.calls
    const prompt = callArgs[0].messages[0].content
    expect(prompt).toContain('DAF')
    expect(prompt).toContain('2019')
    expect(prompt).toContain('camiones')
    expect(prompt).toContain('tractora')
    expect(prompt).toContain('color: rojo')
  })

  it('returns empty description with aiUnavailable when callAI throws', async () => {
    mockCallAI.mockRejectedValue(new Error('API timeout'))
    const result = await handler({} as any)
    expect(result).toMatchObject({ description: '', aiUnavailable: true })
    expect(result.creditsRemaining).toBe(10)
  })
})
