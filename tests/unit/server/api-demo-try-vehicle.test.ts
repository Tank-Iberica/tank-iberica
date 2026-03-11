import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockReadBody, mockSafeError, mockCallAI, mockCheckRateLimit, mockGetRateLimitKey, mockGetRetryAfterSeconds } =
  vi.hoisted(() => ({
    mockReadBody: vi.fn().mockResolvedValue({
      images: [{ data: 'base64data', mediaType: 'image/jpeg' }],
      brand: 'Volvo',
      model: 'FH16',
    }),
    mockSafeError: vi.fn((status: number, msg: string) => {
      const err = new Error(msg)
      ;(err as any).statusCode = status
      return err
    }),
    mockCallAI: vi.fn().mockResolvedValue({
      text: '{"title":"Volvo FH16","description":"Great truck","category":"camiones","subcategory":"tractora","brand":"Volvo","model":"FH16","year":2020,"estimatedPrice":"80.000€","highlights":["A","B","C"]}',
      provider: 'anthropic',
    }),
    mockCheckRateLimit: vi.fn().mockReturnValue(true),
    mockGetRateLimitKey: vi.fn().mockReturnValue('1.2.3.4'),
    mockGetRetryAfterSeconds: vi.fn().mockReturnValue(3600),
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

vi.mock('~~/server/utils/safeError', () => ({ safeError: mockSafeError }))
vi.mock('~~/server/services/aiProvider', () => ({ callAI: mockCallAI }))
vi.mock('~~/server/utils/rateLimit', () => ({
  checkRateLimit: mockCheckRateLimit,
  getRateLimitKey: mockGetRateLimitKey,
  getRetryAfterSeconds: mockGetRetryAfterSeconds,
}))

import handler from '../../../server/api/demo/try-vehicle.post'

describe('POST /api/demo/try-vehicle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCheckRateLimit.mockReturnValue(true)
    mockReadBody.mockResolvedValue({
      images: [{ data: 'base64data', mediaType: 'image/jpeg' }],
      brand: 'Volvo',
      model: 'FH16',
    })
    mockCallAI.mockResolvedValue({
      text: '{"title":"Volvo FH16","description":"Great truck","category":"camiones","subcategory":"tractora","brand":"Volvo","model":"FH16","year":2020,"estimatedPrice":"80.000€","highlights":["A","B","C"]}',
      provider: 'anthropic',
    })
  })

  it('throws 429 when rate limit exceeded', async () => {
    mockCheckRateLimit.mockReturnValue(false)
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 429 })
  })

  it('throws 400 when images array is empty', async () => {
    mockReadBody.mockResolvedValue({ images: [] })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when images is not an array', async () => {
    mockReadBody.mockResolvedValue({ images: null })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when more than 4 images', async () => {
    mockReadBody.mockResolvedValue({
      images: Array(5).fill({ data: 'x', mediaType: 'image/jpeg' }),
    })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when image missing mediaType', async () => {
    mockReadBody.mockResolvedValue({
      images: [{ data: 'base64data' }],
    })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when image exceeds 5MB limit', async () => {
    const oversized = 'x'.repeat(8 * 1024 * 1024)
    mockReadBody.mockResolvedValue({
      images: [{ data: oversized, mediaType: 'image/jpeg' }],
    })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns success preview with parsed AI JSON', async () => {
    const result = await handler({} as any)
    expect(result.success).toBe(true)
    expect(result.preview.title).toBe('Volvo FH16')
    expect(result.preview.category).toBe('camiones')
    expect(result.preview.year).toBe(2020)
    expect(result.preview.imageCount).toBe(1)
    expect(result.provider).toBe('anthropic')
  })

  it('returns fallback preview when callAI throws', async () => {
    mockCallAI.mockRejectedValue(new Error('timeout'))
    const result = await handler({} as any)
    expect(result.success).toBe(true)
    expect(result.provider).toBe('fallback')
    expect(result.preview.brand).toBe('Volvo')
    expect(result.preview.model).toBe('FH16')
  })

  it('returns fallback when AI does not return valid JSON', async () => {
    mockCallAI.mockResolvedValue({ text: 'not json at all', provider: 'anthropic' })
    const result = await handler({} as any)
    expect(result.success).toBe(true)
    expect(result.provider).toBe('fallback')
  })

  it('uses brand/model from body as fallback in preview title', async () => {
    mockCallAI.mockRejectedValue(new Error('fail'))
    mockReadBody.mockResolvedValue({
      images: [{ data: 'x', mediaType: 'image/jpeg' }],
      brand: 'DAF',
      model: 'XF',
    })
    const result = await handler({} as any)
    expect(result.preview.title).toBe('DAF XF')
  })

  it('uses default title when brand and model absent in fallback', async () => {
    mockCallAI.mockRejectedValue(new Error('fail'))
    mockReadBody.mockResolvedValue({
      images: [{ data: 'x', mediaType: 'image/jpeg' }],
    })
    const result = await handler({} as any)
    expect(result.preview.title).toBe('Vehículo Industrial')
  })

  it('calls callAI with background + vision', async () => {
    await handler({} as any)
    expect(mockCallAI).toHaveBeenCalledWith(
      expect.objectContaining({ messages: expect.any(Array), maxTokens: 1024 }),
      'background',
      'vision',
    )
  })
})
