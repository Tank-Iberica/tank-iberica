/**
 * Tests for app/plugins/prebid.client.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.stubGlobal('defineNuxtPlugin', (fn: Function) => fn)

let mockConsentValue: Record<string, boolean> | null = null
const mockHasConsent = vi.fn().mockReturnValue(false)

vi.stubGlobal('useRuntimeConfig', () => ({
  public: { prebidEnabled: true },
}))

vi.stubGlobal('useConsent', () => ({
  consent: { value: mockConsentValue },
  hasConsent: mockHasConsent,
}))

let watchCallback: Function | null = null
vi.stubGlobal('watch', (_source: unknown, callback: Function, opts?: { immediate?: boolean }) => {
  watchCallback = callback
  if (opts?.immediate) {
    const src = typeof _source === 'function' ? (_source as Function)() : _source
    callback(src)
  }
})

let mountedCallback: Function | null = null
vi.stubGlobal('onMounted', (fn: Function) => { mountedCallback = fn })

// Mock DOM for script element
const mockPrebidScript: any = { async: false, src: '', parentNode: null, remove: vi.fn() }
const origCreate2 = globalThis.document?.createElement?.bind(globalThis.document)
vi.spyOn(globalThis.document, 'createElement').mockImplementation((tag: string): any => {
  if (tag === 'script') return mockPrebidScript
  return origCreate2?.(tag) ?? {}
})
vi.spyOn(globalThis.document.head, 'appendChild').mockReturnValue(mockPrebidScript as any)

// ── Dynamic import (after stubs) ──────────────────────────────────────────────

let pluginFn: Function

beforeAll(async () => {
  pluginFn = (await import('../../app/plugins/prebid.client')).default
})

// ══ Tests ═════════════════════════════════════════════════════════════════════

describe('prebid plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConsentValue = null
    mockHasConsent.mockReturnValue(false)
    watchCallback = null
    mountedCallback = null
    mockPrebidScript.parentNode = null
    mockPrebidScript.remove.mockClear()
    delete (globalThis as any).pbjs
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { prebidEnabled: true } }))
  })

  it('does not load Prebid when prebidEnabled is false', () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { prebidEnabled: false } }))
    mockConsentValue = { marketing: true }
    mockHasConsent.mockReturnValue(true)
    pluginFn()
    expect(globalThis.pbjs).toBeUndefined()
  })

  it('does not load Prebid when marketing consent is not given', () => {
    mockConsentValue = { marketing: true }
    // watch sees marketing=true → calls loadPrebid, but inside hasConsent returns false
    mockHasConsent.mockReturnValue(false)
    pluginFn()
    expect(globalThis.pbjs).toBeUndefined()
  })

  it('loads Prebid when enabled and marketing consent granted', () => {
    mockConsentValue = { marketing: true }
    mockHasConsent.mockReturnValue(true)
    pluginFn()
    expect(globalThis.pbjs).toBeDefined()
    expect(Array.isArray(globalThis.pbjs?.que)).toBe(true)
  })

  it('appends Prebid script to document.head', () => {
    mockConsentValue = { marketing: true }
    mockHasConsent.mockReturnValue(true)
    pluginFn()
    expect(globalThis.document.head.appendChild).toHaveBeenCalled()
  })

  it('sets correct Prebid script src', () => {
    mockConsentValue = { marketing: true }
    mockHasConsent.mockReturnValue(true)
    pluginFn()
    expect(mockPrebidScript.src).toContain('prebid.js')
  })

  it('does not throw when called without consent', () => {
    mockConsentValue = null
    mockHasConsent.mockReturnValue(false)
    expect(() => pluginFn()).not.toThrow()
  })

  it('skips loadPrebid if already loaded', () => {
    mockConsentValue = { marketing: true }
    mockHasConsent.mockReturnValue(true)
    pluginFn()
    expect(globalThis.pbjs).toBeDefined()
    // Trigger onMounted — loadPrebid called again but already loaded
    mountedCallback?.()
    expect(globalThis.document.head.appendChild).toHaveBeenCalledTimes(1)
  })

  it('unloads Prebid when consent is revoked', () => {
    mockHasConsent.mockReturnValue(true)
    mockConsentValue = { marketing: true }
    pluginFn()
    expect(globalThis.pbjs).toBeDefined()

    mockPrebidScript.parentNode = globalThis.document.head
    mockHasConsent.mockReturnValue(false)
    watchCallback?.({ marketing: false })
    expect(globalThis.pbjs).toBeUndefined()
    expect(mockPrebidScript.remove).toHaveBeenCalled()
  })

  it('unloadPrebid is no-op if prebid was never loaded', () => {
    mockConsentValue = null
    mockHasConsent.mockReturnValue(false)
    pluginFn()
    watchCallback?.({ marketing: false })
    expect(globalThis.pbjs).toBeUndefined()
  })

  it('loads prebid via onMounted when consent pre-granted', () => {
    mockHasConsent.mockReturnValue(true)
    mockConsentValue = null
    pluginFn()
    expect(globalThis.pbjs).toBeUndefined()
    mountedCallback?.()
    expect(globalThis.pbjs).toBeDefined()
  })

  it('handles load error gracefully', () => {
    mockConsentValue = { marketing: true }
    mockHasConsent.mockReturnValue(true)
    vi.spyOn(globalThis.document, 'createElement').mockImplementation(() => {
      throw new Error('DOM error')
    })
    expect(() => pluginFn()).not.toThrow()
    vi.spyOn(globalThis.document, 'createElement').mockImplementation((tag: string): any => {
      if (tag === 'script') return mockPrebidScript
      return origCreate2?.(tag) ?? {}
    })
  })

  it('handles unload error gracefully', () => {
    mockConsentValue = { marketing: true }
    mockHasConsent.mockReturnValue(true)
    pluginFn()
    mockPrebidScript.parentNode = globalThis.document.head
    mockPrebidScript.remove.mockImplementation(() => { throw new Error('Remove failed') })
    mockHasConsent.mockReturnValue(false)
    expect(() => watchCallback?.({ marketing: false })).not.toThrow()
    mockPrebidScript.remove.mockClear()
  })
})
