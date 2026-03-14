/**
 * Tests for POST /api/cron/translate-batch
 *
 * Covers: cron secret, batch vehicle translation, batch article translation,
 * empty pending, AI failures, source tag mapping, limit param.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks (must be before imports)
// ---------------------------------------------------------------------------

vi.stubGlobal('safeError', (statusCode: number, message: string) => {
  const e = new Error(message) as Error & { statusCode: number }
  e.statusCode = statusCode
  return e
})

// Mock h3
vi.mock('~~/server/utils/cronLock', () => ({ acquireDbCronLock: vi.fn().mockResolvedValue(true) }))
vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  getQuery: (event: Record<string, unknown>) => (event as Record<string, unknown>)._query || {},
  createError: (opts: Record<string, unknown>) => {
    const e = new Error((opts.message || opts.statusMessage || '') as string) as Error & { statusCode: number }
    e.statusCode = (opts.statusCode || 500) as number
    return e
  },
}))

// Mock verifyCronSecret
const mockVerifyCronSecret = vi.fn()
vi.mock('../../../server/utils/verifyCronSecret', () => ({
  verifyCronSecret: (...args: unknown[]) => mockVerifyCronSecret(...args),
}))

// Mock callAI
const mockCallAI = vi.fn()
vi.mock('../../../server/services/aiProvider', () => ({
  callAI: (...args: unknown[]) => mockCallAI(...args),
}))

// Mock logger
vi.mock('../../../server/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

// ---------------------------------------------------------------------------
// Supabase chain mock
// ---------------------------------------------------------------------------

function createChainMock(resolveData: unknown = null) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.from = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.in = vi.fn().mockReturnValue(chain)
  chain.not = vi.fn().mockReturnValue(chain)
  chain.lte = vi.fn().mockReturnValue(chain)
  chain.limit = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue({ data: resolveData, error: null })
  chain.update = vi.fn().mockReturnValue(chain)
  chain.upsert = vi.fn().mockResolvedValue({ data: resolveData, error: null })
  // Make the chain thenable (for awaiting without .single())
  chain.then = vi.fn().mockImplementation((resolve: (val: unknown) => void) => {
    return Promise.resolve({ data: resolveData, error: null }).then(resolve)
  })
  return chain
}

// Per-table overrides
let tableOverrides: Record<string, ReturnType<typeof createChainMock>> = {}
const fallbackChain = createChainMock()

const mockSupabase = {
  from: vi.fn((table: string) => tableOverrides[table] || fallbackChain),
}

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: () => mockSupabase,
}))

// Mock useRuntimeConfig
vi.stubGlobal('useRuntimeConfig', () => ({
  cronSecret: 'test-secret',
  anthropicApiKey: 'test-key',
}))

// ---------------------------------------------------------------------------
// Import handler (after mocks)
// ---------------------------------------------------------------------------

import handler from '../../../server/api/cron/translate-batch.post'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createEvent(queryLimit?: number) {
  return {
    node: { req: { headers: { 'x-cron-secret': 'test-secret' } } },
    _query: queryLimit ? { limit: String(queryLimit) } : {},
  }
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  tableOverrides = {}
  mockCallAI.mockResolvedValue({ text: 'Translated text', provider: 'anthropic', model: 'test', latencyMs: 100 })
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/cron/translate-batch', () => {
  it('calls verifyCronSecret', async () => {
    const configChain = createChainMock({ default_locale: 'es', active_locales: ['es'], translation_engine: 'claude_haiku' })
    tableOverrides = { vertical_config: configChain }

    await handler(createEvent() as never)
    expect(mockVerifyCronSecret).toHaveBeenCalledTimes(1)
  })

  it('returns zeros when no target locales', async () => {
    const configChain = createChainMock({ default_locale: 'es', active_locales: ['es'], translation_engine: 'claude_haiku' })
    tableOverrides = { vertical_config: configChain }

    const result = await handler(createEvent() as never) as Record<string, unknown>
    expect(result).toMatchObject({ translated: 0, failed: 0, vehicles: 0, articles: 0 })
    expect(mockCallAI).not.toHaveBeenCalled()
  })

  it('translates vehicles with pending_translations=true', async () => {
    const vehicles = [{ id: 'veh-001', description_es: 'Camión volquete 20T' }]

    const configChain = createChainMock({ default_locale: 'es', active_locales: ['es', 'en'], translation_engine: 'claude_haiku' })
    const vehChain = createChainMock(vehicles)
    vehChain.update = vi.fn().mockReturnValue(vehChain)

    tableOverrides = {
      vertical_config: configChain,
      vehicles: vehChain,
      articles: createChainMock([]),
      content_translations: createChainMock(),
    }

    const result = await handler(createEvent() as never) as Record<string, unknown>

    expect(mockCallAI).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({ translated: 1, failed: 0, vehicles: 1 })
  })

  it('handles AI translation failure gracefully', async () => {
    const vehicles = [{ id: 'veh-fail', description_es: 'Test description' }]

    const configChain = createChainMock({ default_locale: 'es', active_locales: ['es', 'en', 'fr'], translation_engine: 'gpt4omini' })
    const vehChain = createChainMock(vehicles)
    vehChain.update = vi.fn().mockReturnValue(vehChain)

    tableOverrides = {
      vertical_config: configChain,
      vehicles: vehChain,
      articles: createChainMock([]),
      content_translations: createChainMock(),
    }

    mockCallAI
      .mockResolvedValueOnce({ text: 'OK en', provider: 'anthropic', model: 'test', latencyMs: 100 })
      .mockRejectedValueOnce(new Error('AI provider timeout'))

    const result = await handler(createEvent() as never) as Record<string, unknown>

    expect(result).toMatchObject({ translated: 1, failed: 1, vehicles: 1 })
  })

  it('skips vehicles without description_es', async () => {
    const vehicles = [{ id: 'veh-empty', description_es: null }]

    const configChain = createChainMock({ default_locale: 'es', active_locales: ['es', 'en'], translation_engine: 'claude_haiku' })
    const vehChain = createChainMock(vehicles)
    vehChain.update = vi.fn().mockReturnValue(vehChain)

    tableOverrides = {
      vertical_config: configChain,
      vehicles: vehChain,
      articles: createChainMock([]),
    }

    const result = await handler(createEvent() as never) as Record<string, unknown>

    expect(mockCallAI).not.toHaveBeenCalled()
    expect(result).toMatchObject({ translated: 0, vehicles: 0 })
  })

  it('translates articles with content, excerpt, and meta_description', async () => {
    const articles = [{
      id: 'art-001',
      excerpt: { es: 'Resumen del artículo' },
      meta_description: { es: 'Meta descripción' },
    }]
    const sourceContent = [{ field: 'content', value: 'Contenido completo del artículo' }]

    const configChain = createChainMock({ default_locale: 'es', active_locales: ['es', 'en'], translation_engine: 'claude_haiku' })
    const artChain = createChainMock(articles)
    artChain.update = vi.fn().mockReturnValue(artChain)
    const ctChain = createChainMock(sourceContent)

    tableOverrides = {
      vertical_config: configChain,
      vehicles: createChainMock([]),
      articles: artChain,
      content_translations: ctChain,
    }

    const result = await handler(createEvent() as never) as Record<string, unknown>

    // 3 fields (content + excerpt + meta_description) × 1 target locale = 3 calls
    expect(mockCallAI).toHaveBeenCalledTimes(3)
    expect(result).toMatchObject({ translated: 3, failed: 0, articles: 1 })
  })

  it('maps translation engine to correct source tag', async () => {
    const vehicles = [{ id: 'veh-src', description_es: 'Test' }]

    const configChain = createChainMock({ default_locale: 'es', active_locales: ['es', 'en'], translation_engine: 'gpt4omini' })
    const vehChain = createChainMock(vehicles)
    vehChain.update = vi.fn().mockReturnValue(vehChain)
    const ctChain = createChainMock()

    tableOverrides = {
      vertical_config: configChain,
      vehicles: vehChain,
      articles: createChainMock([]),
      content_translations: ctChain,
    }

    await handler(createEvent() as never)

    expect(ctChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'auto_gpt4omini' }),
      expect.anything(),
    )
  })

  it('respects batch limit query param', async () => {
    const configChain = createChainMock({ default_locale: 'es', active_locales: ['es', 'en'], translation_engine: 'claude_haiku' })
    const vehChain = createChainMock([])
    const artChain = createChainMock([])

    tableOverrides = {
      vertical_config: configChain,
      vehicles: vehChain,
      articles: artChain,
    }

    await handler(createEvent(25) as never)

    expect(vehChain.limit).toHaveBeenCalledWith(25)
    expect(artChain.limit).toHaveBeenCalledWith(25)
  })

  it('caps limit at 50', async () => {
    const configChain = createChainMock({ default_locale: 'es', active_locales: ['es', 'en'], translation_engine: 'claude_haiku' })
    const vehChain = createChainMock([])
    const artChain = createChainMock([])

    tableOverrides = {
      vertical_config: configChain,
      vehicles: vehChain,
      articles: artChain,
    }

    await handler(createEvent(999) as never)

    expect(vehChain.limit).toHaveBeenCalledWith(50)
  })

  it('uses background preset and content model role', async () => {
    const vehicles = [{ id: 'veh-preset', description_es: 'Motor diesel' }]

    const configChain = createChainMock({ default_locale: 'es', active_locales: ['es', 'en'], translation_engine: 'claude_haiku' })
    const vehChain = createChainMock(vehicles)
    vehChain.update = vi.fn().mockReturnValue(vehChain)

    tableOverrides = {
      vertical_config: configChain,
      vehicles: vehChain,
      articles: createChainMock([]),
      content_translations: createChainMock(),
    }

    await handler(createEvent() as never)

    expect(mockCallAI).toHaveBeenCalledWith(
      expect.objectContaining({
        maxTokens: 4096,
        system: expect.stringContaining('professional translator'),
      }),
      'background',
      'content',
    )
  })

  it('defaults to es/en when vertical_config is null', async () => {
    const configChain = createChainMock(null)
    const vehicles = [{ id: 'veh-def', description_es: 'Default test' }]
    const vehChain = createChainMock(vehicles)
    vehChain.update = vi.fn().mockReturnValue(vehChain)

    tableOverrides = {
      vertical_config: configChain,
      vehicles: vehChain,
      articles: createChainMock([]),
      content_translations: createChainMock(),
    }

    const result = await handler(createEvent() as never) as Record<string, unknown>

    expect(mockCallAI).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({ vehicles: 1 })
  })

  it('clears pending_translations flag after translating', async () => {
    const vehicles = [{ id: 'veh-clear', description_es: 'Grúa torre' }]

    const configChain = createChainMock({ default_locale: 'es', active_locales: ['es', 'en'], translation_engine: 'claude_haiku' })
    const vehChain = createChainMock(vehicles)
    vehChain.update = vi.fn().mockReturnValue(vehChain)

    tableOverrides = {
      vertical_config: configChain,
      vehicles: vehChain,
      articles: createChainMock([]),
      content_translations: createChainMock(),
    }

    await handler(createEvent() as never)

    expect(vehChain.update).toHaveBeenCalledWith({ pending_translations: false })
  })
})
