/**
 * Tests for app/plugins/ripple.client.ts
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'

// Simulate nuxtApp.vueApp.directive registration
let registeredDirective: {
  mounted?: (el: HTMLElement) => void
  unmounted?: (el: HTMLElement & { _rippleHandler?: (e: MouseEvent | TouchEvent) => void }) => void
} = {}

const mockVueApp = { directive: vi.fn((_name: string, def: typeof registeredDirective) => { registeredDirective = def }) }
const mockNuxtApp = { vueApp: mockVueApp }

beforeAll(() => {
  // Immediately invoke plugin fn so directive gets registered during import
  vi.stubGlobal('defineNuxtPlugin', (fn: (app: typeof mockNuxtApp) => unknown) => {
    fn(mockNuxtApp)
    return () => {}
  })
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
})

describe('ripple plugin', () => {
  beforeEach(async () => {
    vi.resetModules()
    registeredDirective = {}
    mockVueApp.directive.mockClear()
    await import('../../../app/plugins/ripple.client')
  })

  it('registers v-ripple directive', () => {
    expect(mockVueApp.directive).toHaveBeenCalledWith('ripple', expect.any(Object))
  })

  describe('mounted hook', () => {
    let el: HTMLElement

    beforeEach(() => {
      el = document.createElement('button')
      document.body.appendChild(el)
    })

    afterEach(() => {
      if (el.parentNode) el.parentNode.removeChild(el)
    })

    it('sets overflow:hidden on element', () => {
      registeredDirective.mounted?.(el)
      expect(el.style.overflow).toBe('hidden')
    })

    it('attaches mousedown event listener', () => {
      const spy = vi.spyOn(el, 'addEventListener')
      registeredDirective.mounted?.(el)
      expect(spy).toHaveBeenCalledWith('mousedown', expect.any(Function))
    })

    it('attaches touchstart event listener with passive flag', () => {
      const spy = vi.spyOn(el, 'addEventListener')
      registeredDirective.mounted?.(el)
      expect(spy).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: true })
    })

    it('stores handler reference on element', () => {
      registeredDirective.mounted?.(el)
      expect((el as HTMLElement & { _rippleHandler?: unknown })._rippleHandler).toBeDefined()
    })

    it('creates ripple span on mousedown (no reduced motion)', () => {
      vi.stubGlobal('matchMedia', () => ({ matches: false }))
      registeredDirective.mounted?.(el)
      el.dispatchEvent(new MouseEvent('mousedown', { clientX: 50, clientY: 50, bubbles: true }))
      // Ripple span is appended before animationend removes it
      const ripple = el.querySelector('span')
      expect(ripple).not.toBeNull()
    })

    it('does NOT create ripple when prefers-reduced-motion', () => {
      vi.stubGlobal('matchMedia', () => ({ matches: true }))
      registeredDirective.mounted?.(el)
      el.dispatchEvent(new MouseEvent('mousedown', { clientX: 50, clientY: 50, bubbles: true }))
      expect(el.querySelector('span')).toBeNull()
    })
  })

  describe('unmounted hook', () => {
    it('removes event listeners on unmount', () => {
      const el = document.createElement('button') as HTMLElement & {
        _rippleHandler?: (e: MouseEvent | TouchEvent) => void
      }
      const handler = vi.fn()
      el._rippleHandler = handler
      const spy = vi.spyOn(el, 'removeEventListener')

      registeredDirective.unmounted?.(el)
      expect(spy).toHaveBeenCalledWith('mousedown', handler)
      expect(spy).toHaveBeenCalledWith('touchstart', handler)
    })

    it('handles unmount gracefully when no handler', () => {
      const el = document.createElement('button')
      expect(() => registeredDirective.unmounted?.(el)).not.toThrow()
    })
  })
})
