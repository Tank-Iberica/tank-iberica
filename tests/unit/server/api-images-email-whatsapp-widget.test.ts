/**
 * Tests for:
 * - POST /api/images/process
 * - POST /api/email/send
 * - POST /api/whatsapp/process
 * - GET  /api/widget/:dealerId
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const {
  mockReadBody,
  mockGetQuery,
  mockSetResponseHeaders,
  mockSafeError,
  mockServiceRole,
  mockSupabaseUser,
  mockGetHeader,
  mockGetRequestIP,
} = vi.hoisted(() => {
  const mockSafeError = vi.fn((status: number, msg: string) => {
    const err = new Error(msg)
    ;(err as any).statusCode = status
    return err
  })
  return {
    mockReadBody: vi.fn().mockResolvedValue({}),
    mockGetQuery: vi.fn().mockReturnValue({}),
    mockSetResponseHeaders: vi.fn(),
    mockSafeError,
    mockServiceRole: vi.fn(),
    mockSupabaseUser: vi.fn().mockResolvedValue(null),
    mockGetHeader: vi.fn().mockReturnValue(undefined),
    mockGetRequestIP: vi.fn().mockReturnValue('1.2.3.4'),
  }
})

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: mockReadBody,
  getQuery: mockGetQuery,
  getHeader: mockGetHeader,
  getRequestIP: mockGetRequestIP,
  setResponseHeaders: mockSetResponseHeaders,
  setResponseStatus: vi.fn(),
  createError: (opts: { statusCode?: number; statusMessage?: string }) => {
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

vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = { send: vi.fn().mockResolvedValue({ id: 'email-id' }) }
  },
}))

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({ statusCode: 201 }),
  },
}))

vi.mock('~~/server/services/whatsappProcessor', () => ({
  processWhatsAppSubmission: vi.fn().mockResolvedValue({ success: true }),
  sanitizeSlug: vi.fn((s: string) => s),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
}))

vi.stubGlobal('useRuntimeConfig', () => ({
  cloudflareImagesApiToken: undefined,
  cloudflareAccountId: undefined,
  cloudflareImagesDeliveryUrl: undefined,
  imagePipelineMode: 'cloudinary',
  vapidPublicKey: undefined,
  vapidPrivateKey: undefined,
  vapidEmail: undefined,
  resendApiKey: undefined,
  cronSecret: undefined,
  public: { vapidPublicKey: undefined, siteUrl: 'https://tracciona.com' },
}))
vi.stubGlobal('verifyTurnstile', vi.fn().mockResolvedValue(true))
vi.stubGlobal('safeError', vi.fn((status: number, msg: string) => {
  const err = new Error(msg); (err as any).statusCode = status; return err
}))

function makeChain(data: any = null, error: any = null) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data, error }),
      maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    }),
  }
}

const validCloudinaryUrl = 'https://res.cloudinary.com/test/image/upload/test.jpg'
const validUUID = '550e8400-e29b-41d4-a716-446655440000'

// ── POST /api/images/process ──────────────────────────────────────────────────

import processImageHandler from '../../../server/api/images/process.post'

describe('POST /api/images/process', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    mockReadBody.mockResolvedValue({ cloudinaryUrl: validCloudinaryUrl })
  })

  it('throws 401 when not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(processImageHandler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when cloudinaryUrl is missing', async () => {
    mockReadBody.mockResolvedValue({})
    await expect(processImageHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when cloudinaryUrl is not from cloudinary', async () => {
    mockReadBody.mockResolvedValue({ cloudinaryUrl: 'https://evil.com/image.jpg' })
    await expect(processImageHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns cloudinary URLs in cloudinary mode', async () => {
    const result = await processImageHandler({} as any)
    expect(result.pipeline).toBe('cloudinary')
    expect(result.urls.thumb).toContain('cloudinary')
    expect(result.original).toBe(validCloudinaryUrl)
  })
})

// ── POST /api/email/send ──────────────────────────────────────────────────────

import emailSendHandler from '../../../server/api/email/send.post'

describe('POST /api/email/send', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseUser.mockResolvedValue({ id: 'user-1' })
    mockReadBody.mockResolvedValue({
      templateKey: 'welcome',
      to: 'user@test.com',
    })
  })

  it('throws 401 when not authenticated', async () => {
    mockSupabaseUser.mockResolvedValue(null)
    await expect(emailSendHandler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when templateKey is missing', async () => {
    mockReadBody.mockResolvedValue({ to: 'user@test.com' })
    await expect(emailSendHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when to is missing', async () => {
    mockReadBody.mockResolvedValue({ templateKey: 'welcome' })
    await expect(emailSendHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 500 when vertical_config not found', async () => {
    mockServiceRole.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
      }),
    })
    await expect(emailSendHandler({} as any)).rejects.toMatchObject({ statusCode: 500 })
  })
})

// ── POST /api/whatsapp/process ────────────────────────────────────────────────

import whatsappProcessHandler from '../../../server/api/whatsapp/process.post'

describe('POST /api/whatsapp/process', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReadBody.mockResolvedValue({ submissionId: validUUID })
    mockGetHeader.mockReturnValue(undefined)
    vi.stubGlobal('useRuntimeConfig', () => ({
      cronSecret: 'test-cron',
      public: {},
    }))
  })

  it('throws 401 when no auth and no turnstile token', async () => {
    mockGetHeader.mockReturnValue(undefined)
    mockReadBody.mockResolvedValue({ submissionId: validUUID, turnstileToken: undefined })
    await expect(whatsappProcessHandler({} as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when submissionId is missing', async () => {
    mockGetHeader.mockReturnValue('test-cron') // x-internal-secret matches
    mockReadBody.mockResolvedValue({})
    await expect(whatsappProcessHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when submissionId is invalid UUID', async () => {
    mockGetHeader.mockReturnValue('test-cron')
    mockReadBody.mockResolvedValue({ submissionId: 'not-a-uuid' })
    await expect(whatsappProcessHandler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })
})

// ── GET /api/widget/:dealerId ─────────────────────────────────────────────────

import widgetHandler from '../../../server/api/widget/[dealerId].get'

describe('GET /api/widget/:dealerId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetQuery.mockReturnValue({ theme: 'light' })
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  afterEach(() => {
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  it('returns HTML string even with no Supabase config', async () => {
    const event = { context: { params: { dealerId: 'test-dealer' } } } as any
    const result = await widgetHandler(event)
    // Without SUPABASE_URL configured, returns error HTML
    expect(typeof result).toBe('string')
  })

  it('returns HTML string when dealer not found', async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'

    const { createClient } = await import('@supabase/supabase-js')
    vi.mocked(createClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
      }),
    } as any)

    const event = { context: { params: { dealerId: 'test-dealer' } } } as any
    const result = await widgetHandler(event)
    expect(typeof result).toBe('string')
    // Returns HTML error message when dealer not found
    expect(result).toBeTruthy()
  })
})
