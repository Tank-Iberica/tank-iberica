/**
 * Tests for POST /api/credits/listing-certificate (#26)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const {
  mockSafeError,
  mockSupabaseUser,
  mockVerifyCsrf,
  mockValidateBody,
  mockDeductCredits,
  mockFetch,
} = vi.hoisted(() => {
  const mockSafeError = vi.fn((status: number, msg: string) => {
    const err = new Error(msg)
    ;(err as any).statusCode = status
    return err
  })
  return {
    mockSafeError,
    mockSupabaseUser: vi.fn().mockResolvedValue(null),
    mockVerifyCsrf: vi.fn(),
    mockValidateBody: vi.fn(),
    mockDeductCredits: vi.fn(),
    mockFetch: vi.fn(),
  }
})

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
}))
vi.mock('#supabase/server', () => ({ serverSupabaseUser: mockSupabaseUser }))
vi.mock('../../../server/utils/safeError', () => ({ safeError: mockSafeError }))
vi.mock('../../../server/utils/verifyCsrf', () => ({ verifyCsrf: mockVerifyCsrf }))
vi.mock('../../../server/utils/validateBody', () => ({ validateBody: mockValidateBody }))
vi.mock('../../../server/utils/creditService', () => ({
  deductUserCredits: mockDeductCredits,
}))

vi.stubGlobal('fetch', mockFetch)
vi.stubGlobal('useRuntimeConfig', () => ({
  supabaseServiceRoleKey: 'test-service-key',
  public: {},
}))
vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co')

function mockJsonFetch(data: unknown, ok = true) {
  return { ok, json: vi.fn().mockResolvedValue(data) }
}

let handler: Function

beforeEach(async () => {
  vi.clearAllMocks()
  mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
  mockVerifyCsrf.mockImplementation(() => undefined)
  mockValidateBody.mockResolvedValue({ vehicleId: 'vehicle-uuid-1' })
  mockDeductCredits.mockResolvedValue({ success: true, newBalance: 4 })

  const mod = await import(
    '../../../server/api/credits/listing-certificate.post.ts?t=' + Date.now()
  )
  handler = mod.default
})

describe('POST /api/credits/listing-certificate', () => {
  it('returns 401 when unauthenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(handler({} as any)).rejects.toThrow()
    expect(mockSafeError).toHaveBeenCalledWith(401, expect.any(String))
  })

  it('returns 404 when vehicle not found', async () => {
    mockFetch.mockResolvedValue(mockJsonFetch([]))
    await expect(handler({} as any)).rejects.toThrow()
    expect(mockSafeError).toHaveBeenCalledWith(404, expect.any(String))
  })

  it('returns 400 when vehicle is not published', async () => {
    mockFetch.mockResolvedValue(
      mockJsonFetch([
        { id: 'vehicle-uuid-1', brand: 'Volvo', model: 'FH', year: 2020, slug: 'volvo-fh', dealer_id: 'dealer-1', status: 'draft' },
      ]),
    )
    await expect(handler({} as any)).rejects.toThrow()
    expect(mockSafeError).toHaveBeenCalledWith(400, expect.any(String))
  })

  it('returns 403 when user does not own the dealer', async () => {
    mockFetch
      .mockResolvedValueOnce(
        mockJsonFetch([
          { id: 'vehicle-uuid-1', brand: 'Volvo', model: 'FH', year: 2020, slug: 'volvo-fh', dealer_id: 'dealer-1', status: 'published' },
        ]),
      )
      .mockResolvedValueOnce(mockJsonFetch([])) // dealer check returns empty
    await expect(handler({} as any)).rejects.toThrow()
    expect(mockSafeError).toHaveBeenCalledWith(403, expect.any(String))
  })

  it('returns 402 when credits are insufficient', async () => {
    mockFetch
      .mockResolvedValueOnce(
        mockJsonFetch([
          { id: 'vehicle-uuid-1', brand: 'Volvo', model: 'FH', year: 2020, slug: 'volvo-fh', dealer_id: 'dealer-1', status: 'published' },
        ]),
      )
      .mockResolvedValueOnce(mockJsonFetch([{ id: 'dealer-1', name: 'Test Dealer' }]))
    mockDeductCredits.mockResolvedValue({ success: false, reason: 'insufficient' })
    await expect(handler({} as any)).rejects.toThrow()
    expect(mockSafeError).toHaveBeenCalledWith(402, expect.any(String))
  })

  it('returns certificate data on success', async () => {
    const certCode = 'abc123def456'
    mockFetch
      .mockResolvedValueOnce(
        mockJsonFetch([
          { id: 'vehicle-uuid-1', brand: 'Volvo', model: 'FH', year: 2020, slug: 'volvo-fh-2020', dealer_id: 'dealer-1', status: 'published' },
        ]),
      )
      .mockResolvedValueOnce(mockJsonFetch([{ id: 'dealer-1', name: 'Transport SL' }]))
      .mockResolvedValueOnce(
        mockJsonFetch([{ id: 'cert-uuid', certificate_code: certCode }]),
      )

    const result = await handler({} as any)

    expect(result.certificateCode).toBe(certCode)
    expect(result.vehicleTitle).toBe('Volvo FH (2020)')
    expect(result.slug).toBe('volvo-fh-2020')
    expect(result.dealerName).toBe('Transport SL')
    expect(result.creditsRemaining).toBe(4)
    expect(mockDeductCredits).toHaveBeenCalledWith(
      'user-1',
      1,
      'Certificado publicación vehículo',
      'vehicle-uuid-1',
    )
  })
})
