/**
 * Tests for server/services/whatsappProcessor.ts
 * (aiProvider.ts real callAI tested in services-aiProvider.test.ts)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const {
  mockCallAI,
  mockUploadImage,
  mockCreateVehicleFromAI,
} = vi.hoisted(() => ({
  mockCallAI: vi.fn(),
  mockUploadImage: vi.fn(),
  mockCreateVehicleFromAI: vi.fn(),
}))

vi.mock('../../../server/services/aiProvider', () => ({ callAI: mockCallAI }))
vi.mock('../../../server/services/imageUploader', () => ({ uploadImage: mockUploadImage }))
vi.mock('../../../server/services/vehicleCreator', () => ({
  sanitizeSlug: (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  createVehicleFromAI: mockCreateVehicleFromAI,
  createVehicle: vi.fn(),
}))
vi.mock('~~/server/utils/siteConfig', () => ({ getSiteUrl: vi.fn().mockReturnValue('https://tracciona.com') }))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)
vi.stubGlobal('sendWhatsAppMessage', vi.fn())
vi.stubGlobal('downloadWhatsAppMedia', vi.fn().mockResolvedValue(Buffer.from('imgdata')))

// ── Static import ────────────────────────────────────────────────────────────

import { processWhatsAppSubmission, uploadAnalyzedImages } from '../../../server/services/whatsappProcessor'

// ── Supabase mock ────────────────────────────────────────────────────────────

function makeChain(data: any = null, error: any = null) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
  }
  chain.then = (onFulfilled: Function, onRejected?: Function) =>
    Promise.resolve({ data, error }).then(onFulfilled as any, onRejected as any)
  return chain
}

const validAnalysis = JSON.stringify({
  brand: 'Volvo',
  model: 'FH16',
  year: 2020,
  category_name_es: 'Camiones',
  subcategory_name_es: null,
  license_plate: null,
  title_es: 'Volvo FH16 2020',
  title_en: 'Volvo FH16 2020',
  description_es: 'Camión de alta potencia',
  description_en: 'High power truck',
  attributes_json: {},
  suggested_slug: 'volvo-fh16-2020',
  condition: 'usado',
  image_alt_texts: ['Frontal'],
})

// ══ processWhatsAppSubmission ════════════════════════════════════════════════

describe('processWhatsAppSubmission', () => {
  const mockSupabase = { from: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
  })

  function setupFetchSubmission(submission: any) {
    mockFetch.mockImplementation((url: string, opts?: any) => {
      if (url.includes('whatsapp_submissions') && (!opts?.method || opts.method === 'GET')) {
        return Promise.resolve({
          ok: true,
          json: vi.fn().mockResolvedValue(submission ? [submission] : []),
        })
      }
      // PATCH calls — return ok
      return Promise.resolve({ ok: true })
    })
  }

  function setupSupabaseCategories(categories: any[] = []) {
    mockSupabase.from.mockReturnValue(makeChain(categories))
  }

  it('throws Submission not found when fetch fails', async () => {
    mockFetch.mockResolvedValue({ ok: false })
    await expect(
      processWhatsAppSubmission('sub-1', mockSupabase as any),
    ).rejects.toThrow('Submission not found')
  })

  it('throws Submission not found when submission array is empty', async () => {
    setupFetchSubmission(null)
    await expect(
      processWhatsAppSubmission('sub-1', mockSupabase as any),
    ).rejects.toThrow('Submission not found')
  })

  it('throws when submission status is not received', async () => {
    setupFetchSubmission({
      id: 'sub-1',
      dealer_id: 'dealer-1',
      phone_number: '+34600000001',
      media_ids: [],
      text_content: null,
      status: 'processed',
    })
    await expect(
      processWhatsAppSubmission('sub-1', mockSupabase as any),
    ).rejects.toThrow('already in status')
  })

  it('processes submission successfully and returns vehicle info', async () => {
    setupFetchSubmission({
      id: 'sub-1',
      dealer_id: 'dealer-1',
      phone_number: '+34600000001',
      media_ids: ['media-1'],
      text_content: 'Un Volvo FH16',
      status: 'received',
    })
    setupSupabaseCategories([{ name_es: 'Camiones' }])
    mockCallAI.mockResolvedValue({ text: validAnalysis })
    mockUploadImage.mockResolvedValue({
      publicId: 'p1',
      secureUrl: 'https://cdn/img.jpg',
      width: 800, height: 600, format: 'jpg',
    })
    mockCreateVehicleFromAI.mockResolvedValue({ id: 'v1', slug: 'volvo-fh16-2020' })

    const result = await processWhatsAppSubmission('sub-1', mockSupabase as any)
    expect(result.vehicleId).toBe('v1')
    expect(result.slug).toBe('volvo-fh16-2020')
    expect(result.imagesUploaded).toBe(1)
  })

  it('marks submission as failed and rethrows on AI error', async () => {
    setupFetchSubmission({
      id: 'sub-1',
      dealer_id: null,
      phone_number: '+34600000001',
      media_ids: [],
      text_content: null,
      status: 'received',
    })
    setupSupabaseCategories([])
    mockCallAI.mockRejectedValue(new Error('AI unavailable'))

    await expect(
      processWhatsAppSubmission('sub-1', mockSupabase as any),
    ).rejects.toThrow('AI unavailable')

    // Should have called PATCH at least once (to mark as processing + failed)
    const patchCalls = mockFetch.mock.calls.filter(([, opts]: any) => opts?.method === 'PATCH')
    expect(patchCalls.length).toBeGreaterThanOrEqual(1)
  })

  it('handles JSON with markdown code fences in AI response', async () => {
    const analysisWithFences = '```json\n' + validAnalysis + '\n```'
    setupFetchSubmission({
      id: 'sub-2',
      dealer_id: null,
      phone_number: '+34600000001',
      media_ids: [],
      text_content: null,
      status: 'received',
    })
    setupSupabaseCategories([])
    mockCallAI.mockResolvedValue({ text: analysisWithFences })
    mockCreateVehicleFromAI.mockResolvedValue({ id: 'v2', slug: 'volvo-fh16-2020' })

    const result = await processWhatsAppSubmission('sub-2', mockSupabase as any)
    expect(result.vehicleId).toBe('v2')
  })

  it('proceeds with no images when downloadWhatsAppMedia returns empty buffer', async () => {
    vi.stubGlobal('downloadWhatsAppMedia', vi.fn().mockResolvedValue(Buffer.from('')))
    setupFetchSubmission({
      id: 'sub-3',
      dealer_id: 'dealer-1',
      phone_number: '+34600000001',
      media_ids: ['media-1'],
      text_content: null,
      status: 'received',
    })
    setupSupabaseCategories([])
    mockCallAI.mockResolvedValue({ text: validAnalysis })
    mockCreateVehicleFromAI.mockResolvedValue({ id: 'v3', slug: 'volvo-fh16-2020' })

    const result = await processWhatsAppSubmission('sub-3', mockSupabase as any)
    expect(result.imagesUploaded).toBe(0)
    // Restore
    vi.stubGlobal('downloadWhatsAppMedia', vi.fn().mockResolvedValue(Buffer.from('imgdata')))
  })

  it('handles null uploadImage result (skips image in uploaded list)', async () => {
    setupFetchSubmission({
      id: 'sub-4',
      dealer_id: null,
      phone_number: '+34600000001',
      media_ids: ['media-1'],
      text_content: null,
      status: 'received',
    })
    setupSupabaseCategories([])
    mockCallAI.mockResolvedValue({ text: validAnalysis })
    mockUploadImage.mockResolvedValue(null) // upload returns null
    mockCreateVehicleFromAI.mockResolvedValue({ id: 'v4', slug: 'volvo-fh16-2020' })

    const result = await processWhatsAppSubmission('sub-4', mockSupabase as any)
    expect(result.vehicleId).toBe('v4')
    expect(result.imagesUploaded).toBe(0) // null images not counted
  })

  it('handles downloadWhatsAppMedia throwing an error', async () => {
    vi.stubGlobal('downloadWhatsAppMedia', vi.fn().mockRejectedValue(new Error('network error')))
    setupFetchSubmission({
      id: 'sub-dl-err',
      dealer_id: 'dealer-1',
      phone_number: '+34600000001',
      media_ids: ['media-err'],
      text_content: null,
      status: 'received',
    })
    setupSupabaseCategories([])
    mockCallAI.mockResolvedValue({ text: validAnalysis })
    mockCreateVehicleFromAI.mockResolvedValue({ id: 'v-dl', slug: 'volvo-fh16-2020' })

    const result = await processWhatsAppSubmission('sub-dl-err', mockSupabase as any)
    expect(result.imagesUploaded).toBe(0)
    vi.stubGlobal('downloadWhatsAppMedia', vi.fn().mockResolvedValue(Buffer.from('imgdata')))
  })

  it('skips undefined entries in imageBuffers array', async () => {
    // Provide two media_ids; first download returns data, second returns empty (filtered out)
    // This creates a sparse array scenario where buffer at index may be undefined
    vi.stubGlobal('downloadWhatsAppMedia', vi.fn()
      .mockResolvedValueOnce(Buffer.from(''))
      .mockResolvedValueOnce(Buffer.from('imgdata')),
    )
    setupFetchSubmission({
      id: 'sub-sparse',
      dealer_id: 'dealer-1',
      phone_number: '+34600000001',
      media_ids: ['media-1', 'media-2'],
      text_content: null,
      status: 'received',
    })
    setupSupabaseCategories([])
    mockCallAI.mockResolvedValue({ text: validAnalysis })
    mockUploadImage.mockResolvedValue({
      publicId: 'p1', secureUrl: 'https://cdn/img.jpg',
      width: 800, height: 600, format: 'jpg',
    })
    mockCreateVehicleFromAI.mockResolvedValue({ id: 'v-sp', slug: 'volvo-fh16-2020' })

    const result = await processWhatsAppSubmission('sub-sparse', mockSupabase as any)
    expect(result.vehicleId).toBe('v-sp')
    vi.stubGlobal('downloadWhatsAppMedia', vi.fn().mockResolvedValue(Buffer.from('imgdata')))
  })

  it('catches sendWhatsAppMessage error in notify (success path)', async () => {
    vi.stubGlobal('sendWhatsAppMessage', vi.fn().mockRejectedValue(new Error('WA down')))
    setupFetchSubmission({
      id: 'sub-notify',
      dealer_id: null,
      phone_number: '+34600000001',
      media_ids: [],
      text_content: null,
      status: 'received',
    })
    setupSupabaseCategories([])
    mockCallAI.mockResolvedValue({ text: validAnalysis })
    mockCreateVehicleFromAI.mockResolvedValue({ id: 'v-n', slug: 'volvo-fh16-2020' })

    // Should not throw despite notification failure
    const result = await processWhatsAppSubmission('sub-notify', mockSupabase as any)
    expect(result.vehicleId).toBe('v-n')
    vi.stubGlobal('sendWhatsAppMessage', vi.fn())
  })

  it('uses category list from DB in AI prompt', async () => {
    setupFetchSubmission({
      id: 'sub-5',
      dealer_id: null,
      phone_number: '+34600000001',
      media_ids: [],
      text_content: null,
      status: 'received',
    })
    setupSupabaseCategories([{ name_es: 'Camiones' }, { name_es: 'Semirremolques' }])
    mockCallAI.mockResolvedValue({ text: validAnalysis })
    mockCreateVehicleFromAI.mockResolvedValue({ id: 'v5', slug: 'volvo-fh16-2020' })

    await processWhatsAppSubmission('sub-5', mockSupabase as any)
    const [aiRequest] = mockCallAI.mock.calls[0]!
    expect(aiRequest.system).toContain('Camiones')
    expect(aiRequest.system).toContain('Semirremolques')
  })
})

// ── uploadAnalyzedImages (direct) ──────────────────────────────────────────────

describe('uploadAnalyzedImages', () => {
  it('skips undefined entries in imageBuffers', async () => {
    const sparseBuffers = [Buffer.from('img1'), undefined as unknown as Buffer, Buffer.from('img3')]
    mockUploadImage.mockResolvedValue({
      publicId: 'p1', secureUrl: 'https://cdn/img.jpg',
      width: 800, height: 600, format: 'jpg',
    })
    const analysis = {
      suggested_slug: 'volvo-fh16',
      brand: 'Volvo',
      model: 'FH16',
      image_alt_texts: ['alt1', 'alt2', 'alt3'],
    }
    const result = await uploadAnalyzedImages(sparseBuffers, analysis as any)
    // Only 2 images should be uploaded (index 0 and 2), index 1 is skipped
    expect(mockUploadImage).toHaveBeenCalledTimes(2)
    expect(result).toHaveLength(2)
    expect(result[0]!.position).toBe(0)
    expect(result[1]!.position).toBe(2)
  })
})
