/**
 * Tests for app/plugins/error-handler.ts
 */
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockSentryInit, mockSentryCapture, mockSetUser } = vi.hoisted(() => ({
  mockSentryInit: vi.fn(),
  mockSentryCapture: vi.fn(),
  mockSetUser: vi.fn(),
}))

vi.mock('@sentry/vue', () => ({
  init: mockSentryInit,
  captureException: mockSentryCapture,
  setUser: mockSetUser,
  replayIntegration: vi.fn().mockReturnValue({ name: 'Replay' }),
  browserTracingIntegration: vi.fn().mockReturnValue({ name: 'BrowserTracing' }),
}))

vi.stubGlobal('defineNuxtPlugin', (fn: Function) => fn)
vi.stubGlobal('useRuntimeConfig', () => ({ public: { sentryDsn: undefined } }))
vi.stubGlobal('useAuth', () => ({
  profile: { value: null },
  userEmail: { value: '' },
}))

// ── Dynamic import (after stubs) ──────────────────────────────────────────────

let pluginFn: Function

beforeAll(async () => {
  pluginFn = (await import('../../app/plugins/error-handler')).default
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeNuxtApp() {
  return {
    vueApp: { config: { errorHandler: null as unknown } },
    hook: vi.fn(),
  }
}

// ══ Tests ═════════════════════════════════════════════════════════════════════

describe('error-handler plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes Sentry when DSN is configured', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { sentryDsn: 'https://test@sentry.io/1' } }))
    const app = makeNuxtApp()
    await pluginFn(app as any)
    expect(mockSentryInit).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://test@sentry.io/1',
      }),
    )
  })

  it('does not initialize Sentry when DSN is not configured', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { sentryDsn: undefined } }))
    const app = makeNuxtApp()
    await pluginFn(app as any)
    expect(mockSentryInit).not.toHaveBeenCalled()
  })

  it('sets errorHandler on vueApp.config', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { sentryDsn: undefined } }))
    const app = makeNuxtApp()
    await pluginFn(app as any)
    expect(typeof app.vueApp.config.errorHandler).toBe('function')
  })

  it('registers app:error hook', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { sentryDsn: undefined } }))
    const app = makeNuxtApp()
    await pluginFn(app as any)
    expect(app.hook).toHaveBeenCalledWith('app:error', expect.any(Function))
  })

  it('sends component error to Sentry when DSN is set', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { sentryDsn: 'https://test@sentry.io/1' } }))
    const app = makeNuxtApp()
    await pluginFn(app as any)
    const err = new Error('component error')
    ;(app.vueApp.config.errorHandler as Function)(err, null, 'test-info')
    expect(mockSentryCapture).toHaveBeenCalledWith(err, expect.any(Object))
  })

  it('does not send component error to Sentry when no DSN', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { sentryDsn: undefined } }))
    const app = makeNuxtApp()
    await pluginFn(app as any)
    const err = new Error('component error')
    ;(app.vueApp.config.errorHandler as Function)(err, null, 'test-info')
    expect(mockSentryCapture).not.toHaveBeenCalled()
  })

  it('captures app:error via Sentry when DSN is set', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { sentryDsn: 'https://test@sentry.io/1' } }))
    const app = makeNuxtApp()
    await pluginFn(app as any)
    const hookCb = app.hook.mock.calls.find(
      ([name]: any[]) => name === 'app:error',
    )?.[1] as Function
    const err = new Error('global error')
    hookCb(err)
    expect(mockSentryCapture).toHaveBeenCalledWith(err)
  })

  it('does not capture app:error via Sentry when no DSN', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { sentryDsn: undefined } }))
    const app = makeNuxtApp()
    await pluginFn(app as any)
    const hookCb = app.hook.mock.calls.find(
      ([name]: any[]) => name === 'app:error',
    )?.[1] as Function
    hookCb(new Error('global'))
    expect(mockSentryCapture).not.toHaveBeenCalled()
  })
})
