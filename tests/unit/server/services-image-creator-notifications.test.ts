/**
 * Tests for:
 * - server/services/imageUploader.ts
 * - server/services/vehicleCreator.ts
 * - server/services/notifications.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks (before imports) ──────────────────────────────────────────

const { mockFetchOfetch } = vi.hoisted(() => ({
  mockFetchOfetch: vi.fn(),
}))

vi.mock('ofetch', () => ({ $fetch: mockFetchOfetch }))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)
vi.stubGlobal('sendWhatsAppMessage', vi.fn())
vi.stubGlobal('useRuntimeConfig', () => ({
  public: {
    cloudinaryCloudName: 'test-cloud',
    cloudinaryUploadPreset: 'test-preset',
  },
}))

// ── Static imports ──────────────────────────────────────────────────────────

import { uploadToCloudinary, uploadImage } from '../../../server/services/imageUploader'
import {
  sanitizeSlug,
  createVehicle,
  createVehicleFromAI,
} from '../../../server/services/vehicleCreator'
import {
  notify,
  notifyDealer,
  notifyAdmin,
  notifyBuyer,
} from '../../../server/services/notifications'

// ── Supabase mock helpers ────────────────────────────────────────────────────

function makeChain(data: any = null, error: any = null) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  }
  chain.then = (onFulfilled: Function, onRejected?: Function) =>
    Promise.resolve({ data, error }).then(onFulfilled as any, onRejected as any)
  return chain
}

function makeMultiClient(steps: Array<{ data?: any; error?: any }>) {
  let callCount = 0
  return {
    from: vi.fn().mockImplementation(() => {
      const step = steps[callCount++] ?? { data: null, error: null }
      return makeChain(step.data ?? null, step.error ?? null)
    }),
  }
}

// ══ imageUploader.ts ═════════════════════════════════════════════════════════

describe('imageUploader — uploadToCloudinary', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns null when cloudName missing from config', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: {} }))
    const result = await uploadToCloudinary(Buffer.from('test'), { filename: 'test' })
    expect(result).toBeNull()
    // Restore
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: { cloudinaryCloudName: 'test-cloud', cloudinaryUploadPreset: 'test-preset' },
    }))
  })

  it('uses opts.cloudName and opts.uploadPreset when provided', async () => {
    const cloudResponse = {
      public_id: 'folder/file',
      secure_url: 'https://res.cloudinary.com/c/image/upload/file.jpg',
      width: 800, height: 600, format: 'jpg',
    }
    mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(cloudResponse) })
    const result = await uploadToCloudinary(Buffer.from('data'), {
      filename: 'test',
      cloudName: 'my-cloud',
      uploadPreset: 'my-preset',
    })
    expect(result).toMatchObject({ publicId: 'folder/file', width: 800 })
    const [url] = mockFetch.mock.calls[0]!
    expect(url).toContain('my-cloud')
  })

  it('returns null when fetch response is not ok', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: vi.fn().mockResolvedValue('error'),
    })
    const result = await uploadToCloudinary(Buffer.from('test'), {
      filename: 'test',
      cloudName: 'c',
      uploadPreset: 'p',
    })
    expect(result).toBeNull()
  })

  it('returns full ImageUploadResult on success', async () => {
    const cloudResponse = {
      public_id: 'tracciona/vehicles/volvo-fh16',
      secure_url: 'https://res.cloudinary.com/c/image/upload/volvo.jpg',
      width: 1920, height: 1080, format: 'jpg',
    }
    mockFetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(cloudResponse) })
    const result = await uploadToCloudinary(Buffer.from('img'), {
      filename: 'volvo-fh16',
      folder: 'tracciona/vehicles',
      cloudName: 'c',
      uploadPreset: 'p',
    })
    expect(result).toMatchObject({
      publicId: 'tracciona/vehicles/volvo-fh16',
      secureUrl: 'https://res.cloudinary.com/c/image/upload/volvo.jpg',
      width: 1920,
      height: 1080,
      format: 'jpg',
    })
  })
})

describe('imageUploader — uploadImage', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('delegates to cloudinary by default (IMAGE_PIPELINE_MODE unset)', async () => {
    delete process.env.IMAGE_PIPELINE_MODE
    mockFetch.mockResolvedValue({
      ok: false, status: 400, statusText: 'Err', text: vi.fn().mockResolvedValue(''),
    })
    const result = await uploadImage(Buffer.from('x'), { filename: 'f', cloudName: 'c', uploadPreset: 'p' })
    expect(mockFetch).toHaveBeenCalled()
    expect(result).toBeNull()
  })

  it('still delegates to cloudinary when mode is cf-images (not implemented)', async () => {
    process.env.IMAGE_PIPELINE_MODE = 'cf-images'
    mockFetch.mockResolvedValue({
      ok: false, status: 400, statusText: 'Err', text: vi.fn().mockResolvedValue(''),
    })
    const result = await uploadImage(Buffer.from('x'), { filename: 'f', cloudName: 'c', uploadPreset: 'p' })
    expect(result).toBeNull()
    delete process.env.IMAGE_PIPELINE_MODE
  })
})

// ══ vehicleCreator.ts — sanitizeSlug ════════════════════════════════════════

describe('vehicleCreator — sanitizeSlug', () => {
  it('lowercases and removes accents', () => {
    expect(sanitizeSlug('Café Renault')).toBe('cafe-renault')
  })

  it('replaces spaces and special chars with hyphens', () => {
    expect(sanitizeSlug('Volvo FH16 2022')).toBe('volvo-fh16-2022')
  })

  it('trims leading and trailing hyphens', () => {
    expect(sanitizeSlug('--test--')).toBe('test')
  })

  it('truncates to 120 chars', () => {
    const long = 'a'.repeat(200)
    expect(sanitizeSlug(long)).toHaveLength(120)
  })

  it('handles special characters (!, ?, &)', () => {
    expect(sanitizeSlug('MAN TGA 18.480!')).toBe('man-tga-18-480')
  })

  it('collapses multiple hyphens into one', () => {
    expect(sanitizeSlug('volvo   FH16')).toBe('volvo-fh16')
  })

  it('handles empty string', () => {
    expect(sanitizeSlug('')).toBe('')
  })
})

// ══ vehicleCreator.ts — createVehicle ═══════════════════════════════════════

describe('vehicleCreator — createVehicle', () => {
  it('creates vehicle and returns id + slug', async () => {
    const vehicle = { id: 'v1', slug: 'volvo-fh16' }
    const supabase = makeMultiClient([{ data: vehicle }])
    const result = await createVehicle(supabase as any, {
      brand: 'Volvo',
      model: 'FH16',
      slug: 'volvo-fh16',
    })
    expect(result).toMatchObject({ id: 'v1', slug: 'volvo-fh16' })
  })

  it('throws on Supabase error', async () => {
    const supabase = makeMultiClient([{ error: { message: 'duplicate key value' } }])
    await expect(
      createVehicle(supabase as any, { brand: 'Volvo', model: 'FH16', slug: 'volvo-fh16' }),
    ).rejects.toThrow('Failed to create vehicle')
  })

  it('throws when vehicle data is null (no error but no data)', async () => {
    const supabase = makeMultiClient([{ data: null, error: null }])
    await expect(
      createVehicle(supabase as any, { brand: 'Volvo', model: 'FH16', slug: 'volvo-fh16' }),
    ).rejects.toThrow('Failed to create vehicle')
  })

  it('uses draft status by default', async () => {
    const vehicle = { id: 'v1', slug: 'test' }
    const supabase = makeMultiClient([{ data: vehicle }])
    await createVehicle(supabase as any, { brand: 'X', model: 'Y', slug: 'test' })
    const fromCall = (supabase.from as any).mock.results[0].value
    const insertArgs = fromCall.insert.mock.calls[0][0]
    expect(insertArgs.status).toBe('draft')
  })

  it('uses provided status', async () => {
    const vehicle = { id: 'v1', slug: 'active-vehicle' }
    const supabase = makeMultiClient([{ data: vehicle }])
    await createVehicle(supabase as any, { brand: 'X', model: 'Y', slug: 'active-vehicle', status: 'active' })
    const fromCall = (supabase.from as any).mock.results[0].value
    const insertArgs = fromCall.insert.mock.calls[0][0]
    expect(insertArgs.status).toBe('active')
  })
})

// ══ vehicleCreator.ts — createVehicleFromAI ══════════════════════════════════

const sampleAnalysis = {
  brand: 'Volvo',
  model: 'FH16',
  year: 2020,
  category_name_es: 'Camiones',
  subcategory_name_es: null,
  license_plate: 'AB1234',
  title_es: 'Volvo FH16 2020',
  title_en: 'Volvo FH16 2020',
  description_es: 'Camión Volvo de alta potencia',
  description_en: 'High power Volvo truck',
  attributes_json: { km: 250000 },
  suggested_slug: 'volvo-fh16-2020',
  condition: 'usado',
  image_alt_texts: ['Volvo FH16 frontal', 'Volvo FH16 lateral'],
}

describe('vehicleCreator — createVehicleFromAI', () => {
  it('creates vehicle without images', async () => {
    const vehicle = { id: 'v1', slug: 'volvo-fh16-2020' }
    const supabase = makeMultiClient([
      { data: [{ id: 'cat-1', name_es: 'Camiones', slug: 'camiones' }] }, // categories
      { data: vehicle }, // vehicle insert
    ])
    const result = await createVehicleFromAI(supabase as any, sampleAnalysis, 'dealer-1', [], 'sub-1')
    expect(result).toMatchObject({ id: 'v1', slug: 'volvo-fh16-2020' })
  })

  it('matches category by name_es (case-insensitive)', async () => {
    const vehicle = { id: 'v2', slug: 'volvo-fh16-2020' }
    const supabase = makeMultiClient([
      { data: [{ id: 'cat-camiones', name_es: 'camiones', slug: 'camiones' }] },
      { data: vehicle },
    ])
    await createVehicleFromAI(supabase as any, sampleAnalysis, 'dealer-1', [], 'sub-1')
    const vehicleInsertChain = (supabase.from as any).mock.results[1].value
    const insertArgs = vehicleInsertChain.insert.mock.calls[0][0]
    expect(insertArgs.category_id).toBe('cat-camiones')
  })

  it('uses null category when no match found', async () => {
    const vehicle = { id: 'v3', slug: 'volvo-fh16-2020' }
    const supabase = makeMultiClient([
      { data: [{ id: 'cat-x', name_es: 'Trailers', slug: 'trailers' }] },
      { data: vehicle },
    ])
    await createVehicleFromAI(supabase as any, sampleAnalysis, null, [], 'sub-1')
    const vehicleInsertChain = (supabase.from as any).mock.results[1].value
    const insertArgs = vehicleInsertChain.insert.mock.calls[0][0]
    expect(insertArgs.category_id).toBeNull()
  })

  it('inserts vehicle images when provided', async () => {
    const vehicle = { id: 'v4', slug: 'volvo-fh16-2020' }
    const images = [
      {
        result: { publicId: 'p1', secureUrl: 'https://cdn/img.jpg', width: 800, height: 600, format: 'jpg' },
        altText: 'Volvo frontal',
        position: 0,
      },
    ]
    const supabase = makeMultiClient([
      { data: [] }, // categories
      { data: vehicle }, // vehicle insert
      { data: null, error: null }, // vehicle_images insert (success)
    ])
    const result = await createVehicleFromAI(supabase as any, sampleAnalysis, 'dealer-1', images, 'sub-1')
    expect(result.id).toBe('v4')
    // 3 from() calls: categories + vehicles + vehicle_images
    expect((supabase.from as any).mock.calls.length).toBe(3)
  })

  it('continues when vehicle_images insert fails', async () => {
    const vehicle = { id: 'v5', slug: 'volvo-fh16-2020' }
    const images = [
      {
        result: { publicId: 'p1', secureUrl: 'https://cdn/img.jpg', width: 800, height: 600, format: 'jpg' },
        altText: 'Volvo frontal',
        position: 0,
      },
    ]
    const supabase = makeMultiClient([
      { data: [] }, // categories
      { data: vehicle }, // vehicle insert
      { data: null, error: { message: 'image insert failed' } }, // vehicle_images error
    ])
    const result = await createVehicleFromAI(supabase as any, sampleAnalysis, 'dealer-1', images, 'sub-1')
    expect(result.id).toBe('v5') // still succeeds despite image error
  })

  it('generates slug from brand+model+timestamp when suggested_slug empty', async () => {
    const vehicle = { id: 'v6', slug: 'volvo-fh16-timestamp' }
    const supabase = makeMultiClient([
      { data: [] },
      { data: vehicle },
    ])
    const analysisNoSlug = { ...sampleAnalysis, suggested_slug: '' }
    const result = await createVehicleFromAI(supabase as any, analysisNoSlug, null, [], 'sub-2')
    expect(result.id).toBe('v6')
  })
})

// ══ notifications.ts ═════════════════════════════════════════════════════════

describe('notifications — notify', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('sends email channel successfully', async () => {
    mockFetchOfetch.mockResolvedValue({})
    const result = await notify('user-1', { type: 'vehicle_sold', channels: ['email'], data: {} })
    expect(result.sent).toContain('email')
    expect(result.failed).toHaveLength(0)
  })

  it('defaults to email channel when channels not specified', async () => {
    mockFetchOfetch.mockResolvedValue({})
    const result = await notify('user-1', { type: 'test', data: {} })
    expect(result.sent).toContain('email')
  })

  it('marks email as failed when $fetch throws', async () => {
    mockFetchOfetch.mockRejectedValue(new Error('network error'))
    const result = await notify('user-1', { type: 'test', channels: ['email'], data: {} })
    expect(result.failed).toContain('email')
    expect(result.sent).toHaveLength(0)
  })

  it('skips whatsapp when phone/message missing', async () => {
    const result = await notify('user-1', { type: 'test', channels: ['whatsapp'], data: {} })
    // no error thrown, nothing sent
    expect(result.sent).toHaveLength(0)
    expect(result.failed).toHaveLength(0)
  })

  it('sends whatsapp when phone and message are present', async () => {
    const mockWa = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('sendWhatsAppMessage', mockWa)
    const result = await notify('user-1', {
      type: 'test',
      channels: ['whatsapp'],
      data: { phone: '34612345678', message: 'Hello' },
    })
    expect(result.sent).toContain('whatsapp')
    expect(mockWa).toHaveBeenCalledWith('34612345678', 'Hello')
  })

  it('handles multiple channels — email ok, push skipped', async () => {
    mockFetchOfetch.mockResolvedValue({})
    const result = await notify('user-1', {
      type: 'test',
      channels: ['email', 'push'],
      data: {},
    })
    expect(result.sent).toContain('email')
    // push is not-yet-implemented, should not appear in sent or failed
    expect(result.failed).toHaveLength(0)
  })
})

describe('notifications — notifyDealer', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls $fetch for email even when no WhatsApp data', async () => {
    mockFetchOfetch.mockResolvedValue({})
    await notifyDealer('dealer-1', 'vehicle_sold', { amount: 50000 })
    expect(mockFetchOfetch).toHaveBeenCalled()
  })

  it('does not throw when email fails (best-effort)', async () => {
    mockFetchOfetch.mockRejectedValue(new Error('email error'))
    await expect(notifyDealer('dealer-1', 'test', {})).resolves.toBeUndefined()
  })

  it('sends WhatsApp when phone and message are present', async () => {
    const mockWa = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('sendWhatsAppMessage', mockWa)
    mockFetchOfetch.mockResolvedValue({})
    await notifyDealer('dealer-1', 'test', { phone: '34600000001', message: 'Hi dealer' })
    expect(mockWa).toHaveBeenCalledWith('34600000001', 'Hi dealer')
  })

  it('does not throw when WhatsApp fails for dealer', async () => {
    vi.stubGlobal('sendWhatsAppMessage', vi.fn().mockRejectedValue(new Error('wa failed')))
    mockFetchOfetch.mockResolvedValue({})
    await expect(
      notifyDealer('dealer-1', 'test', { phone: '34600000002', message: 'Hi' }),
    ).resolves.toBeUndefined()
  })
})

describe('notifications — notifyAdmin', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls $fetch with email endpoint', async () => {
    mockFetchOfetch.mockResolvedValue({})
    await notifyAdmin('system_alert', { message: 'disk full' })
    expect(mockFetchOfetch).toHaveBeenCalledWith(
      '/api/email/send',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('does not throw when $fetch fails', async () => {
    mockFetchOfetch.mockRejectedValue(new Error('smtp unavailable'))
    await expect(notifyAdmin('alert', { detail: 'x' })).resolves.toBeUndefined()
  })
})

describe('notifications — notifyBuyer', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls notify with email channel', async () => {
    mockFetchOfetch.mockResolvedValue({})
    await notifyBuyer('buyer-1', 'auction_won', { amount: 25000 })
    expect(mockFetchOfetch).toHaveBeenCalled()
  })
})
