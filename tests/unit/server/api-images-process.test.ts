import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockServerUser, mockReadBody } = vi.hoisted(() => ({
  mockServerUser: vi.fn(),
  mockReadBody: vi.fn(),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: (...a: unknown[]) => mockReadBody(...a),
  createError: (opts: { statusCode?: number; statusMessage?: string; data?: unknown }) => {
    const err = new Error(opts.statusMessage ?? 'Error')
    ;(err as any).statusCode = opts.statusCode
    return err
  },
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseUser: (...a: unknown[]) => mockServerUser(...a),
}))

vi.mock('../../../server/utils/safeError', () => ({
  safeError: (_code: number, msg: string) => {
    const err = new Error(msg) as Error & { statusCode: number }
    err.statusCode = _code
    return err
  },
}))

vi.stubGlobal('useRuntimeConfig', () => ({
  cloudflareImagesApiToken: undefined,
  cloudflareAccountId: undefined,
  cloudflareImagesDeliveryUrl: undefined,
  imagePipelineMode: 'cloudinary',
}))
vi.stubGlobal('$fetch', vi.fn())

import handler from '../../../server/api/images/process.post'

describe('POST /api/images/process', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('useRuntimeConfig', () => ({
      cloudflareImagesApiToken: undefined,
      cloudflareAccountId: undefined,
      cloudflareImagesDeliveryUrl: undefined,
      imagePipelineMode: 'cloudinary',
    }))
  })

  it('throws 401 when not authenticated', async () => {
    mockServerUser.mockResolvedValue(null)
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when cloudinaryUrl is missing', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockReadBody.mockResolvedValue({})
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 for non-cloudinary URL', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockReadBody.mockResolvedValue({ cloudinaryUrl: 'https://evil.com/image.jpg' })
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 for invalid URL', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockReadBody.mockResolvedValue({ cloudinaryUrl: 'not-a-url' })
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns cloudinary variants in cloudinary mode', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockReadBody.mockResolvedValue({
      cloudinaryUrl: 'https://res.cloudinary.com/demo/image/upload/test.jpg',
    })

    const result = await (handler as Function)({})
    expect(result.pipeline).toBe('cloudinary')
    expect(result.original).toBe('https://res.cloudinary.com/demo/image/upload/test.jpg')
    expect(result.urls.thumb).toContain('w_300')
    expect(result.urls.card).toContain('w_600')
    expect(result.urls.gallery).toContain('w_1200')
    expect(result.urls.og).toContain('w_1200,h_630')
  })

  it('falls back to cloudinary when CF keys are missing', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      cloudflareImagesApiToken: undefined,
      cloudflareAccountId: undefined,
      cloudflareImagesDeliveryUrl: undefined,
      imagePipelineMode: 'hybrid', // hybrid requested but keys missing
    }))
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockReadBody.mockResolvedValue({
      cloudinaryUrl: 'https://res.cloudinary.com/demo/image/upload/test.jpg',
    })

    const result = await (handler as Function)({})
    expect(result.pipeline).toBe('cloudinary')
  })

  it('processes hybrid mode with CF Images', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      cloudflareImagesApiToken: 'cf-token',
      cloudflareAccountId: 'cf-account',
      cloudflareImagesDeliveryUrl: 'https://imagedelivery.net/abc',
      imagePipelineMode: 'hybrid',
    }))

    const mockFetch = vi.fn()
      .mockResolvedValueOnce(new ArrayBuffer(100)) // fetch thumb buffer
      .mockResolvedValueOnce({ success: true, result: { id: 'img-1', variants: [] } }) // upload thumb
      .mockResolvedValueOnce(new ArrayBuffer(100)) // fetch card buffer
      .mockResolvedValueOnce({ success: true, result: { id: 'img-2', variants: [] } }) // upload card
      .mockResolvedValueOnce(new ArrayBuffer(100)) // fetch gallery
      .mockResolvedValueOnce({ success: true, result: { id: 'img-3', variants: [] } }) // upload gallery
      .mockResolvedValueOnce(new ArrayBuffer(100)) // fetch og
      .mockResolvedValueOnce({ success: true, result: { id: 'img-4', variants: [] } }) // upload og
    vi.stubGlobal('$fetch', mockFetch)

    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockReadBody.mockResolvedValue({
      cloudinaryUrl: 'https://res.cloudinary.com/demo/image/upload/test.jpg',
      vehicleId: '00000000-0000-0000-0000-000000000001',
    })

    const result = await (handler as Function)({})
    expect(result.pipeline).toBe('hybrid')
    expect(result.urls.thumb).toContain('img-1')
  })

  it('falls back to cloudinary URL when CF upload fails for a variant', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      cloudflareImagesApiToken: 'cf-token',
      cloudflareAccountId: 'cf-account',
      cloudflareImagesDeliveryUrl: 'https://imagedelivery.net/abc',
      imagePipelineMode: 'cf_images_only',
    }))

    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new Error('Network error')) // thumb fails
      .mockResolvedValueOnce(new ArrayBuffer(100)) // card fetch
      .mockResolvedValueOnce({ success: true, result: { id: 'img-2', variants: [] } }) // card upload
      .mockResolvedValueOnce(new ArrayBuffer(100)) // gallery fetch
      .mockResolvedValueOnce({ success: true, result: { id: 'img-3', variants: [] } }) // gallery upload
      .mockResolvedValueOnce(new ArrayBuffer(100)) // og fetch
      .mockResolvedValueOnce({ success: true, result: { id: 'img-4', variants: [] } }) // og upload
    vi.stubGlobal('$fetch', mockFetch)

    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockReadBody.mockResolvedValue({
      cloudinaryUrl: 'https://res.cloudinary.com/demo/image/upload/test.jpg',
    })

    const result = await (handler as Function)({})
    // thumb should fall back to cloudinary URL
    expect(result.urls.thumb).toContain('cloudinary.com')
    // card should use CF Images
    expect(result.urls.card).toContain('img-2')
  })

  it('throws 400 for HTTP (non-HTTPS) cloudinary URL', async () => {
    mockServerUser.mockResolvedValue({ id: 'u1' })
    mockReadBody.mockResolvedValue({ cloudinaryUrl: 'http://res.cloudinary.com/demo/image/upload/test.jpg' })
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 400 })
  })
})
