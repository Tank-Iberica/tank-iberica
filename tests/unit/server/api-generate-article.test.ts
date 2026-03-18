/**
 * Tests for A7 — generate-article endpoint.
 * Validates schema, auth, AI response parsing, and error handling.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ─────────────────────────────────────────────────────────────
const { mockServerUser, mockValidateBody, mockCallAI } = vi.hoisted(() => ({
  mockServerUser: vi.fn(),
  mockValidateBody: vi.fn(),
  mockCallAI: vi.fn(),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
}))

vi.mock('#supabase/server', () => ({
  serverSupabaseUser: (...args: unknown[]) => mockServerUser(...args),
}))

vi.mock('~~/server/utils/validateBody', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody(...args),
}))

vi.mock('~~/server/services/aiProvider', () => ({
  callAI: (...args: unknown[]) => mockCallAI(...args),
}))

vi.mock('~~/server/utils/safeError', () => ({
  safeError: (code: number, msg: string) => {
    const e = new Error(msg) as Error & { statusCode: number; statusMessage: string }
    e.statusCode = code
    e.statusMessage = msg
    return e
  },
}))

vi.mock('~~/server/utils/sanitizeInput', () => ({
  sanitizeText: (text: string) => text,
}))

vi.mock('~~/server/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import handler from '~~/server/api/generate-article.post'

// ── Helpers ───────────────────────────────────────────────────────────────────
const mockEvent = {} as Parameters<typeof handler>[0]

const mockUser = { id: 'user-1', email: 'admin@test.com' }

const validBody = {
  topic: 'Cómo elegir un semirremolque refrigerado',
  type: 'guide' as const,
  catalogContext: undefined as string | undefined,
}

const validAIResponse = {
  title_es: 'Guía para elegir semirremolque refrigerado',
  title_en: 'Guide to choosing a refrigerated trailer',
  meta_description_es: 'Aprende a elegir el mejor semirremolque ATP para tu negocio',
  meta_description_en: 'Learn how to choose the best ATP refrigerated trailer',
  content_es: '<h2>Introducción</h2><p>Los semirremolques refrigerados son esenciales.</p>',
  content_en: '<h2>Introduction</h2><p>Refrigerated trailers are essential.</p>',
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('POST /api/generate-article', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockServerUser.mockResolvedValue(mockUser)
    mockValidateBody.mockResolvedValue(validBody)
    mockCallAI.mockResolvedValue({
      text: JSON.stringify(validAIResponse),
      provider: 'anthropic',
      model: 'claude-haiku',
      latencyMs: 800,
    })
  })

  it('returns generated article fields on success', async () => {
    const result = await handler(mockEvent)
    expect(result.title_es).toBe(validAIResponse.title_es)
    expect(result.title_en).toBe(validAIResponse.title_en)
    expect(result.meta_description_es).toBe(validAIResponse.meta_description_es)
    expect(result.content_es).toContain('<h2>')
    expect(result.content_en).toContain('<h2>')
    expect(result.aiUnavailable).toBeUndefined()
  })

  it('returns 401 if user is not authenticated', async () => {
    mockServerUser.mockResolvedValue(null)
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('handles AI returning JSON with backtick wrappers', async () => {
    mockCallAI.mockResolvedValue({
      text: '```json\n' + JSON.stringify(validAIResponse) + '\n```',
      provider: 'anthropic',
      model: 'claude-haiku',
      latencyMs: 900,
    })
    const result = await handler(mockEvent)
    expect(result.title_es).toBe(validAIResponse.title_es)
  })

  it('returns aiUnavailable when AI call throws', async () => {
    mockCallAI.mockRejectedValue(new Error('AI provider timeout'))
    const result = await handler(mockEvent)
    expect(result.aiUnavailable).toBe(true)
    expect(result.title_es).toBe('')
  })

  it('throws 502 when AI returns non-JSON text', async () => {
    mockCallAI.mockResolvedValue({
      text: 'Sorry, I cannot help with that.',
      provider: 'anthropic',
      model: 'claude-haiku',
      latencyMs: 500,
    })
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 502 })
  })

  it('throws 502 when AI JSON is missing required fields', async () => {
    mockCallAI.mockResolvedValue({
      text: JSON.stringify({ title_en: 'Only English', content_en: 'Content only' }),
      provider: 'anthropic',
      model: 'claude-haiku',
      latencyMs: 600,
    })
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 502 })
  })

  it('includes catalogContext in the prompt when provided', async () => {
    mockValidateBody.mockResolvedValue({
      ...validBody,
      catalogContext: 'Tenemos 15 semirremolques ATP disponibles',
    })
    mockCallAI.mockResolvedValue({
      text: JSON.stringify(validAIResponse),
      provider: 'anthropic',
      model: 'claude-haiku',
      latencyMs: 800,
    })
    await handler(mockEvent)
    const aiRequest = mockCallAI.mock.calls[0][0] as { messages: Array<{ content: string }> }
    expect(aiRequest.messages[0].content).toContain('semirremolques ATP')
  })

  // ─── #23 expanded: edge cases ───────────────────────────────────────────

  it('handles AI response with extra whitespace around JSON', async () => {
    mockCallAI.mockResolvedValue({
      text: '  \n' + JSON.stringify(validAIResponse) + '\n  ',
      provider: 'anthropic',
      model: 'claude-haiku',
      latencyMs: 700,
    })
    const result = await handler(mockEvent)
    expect(result.title_es).toBe(validAIResponse.title_es)
  })

  it('handles AI response with ```json\\n...\\n``` wrapper and extra whitespace', async () => {
    mockCallAI.mockResolvedValue({
      text: '```json\n  ' + JSON.stringify(validAIResponse) + '  \n```',
      provider: 'anthropic',
      model: 'claude-haiku',
      latencyMs: 800,
    })
    const result = await handler(mockEvent)
    expect(result.title_es).toBe(validAIResponse.title_es)
  })

  it('returns all 6 required fields on success', async () => {
    const result = await handler(mockEvent)
    expect(result).toHaveProperty('title_es')
    expect(result).toHaveProperty('title_en')
    expect(result).toHaveProperty('meta_description_es')
    expect(result).toHaveProperty('meta_description_en')
    expect(result).toHaveProperty('content_es')
    expect(result).toHaveProperty('content_en')
  })

  it('calls callAI exactly once per request', async () => {
    await handler(mockEvent)
    expect(mockCallAI).toHaveBeenCalledTimes(1)
  })

  it('passes topic and type from body to AI prompt', async () => {
    await handler(mockEvent)
    const aiRequest = mockCallAI.mock.calls[0][0] as { messages: Array<{ content: string }> }
    const prompt = aiRequest.messages[0].content
    expect(prompt).toContain('semirremolque refrigerado')
  })

  it('validates user is authenticated before processing body', async () => {
    mockServerUser.mockResolvedValue(null)
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 401 })
    // validateBody should not be called if user is not authenticated
    expect(mockValidateBody).not.toHaveBeenCalled()
  })

  it('returns aiUnavailable fields as empty strings when AI fails', async () => {
    mockCallAI.mockRejectedValue(new Error('Service unavailable'))
    const result = await handler(mockEvent)
    expect(result.aiUnavailable).toBe(true)
    expect(result.title_es).toBe('')
    expect(result.title_en).toBe('')
    expect(result.content_es).toBe('')
    expect(result.content_en).toBe('')
  })

  it('throws 502 when AI returns empty object', async () => {
    mockCallAI.mockResolvedValue({
      text: JSON.stringify({}),
      provider: 'anthropic',
      model: 'claude-haiku',
      latencyMs: 400,
    })
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 502 })
  })

  it('throws 502 when AI returns empty string', async () => {
    mockCallAI.mockResolvedValue({
      text: '',
      provider: 'anthropic',
      model: 'claude-haiku',
      latencyMs: 300,
    })
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 502 })
  })
})
