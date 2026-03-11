import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockReadBody, mockSafeError, mockSupabaseUser, mockCallAI } = vi.hoisted(() => ({
  mockReadBody: vi.fn().mockResolvedValue({ brand: 'Volvo', model: 'FH16' }),
  mockSafeError: vi.fn((status: number, msg: string) => {
    const err = new Error(msg)
    ;(err as any).statusCode = status
    return err
  }),
  mockSupabaseUser: vi.fn().mockResolvedValue({ id: 'user-1' }),
  mockCallAI: vi.fn().mockResolvedValue({ text: '  Great vehicle description  ', provider: 'anthropic' }),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: mockReadBody,
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

import handler from '../../../server/api/generate-description.post'

describe('POST /api/generate-description', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    mockReadBody.mockResolvedValue({ brand: 'Volvo', model: 'FH16' })
    mockCallAI.mockResolvedValue({ text: '  Great vehicle description  ', provider: 'anthropic' })
  })

  it('throws 401 when user not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when brand is missing', async () => {
    mockReadBody.mockResolvedValue({ model: 'FH16' })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when brand is not a string', async () => {
    mockReadBody.mockResolvedValue({ brand: 123, model: 'FH16' })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when model is missing', async () => {
    mockReadBody.mockResolvedValue({ brand: 'Volvo' })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns trimmed description from AI', async () => {
    const result = await handler({} as any)
    expect(result).toEqual({ description: 'Great vehicle description' })
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
    mockReadBody.mockResolvedValue({ brand: 'Mercedes', model: 'Actros', year: 2020 })
    await handler({} as any)
    const [callArgs] = mockCallAI.mock.calls
    const prompt = callArgs[0].messages[0].content
    expect(prompt).toContain('Mercedes')
    expect(prompt).toContain('Actros')
  })

  it('includes optional fields in prompt when present', async () => {
    mockReadBody.mockResolvedValue({
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

  it('throws 500 when callAI throws', async () => {
    mockCallAI.mockRejectedValue(new Error('API timeout'))
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 500 })
    expect(mockSafeError).toHaveBeenCalledWith(500, expect.stringContaining('API timeout'))
  })
})
