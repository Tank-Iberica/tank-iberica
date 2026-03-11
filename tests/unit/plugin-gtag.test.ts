/**
 * Tests for app/plugins/gtag.client.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.stubGlobal('defineNuxtPlugin', (fn: Function) => fn)

let mockConsentValue: Record<string, boolean> | null = null
const mockHasConsent = vi.fn().mockReturnValue(false)

vi.stubGlobal('useRuntimeConfig', () => ({
  public: { googleAdsId: 'AW-123456789' },
}))

vi.stubGlobal('useConsent', () => ({
  consent: { value: mockConsentValue },
  hasConsent: mockHasConsent,
}))

// watch & onMounted: capture callbacks for manual invocation
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

// Mock document.createElement and document.head.appendChild for script loading
const mockScript: any = { async: false, src: '', parentNode: null, remove: vi.fn() }
const origCreate = globalThis.document?.createElement?.bind(globalThis.document)
vi.spyOn(globalThis.document, 'createElement').mockImplementation((tag: string): any => {
  if (tag === 'script') return mockScript
  return origCreate?.(tag) ?? {}
})
vi.spyOn(globalThis.document.head, 'appendChild').mockReturnValue(mockScript as any)

// ── Dynamic import (after stubs) ──────────────────────────────────────────────

let pluginFn: Function

beforeAll(async () => {
  pluginFn = (await import('../../app/plugins/gtag.client')).default
})

// ══ Tests ═════════════════════════════════════════════════════════════════════

describe('gtag plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConsentValue = null
    mockHasConsent.mockReturnValue(false)
    watchCallback = null
    mountedCallback = null
    mockScript.parentNode = null
    mockScript.remove.mockClear()
    // Reset globals
    delete (globalThis as any).gtag
    delete (globalThis as any).dataLayer
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { googleAdsId: 'AW-123456789' } }))
  })

  it('does not load gtag when no googleAdsId is configured', () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { googleAdsId: undefined } }))
    mockConsentValue = { marketing: true }
    mockHasConsent.mockReturnValue(true)
    pluginFn()
    // loadGtag called but adsId is empty → logs and returns
    expect(globalThis.gtag).toBeUndefined()
  })

  it('does not load gtag when marketing consent is not given', () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { googleAdsId: 'AW-123456789' } }))
    mockConsentValue = { marketing: true }
    // watch sees marketing=true → calls loadGtag, but inside hasConsent returns false
    mockHasConsent.mockReturnValue(false)
    pluginFn()
    expect(globalThis.gtag).toBeUndefined()
  })

  it('loads gtag when adsId is set and marketing consent granted', () => {
    mockConsentValue = { marketing: true }
    mockHasConsent.mockReturnValue(true)
    pluginFn()
    expect(typeof globalThis.gtag).toBe('function')
    expect(globalThis.dataLayer).toBeDefined()
  })

  it('appends script tag to document.head when loaded', () => {
    mockConsentValue = { marketing: true }
    mockHasConsent.mockReturnValue(true)
    pluginFn()
    expect(globalThis.document.head.appendChild).toHaveBeenCalled()
  })

  it('sets correct gtag script src', () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { googleAdsId: 'AW-999' } }))
    mockConsentValue = { marketing: true }
    mockHasConsent.mockReturnValue(true)
    pluginFn()
    expect(mockScript.src).toContain('AW-999')
  })

  it('does not throw when called without consent', () => {
    mockConsentValue = null
    mockHasConsent.mockReturnValue(false)
    expect(() => pluginFn()).not.toThrow()
  })

  it('skips loadGtag if already loaded (gtagLoaded guard)', () => {
    mockConsentValue = { marketing: true }
    mockHasConsent.mockReturnValue(true)
    pluginFn()
    expect(typeof globalThis.gtag).toBe('function')
    // Call watch callback again with marketing=true → loadGtag called but already loaded
    // Need to reset gtagLoaded state indirectly — re-trigger via onMounted
    mountedCallback?.()
    // Should not throw or double-load
    expect(globalThis.document.head.appendChild).toHaveBeenCalledTimes(1)
  })

  it('unloads gtag when consent is revoked after initial load', () => {
    mockHasConsent.mockReturnValue(true)
    mockConsentValue = { marketing: true }
    pluginFn()
    expect(typeof globalThis.gtag).toBe('function')

    // Set parentNode so script removal works
    mockScript.parentNode = globalThis.document.head

    // Revoke consent
    mockHasConsent.mockReturnValue(false)
    watchCallback?.({ marketing: false })
    expect(globalThis.gtag).toBeUndefined()
    expect(globalThis.dataLayer).toBeUndefined()
    expect(mockScript.remove).toHaveBeenCalled()
  })

  it('unloadGtag is no-op if gtag was never loaded', () => {
    mockConsentValue = null
    mockHasConsent.mockReturnValue(false)
    pluginFn()
    // gtag was never loaded, triggering revoke does nothing
    watchCallback?.({ marketing: false })
    expect(globalThis.gtag).toBeUndefined()
  })

  it('loads gtag via onMounted when consent is pre-granted', () => {
    mockHasConsent.mockReturnValue(true)
    mockConsentValue = null // watch won't trigger load (null consent)
    pluginFn()
    // Watch with null consent → returns early. onMounted not called yet.
    expect(globalThis.gtag).toBeUndefined()
    // Now simulate mount
    mountedCallback?.()
    expect(typeof globalThis.gtag).toBe('function')
  })

  it('handles load error gracefully', () => {
    mockConsentValue = { marketing: true }
    mockHasConsent.mockReturnValue(true)
    // Make createElement throw to trigger error path
    vi.spyOn(globalThis.document, 'createElement').mockImplementation(() => {
      throw new Error('DOM error')
    })
    expect(() => pluginFn()).not.toThrow()
    vi.spyOn(globalThis.document, 'createElement').mockImplementation((tag: string): any => {
      if (tag === 'script') return mockScript
      return origCreate?.(tag) ?? {}
    })
  })

  it('handles unload error gracefully', () => {
    mockConsentValue = { marketing: true }
    mockHasConsent.mockReturnValue(true)
    pluginFn()
    // Make remove() throw
    mockScript.parentNode = globalThis.document.head
    mockScript.remove.mockImplementation(() => { throw new Error('Remove failed') })
    mockHasConsent.mockReturnValue(false)
    expect(() => watchCallback?.({ marketing: false })).not.toThrow()
    mockScript.remove.mockClear()
  })
})
