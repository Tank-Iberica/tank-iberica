import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockSendRedirect } = vi.hoisted(() => ({
  mockSendRedirect: vi.fn(),
}))

vi.mock('h3', () => ({
  defineEventHandler: (fn: Function) => fn,
  sendRedirect: mockSendRedirect,
}))

import handler, { track404 } from '../../../server/middleware/redirects'

function makeEvent(path: string) {
  return { path } as any
}

describe('redirects middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('skips API routes', () => {
    handler(makeEvent('/api/vehicles'))
    expect(mockSendRedirect).not.toHaveBeenCalled()
  })

  it('skips _nuxt routes', () => {
    handler(makeEvent('/_nuxt/app.js'))
    expect(mockSendRedirect).not.toHaveBeenCalled()
  })

  it('skips __nuxt routes', () => {
    handler(makeEvent('/__nuxt_test'))
    expect(mockSendRedirect).not.toHaveBeenCalled()
  })

  it('does not redirect root path', () => {
    handler(makeEvent('/'))
    expect(mockSendRedirect).not.toHaveBeenCalled()
  })

  it('does not redirect unknown paths', () => {
    handler(makeEvent('/vehiculo/volvo-fh-2022'))
    expect(mockSendRedirect).not.toHaveBeenCalled()
  })

  // Static redirects
  it('redirects /vehiculos to /', () => {
    handler(makeEvent('/vehiculos'))
    expect(mockSendRedirect).toHaveBeenCalledWith(expect.anything(), '/', 301)
  })

  it('redirects /catalogo to /', () => {
    handler(makeEvent('/catalogo'))
    expect(mockSendRedirect).toHaveBeenCalledWith(expect.anything(), '/', 301)
  })

  it('redirects /catalog to /', () => {
    handler(makeEvent('/catalog'))
    expect(mockSendRedirect).toHaveBeenCalledWith(expect.anything(), '/', 301)
  })

  it('redirects /contacto to /sobre-nosotros', () => {
    handler(makeEvent('/contacto'))
    expect(mockSendRedirect).toHaveBeenCalledWith(expect.anything(), '/sobre-nosotros', 301)
  })

  it('redirects /privacidad to /legal/privacidad', () => {
    handler(makeEvent('/privacidad'))
    expect(mockSendRedirect).toHaveBeenCalledWith(expect.anything(), '/legal/privacidad', 301)
  })

  it('redirects /terminos to /legal/condiciones', () => {
    handler(makeEvent('/terminos'))
    expect(mockSendRedirect).toHaveBeenCalledWith(expect.anything(), '/legal/condiciones', 301)
  })

  it('redirects /cookies to /legal/cookies', () => {
    handler(makeEvent('/cookies'))
    expect(mockSendRedirect).toHaveBeenCalledWith(expect.anything(), '/legal/cookies', 301)
  })

  // Pattern redirects
  it('redirects /vehiculos/:numericId to /', () => {
    handler(makeEvent('/vehiculos/12345'))
    expect(mockSendRedirect).toHaveBeenCalledWith(expect.anything(), '/', 301)
  })

  it('redirects /en/vehicles/:slug to /en/vehiculo/:slug', () => {
    handler(makeEvent('/en/vehicles/volvo-fh-2022'))
    expect(mockSendRedirect).toHaveBeenCalledWith(
      expect.anything(),
      '/en/vehiculo/volvo-fh-2022',
      301,
    )
  })

  // Trailing slash
  it('removes trailing slash from non-root path', () => {
    handler(makeEvent('/sobre-nosotros/'))
    expect(mockSendRedirect).toHaveBeenCalledWith(expect.anything(), '/sobre-nosotros', 301)
  })

  it('handles case-insensitive static redirects', () => {
    handler(makeEvent('/VEHICULOS'))
    expect(mockSendRedirect).toHaveBeenCalledWith(expect.anything(), '/', 301)
  })
})

// ─── track404 ────────────────────────────────────────────────────────────────

describe('track404', () => {
  it('tracks a path without throwing', () => {
    expect(() => track404('/missing-page')).not.toThrow()
  })

  it('can track same path multiple times', () => {
    expect(() => {
      track404('/repeated')
      track404('/repeated')
      track404('/repeated')
    }).not.toThrow()
  })

  it('handles empty string path', () => {
    expect(() => track404('')).not.toThrow()
  })

  it('logs frequent 404s when LOG_INTERVAL has elapsed', () => {
    vi.useFakeTimers()
    // Advance beyond LOG_INTERVAL (1 hour) so the periodic log triggers
    vi.advanceTimersByTime(2 * 60 * 60 * 1000)
    // Track a path >= MIN_COUNT_TO_LOG (3) times then trigger the log check
    track404('/legacy-url')
    track404('/legacy-url')
    track404('/legacy-url')
    expect(() => track404('/trigger')).not.toThrow()
    vi.useRealTimers()
  })

  it('sort comparator exercises with multiple frequent paths', () => {
    vi.useFakeTimers()
    // Accumulate paths FIRST (Date.now ≈ base, lastLogTime is from a prior test in the future)
    // so the LOG_INTERVAL check does NOT trigger during accumulation.
    for (let i = 0; i < 5; i++) track404('/sort-a')
    for (let i = 0; i < 3; i++) track404('/sort-b')
    // NOW advance time well past LOG_INTERVAL so next call triggers the periodic log
    vi.advanceTimersByTime(4 * 60 * 60 * 1000)
    // This call triggers the check: both paths have count >= MIN_COUNT_TO_LOG(3)
    // so the sort comparator runs on 2+ entries
    expect(() => track404('/sort-b')).not.toThrow()
    vi.useRealTimers()
  })
})
