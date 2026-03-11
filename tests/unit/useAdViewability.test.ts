import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdViewability } from '../../app/composables/useAdViewability'

// ─── Stubs ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      insert: () => Promise.resolve({ data: null, error: null }),
    }),
  }))
  vi.stubGlobal('useRoute', () => ({ fullPath: '/vehicles/v1' }))
  vi.stubGlobal('watch', vi.fn())
  vi.stubGlobal('onMounted', vi.fn())
  vi.stubGlobal('onUnmounted', vi.fn())
  // Stub IntersectionObserver
  vi.stubGlobal('IntersectionObserver', class {
    constructor(_cb: unknown, _opts?: unknown) {}
    observe = vi.fn()
    disconnect = vi.fn()
  })
  // Stub document.addEventListener / removeEventListener
  vi.stubGlobal('document', {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    visibilityState: 'visible',
  })
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('isViewable starts as false', () => {
    const ref = { value: null as HTMLElement | null }
    const c = useAdViewability(ref, 'ad-1', { source: 'direct', position: 'sidebar' })
    expect(c.isViewable.value).toBe(false)
  })

  it('timeInView starts at 0', () => {
    const ref = { value: null as HTMLElement | null }
    const c = useAdViewability(ref, 'ad-1', { source: 'direct', position: 'sidebar' })
    expect(c.timeInView.value).toBe(0)
  })

  it('returns isViewable and timeInView refs', () => {
    const ref = { value: null as HTMLElement | null }
    const c = useAdViewability(ref, 'ad-1', { source: 'prebid', position: 'catalog_inline' })
    expect(c).toHaveProperty('isViewable')
    expect(c).toHaveProperty('timeInView')
  })

  it('works with null adId', () => {
    const ref = { value: null as HTMLElement | null }
    const c = useAdViewability(ref, null, { source: 'adsense', position: 'landing_sidebar' })
    expect(c.isViewable.value).toBe(false)
  })
})

// ─── Callback option ──────────────────────────────────────────────────────────

describe('options', () => {
  it('accepts onViewable callback', () => {
    const onViewable = vi.fn()
    const ref = { value: null as HTMLElement | null }
    expect(() =>
      useAdViewability(ref, 'ad-1', { source: 'direct', position: 'sidebar', onViewable }),
    ).not.toThrow()
  })
})
