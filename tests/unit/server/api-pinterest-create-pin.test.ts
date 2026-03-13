/**
 * Tests for POST /api/pinterest/create-pin
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockServerUser, mockValidateBody } = vi.hoisted(() => ({
  mockServerUser: vi.fn(),
  mockValidateBody: vi.fn(),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseUser: (...a: unknown[]) => mockServerUser(...a),
  serverSupabaseServiceRole: () => mockSupabase,
}))

vi.mock('~~/server/utils/safeError', () => ({
  safeError: (_code: number, msg: string) => {
    const err = new Error(msg) as Error & { statusCode: number }
    err.statusCode = _code
    return err
  },
}))

vi.mock('~~/server/utils/validateBody', () => ({
  validateBody: (...a: unknown[]) => mockValidateBody(...a),
}))

vi.mock('~~/server/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('~~/server/utils/siteConfig', () => ({
  getSiteUrl: () => 'https://tracciona.com',
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

let mockSupabase: Record<string, unknown>

const VALID_UUID = '12345678-1234-1234-1234-123456789abc'

const VEHICLE = {
  id: VALID_UUID,
  brand: 'Komatsu',
  model: 'PC210',
  year: 2021,
  price: 12000000,
  location: 'Barcelona',
  slug: 'komatsu-pc210-2021',
  vehicle_images: [
    { url: 'https://cdn.example.com/komatsu.jpg', position: 0 },
    { url: 'https://cdn.example.com/komatsu2.jpg', position: 1 },
  ],
  subcategories: { name: { es: 'Excavadoras', en: 'Excavators' } },
}

function makeSupabase(opts: {
  vehicleData?: unknown
  vehicleError?: unknown
  configRows?: { key: string; value: string }[] | null
} = {}) {
  const { vehicleData = null, vehicleError = null, configRows = null } = opts

  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'vehicles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: vehicleData, error: vehicleError }),
        }
      }
      if (table === 'vertical_config') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: configRows, error: null }),
        }
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null }) }
    }),
  }
}

import handler, { createPinterestPin } from '../../../server/api/pinterest/create-pin.post'

describe('POST /api/pinterest/create-pin', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockServerUser.mockResolvedValue({ id: 'admin-1' })
    mockValidateBody.mockResolvedValue({ vehicleId: VALID_UUID })
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'pin-abc', link: 'https://pinterest.com/pin/pin-abc' }),
    })
    process.env.PINTEREST_ACCESS_TOKEN = 'pint-token'
    process.env.PINTEREST_BOARD_ID = 'board-123'
    mockSupabase = makeSupabase({ vehicleData: VEHICLE })
  })

  it('creates pin and returns ok=true with pinId', async () => {
    const result = await handler({} as any)
    expect(result).toEqual({
      ok: true,
      vehicleId: VALID_UUID,
      pinId: 'pin-abc',
      pinUrl: 'https://pinterest.com/pin/pin-abc',
    })
  })

  it('returns 401 when user not authenticated', async () => {
    mockServerUser.mockResolvedValue(null)
    await expect(handler({} as any)).rejects.toThrow('Unauthorized')
  })

  it('skips gracefully when env vars not configured and no vertical_config', async () => {
    delete process.env.PINTEREST_ACCESS_TOKEN
    delete process.env.PINTEREST_BOARD_ID
    mockSupabase = makeSupabase({ vehicleData: VEHICLE, configRows: [] })
    const result = await handler({} as any)
    expect(result).toMatchObject({ ok: false, skipped: true, reason: 'Pinterest not configured' })
  })

  it('uses credentials from vertical_config as fallback', async () => {
    delete process.env.PINTEREST_ACCESS_TOKEN
    delete process.env.PINTEREST_BOARD_ID
    mockSupabase = makeSupabase({
      vehicleData: VEHICLE,
      configRows: [
        { key: 'pinterest_access_token', value: 'config-token' },
        { key: 'pinterest_board_id', value: 'config-board' },
      ],
    })
    const result = await handler({} as any)
    expect(result).toMatchObject({ ok: true })
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.pinterest.com/v5/pins',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer config-token' }),
      }),
    )
  })

  it('env vars take precedence over vertical_config', async () => {
    // env vars ARE set (from beforeEach), vertical_config also has values
    mockSupabase = makeSupabase({
      vehicleData: VEHICLE,
      configRows: [
        { key: 'pinterest_access_token', value: 'config-token-ignored' },
        { key: 'pinterest_board_id', value: 'config-board-ignored' },
      ],
    })
    const result = await handler({} as any)
    expect(result).toMatchObject({ ok: true })
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.pinterest.com/v5/pins',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer pint-token' }),
      }),
    )
  })

  it('skips when vehicle has no images', async () => {
    mockSupabase = makeSupabase({
      vehicleData: { ...VEHICLE, vehicle_images: [] },
    })
    const result = await handler({} as any)
    expect(result).toMatchObject({ ok: false, skipped: true, reason: expect.stringContaining('image') })
  })

  it('throws 404 when vehicle not found', async () => {
    mockSupabase = makeSupabase({ vehicleData: null, vehicleError: new Error('not found') })
    await expect(handler({} as any)).rejects.toThrow('Vehicle not found')
  })

  it('propagates Pinterest API error as 502', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized'),
    })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 502 })
  })

  it('posts to Pinterest v5 API with correct structure', async () => {
    await handler({} as any)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.pinterest.com/v5/pins',
      expect.objectContaining({ method: 'POST' }),
    )
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.board_id).toBe('board-123')
    expect(body.media_source.source_type).toBe('image_url')
    expect(body.link).toContain('/vehiculo/komatsu-pc210-2021')
  })

  it('uses primary image (position 0)', async () => {
    await handler({} as any)
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.media_source.url).toBe('https://cdn.example.com/komatsu.jpg')
  })

  it('truncates title to 100 chars', async () => {
    const longBrand = 'A'.repeat(90)
    mockSupabase = makeSupabase({ vehicleData: { ...VEHICLE, brand: longBrand, model: 'Long Model Name Here' } })
    await handler({} as any)
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.title.length).toBeLessThanOrEqual(100)
  })

  it('truncates description to 500 chars', async () => {
    mockSupabase = makeSupabase({ vehicleData: { ...VEHICLE, location: 'L'.repeat(400) } })
    await handler({} as any)
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.description.length).toBeLessThanOrEqual(500)
  })

  it('falls back to Spanish subcategory name', async () => {
    await handler({} as any)
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.description).toContain('Excavadoras')
  })

  it('uses default category when subcategory missing', async () => {
    mockSupabase = makeSupabase({ vehicleData: { ...VEHICLE, subcategories: null } })
    await handler({} as any)
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.description).toContain('Maquinaria industrial')
  })
})

describe('createPinterestPin (unit)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'pin-xyz', link: 'https://pinterest.com/pin/pin-xyz' }),
    })
  })

  it('returns pin id and link', async () => {
    const payload = {
      board_id: 'board-1',
      title: 'Test Pin',
      description: 'A test pin',
      link: 'https://example.com',
      media_source: { source_type: 'image_url' as const, url: 'https://img.example.com/img.jpg' },
    }
    const result = await createPinterestPin(payload, 'my-token')
    expect(result).toEqual({ id: 'pin-xyz', link: 'https://pinterest.com/pin/pin-xyz' })
  })

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      text: () => Promise.resolve('Unprocessable Entity'),
    })
    await expect(
      createPinterestPin(
        { board_id: 'b', title: 't', description: 'd', link: 'https://x.com', media_source: { source_type: 'image_url', url: 'https://img.jpg' } },
        'tok',
      ),
    ).rejects.toThrow('Pinterest API error (422)')
  })
})
