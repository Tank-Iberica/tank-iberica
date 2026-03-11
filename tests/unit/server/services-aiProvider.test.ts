/**
 * Tests for server/services/aiProvider.ts — callAI real implementation
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockFetchWithRetry } = vi.hoisted(() => ({
  mockFetchWithRetry: vi.fn(),
}))

vi.mock('~~/server/utils/fetchWithRetry', () => ({ fetchWithRetry: mockFetchWithRetry }))
vi.mock('~~/server/utils/aiConfig', () => ({
  AI_MODELS: { fast: 'claude-haiku', vision: 'claude-3-sonnet', content: 'claude-3-opus' },
}))

vi.stubGlobal('useRuntimeConfig', () => ({
  anthropicApiKey: 'test-anthropic-key',
  public: {},
}))

// ── Static import ────────────────────────────────────────────────────────────

import { callAI } from '../../../server/services/aiProvider'

// ══ callAI ═══════════════════════════════════════════════════════════════════

describe('callAI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.OPENAI_API_KEY
    vi.stubGlobal('useRuntimeConfig', () => ({
      anthropicApiKey: 'test-anthropic-key',
      public: {},
    }))
  })

  it('throws when unknown preset provided', async () => {
    await expect(
      callAI({ messages: [], maxTokens: 100 }, 'unknown-preset' as any, 'fast'),
    ).rejects.toThrow('Unknown AI preset')
  })

  it('throws No AI provider when no keys configured', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ anthropicApiKey: undefined, public: {} }))
    delete process.env.OPENAI_API_KEY
    await expect(
      callAI({ messages: [{ role: 'user', content: 'hello' }], maxTokens: 100 }, 'realtime', 'fast'),
    ).rejects.toThrow('No AI provider API keys configured')
  })

  it('calls Anthropic endpoint and returns structured response', async () => {
    mockFetchWithRetry.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Vehicle analyzed' }],
      }),
    })
    const result = await callAI(
      { messages: [{ role: 'user', content: 'Analyze' }], maxTokens: 1000 },
      'realtime',
      'fast',
    )
    expect(result.text).toBe('Vehicle analyzed')
    expect(result.provider).toBe('anthropic')
    expect(result.model).toBe('claude-haiku')
    expect(typeof result.latencyMs).toBe('number')
  })

  it('includes system prompt in Anthropic request body', async () => {
    mockFetchWithRetry.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] }),
    })
    await callAI(
      {
        messages: [{ role: 'user', content: 'test' }],
        maxTokens: 100,
        system: 'You are an expert vehicle analyst',
      },
      'background',
      'content',
    )
    const [, opts] = mockFetchWithRetry.mock.calls[0]!
    const body = JSON.parse(opts.body)
    expect(body.system).toBe('You are an expert vehicle analyst')
  })

  it('does not include system key when system is not provided', async () => {
    mockFetchWithRetry.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] }),
    })
    await callAI(
      { messages: [{ role: 'user', content: 'test' }], maxTokens: 100 },
      'realtime',
      'fast',
    )
    const [, opts] = mockFetchWithRetry.mock.calls[0]!
    const body = JSON.parse(opts.body)
    expect(body.system).toBeUndefined()
  })

  it('throws All AI providers failed when Anthropic returns non-ok status', async () => {
    mockFetchWithRetry.mockResolvedValue({
      ok: false,
      status: 429,
      text: vi.fn().mockResolvedValue('Rate limit exceeded'),
    })
    await expect(
      callAI({ messages: [{ role: 'user', content: 'test' }], maxTokens: 100 }, 'realtime', 'fast'),
    ).rejects.toThrow('All AI providers failed')
  })

  it('throws when Anthropic returns empty content array', async () => {
    mockFetchWithRetry.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ content: [] }),
    })
    await expect(
      callAI({ messages: [{ role: 'user', content: 'test' }], maxTokens: 100 }, 'realtime', 'fast'),
    ).rejects.toThrow('All AI providers failed')
  })

  it('falls back to OpenAI when Anthropic fails', async () => {
    process.env.OPENAI_API_KEY = 'openai-key'
    let callCount = 0
    mockFetchWithRetry.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return Promise.resolve({ ok: false, status: 500, text: vi.fn().mockResolvedValue('error') })
      }
      return Promise.resolve({
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'OpenAI response' } }],
        }),
      })
    })
    const result = await callAI(
      { messages: [{ role: 'user', content: 'test' }], maxTokens: 100 },
      'background',
      'fast',
    )
    expect(result.text).toBe('OpenAI response')
    expect(result.provider).toBe('openai')
    delete process.env.OPENAI_API_KEY
  })

  it('converts multimodal content to OpenAI image_url format when falling back', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ anthropicApiKey: undefined, public: {} }))
    process.env.OPENAI_API_KEY = 'openai-key'
    mockFetchWithRetry.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'Image analyzed' } }],
      }),
    })
    const result = await callAI(
      {
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text' as const, text: 'What is this?' },
              {
                type: 'image' as const,
                source: { type: 'base64' as const, media_type: 'image/jpeg', data: 'abc123' },
              },
            ],
          },
        ],
        maxTokens: 100,
      },
      'realtime',
      'vision',
    )
    expect(result.text).toBe('Image analyzed')
    const [, opts] = mockFetchWithRetry.mock.calls[0]!
    const body = JSON.parse(opts.body)
    const parts = body.messages[0].content
    expect(parts[0].type).toBe('text')
    expect(parts[1].type).toBe('image_url')
    expect(parts[1].image_url.url).toContain('base64')
    delete process.env.OPENAI_API_KEY
  })

  it('adds system message to OpenAI messages when provided', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ anthropicApiKey: undefined, public: {} }))
    process.env.OPENAI_API_KEY = 'openai-key'
    mockFetchWithRetry.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'ok' } }],
      }),
    })
    await callAI(
      {
        messages: [{ role: 'user', content: 'test' }],
        maxTokens: 100,
        system: 'Be helpful',
      },
      'realtime',
      'fast',
    )
    const [, opts] = mockFetchWithRetry.mock.calls[0]!
    const body = JSON.parse(opts.body)
    expect(body.messages[0].role).toBe('system')
    expect(body.messages[0].content).toBe('Be helpful')
    delete process.env.OPENAI_API_KEY
  })

  it('throws when OpenAI returns empty choices', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ anthropicApiKey: undefined, public: {} }))
    process.env.OPENAI_API_KEY = 'openai-key'
    mockFetchWithRetry.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ choices: [] }),
    })
    await expect(
      callAI({ messages: [{ role: 'user', content: 'test' }], maxTokens: 100 }, 'realtime', 'fast'),
    ).rejects.toThrow('All AI providers failed')
    delete process.env.OPENAI_API_KEY
  })

  it('sends request to Anthropic endpoint with correct auth header', async () => {
    mockFetchWithRetry.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] }),
    })
    await callAI(
      { messages: [{ role: 'user', content: 'test' }], maxTokens: 50 },
      'deferred',
      'fast',
    )
    const [url, opts] = mockFetchWithRetry.mock.calls[0]!
    expect(url).toContain('anthropic.com')
    expect(opts.headers['x-api-key']).toBe('test-anthropic-key')
  })

  it('fires abort timeout on Anthropic when fetch hangs', async () => {
    vi.useFakeTimers()
    mockFetchWithRetry.mockImplementation((_url: string, opts: any) =>
      new Promise((_resolve, reject) => {
        opts?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
      }),
    )
    let caughtError: Error | undefined
    const promise = callAI(
      { messages: [{ role: 'user', content: 'test' }], maxTokens: 100 },
      'realtime',
      'fast',
    ).catch((e: Error) => { caughtError = e })
    await vi.advanceTimersByTimeAsync(8_001)
    await promise
    expect(caughtError?.message).toContain('All AI providers failed')
    vi.useRealTimers()
  })

  it('fires abort timeout on OpenAI when fetch hangs', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('useRuntimeConfig', () => ({ anthropicApiKey: undefined, public: {} }))
    process.env.OPENAI_API_KEY = 'openai-key'
    mockFetchWithRetry.mockImplementation((_url: string, opts: any) =>
      new Promise((_resolve, reject) => {
        opts?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
      }),
    )
    let caughtError: Error | undefined
    const promise = callAI(
      { messages: [{ role: 'user', content: 'test' }], maxTokens: 100 },
      'realtime',
      'fast',
    ).catch((e: Error) => { caughtError = e })
    await vi.advanceTimersByTimeAsync(8_001)
    await promise
    expect(caughtError?.message).toContain('All AI providers failed')
    vi.useRealTimers()
    delete process.env.OPENAI_API_KEY
  })

  it('throws All AI providers failed when OpenAI returns non-ok response', async () => {
    process.env.OPENAI_API_KEY = 'openai-key'
    mockFetchWithRetry
      // Anthropic fails
      .mockResolvedValueOnce({ ok: false, status: 500, text: vi.fn().mockResolvedValue('Anthropic error') })
      // OpenAI also non-ok
      .mockResolvedValueOnce({ ok: false, status: 429, text: vi.fn().mockResolvedValue('rate limited') })
    await expect(
      callAI({ messages: [{ role: 'user', content: 'test' }], maxTokens: 100 }, 'realtime', 'fast'),
    ).rejects.toThrow('All AI providers failed')
    delete process.env.OPENAI_API_KEY
  })
})
