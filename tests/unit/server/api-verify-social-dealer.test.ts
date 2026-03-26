/**
 * Tests for:
 * - POST /api/verify-document
 * - POST /api/social/generate-posts
 * - GET /api/dealer/market-intelligence
 * - POST /api/dealer/import-stock
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const {
  mockReadBody,
  mockGetQuery,
  mockSafeError,
  mockServiceRole,
  mockSupabaseUser,
  mockCallAI,
  mockGetSiteUrl,
  mockCheckRateLimit,
  mockGetRateLimitKey,
  mockGetRetryAfterSeconds,
  mockGenerateDealerIntelligence,
} = vi.hoisted(() => {
  const mockSafeError = vi.fn((status: number, msg: string) => {
    const err = new Error(msg)
    ;(err as any).statusCode = status
    return err
  })
  return {
    mockReadBody: vi.fn().mockResolvedValue({}),
    mockGetQuery: vi.fn().mockReturnValue({}),
    mockSafeError,
    mockServiceRole: vi.fn(),
    mockSupabaseUser: vi.fn().mockResolvedValue(null),
    mockCallAI: vi.fn().mockResolvedValue({ text: '{}', provider: 'anthropic' }),
    mockGetSiteUrl: vi.fn().mockReturnValue('https://tracciona.com'),
    mockCheckRateLimit: vi.fn().mockReturnValue(true),
    mockGetRateLimitKey: vi.fn().mockReturnValue('ip:1.2.3.4'),
    mockGetRetryAfterSeconds: vi.fn().mockReturnValue(60),
    mockGenerateDealerIntelligence: vi.fn().mockResolvedValue({ report: 'data' }),
  }
})

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: mockReadBody,
  getQuery: mockGetQuery,
  setResponseHeader: vi.fn(),
  createError: (opts: { statusCode?: number; statusMessage?: string; data?: unknown }) => {
    const err = new Error(opts.statusMessage ?? 'Error')
    ;(err as any).statusCode = opts.statusCode
    return err
  },
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: mockServiceRole,
  serverSupabaseUser: mockSupabaseUser,
}))

vi.mock('../../../server/utils/safeError', () => ({ safeError: mockSafeError }))
vi.mock('~~/server/utils/safeError', () => ({ safeError: mockSafeError }))
vi.mock('~~/server/services/aiProvider', () => ({ callAI: mockCallAI }))
vi.mock('~~/server/utils/siteConfig', () => ({
  getSiteUrl: mockGetSiteUrl,
  getSiteName: () => 'Tracciona',
  getSiteEmail: () => 'hola@tracciona.com',
}))
vi.mock('~~/server/utils/rateLimit', () => ({
  checkRateLimit: mockCheckRateLimit,
  getRateLimitKey: mockGetRateLimitKey,
  getRetryAfterSeconds: mockGetRetryAfterSeconds,
}))
vi.mock('~~/server/services/marketReport', () => ({
  generateDealerIntelligence: mockGenerateDealerIntelligence,
}))

vi.stubGlobal(
  'fetch',
  vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue([]),
    text: vi.fn().mockResolvedValue('<html>page</html>'),
  }),
)

function makeChain(steps: any[]) {
  let callCount = 0
  return {
    from: vi.fn().mockImplementation(() => {
      const response = steps[callCount] ?? { data: null, error: null }
      callCount++
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(response),
        maybeSingle: vi.fn().mockResolvedValue(response),
      }
    }),
  }
}

const validUuid = '550e8400-e29b-41d4-a716-446655440000'
const validVehicleUuid = '660e8400-e29b-41d4-a716-446655440000'
const validDocUuid = '770e8400-e29b-41d4-a716-446655440000'

// ── POST /api/verify-document ─────────────────────────────────────────────

import verifyDocumentHandler from '../../../server/api/verify-document.post'

const validVerifyBody = {
  documentId: validDocUuid,
  vehicleId: validVehicleUuid,
  imageUrl: 'https://example.com/doc.jpg',
  declaredData: { brand: 'Volvo', model: 'FH16', year: 2020, km: 100000 },
}

describe('POST /api/verify-document', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    mockReadBody.mockResolvedValue({ ...validVerifyBody })
    mockCallAI.mockResolvedValue({
      text: '{"brand":"Volvo","model":"FH16","year":2020,"km":100000,"matricula":null,"vin":null}',
      provider: 'anthropic',
    })
  })

  it('throws 401 when user not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(verifyDocumentHandler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when documentId is missing', async () => {
    mockReadBody.mockResolvedValue({
      vehicleId: validVehicleUuid,
      imageUrl: 'https://example.com/doc.jpg',
      declaredData: validVerifyBody.declaredData,
    })
    await expect(verifyDocumentHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when documentId is not a UUID', async () => {
    mockReadBody.mockResolvedValue({ ...validVerifyBody, documentId: 'not-a-uuid' })
    await expect(verifyDocumentHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when imageUrl is invalid', async () => {
    mockReadBody.mockResolvedValue({ ...validVerifyBody, imageUrl: 'not-a-url' })
    await expect(verifyDocumentHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when declaredData is invalid (bad year)', async () => {
    mockReadBody.mockResolvedValue({
      ...validVerifyBody,
      declaredData: { brand: 'Volvo', model: 'FH', year: 1800, km: 0 },
    })
    await expect(verifyDocumentHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 404 when vehicle not found', async () => {
    mockServiceRole.mockReturnValue(makeChain([{ data: null, error: { message: 'not found' } }]))
    await expect(verifyDocumentHandler({} as any)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 403 when user has no access', async () => {
    // vehicle found, but dealer check returns different dealer_id
    mockServiceRole.mockReturnValue(
      makeChain([
        {
          data: {
            id: validVehicleUuid,
            brand: 'Volvo',
            model: 'FH16',
            year: 2020,
            dealer_id: 'other-dealer',
          },
          error: null,
        }, // vehicle
        { data: { id: 'user-dealer-id' }, error: null }, // user dealer (different)
        { data: { role: 'user' }, error: null }, // user role (not admin)
      ]),
    )
    await expect(verifyDocumentHandler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 404 when document not found', async () => {
    mockServiceRole.mockReturnValue(
      makeChain([
        {
          data: {
            id: validVehicleUuid,
            brand: 'Volvo',
            model: 'FH16',
            year: 2020,
            dealer_id: 'dealer-1',
          },
          error: null,
        }, // vehicle
        { data: { id: 'dealer-1' }, error: null }, // user dealer (matches)
        { data: null, error: { message: 'not found' } }, // document not found
        { data: null, error: null }, // update result
      ]),
    )
    await expect(verifyDocumentHandler({} as any)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns match:true and status:verified on match', async () => {
    mockServiceRole.mockReturnValue(
      makeChain([
        {
          data: {
            id: validVehicleUuid,
            brand: 'Volvo',
            model: 'FH16',
            year: 2020,
            dealer_id: 'dealer-1',
          },
          error: null,
        }, // vehicle
        { data: { id: 'dealer-1' }, error: null }, // user dealer
        {
          data: {
            id: validDocUuid,
            vehicle_id: validVehicleUuid,
            doc_type: 'itv',
            status: 'pending',
          },
          error: null,
        }, // doc
        { data: null, error: null }, // update
      ]),
    )
    const result = await verifyDocumentHandler({} as any)
    expect(result.match).toBe(true)
    expect(result.status).toBe('verified')
    expect(result.documentId).toBe(validDocUuid)
  })

  it('marks as pending when AI call fails (no auto-approve)', async () => {
    mockCallAI.mockRejectedValueOnce(new Error('AI down'))
    mockServiceRole.mockReturnValue(
      makeChain([
        {
          data: {
            id: validVehicleUuid,
            brand: 'Volvo',
            model: 'FH16',
            year: 2020,
            dealer_id: 'dealer-1',
          },
          error: null,
        },
        { data: { id: 'dealer-1' }, error: null },
        {
          data: {
            id: validDocUuid,
            vehicle_id: validVehicleUuid,
            doc_type: 'itv',
            status: 'pending',
          },
          error: null,
        },
        { data: null, error: null },
      ]),
    )
    const result = await verifyDocumentHandler({} as any)
    // AI unavailable → cannot verify → match is false, status is pending
    expect(result.match).toBe(false)
  })

  // ── Extended validation tests ─────────────────────────────────────────

  it('throws 400 when vehicleId is missing', async () => {
    mockReadBody.mockResolvedValue({
      documentId: validDocUuid,
      imageUrl: 'https://example.com/doc.jpg',
      declaredData: validVerifyBody.declaredData,
    })
    await expect(verifyDocumentHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when vehicleId is not a UUID', async () => {
    mockReadBody.mockResolvedValue({ ...validVerifyBody, vehicleId: 'not-a-uuid' })
    await expect(verifyDocumentHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when imageUrl is missing entirely', async () => {
    mockReadBody.mockResolvedValue({
      documentId: validDocUuid,
      vehicleId: validVehicleUuid,
      declaredData: validVerifyBody.declaredData,
    })
    await expect(verifyDocumentHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when declaredData is missing entirely', async () => {
    mockReadBody.mockResolvedValue({
      documentId: validDocUuid,
      vehicleId: validVehicleUuid,
      imageUrl: 'https://example.com/doc.jpg',
    })
    await expect(verifyDocumentHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when declaredData.brand is empty string', async () => {
    mockReadBody.mockResolvedValue({
      ...validVerifyBody,
      declaredData: { brand: '  ', model: 'FH16', year: 2020, km: 100000 },
    })
    await expect(verifyDocumentHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when declaredData.model is empty string', async () => {
    mockReadBody.mockResolvedValue({
      ...validVerifyBody,
      declaredData: { brand: 'Volvo', model: '', year: 2020, km: 100000 },
    })
    await expect(verifyDocumentHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when declaredData.year is null', async () => {
    mockReadBody.mockResolvedValue({
      ...validVerifyBody,
      declaredData: { brand: 'Volvo', model: 'FH16', year: null, km: 100000 },
    })
    await expect(verifyDocumentHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when declaredData.year is undefined', async () => {
    mockReadBody.mockResolvedValue({
      ...validVerifyBody,
      declaredData: { brand: 'Volvo', model: 'FH16', km: 100000 },
    })
    await expect(verifyDocumentHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when declaredData.year is too far in the future', async () => {
    const futureYear = new Date().getFullYear() + 5
    mockReadBody.mockResolvedValue({
      ...validVerifyBody,
      declaredData: { brand: 'Volvo', model: 'FH16', year: futureYear, km: 100000 },
    })
    await expect(verifyDocumentHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when declaredData.km is null', async () => {
    mockReadBody.mockResolvedValue({
      ...validVerifyBody,
      declaredData: { brand: 'Volvo', model: 'FH16', year: 2020, km: null },
    })
    await expect(verifyDocumentHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when declaredData.km is negative', async () => {
    mockReadBody.mockResolvedValue({
      ...validVerifyBody,
      declaredData: { brand: 'Volvo', model: 'FH16', year: 2020, km: -1000 },
    })
    await expect(verifyDocumentHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when declaredData.brand is not a string', async () => {
    mockReadBody.mockResolvedValue({
      ...validVerifyBody,
      declaredData: { brand: 123, model: 'FH16', year: 2020, km: 100000 },
    })
    await expect(verifyDocumentHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when declaredData.km is not a number', async () => {
    mockReadBody.mockResolvedValue({
      ...validVerifyBody,
      declaredData: { brand: 'Volvo', model: 'FH16', year: 2020, km: 'many' },
    })
    await expect(verifyDocumentHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 with multiple validation errors combined', async () => {
    mockReadBody.mockResolvedValue({
      documentId: 'bad',
      vehicleId: 'bad',
      imageUrl: 'bad',
      declaredData: { brand: '', model: '', year: 1800, km: -1 },
    })
    try {
      await verifyDocumentHandler({} as any)
      expect.fail('Should have thrown')
    } catch (e: any) {
      expect(e.statusCode).toBe(400)
      // validateBody returns generic message (details only in logger)
      expect(e.message).toContain('inválid')
    }
  })

  // ── Access control: admin can access any vehicle ──────────────────────

  it('grants access when user is admin (even if not vehicle owner)', async () => {
    mockServiceRole.mockReturnValue(
      makeChain([
        {
          data: {
            id: validVehicleUuid,
            brand: 'Volvo',
            model: 'FH16',
            year: 2020,
            dealer_id: 'other-dealer',
          },
          error: null,
        }, // vehicle
        { data: null, error: { message: 'no dealer' } }, // user is NOT a dealer
        { data: { role: 'admin' }, error: null }, // but user IS admin
        {
          data: {
            id: validDocUuid,
            vehicle_id: validVehicleUuid,
            doc_type: 'itv',
            status: 'pending',
          },
          error: null,
        }, // doc
        { data: null, error: null }, // update
      ]),
    )
    const result = await verifyDocumentHandler({} as any)
    expect(result.match).toBe(true)
    expect(result.status).toBe('verified')
  })

  it('denies access when dealer lookup errors and user is not admin', async () => {
    mockServiceRole.mockReturnValue(
      makeChain([
        {
          data: {
            id: validVehicleUuid,
            brand: 'Volvo',
            model: 'FH16',
            year: 2020,
            dealer_id: 'other-dealer',
          },
          error: null,
        }, // vehicle
        { data: null, error: { message: 'dealer error' } }, // dealer lookup error
        { data: { role: 'dealer' }, error: null }, // not admin
      ]),
    )
    await expect(verifyDocumentHandler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  // ── Discrepancy detection ─────────────────────────────────────────────

  it('returns match:false with brand mismatch discrepancy', async () => {
    mockCallAI.mockResolvedValue({
      text: '{"brand":"Scania","model":"FH16","year":2020,"km":100000,"matricula":null,"vin":null}',
      provider: 'anthropic',
    })
    mockServiceRole.mockReturnValue(
      makeChain([
        {
          data: {
            id: validVehicleUuid,
            brand: 'Volvo',
            model: 'FH16',
            year: 2020,
            dealer_id: 'dealer-1',
          },
          error: null,
        },
        { data: { id: 'dealer-1' }, error: null },
        {
          data: {
            id: validDocUuid,
            vehicle_id: validVehicleUuid,
            doc_type: 'itv',
            status: 'pending',
          },
          error: null,
        },
        { data: null, error: null },
      ]),
    )
    const result = await verifyDocumentHandler({} as any)
    expect(result.match).toBe(false)
    expect(result.status).toBe('pending')
    expect(result.confidence).toBe(0.4)
    expect(result.discrepancies).toContainEqual(expect.stringContaining('Brand mismatch'))
  })

  it('returns match:false with model mismatch discrepancy', async () => {
    mockCallAI.mockResolvedValue({
      text: '{"brand":"Volvo","model":"FH12","year":2020,"km":100000,"matricula":null,"vin":null}',
      provider: 'anthropic',
    })
    mockServiceRole.mockReturnValue(
      makeChain([
        {
          data: {
            id: validVehicleUuid,
            brand: 'Volvo',
            model: 'FH16',
            year: 2020,
            dealer_id: 'dealer-1',
          },
          error: null,
        },
        { data: { id: 'dealer-1' }, error: null },
        {
          data: {
            id: validDocUuid,
            vehicle_id: validVehicleUuid,
            doc_type: 'itv',
            status: 'pending',
          },
          error: null,
        },
        { data: null, error: null },
      ]),
    )
    const result = await verifyDocumentHandler({} as any)
    expect(result.match).toBe(false)
    expect(result.discrepancies).toContainEqual(expect.stringContaining('Model mismatch'))
  })

  it('returns match:false with year mismatch discrepancy', async () => {
    mockCallAI.mockResolvedValue({
      text: '{"brand":"Volvo","model":"FH16","year":2019,"km":100000,"matricula":null,"vin":null}',
      provider: 'anthropic',
    })
    mockServiceRole.mockReturnValue(
      makeChain([
        {
          data: {
            id: validVehicleUuid,
            brand: 'Volvo',
            model: 'FH16',
            year: 2020,
            dealer_id: 'dealer-1',
          },
          error: null,
        },
        { data: { id: 'dealer-1' }, error: null },
        {
          data: {
            id: validDocUuid,
            vehicle_id: validVehicleUuid,
            doc_type: 'itv',
            status: 'pending',
          },
          error: null,
        },
        { data: null, error: null },
      ]),
    )
    const result = await verifyDocumentHandler({} as any)
    expect(result.match).toBe(false)
    expect(result.discrepancies).toContainEqual(expect.stringContaining('Year mismatch'))
  })

  it('returns match:false with km mismatch (>5% difference)', async () => {
    // 100000 declared, 120000 extracted = 20% diff > 5%
    mockCallAI.mockResolvedValue({
      text: '{"brand":"Volvo","model":"FH16","year":2020,"km":120000,"matricula":null,"vin":null}',
      provider: 'anthropic',
    })
    mockServiceRole.mockReturnValue(
      makeChain([
        {
          data: {
            id: validVehicleUuid,
            brand: 'Volvo',
            model: 'FH16',
            year: 2020,
            dealer_id: 'dealer-1',
          },
          error: null,
        },
        { data: { id: 'dealer-1' }, error: null },
        {
          data: {
            id: validDocUuid,
            vehicle_id: validVehicleUuid,
            doc_type: 'itv',
            status: 'pending',
          },
          error: null,
        },
        { data: null, error: null },
      ]),
    )
    const result = await verifyDocumentHandler({} as any)
    expect(result.match).toBe(false)
    expect(result.discrepancies).toContainEqual(expect.stringContaining('Km mismatch'))
    expect(result.discrepancies[0]).toContain('difference: 20000')
  })

  it('returns match:true when km difference is within 5% tolerance', async () => {
    // 100000 declared, 104000 extracted = 4% diff < 5%
    mockCallAI.mockResolvedValue({
      text: '{"brand":"Volvo","model":"FH16","year":2020,"km":104000,"matricula":null,"vin":null}',
      provider: 'anthropic',
    })
    mockServiceRole.mockReturnValue(
      makeChain([
        {
          data: {
            id: validVehicleUuid,
            brand: 'Volvo',
            model: 'FH16',
            year: 2020,
            dealer_id: 'dealer-1',
          },
          error: null,
        },
        { data: { id: 'dealer-1' }, error: null },
        {
          data: {
            id: validDocUuid,
            vehicle_id: validVehicleUuid,
            doc_type: 'itv',
            status: 'pending',
          },
          error: null,
        },
        { data: null, error: null },
      ]),
    )
    const result = await verifyDocumentHandler({} as any)
    expect(result.match).toBe(true)
    expect(result.discrepancies).toHaveLength(0)
  })

  it('skips comparison for null extracted fields (no discrepancy)', async () => {
    mockCallAI.mockResolvedValue({
      text: '{"brand":null,"model":null,"year":null,"km":null,"matricula":"1234ABC","vin":"VIN123"}',
      provider: 'anthropic',
    })
    mockServiceRole.mockReturnValue(
      makeChain([
        {
          data: {
            id: validVehicleUuid,
            brand: 'Volvo',
            model: 'FH16',
            year: 2020,
            dealer_id: 'dealer-1',
          },
          error: null,
        },
        { data: { id: 'dealer-1' }, error: null },
        {
          data: {
            id: validDocUuid,
            vehicle_id: validVehicleUuid,
            doc_type: 'itv',
            status: 'pending',
          },
          error: null,
        },
        { data: null, error: null },
      ]),
    )
    const result = await verifyDocumentHandler({} as any)
    expect(result.match).toBe(true)
    expect(result.discrepancies).toHaveLength(0)
    expect(result.extractedData.matricula).toBe('1234ABC')
    expect(result.extractedData.vin).toBe('VIN123')
  })

  it('returns match:false with multiple discrepancies', async () => {
    mockCallAI.mockResolvedValue({
      text: '{"brand":"Scania","model":"R450","year":2018,"km":200000,"matricula":null,"vin":null}',
      provider: 'anthropic',
    })
    mockServiceRole.mockReturnValue(
      makeChain([
        {
          data: {
            id: validVehicleUuid,
            brand: 'Volvo',
            model: 'FH16',
            year: 2020,
            dealer_id: 'dealer-1',
          },
          error: null,
        },
        { data: { id: 'dealer-1' }, error: null },
        {
          data: {
            id: validDocUuid,
            vehicle_id: validVehicleUuid,
            doc_type: 'itv',
            status: 'pending',
          },
          error: null,
        },
        { data: null, error: null },
      ]),
    )
    const result = await verifyDocumentHandler({} as any)
    expect(result.match).toBe(false)
    expect(result.discrepancies.length).toBeGreaterThanOrEqual(3)
  })

  // ── AI response with code fences ──────────────────────────────────────

  it('parses AI response wrapped in ```json code fences', async () => {
    mockCallAI.mockResolvedValue({
      text: '```json\n{"brand":"Volvo","model":"FH16","year":2020,"km":100000,"matricula":"1234ABC","vin":"VIN123"}\n```',
      provider: 'anthropic',
    })
    mockServiceRole.mockReturnValue(
      makeChain([
        {
          data: {
            id: validVehicleUuid,
            brand: 'Volvo',
            model: 'FH16',
            year: 2020,
            dealer_id: 'dealer-1',
          },
          error: null,
        },
        { data: { id: 'dealer-1' }, error: null },
        {
          data: {
            id: validDocUuid,
            vehicle_id: validVehicleUuid,
            doc_type: 'itv',
            status: 'pending',
          },
          error: null,
        },
        { data: null, error: null },
      ]),
    )
    const result = await verifyDocumentHandler({} as any)
    expect(result.match).toBe(true)
    expect(result.extractedData.matricula).toBe('1234ABC')
  })

  it('parses AI response wrapped in ``` code fences (no language tag)', async () => {
    mockCallAI.mockResolvedValue({
      text: '```\n{"brand":"Volvo","model":"FH16","year":2020,"km":100000,"matricula":null,"vin":null}\n```',
      provider: 'anthropic',
    })
    mockServiceRole.mockReturnValue(
      makeChain([
        {
          data: {
            id: validVehicleUuid,
            brand: 'Volvo',
            model: 'FH16',
            year: 2020,
            dealer_id: 'dealer-1',
          },
          error: null,
        },
        { data: { id: 'dealer-1' }, error: null },
        {
          data: {
            id: validDocUuid,
            vehicle_id: validVehicleUuid,
            doc_type: 'itv',
            status: 'pending',
          },
          error: null,
        },
        { data: null, error: null },
      ]),
    )
    const result = await verifyDocumentHandler({} as any)
    expect(result.match).toBe(true)
  })

  // ── Update error (500) ────────────────────────────────────────────────

  it('throws 500 when document update fails', async () => {
    // Need a custom mock because makeChain's .eq() returns this, but the update
    // path uses `await supabase.from(...).update(...).eq(...)` which needs to
    // resolve to { error }.
    let callCount = 0
    const steps = [
      {
        data: {
          id: validVehicleUuid,
          brand: 'Volvo',
          model: 'FH16',
          year: 2020,
          dealer_id: 'dealer-1',
        },
        error: null,
      },
      { data: { id: 'dealer-1' }, error: null },
      {
        data: {
          id: validDocUuid,
          vehicle_id: validVehicleUuid,
          doc_type: 'itv',
          status: 'pending',
        },
        error: null,
      },
      { data: null, error: { message: 'update failed: constraint violation' } },
    ]
    const supabase = {
      from: vi.fn().mockImplementation(() => {
        const response = steps[callCount] ?? { data: null, error: null }
        callCount++
        const chainObj: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue(response),
          }),
          single: vi.fn().mockResolvedValue(response),
          maybeSingle: vi.fn().mockResolvedValue(response),
        }
        return chainObj
      }),
    }
    mockServiceRole.mockReturnValue(supabase)
    await expect(verifyDocumentHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })

  // ── Case-insensitive brand/model comparison ───────────────────────────

  it('matches brand case-insensitively', async () => {
    mockCallAI.mockResolvedValue({
      text: '{"brand":"VOLVO","model":"fh16","year":2020,"km":100000,"matricula":null,"vin":null}',
      provider: 'anthropic',
    })
    mockServiceRole.mockReturnValue(
      makeChain([
        {
          data: {
            id: validVehicleUuid,
            brand: 'Volvo',
            model: 'FH16',
            year: 2020,
            dealer_id: 'dealer-1',
          },
          error: null,
        },
        { data: { id: 'dealer-1' }, error: null },
        {
          data: {
            id: validDocUuid,
            vehicle_id: validVehicleUuid,
            doc_type: 'itv',
            status: 'pending',
          },
          error: null,
        },
        { data: null, error: null },
      ]),
    )
    const result = await verifyDocumentHandler({} as any)
    expect(result.match).toBe(true)
    expect(result.discrepancies).toHaveLength(0)
  })

  // ── Confidence values ─────────────────────────────────────────────────

  it('returns confidence 0.95 on match and 0.4 on mismatch', async () => {
    // Test match confidence
    mockServiceRole.mockReturnValue(
      makeChain([
        {
          data: {
            id: validVehicleUuid,
            brand: 'Volvo',
            model: 'FH16',
            year: 2020,
            dealer_id: 'dealer-1',
          },
          error: null,
        },
        { data: { id: 'dealer-1' }, error: null },
        {
          data: {
            id: validDocUuid,
            vehicle_id: validVehicleUuid,
            doc_type: 'itv',
            status: 'pending',
          },
          error: null,
        },
        { data: null, error: null },
      ]),
    )
    const matchResult = await verifyDocumentHandler({} as any)
    expect(matchResult.confidence).toBe(0.95)

    // Test mismatch confidence
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    mockReadBody.mockResolvedValue({ ...validVerifyBody })
    mockCallAI.mockResolvedValue({
      text: '{"brand":"Scania","model":"FH16","year":2020,"km":100000,"matricula":null,"vin":null}',
      provider: 'anthropic',
    })
    mockServiceRole.mockReturnValue(
      makeChain([
        {
          data: {
            id: validVehicleUuid,
            brand: 'Volvo',
            model: 'FH16',
            year: 2020,
            dealer_id: 'dealer-1',
          },
          error: null,
        },
        { data: { id: 'dealer-1' }, error: null },
        {
          data: {
            id: validDocUuid,
            vehicle_id: validVehicleUuid,
            doc_type: 'itv',
            status: 'pending',
          },
          error: null,
        },
        { data: null, error: null },
      ]),
    )
    const mismatchResult = await verifyDocumentHandler({} as any)
    expect(mismatchResult.confidence).toBe(0.4)
  })

  // ── Zero km edge case ─────────────────────────────────────────────────

  it('accepts declaredData.km = 0 as valid (new vehicle)', async () => {
    mockReadBody.mockResolvedValue({
      ...validVerifyBody,
      declaredData: { brand: 'Volvo', model: 'FH16', year: 2024, km: 0 },
    })
    mockCallAI.mockResolvedValue({
      text: '{"brand":"Volvo","model":"FH16","year":2024,"km":0,"matricula":null,"vin":null}',
      provider: 'anthropic',
    })
    mockServiceRole.mockReturnValue(
      makeChain([
        {
          data: {
            id: validVehicleUuid,
            brand: 'Volvo',
            model: 'FH16',
            year: 2024,
            dealer_id: 'dealer-1',
          },
          error: null,
        },
        { data: { id: 'dealer-1' }, error: null },
        {
          data: {
            id: validDocUuid,
            vehicle_id: validVehicleUuid,
            doc_type: 'itv',
            status: 'pending',
          },
          error: null,
        },
        { data: null, error: null },
      ]),
    )
    const result = await verifyDocumentHandler({} as any)
    expect(result.match).toBe(true)
  })

  // ── Year at boundary values ───────────────────────────────────────────

  it('accepts declaredData.year = 1950 (minimum boundary)', async () => {
    mockReadBody.mockResolvedValue({
      ...validVerifyBody,
      declaredData: { brand: 'Volvo', model: 'FH16', year: 1950, km: 500000 },
    })
    mockCallAI.mockResolvedValue({
      text: '{"brand":"Volvo","model":"FH16","year":1950,"km":500000,"matricula":null,"vin":null}',
      provider: 'anthropic',
    })
    mockServiceRole.mockReturnValue(
      makeChain([
        {
          data: {
            id: validVehicleUuid,
            brand: 'Volvo',
            model: 'FH16',
            year: 1950,
            dealer_id: 'dealer-1',
          },
          error: null,
        },
        { data: { id: 'dealer-1' }, error: null },
        {
          data: {
            id: validDocUuid,
            vehicle_id: validVehicleUuid,
            doc_type: 'itv',
            status: 'pending',
          },
          error: null,
        },
        { data: null, error: null },
      ]),
    )
    const result = await verifyDocumentHandler({} as any)
    expect(result.match).toBe(true)
  })

  it('throws 400 when declaredData.year = 1949 (below minimum)', async () => {
    mockReadBody.mockResolvedValue({
      ...validVerifyBody,
      declaredData: { brand: 'Volvo', model: 'FH16', year: 1949, km: 100000 },
    })
    await expect(verifyDocumentHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('accepts year = currentYear + 2 (max boundary)', async () => {
    const maxYear = new Date().getFullYear() + 2
    mockReadBody.mockResolvedValue({
      ...validVerifyBody,
      declaredData: { brand: 'Volvo', model: 'FH16', year: maxYear, km: 0 },
    })
    mockCallAI.mockResolvedValue({
      text: `{"brand":"Volvo","model":"FH16","year":${maxYear},"km":0,"matricula":null,"vin":null}`,
      provider: 'anthropic',
    })
    mockServiceRole.mockReturnValue(
      makeChain([
        {
          data: {
            id: validVehicleUuid,
            brand: 'Volvo',
            model: 'FH16',
            year: maxYear,
            dealer_id: 'dealer-1',
          },
          error: null,
        },
        { data: { id: 'dealer-1' }, error: null },
        {
          data: {
            id: validDocUuid,
            vehicle_id: validVehicleUuid,
            doc_type: 'itv',
            status: 'pending',
          },
          error: null,
        },
        { data: null, error: null },
      ]),
    )
    const result = await verifyDocumentHandler({} as any)
    expect(result.match).toBe(true)
  })

  it('throws 400 when year = currentYear + 3 (above max boundary)', async () => {
    const overMax = new Date().getFullYear() + 3
    mockReadBody.mockResolvedValue({
      ...validVerifyBody,
      declaredData: { brand: 'Volvo', model: 'FH16', year: overMax, km: 100000 },
    })
    await expect(verifyDocumentHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  // ── imageUrl with whitespace ──────────────────────────────────────────

  it('trims imageUrl whitespace before validation', async () => {
    mockReadBody.mockResolvedValue({
      ...validVerifyBody,
      imageUrl: '  https://example.com/doc.jpg  ',
    })
    mockServiceRole.mockReturnValue(
      makeChain([
        {
          data: {
            id: validVehicleUuid,
            brand: 'Volvo',
            model: 'FH16',
            year: 2020,
            dealer_id: 'dealer-1',
          },
          error: null,
        },
        { data: { id: 'dealer-1' }, error: null },
        {
          data: {
            id: validDocUuid,
            vehicle_id: validVehicleUuid,
            doc_type: 'itv',
            status: 'pending',
          },
          error: null,
        },
        { data: null, error: null },
      ]),
    )
    const result = await verifyDocumentHandler({} as any)
    expect(result.match).toBe(true)
  })
})

// ── POST /api/social/generate-posts ───────────────────────────────────────

import socialGenerateHandler from '../../../server/api/social/generate-posts.post'

const validVehicle = {
  id: validUuid,
  brand: 'Volvo',
  model: 'FH16',
  year: 2020,
  price: 8000000,
  location: 'Madrid',
  slug: 'volvo-fh16-2020',
  dealer_id: 'dealer-1',
  subcategories: { name: { es: 'Camiones', en: 'Trucks' } },
  vehicle_images: [{ url: 'https://example.com/img.jpg', position: 0 }],
}

describe('POST /api/social/generate-posts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    mockReadBody.mockResolvedValue({ vehicleId: validUuid })
    mockCallAI.mockResolvedValue({
      text: '{"linkedin":{"es":"post","en":"post"},"facebook":{"es":"post","en":"post"},"instagram":{"es":"post","en":"post"},"x":{"es":"post","en":"post"}}',
      provider: 'anthropic',
    })
  })

  it('throws 401 when user not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(socialGenerateHandler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when vehicleId is missing', async () => {
    mockReadBody.mockResolvedValue({})
    await expect(socialGenerateHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when vehicleId is not a UUID', async () => {
    mockReadBody.mockResolvedValue({ vehicleId: 'not-a-uuid' })
    await expect(socialGenerateHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 404 when vehicle not found', async () => {
    mockServiceRole.mockReturnValue(makeChain([{ data: null, error: { message: 'not found' } }]))
    await expect(socialGenerateHandler({} as any)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 403 when user is not owner and not admin', async () => {
    mockServiceRole.mockReturnValue(
      makeChain([
        { data: { ...validVehicle, dealer_id: 'other-dealer' }, error: null }, // vehicle
        { data: { id: 'dealer-1' }, error: null }, // user dealer (different)
        { data: { role: 'user' }, error: null }, // user role
      ]),
    )
    await expect(socialGenerateHandler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('returns postIds when owner generates posts', async () => {
    const insertedPosts = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }, { id: 'p4' }]
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'vehicles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: validVehicle, error: null }),
          }
        }
        if (table === 'dealers') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'dealer-1' }, error: null }),
          }
        }
        if (table === 'social_posts') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue({ data: insertedPosts, error: null }),
          }
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }),
    }
    mockServiceRole.mockReturnValue(supabase)
    const result = await socialGenerateHandler({} as any)
    expect(result.count).toBe(4)
    expect(result.postIds).toHaveLength(4)
  })

  it('uses template fallback when AI fails', async () => {
    mockCallAI.mockRejectedValueOnce(new Error('AI down'))
    const insertedPosts = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }, { id: 'p4' }]
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'vehicles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: validVehicle, error: null }),
          }
        }
        if (table === 'dealers') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'dealer-1' }, error: null }),
          }
        }
        if (table === 'social_posts') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue({ data: insertedPosts, error: null }),
          }
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }),
    }
    mockServiceRole.mockReturnValue(supabase)
    const result = await socialGenerateHandler({} as any)
    expect(result.count).toBe(4)
  })
})

// ── GET /api/dealer/market-intelligence ───────────────────────────────────

import marketIntelligenceHandler from '../../../server/api/dealer/market-intelligence.get'

describe('GET /api/dealer/market-intelligence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    mockGetQuery.mockReturnValue({ dealerId: 'dealer-1' })
  })

  it('throws 401 when user not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(marketIntelligenceHandler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when dealerId is missing', async () => {
    mockGetQuery.mockReturnValue({})
    await expect(marketIntelligenceHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 403 when non-admin tries to access another dealer', async () => {
    mockServiceRole.mockReturnValue(
      makeChain([
        { data: { role: 'dealer' }, error: null }, // user profile
        { data: null, error: null }, // dealer not owned by user
      ]),
    )
    await expect(marketIntelligenceHandler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('returns report when user is admin', async () => {
    mockServiceRole.mockReturnValue(makeChain([{ data: { role: 'admin' }, error: null }]))
    const result = await marketIntelligenceHandler({} as any)
    expect(result).toEqual({ report: 'data' })
    expect(mockGenerateDealerIntelligence).toHaveBeenCalled()
  })

  it('returns report when user owns the dealer', async () => {
    mockServiceRole.mockReturnValue(
      makeChain([
        { data: { role: 'dealer' }, error: null },
        { data: { id: 'dealer-1' }, error: null },
      ]),
    )
    const result = await marketIntelligenceHandler({} as any)
    expect(result).toEqual({ report: 'data' })
  })
})

// ── POST /api/dealer/import-stock ─────────────────────────────────────────

import importStockHandler from '../../../server/api/dealer/import-stock.post'

describe('POST /api/dealer/import-stock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    mockReadBody.mockResolvedValue({ url: 'https://mascus.es/dealer/profile', consent: true })
    mockCheckRateLimit.mockReturnValue(true)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue('<html><body>Vehicle listings</body></html>'),
      }),
    )
    mockCallAI.mockResolvedValue({
      text: '[{"brand":"Volvo","model":"FH16","year":2020,"price":80000,"description":"Good truck","imageUrls":[]}]',
      provider: 'anthropic',
    })
  })

  it('throws 401 when user not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(importStockHandler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 403 when no dealer account', async () => {
    mockServiceRole.mockReturnValue(makeChain([{ data: null, error: null }]))
    await expect(importStockHandler({} as any)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 429 when rate limited', async () => {
    mockServiceRole.mockReturnValue(makeChain([{ data: { id: 'dealer-1' }, error: null }]))
    mockCheckRateLimit.mockReturnValue(false)
    await expect(importStockHandler({} as any)).rejects.toMatchObject({ statusCode: 429 })
  })

  it('throws 400 when consent is false', async () => {
    mockServiceRole.mockReturnValue(makeChain([{ data: { id: 'dealer-1' }, error: null }]))
    mockReadBody.mockResolvedValue({ url: 'https://mascus.es/dealer/profile', consent: false })
    await expect(importStockHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when URL is from unsupported platform', async () => {
    mockServiceRole.mockReturnValue(makeChain([{ data: { id: 'dealer-1' }, error: null }]))
    mockReadBody.mockResolvedValue({ url: 'https://unsupportedsite.com/dealer', consent: true })
    await expect(importStockHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns imported:0 when AI returns no vehicles', async () => {
    mockServiceRole.mockReturnValue(
      makeChain([{ data: { id: 'dealer-1', company_name: 'Test' }, error: null }]),
    )
    mockCallAI.mockResolvedValue({ text: '[]', provider: 'anthropic' })
    const result = await importStockHandler({} as any)
    expect(result.imported).toBe(0)
  })

  it('returns success with imported count', async () => {
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({
          data: table === 'dealers' ? { id: 'dealer-1', company_name: 'Test' } : null,
          error: null,
        }),
        single: vi.fn().mockResolvedValue({
          data: table === 'dealers' ? { id: 'dealer-1', company_name: 'Test' } : null,
          error: null,
        }),
      })),
    }
    mockServiceRole.mockReturnValue(supabase)
    const result = await importStockHandler({} as any)
    expect(result.success).toBe(true)
    expect(result.imported).toBeGreaterThanOrEqual(0)
  })
})
