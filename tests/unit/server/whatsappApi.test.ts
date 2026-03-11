import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  // Default: no WhatsApp credentials
  vi.stubGlobal('useRuntimeConfig', () => ({
    whatsappApiToken: '',
    whatsappPhoneNumberId: '',
    public: { vertical: 'tracciona' },
  }))
})

import {
  sendWhatsAppMessage,
  downloadWhatsAppMedia,
} from '../../../server/utils/whatsappApi'

// ─── sendWhatsAppMessage ──────────────────────────────────────────────────────

describe('sendWhatsAppMessage', () => {
  it('logs a warning and returns when no token configured', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await expect(sendWhatsAppMessage('34612345678', 'Hello')).resolves.toBeUndefined()
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('does not call fetch when no token', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    await sendWhatsAppMessage('34612345678', 'Hello')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('calls fetch with correct URL when token is configured', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      whatsappApiToken: 'test-token',
      whatsappPhoneNumberId: 'phone-id-123',
      public: {},
    }))
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        messaging_product: 'whatsapp',
        contacts: [{ input: '34612345678', wa_id: '34612345678' }],
        messages: [{ id: 'msg-1' }],
      }),
    })
    vi.stubGlobal('fetch', mockFetch)
    vi.spyOn(console, 'info').mockImplementation(() => {})

    await sendWhatsAppMessage('34612345678', 'Test message')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('phone-id-123'),
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('sends message body in request', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      whatsappApiToken: 'test-token',
      whatsappPhoneNumberId: 'phone-id-123',
      public: {},
    }))
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ messages: [{ id: 'msg-1' }] }),
    })
    vi.stubGlobal('fetch', mockFetch)
    vi.spyOn(console, 'info').mockImplementation(() => {})

    await sendWhatsAppMessage('34612345678', 'Hello World')
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.to).toBe('34612345678')
    expect(body.text.body).toBe('Hello World')
    expect(body.messaging_product).toBe('whatsapp')
  })

  it('throws when fetch response is not ok', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      whatsappApiToken: 'test-token',
      whatsappPhoneNumberId: 'phone-id',
      public: {},
    }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: vi.fn().mockResolvedValue('error body'),
    }))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(sendWhatsAppMessage('123', 'msg')).rejects.toThrow()
  })

  it('uses Bearer authorization header', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      whatsappApiToken: 'my-token',
      whatsappPhoneNumberId: 'pid',
      public: {},
    }))
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ messages: [{ id: 'x' }] }),
    })
    vi.stubGlobal('fetch', mockFetch)
    vi.spyOn(console, 'info').mockImplementation(() => {})

    await sendWhatsAppMessage('123', 'msg')
    const headers = (mockFetch.mock.calls[0][1] as RequestInit).headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer my-token')
  })
})

// ─── downloadWhatsAppMedia ────────────────────────────────────────────────────

describe('downloadWhatsAppMedia', () => {
  it('returns empty Buffer when no token configured', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await downloadWhatsAppMedia('media-id-123')
    expect(Buffer.isBuffer(result)).toBe(true)
    expect(result.length).toBe(0)
  })

  it('warns when no token and skips API call', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    await downloadWhatsAppMedia('media-id')
    expect(mockFetch).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('fetches metadata then downloads media when token is set', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      whatsappApiToken: 'test-token',
      whatsappPhoneNumberId: '',
      public: {},
    }))
    const mediaUrl = 'https://cdn.whatsapp.net/media/abc123'
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          url: mediaUrl,
          mime_type: 'image/jpeg',
          sha256: 'abc',
          file_size: 1024,
          id: 'media-id',
          messaging_product: 'whatsapp',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      })
    vi.stubGlobal('fetch', mockFetch)

    const result = await downloadWhatsAppMedia('media-id')
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(Buffer.isBuffer(result)).toBe(true)
  })

  it('throws when metadata fetch fails', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      whatsappApiToken: 'test-token',
      public: {},
    }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: vi.fn().mockResolvedValue('not found'),
    }))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(downloadWhatsAppMedia('bad-id')).rejects.toThrow()
  })

  it('throws when media download fetch is not ok', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      whatsappApiToken: 'test-token',
      whatsappPhoneNumberId: '',
      public: {},
    }))
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          url: 'https://cdn.whatsapp.net/media/abc',
          mime_type: 'image/jpeg',
          sha256: 'abc',
          file_size: 1024,
          id: 'media-id',
          messaging_product: 'whatsapp',
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: vi.fn().mockResolvedValue('forbidden'),
      })
    vi.stubGlobal('fetch', mockFetch)
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(downloadWhatsAppMedia('media-id-123')).rejects.toThrow('WhatsApp media download error: 403')
  })
})
