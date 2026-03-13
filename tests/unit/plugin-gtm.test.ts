/**
 * Tests for app/plugins/gtm.client.ts
 *
 * Note: vitest.config.ts replaces import.meta.client → (true) and
 * import.meta.dev → (true) for all files under app/plugins/.
 *
 * happy-dom would try to fetch external scripts/iframes if actually appended,
 * so we spy on DOM insertion methods to capture calls without triggering
 * network requests.
 */
import { describe, it, expect, vi, beforeEach, beforeAll, type MockInstance } from 'vitest'

// ── Vue composable stubs (must be at top, before module import) ───────────────

// Capture watch callbacks so tests can trigger consent changes manually
let _watchCb: ((v: unknown) => void) | null = null

vi.stubGlobal('watch', (source: unknown, cb: Function, opts?: { immediate?: boolean }) => {
  _watchCb = cb as (v: unknown) => void
  if (opts?.immediate && typeof source === 'function') {
    cb((source as () => unknown)())
  }
})

vi.stubGlobal('onMounted', (cb: Function) => cb())
vi.stubGlobal('defineNuxtPlugin', (fn: Function) => fn)

// ── Shared mutable consent state (survives closure capture in plugin) ─────────

const _consent = { marketing: false }

// Stub uses the shared object so hasConsent() reflects mutations made in tests
vi.stubGlobal('useConsent', () => ({
  consent: { value: _consent },
  hasConsent: (type: string) => type === 'marketing' && _consent.marketing,
}))

function stubConsent(marketing: boolean) {
  _consent.marketing = marketing
}

function stubConfig(gtmId: string) {
  vi.stubGlobal('useRuntimeConfig', () => ({ public: { gtmId } }))
}

// ── Dynamic import (after top-level stubs) ────────────────────────────────────

let pluginFn: Function

beforeAll(async () => {
  stubConsent(false)
  stubConfig('GTM-TEST123')
  pluginFn = (await import('../../app/plugins/gtm.client')).default
})

// ── DOM spies ─────────────────────────────────────────────────────────────────

let appendedScripts: HTMLScriptElement[]
let headAppendSpy: MockInstance
let bodyInsertSpy: MockInstance

// ══ Tests ═════════════════════════════════════════════════════════════════════

describe('gtm plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    _watchCb = null

    // Track scripts appended to head without triggering happy-dom's network fetch
    appendedScripts = []
    headAppendSpy = vi
      .spyOn(document.head, 'appendChild')
      .mockImplementation((node: Node) => {
        if (node instanceof HTMLScriptElement) appendedScripts.push(node)
        return node
      })

    // Suppress noscript/iframe insertion to body (would trigger iframe fetch)
    bodyInsertSpy = vi
      .spyOn(document.body, 'insertAdjacentElement')
      .mockReturnValue(null)

    // Re-register watch stub so fresh calls in pluginFn() are captured
    vi.stubGlobal('watch', (source: unknown, cb: Function, opts?: { immediate?: boolean }) => {
      _watchCb = cb as (v: unknown) => void
      if (opts?.immediate && typeof source === 'function') {
        cb((source as () => unknown)())
      }
    })
    vi.stubGlobal('onMounted', (cb: Function) => cb())

    // Reset dataLayer
    delete (window as Record<string, unknown>).dataLayer
  })

  // ── Structure ──────────────────────────────────────────────────────────────

  describe('plugin structure', () => {
    it('is callable without throwing', () => {
      stubConsent(false)
      stubConfig('GTM-TEST123')
      expect(() => pluginFn()).not.toThrow()
    })

    it('provides gtm.push function', () => {
      stubConsent(false)
      stubConfig('GTM-TEST123')
      const result = pluginFn()
      expect(result).toHaveProperty('provide.gtm.push')
      expect(typeof result.provide.gtm.push).toBe('function')
    })
  })

  // ── No consent ────────────────────────────────────────────────────────────

  describe('without marketing consent', () => {
    it('does not append any script to head', () => {
      stubConsent(false)
      stubConfig('GTM-TEST123')
      pluginFn()
      const gtmScripts = appendedScripts.filter((s) =>
        s.src?.includes('googletagmanager.com/gtm.js'),
      )
      expect(gtmScripts).toHaveLength(0)
    })

    it('does not insert noscript into body', () => {
      stubConsent(false)
      stubConfig('GTM-TEST123')
      pluginFn()
      expect(bodyInsertSpy).not.toHaveBeenCalled()
    })
  })

  // ── No gtmId ──────────────────────────────────────────────────────────────

  describe('without gtmId configured', () => {
    it('does not append GTM script even with marketing consent', () => {
      stubConsent(true)
      stubConfig('')
      pluginFn()
      expect(appendedScripts).toHaveLength(0)
    })

    it('does not insert noscript into body', () => {
      stubConsent(true)
      stubConfig('')
      pluginFn()
      expect(bodyInsertSpy).not.toHaveBeenCalled()
    })
  })

  // ── With consent and gtmId ────────────────────────────────────────────────

  describe('with marketing consent and gtmId', () => {
    it('appends a script to document.head', () => {
      stubConsent(true)
      stubConfig('GTM-TEST123')
      pluginFn()
      expect(appendedScripts.length).toBeGreaterThan(0)
    })

    it('script src contains the gtmId', () => {
      stubConsent(true)
      stubConfig('GTM-TEST123')
      pluginFn()
      const gtmScript = appendedScripts.find((s) => s.src?.includes('GTM-TEST123'))
      expect(gtmScript).toBeDefined()
    })

    it('script src points to googletagmanager.com', () => {
      stubConsent(true)
      stubConfig('GTM-TEST123')
      pluginFn()
      const gtmScript = appendedScripts.find((s) => s.src?.includes('googletagmanager.com/gtm.js'))
      expect(gtmScript).toBeDefined()
    })

    it('GTM script has async=true', () => {
      stubConsent(true)
      stubConfig('GTM-TEST123')
      pluginFn()
      const gtmScript = appendedScripts.find((s) => s.src?.includes('GTM-TEST123'))
      expect(gtmScript?.async).toBe(true)
    })

    it('inserts noscript fallback into body', () => {
      stubConsent(true)
      stubConfig('GTM-TEST123')
      pluginFn()
      expect(bodyInsertSpy).toHaveBeenCalledWith('afterbegin', expect.any(HTMLElement))
    })

    it('initializes window.dataLayer as an array', () => {
      stubConsent(true)
      stubConfig('GTM-TEST123')
      pluginFn()
      const dLayer = (window as Record<string, unknown>).dataLayer
      expect(Array.isArray(dLayer)).toBe(true)
    })

    it('pushes gtm.init_consent event to dataLayer', () => {
      stubConsent(true)
      stubConfig('GTM-TEST123')
      pluginFn()
      const dLayer = (window as Record<string, unknown>).dataLayer as Record<string, unknown>[]
      const initEvent = dLayer?.find((e) => e.event === 'gtm.init_consent')
      expect(initEvent).toBeDefined()
    })

    it('init_consent grants ad_storage', () => {
      stubConsent(true)
      stubConfig('GTM-TEST123')
      pluginFn()
      const dLayer = (window as Record<string, unknown>).dataLayer as Record<string, unknown>[]
      const initEvent = dLayer?.find((e) => e.event === 'gtm.init_consent')
      const consent = initEvent?.['gtm.consent'] as Record<string, string>
      expect(consent?.ad_storage).toBe('granted')
    })

    it('init_consent grants analytics_storage', () => {
      stubConsent(true)
      stubConfig('GTM-TEST123')
      pluginFn()
      const dLayer = (window as Record<string, unknown>).dataLayer as Record<string, unknown>[]
      const initEvent = dLayer?.find((e) => e.event === 'gtm.init_consent')
      const consent = initEvent?.['gtm.consent'] as Record<string, string>
      expect(consent?.analytics_storage).toBe('granted')
    })
  })

  // ── pushEvent ─────────────────────────────────────────────────────────────

  describe('gtm.push (pushEvent)', () => {
    it('pushes custom events to window.dataLayer', () => {
      stubConsent(false)
      stubConfig('GTM-TEST123')
      const result = pluginFn()
      const push = result.provide.gtm.push as (e: Record<string, unknown>) => void
      push({ event: 'custom_test', value: 42 })
      const dLayer = (window as Record<string, unknown>).dataLayer as Record<string, unknown>[]
      const found = dLayer?.find((e) => e.event === 'custom_test')
      expect(found).toBeDefined()
      expect(found?.value).toBe(42)
    })

    it('initializes dataLayer if not present before pushing', () => {
      stubConsent(false)
      stubConfig('GTM-TEST123')
      delete (window as Record<string, unknown>).dataLayer
      const result = pluginFn()
      const push = result.provide.gtm.push as (e: Record<string, unknown>) => void
      push({ event: 'lazy_init' })
      const dLayer = (window as Record<string, unknown>).dataLayer as Record<string, unknown>[]
      expect(Array.isArray(dLayer)).toBe(true)
    })

    it('event pushed to dataLayer is retrievable', () => {
      stubConsent(false)
      stubConfig('GTM-TEST123')
      const result = pluginFn()
      const push = result.provide.gtm.push as (e: Record<string, unknown>) => void
      push({ event: 'lazy_init' })
      const dLayer = (window as Record<string, unknown>).dataLayer as Record<string, unknown>[]
      expect(dLayer.find((e) => e.event === 'lazy_init')).toBeDefined()
    })

    it('does not throw when called multiple times', () => {
      stubConsent(false)
      stubConfig('GTM-TEST123')
      const result = pluginFn()
      const push = result.provide.gtm.push as (e: Record<string, unknown>) => void
      expect(() => {
        push({ event: 'a' })
        push({ event: 'b' })
        push({ event: 'c' })
      }).not.toThrow()
    })

    it('preserves existing dataLayer entries', () => {
      ;(window as Record<string, unknown>).dataLayer = [{ event: 'pre_existing' }]
      stubConsent(false)
      stubConfig('GTM-TEST123')
      const result = pluginFn()
      const push = result.provide.gtm.push as (e: Record<string, unknown>) => void
      push({ event: 'new_event' })
      const dLayer = (window as Record<string, unknown>).dataLayer as Record<string, unknown>[]
      expect(dLayer.find((e) => e.event === 'pre_existing')).toBeDefined()
      expect(dLayer.find((e) => e.event === 'new_event')).toBeDefined()
    })
  })

  // ── Consent watch ─────────────────────────────────────────────────────────

  describe('consent watch', () => {
    it('loads GTM when watch callback fires with marketing=true', () => {
      stubConsent(false)
      stubConfig('GTM-TEST123')
      pluginFn()
      expect(appendedScripts).toHaveLength(0)

      // Simulate consent granted: mutate shared state THEN fire watch callback
      // so hasConsent('marketing') inside loadGtm() returns true
      stubConsent(true)
      if (_watchCb) _watchCb(_consent)

      const gtmScript = appendedScripts.find((s) => s.src?.includes('GTM-TEST123'))
      expect(gtmScript).toBeDefined()
    })

    it('does not throw when watch fires with null', () => {
      stubConsent(false)
      stubConfig('GTM-TEST123')
      pluginFn()
      expect(() => {
        if (_watchCb) _watchCb(null)
      }).not.toThrow()
    })

    it('does not throw when watch fires with undefined', () => {
      stubConsent(false)
      stubConfig('GTM-TEST123')
      pluginFn()
      expect(() => {
        if (_watchCb) _watchCb(undefined)
      }).not.toThrow()
    })

    it('watch is registered with immediate: true', () => {
      let capturedImmediate: boolean | undefined
      vi.stubGlobal(
        'watch',
        (source: unknown, cb: Function, opts?: { immediate?: boolean }) => {
          capturedImmediate = opts?.immediate
          _watchCb = cb as (v: unknown) => void
        },
      )
      stubConsent(false)
      stubConfig('GTM-TEST123')
      pluginFn()
      expect(capturedImmediate).toBe(true)
      // Restore
      vi.stubGlobal('watch', (source: unknown, cb: Function, opts?: { immediate?: boolean }) => {
        _watchCb = cb as (v: unknown) => void
        if (opts?.immediate && typeof source === 'function') {
          cb((source as () => unknown)())
        }
      })
    })
  })

  // ── onMounted path ────────────────────────────────────────────────────────

  describe('onMounted', () => {
    it('loads GTM on mount when consent is already granted', () => {
      stubConsent(true)
      stubConfig('GTM-TEST123')
      pluginFn()
      const gtmScript = appendedScripts.find((s) => s.src?.includes('GTM-TEST123'))
      expect(gtmScript).toBeDefined()
    })

    it('skips GTM load on mount when no consent', () => {
      stubConsent(false)
      stubConfig('GTM-TEST123')
      pluginFn()
      expect(appendedScripts).toHaveLength(0)
    })
  })
})
