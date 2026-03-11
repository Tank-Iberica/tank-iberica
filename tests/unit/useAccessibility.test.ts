import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAccessibility } from '../../app/composables/useAccessibility'

// ─── Stub helpers ──────────────────────────────────────────────────────────────

function stubColorMode(preference = 'system') {
  vi.stubGlobal('useColorMode', () => ({
    preference,
    value: preference === 'system' ? 'light' : preference,
  }))
}

function stubCookie(initial = 'normal') {
  const cookie = { value: initial }
  vi.stubGlobal('useCookie', (_key: string, _opts?: object) => cookie)
  return cookie
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('useHead', () => {})
  stubColorMode()
  stubCookie()
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('exposes colorMode from useColorMode', () => {
    stubColorMode('dark')
    const c = useAccessibility()
    expect((c.colorMode as Record<string, unknown>).preference).toBe('dark')
  })

  it('exposes fontSize from cookie', () => {
    stubCookie('large')
    const c = useAccessibility()
    expect(c.fontSize.value).toBe('large')
  })

  it('fontSize defaults to normal when no cookie value', () => {
    stubCookie('normal')
    const c = useAccessibility()
    expect(c.fontSize.value).toBe('normal')
  })
})

// ─── setFontSize ──────────────────────────────────────────────────────────────

describe('setFontSize', () => {
  it('updates cookie value', () => {
    const cookie = stubCookie('normal')
    const c = useAccessibility()
    c.setFontSize('large')
    expect(cookie.value).toBe('large')
  })

  it('sets large font size', () => {
    const cookie = stubCookie('normal')
    const c = useAccessibility()
    c.setFontSize('large')
    expect(c.fontSize.value).toBe('large')
  })

  it('sets xlarge font size', () => {
    const cookie = stubCookie('normal')
    const c = useAccessibility()
    c.setFontSize('xlarge')
    expect(c.fontSize.value).toBe('xlarge')
  })

  it('can reset to normal', () => {
    const cookie = stubCookie('large')
    const c = useAccessibility()
    c.setFontSize('normal')
    expect(c.fontSize.value).toBe('normal')
  })
})

// ─── return shape ─────────────────────────────────────────────────────────────

describe('return shape', () => {
  it('exposes colorMode', () => {
    const c = useAccessibility()
    expect(c.colorMode).toBeDefined()
  })

  it('exposes fontSize', () => {
    const c = useAccessibility()
    expect(c.fontSize).toBeDefined()
  })

  it('exposes setFontSize function', () => {
    const c = useAccessibility()
    expect(typeof c.setFontSize).toBe('function')
  })
})
