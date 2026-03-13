/**
 * Tests for POST /api/whatsapp/broadcast
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

function makeSupabase(opts: {
  vehicleData?: unknown
  vehicleError?: unknown
  configValue?: unknown | null
  insertError?: unknown
} = {}) {
  const { vehicleData = null, vehicleError = null, configValue = true, insertError = null } = opts

  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'vehicles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: vehicleData,
            error: vehicleError,
          }),
        }
      }
      if (table === 'vertical_config') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: configValue !== null ? { value: configValue } : null,
            error: null,
          }),
        }
      }
      if (table === 'whatsapp_submissions') {
        return {
          insert: vi.fn().mockResolvedValue({ error: insertError }),
        }
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null }) }
    }),
  }
}

const VEHICLE = {
  id: VALID_UUID,
  brand: 'Volvo',
  model: 'FH16',
  year: 2022,
  price: 8500000,
  location: 'Madrid',
  slug: 'volvo-fh16-2022',
  vehicle_images: [
    { url: 'https://cdn.example.com/img1.jpg', position: 0 },
  ],
}

import handler, { sendWhatsAppBroadcast } from '../../../server/api/whatsapp/broadcast.post'

describe('POST /api/whatsapp/broadcast', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockServerUser.mockResolvedValue({ id: 'admin-1' })
    mockValidateBody.mockResolvedValue({ vehicleId: VALID_UUID })
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ messages: [{ id: 'wamid.123' }] }),
      text: () => Promise.resolve(''),
    })
    process.env.WHATSAPP_PHONE_NUMBER_ID = 'phone-123'
    process.env.WHATSAPP_ACCESS_TOKEN = 'token-abc'
    process.env.WHATSAPP_CHANNEL_ID = 'channel-456'
    mockSupabase = makeSupabase({ vehicleData: VEHICLE })
  })

  it('sends broadcast and returns ok=true', async () => {
    const result = await handler({} as any)
    expect(result).toEqual({ ok: true, vehicleId: VALID_UUID, messageId: 'wamid.123' })
  })

  it('returns 401 when user not authenticated', async () => {
    mockServerUser.mockResolvedValue(null)
    await expect(handler({} as any)).rejects.toThrow('Unauthorized')
  })

  it('skips gracefully when env vars not configured', async () => {
    delete process.env.WHATSAPP_PHONE_NUMBER_ID
    delete process.env.WHATSAPP_ACCESS_TOKEN
    delete process.env.WHATSAPP_CHANNEL_ID
    const result = await handler({} as any)
    expect(result).toMatchObject({ ok: false, skipped: true, reason: 'WhatsApp not configured' })
  })

  it('skips when broadcast disabled in config', async () => {
    mockSupabase = makeSupabase({ vehicleData: VEHICLE, configValue: false })
    const result = await handler({} as any)
    expect(result).toMatchObject({ ok: false, skipped: true, reason: expect.stringContaining('disabled') })
  })

  it('skips broadcast when config returns null (treats as enabled)', async () => {
    // null configData means no explicit disable → should proceed (value !== false = true)
    mockSupabase = makeSupabase({ vehicleData: VEHICLE, configValue: null })
    const result = await handler({} as any)
    // null config → broadcastEnabled = true → should proceed and send
    expect(result).toMatchObject({ ok: true })
  })

  it('throws 404 when vehicle not found', async () => {
    mockSupabase = makeSupabase({ vehicleData: null, vehicleError: new Error('not found') })
    await expect(handler({} as any)).rejects.toThrow('Vehicle not found')
  })

  it('propagates WhatsApp API error as 502', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal error'),
    })
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 502 })
  })

  it('calls Meta API with correct URL and headers', async () => {
    await handler({} as any)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://graph.facebook.com/v19.0/phone-123/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-abc',
          'Content-Type': 'application/json',
        }),
      }),
    )
  })

  it('includes vehicle URL in message body', async () => {
    await handler({} as any)
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.text.body).toContain('https://tracciona.com/vehiculo/volvo-fh16-2022')
  })

  it('inserts broadcast record to whatsapp_submissions', async () => {
    const insertSpy = vi.fn().mockResolvedValue({ error: null })
    mockSupabase = {
      ...makeSupabase({ vehicleData: VEHICLE }),
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'whatsapp_submissions') return { insert: insertSpy }
        return makeSupabase({ vehicleData: VEHICLE, configValue: true }).from(table)
      }),
    }
    await handler({} as any)
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message_type: 'broadcast', status: 'sent' }),
    )
  })

  it('uses fallback messageId when Meta response missing messages array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
    })
    const result = await handler({} as any)
    expect(result).toMatchObject({ ok: true })
    expect((result as any).messageId).toMatch(/^wa_\d+$/)
  })
})

describe('sendWhatsAppBroadcast (unit)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ messages: [{ id: 'wamid.xyz' }] }),
    })
  })

  it('returns messageId from response', async () => {
    const result = await sendWhatsAppBroadcast('hello', 'ch-1', 'ph-1', 'tok-1')
    expect(result).toEqual({ messageId: 'wamid.xyz' })
  })

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: () => Promise.resolve('Forbidden'),
    })
    await expect(sendWhatsAppBroadcast('hello', 'ch-1', 'ph-1', 'tok-1')).rejects.toThrow(
      'WhatsApp API error (403)',
    )
  })
})
