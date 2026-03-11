/**
 * Tests for POST /api/whatsapp/process
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockReadBody, mockGetHeader, mockGetRequestIP, mockProcessSubmission, mockSanitizeSlug } = vi.hoisted(() => ({
  mockReadBody: vi.fn(),
  mockGetHeader: vi.fn(),
  mockGetRequestIP: vi.fn(),
  mockProcessSubmission: vi.fn(),
  mockSanitizeSlug: vi.fn((s: string) => s),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: (...a: unknown[]) => mockReadBody(...a),
  getHeader: (...a: unknown[]) => mockGetHeader(...a),
  getRequestIP: (...a: unknown[]) => mockGetRequestIP(...a),
  createError: (opts: { statusCode?: number; statusMessage?: string; data?: unknown }) => {
    const err = new Error(opts.statusMessage ?? 'Error')
    ;(err as any).statusCode = opts.statusCode
    return err
  },
}))

let mockSupabase: Record<string, unknown>

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: () => mockSupabase,
}))

vi.mock('~~/server/services/whatsappProcessor', () => ({
  processWhatsAppSubmission: (...a: unknown[]) => mockProcessSubmission(...a),
  sanitizeSlug: (...a: unknown[]) => mockSanitizeSlug(...a),
}))

vi.mock('../../../server/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const mockSafeError = vi.fn((_code: number, msg: string) => {
  const err = new Error(msg) as Error & { statusCode: number }
  err.statusCode = _code
  return err
})
vi.stubGlobal('safeError', mockSafeError)

const mockVerifyTurnstile = vi.fn()
vi.stubGlobal('verifyTurnstile', mockVerifyTurnstile)

vi.stubGlobal('useRuntimeConfig', () => ({
  cronSecret: 'test-secret',
  anthropicApiKey: '',
  public: {},
}))

function makeChain(data: unknown = null, error: unknown = null) {
  const chain: Record<string, unknown> = {}
  const ms = ['select', 'eq', 'single', 'insert']
  for (const m of ms) chain[m] = (..._a: unknown[]) => chain
  chain.then = (r: (v: unknown) => void) => Promise.resolve({ data, error }).then(r)
  chain.catch = (r: (v: unknown) => void) => Promise.resolve({ data, error: null }).catch(r)
  return chain
}

const VALID_UUID = '12345678-1234-1234-1234-123456789abc'

import handler from '../../../server/api/whatsapp/process.post'

describe('POST /api/whatsapp/process', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = { from: () => makeChain({ id: 'v1', slug: 'whatsapp-123' }) }
  })

  it('throws 401 when no internal secret or turnstile token', async () => {
    mockReadBody.mockResolvedValue({ submissionId: VALID_UUID })
    mockGetHeader.mockReturnValue(null)
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 401 })
  })

  it('allows access with internal secret header', async () => {
    mockReadBody.mockResolvedValue({ submissionId: VALID_UUID })
    mockGetHeader.mockReturnValue('test-secret')

    const result = await (handler as Function)({})
    // No AI key configured → placeholder mode
    expect(result.dev).toBe(true)
    expect(result.vehicleId).toBe('v1')
  })

  it('allows access with valid turnstile token', async () => {
    mockReadBody.mockResolvedValue({ submissionId: VALID_UUID, turnstileToken: 'token123' })
    mockGetHeader.mockReturnValue(null)
    mockVerifyTurnstile.mockResolvedValue(true)
    mockGetRequestIP.mockReturnValue('1.2.3.4')

    const result = await (handler as Function)({})
    expect(result.dev).toBe(true)
  })

  it('throws 403 when turnstile verification fails', async () => {
    mockReadBody.mockResolvedValue({ submissionId: VALID_UUID, turnstileToken: 'bad-token' })
    mockGetHeader.mockReturnValue(null)
    mockVerifyTurnstile.mockResolvedValue(false)

    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 400 for missing submissionId', async () => {
    mockReadBody.mockResolvedValue({})
    mockGetHeader.mockReturnValue('test-secret')
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 for invalid UUID', async () => {
    mockReadBody.mockResolvedValue({ submissionId: 'not-a-uuid' })
    mockGetHeader.mockReturnValue('test-secret')
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('creates placeholder in dev mode (no AI keys)', async () => {
    mockReadBody.mockResolvedValue({ submissionId: VALID_UUID })
    mockGetHeader.mockReturnValue('test-secret')

    const result = await (handler as Function)({})
    expect(result.status).toBe('processed')
    expect(result.dev).toBe(true)
    expect(result.vehicleId).toBeTruthy()
  })

  it('throws 500 when placeholder creation fails', async () => {
    mockReadBody.mockResolvedValue({ submissionId: VALID_UUID })
    mockGetHeader.mockReturnValue('test-secret')
    mockSupabase = { from: () => makeChain(null, { message: 'insert failed' }) }

    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 500 })
  })

  it('calls processWhatsAppSubmission when AI key is configured', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      cronSecret: 'test-secret',
      anthropicApiKey: 'sk-ant-test',
      public: {},
    }))

    mockReadBody.mockResolvedValue({ submissionId: VALID_UUID })
    mockGetHeader.mockReturnValue('test-secret')
    mockProcessSubmission.mockResolvedValue({ vehicleId: 'v2', imageCount: 3 })

    const result = await (handler as Function)({})
    expect(result.status).toBe('processed')
    expect(result.vehicleId).toBe('v2')
    expect(mockProcessSubmission).toHaveBeenCalledWith(VALID_UUID, mockSupabase)

    // Restore
    vi.stubGlobal('useRuntimeConfig', () => ({
      cronSecret: 'test-secret',
      anthropicApiKey: '',
      public: {},
    }))
  })

  it('throws 500 when processWhatsAppSubmission fails', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      cronSecret: 'test-secret',
      anthropicApiKey: 'sk-ant-test',
      public: {},
    }))

    mockReadBody.mockResolvedValue({ submissionId: VALID_UUID })
    mockGetHeader.mockReturnValue('test-secret')
    mockProcessSubmission.mockRejectedValue(new Error('AI failed'))

    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 500 })

    vi.stubGlobal('useRuntimeConfig', () => ({
      cronSecret: 'test-secret',
      anthropicApiKey: '',
      public: {},
    }))
  })
})
