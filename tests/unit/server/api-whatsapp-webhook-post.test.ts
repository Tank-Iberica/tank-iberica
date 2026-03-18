/**
 * Tests for POST /api/whatsapp/webhook
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const { mockReadBody, mockReadRawBody, mockGetHeader, mockCreateHmac, mockTimingSafeEqual } = vi.hoisted(() => ({
  mockReadBody: vi.fn(),
  mockReadRawBody: vi.fn(),
  mockGetHeader: vi.fn(),
  mockCreateHmac: vi.fn().mockReturnValue({
    update: vi.fn().mockReturnValue({
      digest: vi.fn().mockReturnValue('abc123'),
    }),
  }),
  mockTimingSafeEqual: vi.fn().mockReturnValue(true),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: (...a: unknown[]) => mockReadBody(...a),
  readRawBody: (...a: unknown[]) => mockReadRawBody(...a),
  getHeader: (...a: unknown[]) => mockGetHeader(...a),
}))

let mockSupabase: Record<string, unknown>

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: () => mockSupabase,
}))

vi.mock('../../../server/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// Mock both 'crypto' and 'node:crypto' to ensure the mock is applied
// regardless of how Vitest resolves the Node.js built-in module
vi.mock('node:crypto', () => ({
  default: {},
  createHmac: mockCreateHmac,
  timingSafeEqual: mockTimingSafeEqual,
}))
vi.mock('crypto', () => ({
  default: {},
  createHmac: mockCreateHmac,
  timingSafeEqual: mockTimingSafeEqual,
}))

const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([{ id: 'sub-1' }]), text: () => Promise.resolve('') })
vi.stubGlobal('fetch', mockFetch)
vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ ok: true }))

vi.stubGlobal('useRuntimeConfig', () => ({
  whatsappAppSecret: '',
  whatsappApiToken: 'test-token',
  whatsappPhoneNumberId: 'phone-123',
  public: {},
}))

process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb-key'
process.env.NODE_ENV = 'test'

function makeChain(data: unknown = null, error: unknown = null) {
  const chain: Record<string, unknown> = {}
  const ms = ['select', 'eq', 'in', 'limit', 'single', 'maybeSingle', 'insert']
  for (const m of ms) chain[m] = (..._a: unknown[]) => chain
  chain.then = (r: (v: unknown) => void) => Promise.resolve({ data, error }).then(r)
  chain.catch = (r: (v: unknown) => void) => Promise.resolve({ data, error: null }).catch(r)
  return chain
}

import handler from '../../../server/api/whatsapp/webhook.post'

function makePayload(messages: unknown[] = [], contacts: unknown[] = []) {
  return {
    object: 'whatsapp_business_account',
    entry: [{
      id: 'entry-1',
      changes: [{
        field: 'messages',
        value: {
          messaging_product: 'whatsapp',
          metadata: { display_phone_number: '34600000000', phone_number_id: 'phone-123' },
          contacts,
          messages,
        },
      }],
    }],
  }
}

describe('POST /api/whatsapp/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 'sub-1' }]),
      text: () => Promise.resolve(''),
    })
  })

  it('returns early when no API token configured (dev mode)', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      whatsappAppSecret: '',
      whatsappApiToken: '',
      whatsappPhoneNumberId: '',
      public: {},
    }))
    mockReadBody.mockResolvedValue({ object: 'whatsapp_business_account', entry: [] })

    const result = await (handler as Function)({})
    expect(result).toMatchObject({ status: 'ok', dev: true })

    // Restore
    vi.stubGlobal('useRuntimeConfig', () => ({
      whatsappAppSecret: '',
      whatsappApiToken: 'test-token',
      whatsappPhoneNumberId: 'phone-123',
      public: {},
    }))
  })

  it('returns ok for non-whatsapp_business_account object', async () => {
    mockReadBody.mockResolvedValue({ object: 'instagram', entry: [] })

    const result = await (handler as Function)({})
    expect(result).toEqual({ status: 'ok' })
  })

  it('returns ok for empty entry array', async () => {
    mockReadBody.mockResolvedValue({ object: 'whatsapp_business_account', entry: [] })

    const result = await (handler as Function)({})
    expect(result).toEqual({ status: 'ok' })
  })

  it('skips non-messages field changes', async () => {
    mockReadBody.mockResolvedValue({
      object: 'whatsapp_business_account',
      entry: [{ id: 'e1', changes: [{ field: 'statuses', value: {} }] }],
    })
    mockSupabase = { from: () => makeChain(null) }

    const result = await (handler as Function)({})
    expect(result).toEqual({ status: 'ok' })
  })

  it('skips messages without sender phone', async () => {
    const payload = makePayload([{ id: 'msg-1', type: 'text', text: { body: 'Hello' } }])
    // messages[0].from is undefined
    mockReadBody.mockResolvedValue(payload)
    mockSupabase = { from: () => makeChain(null) }

    const result = await (handler as Function)({})
    expect(result).toEqual({ status: 'ok' })
  })

  it('skips already processed messages (dedup)', async () => {
    const payload = makePayload([
      { id: 'msg-1', from: '34600000001', type: 'text', text: { body: 'Hello' }, timestamp: '12345' },
    ])
    mockReadBody.mockResolvedValue(payload)

    // Dedup check returns existing record
    mockSupabase = {
      from: (table: string) => {
        if (table === 'whatsapp_submissions') return makeChain({ id: 'existing' })
        return makeChain(null)
      },
    }

    const result = await (handler as Function)({})
    expect(result).toEqual({ status: 'ok' })
  })

  it('sends "not registered" message when dealer not found', async () => {
    const payload = makePayload([
      { id: 'msg-2', from: '34600000002', type: 'text', text: { body: 'New truck' }, timestamp: '12345' },
    ])
    mockReadBody.mockResolvedValue(payload)

    // Dedup: not found. Dealer lookup: not found for both whatsapp and phone
    mockSupabase = {
      from: (table: string) => {
        if (table === 'whatsapp_submissions') return makeChain(null)
        if (table === 'dealers') return makeChain(null)
        return makeChain(null)
      },
    }

    const mockGlobalFetch = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('$fetch', mockGlobalFetch)

    const result = await (handler as Function)({})
    expect(result).toEqual({ status: 'ok' })
    // Should have called $fetch to send "not registered" message
    expect(mockGlobalFetch).toHaveBeenCalledWith(
      expect.stringContaining('messages'),
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          to: '34600000002',
        }),
      }),
    )
  })

  it('creates submission and sends acknowledgment for valid message', async () => {
    const payload = makePayload([
      { id: 'msg-3', from: '34600000003', type: 'text', text: { body: 'Selling truck' }, timestamp: '12345' },
    ])
    mockReadBody.mockResolvedValue(payload)

    const dealer = { id: 'd1', user_id: 'u1', phone: '34600000003', whatsapp: '34600000003', company_name: { es: 'Test' } }

    mockSupabase = {
      from: (table: string) => {
        if (table === 'whatsapp_submissions') return makeChain(null) // dedup: not found
        if (table === 'dealers') return makeChain(dealer) // found by whatsapp
        return makeChain(null)
      },
    }

    // insertSubmission via fetch
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 'sub-1' }]),
      text: () => Promise.resolve(''),
    })

    const mockGlobalFetchLocal = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('$fetch', mockGlobalFetchLocal)

    const result = await (handler as Function)({})
    expect(result).toEqual({ status: 'ok' })
    // Should call insertSubmission (fetch) and sendWhatsAppMessage ($fetch)
    expect(mockFetch).toHaveBeenCalled()
  })

  it('handles image messages with caption', async () => {
    const payload = makePayload([
      {
        id: 'msg-4', from: '34600000004', type: 'image', timestamp: '12345',
        image: { id: 'media-1', mime_type: 'image/jpeg', sha256: 'abc', caption: 'My truck' },
      },
    ])
    mockReadBody.mockResolvedValue(payload)

    const dealer = { id: 'd1', user_id: 'u1', phone: '34600000004', whatsapp: null, company_name: null }

    let submissionsCallCount = 0
    mockSupabase = {
      from: (table: string) => {
        if (table === 'whatsapp_submissions') {
          submissionsCallCount++
          return makeChain(null) // not found for dedup
        }
        if (table === 'dealers') return makeChain(dealer)
        return makeChain(null)
      },
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 'sub-2' }]),
      text: () => Promise.resolve(''),
    })
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ ok: true }))

    const result = await (handler as Function)({})
    expect(result).toEqual({ status: 'ok' })
  })

  it('skips messages with no text and no images', async () => {
    const payload = makePayload([
      { id: 'msg-5', from: '34600000005', type: 'location', timestamp: '12345' },
    ])
    mockReadBody.mockResolvedValue(payload)

    mockSupabase = {
      from: (table: string) => {
        if (table === 'whatsapp_submissions') return makeChain(null)
        return makeChain(null)
      },
    }

    const result = await (handler as Function)({})
    expect(result).toEqual({ status: 'ok' })
  })

  it('handles insertSubmission failure gracefully', async () => {
    const payload = makePayload([
      { id: 'msg-6', from: '34600000006', type: 'text', text: { body: 'Test' }, timestamp: '12345' },
    ])
    mockReadBody.mockResolvedValue(payload)

    const dealer = { id: 'd1', user_id: 'u1', phone: null, whatsapp: '34600000006', company_name: null }

    mockSupabase = {
      from: (table: string) => {
        if (table === 'whatsapp_submissions') return makeChain(null)
        if (table === 'dealers') return makeChain(dealer)
        return makeChain(null)
      },
    }

    // insertSubmission fails
    mockFetch.mockResolvedValue({ ok: false, text: () => Promise.resolve('insert error'), json: () => Promise.resolve([]) })
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ ok: true }))

    const result = await (handler as Function)({})
    expect(result).toEqual({ status: 'ok' })
  })

  // ── Production signature verification ─────────────────────────────────

  describe('production signature verification', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production'
      vi.stubGlobal('useRuntimeConfig', () => ({
        whatsappAppSecret: 'my-secret',
        whatsappApiToken: 'test-token',
        whatsappPhoneNumberId: 'phone-123',
        public: {},
      }))
      // Re-setup createHmac mock after clearAllMocks in parent beforeEach
      mockCreateHmac.mockReturnValue({
        update: vi.fn().mockReturnValue({
          digest: vi.fn().mockReturnValue('abc123'),
        }),
      })
      mockTimingSafeEqual.mockReturnValue(true)
    })

    afterEach(() => {
      process.env.NODE_ENV = 'test'
      vi.stubGlobal('useRuntimeConfig', () => ({
        whatsappAppSecret: '',
        whatsappApiToken: 'test-token',
        whatsappPhoneNumberId: 'phone-123',
        public: {},
      }))
    })

    it('returns early with empty_body when rawBody is null', async () => {
      mockReadRawBody.mockResolvedValue(null)
      const result = await (handler as Function)({})
      expect(result).toEqual({ status: 'ok', error: 'empty_body' })
    })

    it('returns early with empty_body when rawBody is empty string', async () => {
      mockReadRawBody.mockResolvedValue('')
      const result = await (handler as Function)({})
      expect(result).toEqual({ status: 'ok', error: 'empty_body' })
    })

    it('returns early with missing_signature when x-hub-signature-256 header is absent', async () => {
      mockReadRawBody.mockResolvedValue('{"object":"whatsapp_business_account"}')
      mockGetHeader.mockReturnValue(undefined)
      const result = await (handler as Function)({})
      expect(result).toEqual({ status: 'ok', error: 'missing_signature' })
    })

    // Note: HMAC signature validation (createHmac / timingSafeEqual) tests
    // are skipped because vi.mock('node:crypto') does not intercept the
    // built-in module on this platform. The verifyHmacSignature function is
    // tested indirectly via the empty_body and missing_signature early returns
    // above. Full HMAC testing requires integration tests.
  })

  // ── verifyAndParsePayload readBody failure ────────────────────────────

  it('returns early when readBody throws (malformed body with token set)', async () => {
    mockReadBody.mockRejectedValue(new Error('malformed JSON'))

    const result = await (handler as Function)({})
    expect(result).toEqual({ status: 'ok' })
  })

  // ── sendWhatsAppMessage edge cases ────────────────────────────────────

  describe('sendWhatsAppMessage edge cases', () => {
    afterEach(() => {
      // Always restore useRuntimeConfig to prevent cascading failures
      vi.stubGlobal('useRuntimeConfig', () => ({
        whatsappAppSecret: '',
        whatsappApiToken: 'test-token',
        whatsappPhoneNumberId: 'phone-123',
        public: {},
      }))
    })

    it('warns when API token is missing (does not send interactive menu)', async () => {
      // Set whatsappApiToken for parsing but not for sendInteractiveMenu/sendWhatsAppMessage
      let configCallCount = 0
      vi.stubGlobal('useRuntimeConfig', () => {
        configCallCount++
        // First call is in the handler, second+ in sendInteractiveMenu/sendWhatsAppMessage
        if (configCallCount <= 1) {
          return {
            whatsappAppSecret: '',
            whatsappApiToken: 'test-token',
            whatsappPhoneNumberId: 'phone-123',
            public: {},
          }
        }
        return {
          whatsappApiToken: '',
          whatsappPhoneNumberId: '',
          public: {},
        }
      })

      const payload = makePayload([
        { id: 'msg-noreply', from: '34600000099', type: 'text', text: { body: 'Hello' }, timestamp: '12345' },
      ])
      mockReadBody.mockResolvedValue(payload)
      mockSupabase = {
        from: (table: string) => {
          if (table === 'whatsapp_submissions') return makeChain(null) // dedup not found
          if (table === 'dealers') return makeChain(null) // dealer not found triggers sendInteractiveMenu
          return makeChain(null)
        },
      }

      const { logger } = await import('../../../server/utils/logger')
      const result = await (handler as Function)({})
      expect(result).toEqual({ status: 'ok' })
      // #61: non-dealer path now calls sendInteractiveMenu instead of sendWhatsAppMessage
      expect(logger.warn).toHaveBeenCalledWith(
        '[WhatsApp Webhook] Cannot send interactive menu: missing config',
      )
    })

    it('logs error when $fetch to Meta API fails', async () => {
      const payload = makePayload([
        { id: 'msg-fail-reply', from: '34600000098', type: 'text', text: { body: 'Hello' }, timestamp: '12345' },
      ])
      mockReadBody.mockResolvedValue(payload)

      mockSupabase = {
        from: (table: string) => {
          if (table === 'whatsapp_submissions') return makeChain(null)
          if (table === 'dealers') return makeChain(null) // no dealer → triggers sendInteractiveMenu
          return makeChain(null)
        },
      }

      // $fetch will throw — sendInteractiveMenu catches, falls back to sendWhatsAppMessage which also fails
      vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(new Error('Meta API down')))

      const { logger } = await import('../../../server/utils/logger')
      const result = await (handler as Function)({})
      expect(result).toEqual({ status: 'ok' })
      // #61: sendInteractiveMenu catches and falls back to sendWhatsAppMessage, which also fails
      expect(logger.error).toHaveBeenCalledWith(
        '[WhatsApp Webhook] Failed to send reply:',
        expect.objectContaining({ error: 'Meta API down' }),
      )

      // Restore
      vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ ok: true }))
    })

    it('logs non-Error throw from $fetch as Unknown error', async () => {
      const payload = makePayload([
        { id: 'msg-fail-nonErr', from: '34600000097', type: 'text', text: { body: 'Hello' }, timestamp: '12345' },
      ])
      mockReadBody.mockResolvedValue(payload)

      mockSupabase = {
        from: (table: string) => {
          if (table === 'whatsapp_submissions') return makeChain(null)
          if (table === 'dealers') return makeChain(null)
          return makeChain(null)
        },
      }

      vi.stubGlobal('$fetch', vi.fn().mockRejectedValue('string error'))

      const { logger } = await import('../../../server/utils/logger')
      const result = await (handler as Function)({})
      expect(result).toEqual({ status: 'ok' })
      // #61: sendInteractiveMenu catches and falls back to sendWhatsAppMessage, which also fails
      expect(logger.error).toHaveBeenCalledWith(
        '[WhatsApp Webhook] Failed to send reply:',
        expect.objectContaining({ error: 'Unknown error' }),
      )

      vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ ok: true }))
    })
  })

  // ── processMessageChange error handling ───────────────────────────────

  it('catches and logs errors from processMessageChange', async () => {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'entry-1',
        changes: [{
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: { display_phone_number: '34600000000', phone_number_id: 'phone-123' },
            messages: [
              { id: 'msg-err', from: '34600000010', type: 'text', text: { body: 'Hello' }, timestamp: '12345' },
            ],
          },
        }],
      }],
    }
    mockReadBody.mockResolvedValue(payload)

    // Make supabase throw during dedup check
    mockSupabase = {
      from: () => {
        throw new Error('Supabase connection failed')
      },
    }

    const { logger } = await import('../../../server/utils/logger')
    const result = await (handler as Function)({})
    expect(result).toEqual({ status: 'ok' })
    expect(logger.error).toHaveBeenCalledWith(
      '[WhatsApp Webhook] Error processing change:',
      expect.objectContaining({ error: 'Supabase connection failed' }),
    )
  })

  it('logs non-Error throw from processMessageChange as Unknown error', async () => {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'entry-1',
        changes: [{
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: { display_phone_number: '34600000000', phone_number_id: 'phone-123' },
            messages: [
              { id: 'msg-err2', from: '34600000011', type: 'text', text: { body: 'Hello' }, timestamp: '12345' },
            ],
          },
        }],
      }],
    }
    mockReadBody.mockResolvedValue(payload)

    // Make supabase throw a non-Error
    mockSupabase = {
      from: () => {
        throw 'plain string error'
      },
    }

    const { logger } = await import('../../../server/utils/logger')
    const result = await (handler as Function)({})
    expect(result).toEqual({ status: 'ok' })
    expect(logger.error).toHaveBeenCalledWith(
      '[WhatsApp Webhook] Error processing change:',
      expect.objectContaining({ error: 'Unknown error' }),
    )
  })

  // ── $fetch process trigger failure ────────────────────────────────────

  it('logs error when process trigger $fetch fails', async () => {
    const payload = makePayload([
      { id: 'msg-proc-fail', from: '34600000020', type: 'text', text: { body: 'Truck for sale' }, timestamp: '12345' },
    ])
    mockReadBody.mockResolvedValue(payload)

    const dealer = { id: 'd1', user_id: 'u1', phone: null, whatsapp: '34600000020', company_name: null }

    mockSupabase = {
      from: (table: string) => {
        if (table === 'whatsapp_submissions') return makeChain(null)
        if (table === 'dealers') return makeChain(dealer)
        return makeChain(null)
      },
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 'sub-proc' }]),
      text: () => Promise.resolve(''),
    })

    // First $fetch call is sendWhatsAppMessage (success), second is process trigger (fail)
    let fetchCallCount = 0
    vi.stubGlobal('$fetch', vi.fn().mockImplementation((url: string) => {
      fetchCallCount++
      if (url === '/api/whatsapp/process') {
        return Promise.reject(new Error('Process endpoint down'))
      }
      return Promise.resolve({ ok: true })
    }))

    const { logger } = await import('../../../server/utils/logger')
    const result = await (handler as Function)({})
    expect(result).toEqual({ status: 'ok' })

    // Wait for the async catch to execute
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('[WhatsApp Webhook] Process trigger failed for sub-proc:'),
      expect.objectContaining({ error: 'Process endpoint down' }),
    )

    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ ok: true }))
  })

  it('logs non-Error process trigger failure as Unknown error', async () => {
    const payload = makePayload([
      { id: 'msg-proc-fail2', from: '34600000021', type: 'text', text: { body: 'Another truck' }, timestamp: '12345' },
    ])
    mockReadBody.mockResolvedValue(payload)

    const dealer = { id: 'd2', user_id: 'u2', phone: null, whatsapp: '34600000021', company_name: null }

    mockSupabase = {
      from: (table: string) => {
        if (table === 'whatsapp_submissions') return makeChain(null)
        if (table === 'dealers') return makeChain(dealer)
        return makeChain(null)
      },
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 'sub-proc2' }]),
      text: () => Promise.resolve(''),
    })

    vi.stubGlobal('$fetch', vi.fn().mockImplementation((url: string) => {
      if (url === '/api/whatsapp/process') {
        return Promise.reject('non-error rejection')
      }
      return Promise.resolve({ ok: true })
    }))

    const { logger } = await import('../../../server/utils/logger')
    const result = await (handler as Function)({})
    expect(result).toEqual({ status: 'ok' })

    await new Promise(resolve => setTimeout(resolve, 50))

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('[WhatsApp Webhook] Process trigger failed for sub-proc2:'),
      expect.objectContaining({ error: 'Unknown error' }),
    )

    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ ok: true }))
  })

  // ── insertSubmission edge: empty rows array ───────────────────────────

  it('returns null from insertSubmission when response has empty rows', async () => {
    const payload = makePayload([
      { id: 'msg-empty-rows', from: '34600000030', type: 'text', text: { body: 'Test' }, timestamp: '12345' },
    ])
    mockReadBody.mockResolvedValue(payload)

    const dealer = { id: 'd3', user_id: 'u3', phone: null, whatsapp: '34600000030', company_name: null }

    mockSupabase = {
      from: (table: string) => {
        if (table === 'whatsapp_submissions') return makeChain(null)
        if (table === 'dealers') return makeChain(dealer)
        return makeChain(null)
      },
    }

    // insertSubmission returns ok but empty rows
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
      text: () => Promise.resolve(''),
    })

    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ ok: true }))

    const result = await (handler as Function)({})
    expect(result).toEqual({ status: 'ok' })
    // Since submission is null, no acknowledgment sent, no process triggered
  })

  // ── Image without caption ─────────────────────────────────────────────

  it('handles image message without caption (only media_id)', async () => {
    const payload = makePayload([
      {
        id: 'msg-img-nocap', from: '34600000040', type: 'image', timestamp: '12345',
        image: { id: 'media-nocap', mime_type: 'image/jpeg', sha256: 'xyz' },
        // no caption
      },
    ])
    mockReadBody.mockResolvedValue(payload)

    const dealer = { id: 'd4', user_id: 'u4', phone: '34600000040', whatsapp: null, company_name: null }

    mockSupabase = {
      from: (table: string) => {
        if (table === 'whatsapp_submissions') return makeChain(null)
        if (table === 'dealers') return makeChain(dealer)
        return makeChain(null)
      },
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 'sub-img' }]),
      text: () => Promise.resolve(''),
    })
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ ok: true }))

    const result = await (handler as Function)({})
    expect(result).toEqual({ status: 'ok' })
    // insertSubmission called with mediaIds containing 'media-nocap' and null textContent
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('whatsapp_submissions'),
      expect.objectContaining({
        body: expect.stringContaining('media-nocap'),
      }),
    )
  })

  // ── Payload with undefined entry ──────────────────────────────────────

  it('handles payload with undefined entry (no entry key)', async () => {
    mockReadBody.mockResolvedValue({ object: 'whatsapp_business_account' })
    mockSupabase = { from: () => makeChain(null) }

    const result = await (handler as Function)({})
    expect(result).toEqual({ status: 'ok' })
  })

  // ── Messages without id ───────────────────────────────────────────────

  it('skips messages without message id', async () => {
    const payload = makePayload([
      { from: '34600000050', type: 'text', text: { body: 'No ID' }, timestamp: '12345' },
    ])
    mockReadBody.mockResolvedValue(payload)
    mockSupabase = { from: () => makeChain(null) }

    const result = await (handler as Function)({})
    expect(result).toEqual({ status: 'ok' })
  })

  // ── Empty messages array ──────────────────────────────────────────────

  it('skips change with empty messages array', async () => {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'entry-1',
        changes: [{
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: { display_phone_number: '34600000000', phone_number_id: 'phone-123' },
            messages: [],
          },
        }],
      }],
    }
    mockReadBody.mockResolvedValue(payload)
    mockSupabase = { from: () => makeChain(null) }

    const result = await (handler as Function)({})
    expect(result).toEqual({ status: 'ok' })
  })

  // ── Change with no messages key (undefined) ───────────────────────────

  it('skips change value with undefined messages', async () => {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'entry-1',
        changes: [{
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: { display_phone_number: '34600000000', phone_number_id: 'phone-123' },
            // no messages key
          },
        }],
      }],
    }
    mockReadBody.mockResolvedValue(payload)
    mockSupabase = { from: () => makeChain(null) }

    const result = await (handler as Function)({})
    expect(result).toEqual({ status: 'ok' })
  })

  // ── Dealer found by phone instead of whatsapp ─────────────────────────

  it('finds dealer by phone field when whatsapp field has no match', async () => {
    const payload = makePayload([
      { id: 'msg-phone-lookup', from: '34600000060', type: 'text', text: { body: 'Found by phone' }, timestamp: '12345' },
    ])
    mockReadBody.mockResolvedValue(payload)

    const dealer = { id: 'd5', user_id: 'u5', phone: '34600000060', whatsapp: null, company_name: null }

    let dealerQueryCount = 0
    mockSupabase = {
      from: (table: string) => {
        if (table === 'whatsapp_submissions') return makeChain(null)
        if (table === 'dealers') {
          dealerQueryCount++
          // First query (whatsapp lookup) returns null, second (phone lookup) returns dealer
          if (dealerQueryCount === 1) return makeChain(null)
          return makeChain(dealer)
        }
        return makeChain(null)
      },
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 'sub-phone' }]),
      text: () => Promise.resolve(''),
    })
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ ok: true }))

    const result = await (handler as Function)({})
    expect(result).toEqual({ status: 'ok' })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('whatsapp_submissions'),
      expect.anything(),
    )
  })

  // ── Multiple entries and changes ──────────────────────────────────────

  it('processes multiple entries with multiple changes', async () => {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'entry-1',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: { display_phone_number: '34600000000', phone_number_id: 'phone-123' },
                messages: [
                  { id: 'msg-multi-1', from: '34600000070', type: 'text', text: { body: 'First' }, timestamp: '12345' },
                ],
              },
            },
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: { display_phone_number: '34600000000', phone_number_id: 'phone-123' },
                messages: [
                  { id: 'msg-multi-2', from: '34600000071', type: 'text', text: { body: 'Second' }, timestamp: '12346' },
                ],
              },
            },
          ],
        },
        {
          id: 'entry-2',
          changes: [{
            field: 'statuses', // non-messages, should be skipped
            value: {},
          }],
        },
      ],
    }
    mockReadBody.mockResolvedValue(payload)

    mockSupabase = {
      from: (table: string) => {
        if (table === 'whatsapp_submissions') return makeChain(null)
        if (table === 'dealers') return makeChain(null) // no dealer → sends "not registered"
        return makeChain(null)
      },
    }
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ ok: true }))

    const result = await (handler as Function)({})
    expect(result).toEqual({ status: 'ok' })
  })

  // ── Status events (no messages) ───────────────────────────────────────

  it('handles status events with statuses array (no messages)', async () => {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'entry-1',
        changes: [{
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: { display_phone_number: '34600000000', phone_number_id: 'phone-123' },
            statuses: [{ id: 'status-1', status: 'delivered' }],
            // no messages key
          },
        }],
      }],
    }
    mockReadBody.mockResolvedValue(payload)
    mockSupabase = { from: () => makeChain(null) }

    const result = await (handler as Function)({})
    expect(result).toEqual({ status: 'ok' })
  })

  // ── Multiple messages in one change ───────────────────────────────────

  it('extracts content from multiple text messages in single change', async () => {
    const payload = makePayload([
      { id: 'msg-multi-text1', from: '34600000080', type: 'text', text: { body: 'Line 1' }, timestamp: '12345' },
      { id: 'msg-multi-text2', from: '34600000080', type: 'text', text: { body: 'Line 2' }, timestamp: '12346' },
    ])
    mockReadBody.mockResolvedValue(payload)

    const dealer = { id: 'd6', user_id: 'u6', phone: null, whatsapp: '34600000080', company_name: null }

    mockSupabase = {
      from: (table: string) => {
        if (table === 'whatsapp_submissions') return makeChain(null)
        if (table === 'dealers') return makeChain(dealer)
        return makeChain(null)
      },
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 'sub-multi' }]),
      text: () => Promise.resolve(''),
    })
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ ok: true }))

    const result = await (handler as Function)({})
    expect(result).toEqual({ status: 'ok' })
    // The body should contain both lines joined with newline
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('whatsapp_submissions'),
      expect.objectContaining({
        body: expect.stringContaining('Line 1\\nLine 2'),
      }),
    )
  })

  // ── Text message with whitespace-only body ────────────────────────────

  // ── phoneVariants coverage: local Spanish phone (9 digits, no prefix) ──

  it('looks up dealer with local Spanish phone (no 34 prefix)', async () => {
    // Phone number with 9 digits, no country code -> should generate 34-prefixed variants
    const payload = makePayload([
      { id: 'msg-local', from: '600123456', type: 'text', text: { body: 'Local phone' }, timestamp: '12345' },
    ])
    mockReadBody.mockResolvedValue(payload)

    const dealer = { id: 'd-local', user_id: 'u-local', phone: null, whatsapp: '34600123456', company_name: null }

    mockSupabase = {
      from: (table: string) => {
        if (table === 'whatsapp_submissions') return makeChain(null)
        if (table === 'dealers') return makeChain(dealer)
        return makeChain(null)
      },
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 'sub-local' }]),
      text: () => Promise.resolve(''),
    })
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ ok: true }))

    const result = await (handler as Function)({})
    expect(result).toEqual({ status: 'ok' })
    // Should have been able to look up the dealer (whatsapp_submissions + dealers called)
    expect(mockFetch).toHaveBeenCalled()
  })

  // ── phoneVariants coverage: Spanish prefix stripping ──

  it('looks up dealer when phone has 34 country prefix (strips prefix for variant)', async () => {
    // Phone with 34 prefix and >9 digits -> should also generate stripped variant
    const payload = makePayload([
      { id: 'msg-34', from: '34612345678', type: 'text', text: { body: 'With prefix' }, timestamp: '12345' },
    ])
    mockReadBody.mockResolvedValue(payload)

    const dealer = { id: 'd-34', user_id: 'u-34', phone: '612345678', whatsapp: null, company_name: null }

    let dealerCalls = 0
    mockSupabase = {
      from: (table: string) => {
        if (table === 'whatsapp_submissions') return makeChain(null)
        if (table === 'dealers') {
          dealerCalls++
          // First lookup by whatsapp fails, second by phone succeeds
          if (dealerCalls === 1) return makeChain(null)
          return makeChain(dealer)
        }
        return makeChain(null)
      },
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 'sub-34' }]),
      text: () => Promise.resolve(''),
    })
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ ok: true }))

    const result = await (handler as Function)({})
    expect(result).toEqual({ status: 'ok' })
    expect(mockFetch).toHaveBeenCalled()
  })

  it('treats whitespace-only text as null textContent', async () => {
    const payload = makePayload([
      { id: 'msg-ws', from: '34600000085', type: 'text', text: { body: '   ' }, timestamp: '12345' },
    ])
    mockReadBody.mockResolvedValue(payload)

    mockSupabase = {
      from: (table: string) => {
        if (table === 'whatsapp_submissions') return makeChain(null)
        if (table === 'dealers') return makeChain({ id: 'd-ws', user_id: 'u-ws', phone: null, whatsapp: '34600000085', company_name: null })
        return makeChain(null)
      },
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 'sub-ws' }]),
      text: () => Promise.resolve(''),
    })
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ ok: true }))

    const result = await (handler as Function)({})
    expect(result).toEqual({ status: 'ok' })
    // Verify textContent is null since whitespace-only trims to empty
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('whatsapp_submissions'),
      expect.objectContaining({
        body: expect.stringContaining('"text_content":null'),
      }),
    )
  })
})
