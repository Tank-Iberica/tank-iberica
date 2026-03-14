import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockSafeError, mockServiceRole, mockVerifyCronSecret, mockCallAI, mockIsFeatureEnabled } =
  vi.hoisted(() => {
    const mockSafeError = vi.fn((status: number, msg: string) => {
      const err = new Error(msg)
      ;(err as any).statusCode = status
      return err
    })
    return {
      mockSafeError,
      mockServiceRole: vi.fn(),
      mockVerifyCronSecret: vi.fn(),
      mockCallAI: vi.fn().mockResolvedValue({
        text: '[{"title":"Test","slug":"test","excerpt":"Excerpt","content":"Content body","category":"guias","tags":["camiones"]}]',
        provider: 'anthropic',
      }),
      mockIsFeatureEnabled: vi.fn().mockResolvedValue(true),
    }
  })

vi.mock('~~/server/utils/cronLock', () => ({ acquireDbCronLock: vi.fn().mockResolvedValue(true) }))
vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: mockServiceRole,
}))

vi.mock('../../../server/utils/safeError', () => ({ safeError: mockSafeError }))
vi.mock('~~/server/services/aiProvider', () => ({ callAI: mockCallAI }))
vi.mock('~~/server/utils/featureFlags', () => ({ isFeatureEnabled: mockIsFeatureEnabled }))
vi.mock('../../../server/utils/verifyCronSecret', () => ({ verifyCronSecret: mockVerifyCronSecret }))

vi.stubGlobal('verifyCronSecret', mockVerifyCronSecret)
vi.stubGlobal('useRuntimeConfig', () => ({ cronSecret: 'cron-secret', public: {} }))
vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ ok: true }))

import handler from '../../../server/api/cron/generate-editorial.post'

function makeSupabase() {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
  return { from: vi.fn().mockReturnValue(chain) }
}

describe('POST /api/cron/generate-editorial', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyCronSecret.mockReturnValue(undefined)
    mockIsFeatureEnabled.mockResolvedValue(true)
    mockCallAI.mockResolvedValue({
      text: '[{"title":"Test Article","slug":"test-article","excerpt":"Short excerpt","content":"Long article content here","category":"guias","tags":["camiones","mercado"]}]',
      provider: 'anthropic',
    })
    mockServiceRole.mockReturnValue(makeSupabase())
  })

  it('returns disabled message when feature flag is off', async () => {
    mockIsFeatureEnabled.mockResolvedValue(false)
    const result = await handler({} as any)
    expect(result).toMatchObject({ success: true, generated: 0 })
    expect(result.message).toContain('disabled')
    expect(mockCallAI).not.toHaveBeenCalled()
  })

  it('calls callAI with deferred+content strategy', async () => {
    await handler({} as any)
    expect(mockCallAI).toHaveBeenCalledWith(
      expect.objectContaining({ messages: expect.any(Array), maxTokens: 4096 }),
      'deferred',
      'content',
    )
  })

  it('returns generated count on success', async () => {
    const result = await handler({} as any)
    expect(result.success).toBe(true)
    expect(result.generated).toBe(1)
  })

  it('returns generated:0 when AI response has no valid JSON array', async () => {
    mockCallAI.mockResolvedValue({ text: 'no json here', provider: 'anthropic' })
    const result = await handler({} as any)
    expect(result.success).toBe(false)
    expect(result.generated).toBe(0)
  })

  it('returns generated:0 when AI call throws', async () => {
    mockCallAI.mockRejectedValue(new Error('timeout'))
    const result = await handler({} as any)
    expect(result.success).toBe(false)
    expect(result.generated).toBe(0)
  })

  it('skips articles without title or content', async () => {
    mockCallAI.mockResolvedValue({
      text: '[{"title":"","slug":"empty","excerpt":"","content":"","category":"guias","tags":[]}]',
      provider: 'anthropic',
    })
    const result = await handler({} as any)
    expect(result.generated).toBe(0)
  })

  it('builds slug from title when slug is missing', async () => {
    let insertedSlug = ''
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'articles') {
          return {
            insert: vi.fn().mockImplementation((data: any) => {
              insertedSlug = data.slug
              return Promise.resolve({ error: null })
            }),
          }
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data: [], error: null }) }
      }),
    }
    mockServiceRole.mockReturnValue(supabase)
    mockCallAI.mockResolvedValue({
      text: '[{"title":"Cómo comprar camiones","slug":"","excerpt":"Ex","content":"Body content","category":"guias","tags":[]}]',
      provider: 'anthropic',
    })
    await handler({} as any)
    expect(insertedSlug).toContain('como-comprar-camiones')
  })
})
