import { describe, it, expect, vi, beforeAll } from 'vitest'

let handler: Function

describe('vertical-context middleware', () => {
  beforeAll(async () => {
    vi.stubGlobal('defineEventHandler', (fn: Function) => fn)
    vi.resetModules()
    const mod = await import('../../../server/middleware/vertical-context')
    handler = mod.default as Function
  })

  it('sets event.context.vertical from runtime config', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: { vertical: 'tracciona' },
    }))
    const event = { context: {} as Record<string, unknown> }
    await handler(event)
    expect(event.context.vertical).toBe('tracciona')
  })

  it('falls back to "tracciona" when vertical not configured', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: {},
    }))
    const event = { context: {} as Record<string, unknown> }
    await handler(event)
    expect(event.context.vertical).toBe('tracciona')
  })

  it('uses vertical from config when different vertical set', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: { vertical: 'camiones' },
    }))
    const event = { context: {} as Record<string, unknown> }
    await handler(event)
    expect(event.context.vertical).toBe('camiones')
  })
})
