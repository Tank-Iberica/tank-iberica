/**
 * Tests for POST /api/email/send
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockServerUser, mockReadBody, mockGetHeader } = vi.hoisted(() => ({
  mockServerUser: vi.fn(),
  mockReadBody: vi.fn(),
  mockGetHeader: vi.fn(),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  readBody: (...a: unknown[]) => mockReadBody(...a),
  getHeader: (...a: unknown[]) => mockGetHeader(...a),
  createError: (opts: { statusCode?: number; statusMessage?: string }) => {
    const err = new Error(opts.statusMessage ?? 'Error')
    ;(err as any).statusCode = opts.statusCode
    return err
  },
}))

let mockSupabase: Record<string, unknown>

vi.mock('#supabase/server', () => ({
  serverSupabaseUser: (...a: unknown[]) => mockServerUser(...a),
  serverSupabaseServiceRole: () => mockSupabase,
}))

vi.mock('../../../server/utils/safeError', () => ({
  safeError: (_code: number, msg: string) => {
    const err = new Error(msg) as Error & { statusCode: number }
    err.statusCode = _code
    return err
  },
}))

vi.mock('../../../server/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const mockResendSend = vi.fn()
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: mockResendSend }
  },
}))

vi.stubGlobal('useRuntimeConfig', () => ({
  cronSecret: 'test-secret',
  resendApiKey: '',
  public: {},
}))

vi.stubGlobal('crypto', { randomUUID: () => '12345678-1234-1234-1234-123456789abc' })

function makeChain(data: unknown = null, error: unknown = null) {
  const chain: Record<string, unknown> = {}
  const ms = ['select', 'eq', 'single', 'maybeSingle', 'insert']
  for (const m of ms) chain[m] = (..._a: unknown[]) => chain
  chain.then = (r: (v: unknown) => void) => Promise.resolve({ data, error }).then(r)
  chain.catch = (r: (v: unknown) => void) => Promise.resolve({ data, error: null }).catch(r)
  return chain
}

const VERTICAL_CONFIG = {
  email_templates: {
    test_template: {
      subject: { es: 'Asunto {{name}}', en: 'Subject {{name}}' },
      body: { es: 'Hola **{{name}}**, tu pedido está listo.', en: 'Hello **{{name}}**, your order is ready.' },
    },
  },
  theme: { primary: '#23424A' },
  logo_url: 'https://tracciona.com/logo.png',
  name: { es: 'Tracciona', en: 'Tracciona' },
}

import handler from '../../../server/api/email/send.post'

describe('POST /api/email/send', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockResendSend.mockResolvedValue({ data: { id: 'resend-123' }, error: null })
  })

  it('throws 401 when not authenticated and no internal secret', async () => {
    mockReadBody.mockResolvedValue({ templateKey: 'test', to: 'user@test.com' })
    mockGetHeader.mockReturnValue(null)
    mockServerUser.mockResolvedValue(null)
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 401 })
  })

  it('allows internal secret authentication', async () => {
    mockReadBody.mockResolvedValue({ templateKey: 'test_template', to: 'user@test.com', variables: { name: 'Alice' } })
    mockGetHeader.mockReturnValue('test-secret')

    mockSupabase = {
      from: (table: string) => {
        if (table === 'vertical_config') return makeChain(VERTICAL_CONFIG)
        if (table === 'email_logs') return makeChain(null)
        return makeChain(null)
      },
    }

    const result = await (handler as Function)({})
    expect(result.success).toBe(true)
    // No RESEND_API_KEY → mock mode
    expect(result.messageId).toContain('mock_')
  })

  it('throws 400 when templateKey is missing', async () => {
    mockReadBody.mockResolvedValue({ to: 'user@test.com' })
    mockGetHeader.mockReturnValue('test-secret')
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when to is missing', async () => {
    mockReadBody.mockResolvedValue({ templateKey: 'test_template' })
    mockGetHeader.mockReturnValue('test-secret')
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 500 when vertical_config not found', async () => {
    mockReadBody.mockResolvedValue({ templateKey: 'test_template', to: 'user@test.com' })
    mockGetHeader.mockReturnValue('test-secret')
    mockSupabase = { from: () => makeChain(null, { message: 'not found' }) }
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 500 })
  })

  it('throws 404 when template key not found in config', async () => {
    mockReadBody.mockResolvedValue({ templateKey: 'nonexistent', to: 'user@test.com' })
    mockGetHeader.mockReturnValue('test-secret')
    mockSupabase = { from: () => makeChain(VERTICAL_CONFIG) }
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 404 })
  })

  it('skips sending when user preference disabled', async () => {
    mockReadBody.mockResolvedValue({
      templateKey: 'test_template', to: 'user@test.com', userId: '00000000-0000-0000-0000-000000000001',
      variables: { name: 'Bob' },
    })
    mockGetHeader.mockReturnValue('test-secret')

    mockSupabase = {
      from: (table: string) => {
        if (table === 'vertical_config') return makeChain(VERTICAL_CONFIG)
        if (table === 'email_preferences') return makeChain({ enabled: false })
        if (table === 'email_logs') return makeChain(null)
        return makeChain(null)
      },
    }

    const result = await (handler as Function)({})
    expect(result.skipped).toBe(true)
    expect(result.reason).toBe('user_preference')
  })

  it('throws 500 when template has empty body', async () => {
    mockReadBody.mockResolvedValue({ templateKey: 'test_template', to: 'user@test.com', variables: { name: 'Bob' } })
    mockGetHeader.mockReturnValue('test-secret')

    const emptyConfig = {
      ...VERTICAL_CONFIG,
      email_templates: {
        test_template: {
          subject: { es: 'Asunto' },
          body: { es: '', en: '' },
        },
      },
    }
    mockSupabase = { from: () => makeChain(emptyConfig) }
    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 500 })
  })

  it('sends email via Resend when API key is set', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      cronSecret: 'test-secret',
      resendApiKey: 'resend-key-123',
      public: {},
    }))

    mockReadBody.mockResolvedValue({
      templateKey: 'test_template', to: 'user@test.com',
      variables: { name: 'Alice' }, locale: 'en', userId: '00000000-0000-0000-0000-000000000001',
    })
    mockGetHeader.mockReturnValue('test-secret')

    mockSupabase = {
      from: (table: string) => {
        if (table === 'vertical_config') return makeChain(VERTICAL_CONFIG)
        if (table === 'email_preferences') return makeChain(null) // no pref → send
        if (table === 'users') return makeChain({ id: 'u1', email: 'user@test.com', unsubscribe_token: 'tok-abc' })
        if (table === 'email_logs') return makeChain(null)
        return makeChain(null)
      },
    }

    mockResendSend.mockResolvedValue({ data: { id: 'resend-456' }, error: null })

    const result = await (handler as Function)({})
    expect(result.success).toBe(true)
    expect(result.messageId).toBe('resend-456')
    expect(mockResendSend).toHaveBeenCalledWith(expect.objectContaining({
      to: 'user@test.com',
      from: 'noreply@tracciona.com',
    }))

    // Restore
    vi.stubGlobal('useRuntimeConfig', () => ({
      cronSecret: 'test-secret',
      resendApiKey: '',
      public: {},
    }))
  })

  it('defaults to Spanish locale when not specified', async () => {
    mockReadBody.mockResolvedValue({
      templateKey: 'test_template', to: 'user@test.com',
      variables: { name: 'Carlos' },
    })
    mockGetHeader.mockReturnValue('test-secret')

    mockSupabase = {
      from: (table: string) => {
        if (table === 'vertical_config') return makeChain(VERTICAL_CONFIG)
        if (table === 'email_logs') return makeChain(null)
        return makeChain(null)
      },
    }

    const result = await (handler as Function)({})
    expect(result.success).toBe(true)
  })

  it('handles Resend error', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      cronSecret: 'test-secret',
      resendApiKey: 'resend-key',
      public: {},
    }))

    mockReadBody.mockResolvedValue({
      templateKey: 'test_template', to: 'user@test.com',
      variables: { name: 'Alice' },
    })
    mockGetHeader.mockReturnValue('test-secret')

    mockSupabase = {
      from: (table: string) => {
        if (table === 'vertical_config') return makeChain(VERTICAL_CONFIG)
        if (table === 'email_logs') return makeChain(null)
        return makeChain(null)
      },
    }

    mockResendSend.mockResolvedValue({ data: null, error: { message: 'Invalid API key' } })

    await expect((handler as Function)({})).rejects.toMatchObject({ statusCode: 500 })

    vi.stubGlobal('useRuntimeConfig', () => ({
      cronSecret: 'test-secret',
      resendApiKey: '',
      public: {},
    }))
  })

  it('allows authenticated user to send email', async () => {
    mockReadBody.mockResolvedValue({ templateKey: 'test_template', to: 'user@test.com', variables: { name: 'Me' } })
    mockGetHeader.mockReturnValue(null) // no internal secret
    mockServerUser.mockResolvedValue({ id: 'u1' })

    mockSupabase = {
      from: (table: string) => {
        if (table === 'vertical_config') return makeChain(VERTICAL_CONFIG)
        if (table === 'email_logs') return makeChain(null)
        return makeChain(null)
      },
    }

    const result = await (handler as Function)({})
    expect(result.success).toBe(true)
  })
})
