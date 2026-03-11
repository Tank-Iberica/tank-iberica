/**
 * Tests for app/plugins/web-vitals.client.ts — performance marks
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('web-vitals', () => ({
  onCLS: vi.fn(),
  onINP: vi.fn(),
  onLCP: vi.fn(),
  onFCP: vi.fn(),
  onTTFB: vi.fn(),
}))

describe('web-vitals plugin — performance marks', () => {
  let hooks: Record<string, (() => void)[]>
  let mockNuxtApp: { hook: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    vi.resetModules()
    hooks = {}
    mockNuxtApp = {
      hook: vi.fn((name: string, cb: () => void) => {
        if (!hooks[name]) hooks[name] = []
        hooks[name].push(cb)
      }),
    }

    // Immediately invoke plugin fn so hooks get registered during import
    vi.stubGlobal('defineNuxtPlugin', (fn: (app: typeof mockNuxtApp) => unknown) => {
      fn(mockNuxtApp)
      return () => {}
    })

    // Provide a real performance stub with mark + measure
    const markSpy = vi.fn()
    const measureSpy = vi.fn()
    vi.stubGlobal('performance', { mark: markSpy, measure: measureSpy })

    await import('../../../app/plugins/web-vitals.client')
  })

  it('registers page:start hook', () => {
    expect(mockNuxtApp.hook).toHaveBeenCalledWith('page:start', expect.any(Function))
  })

  it('registers page:finish hook', () => {
    expect(mockNuxtApp.hook).toHaveBeenCalledWith('page:finish', expect.any(Function))
  })

  it('registers app:mounted hook', () => {
    expect(mockNuxtApp.hook).toHaveBeenCalledWith('app:mounted', expect.any(Function))
  })

  it('calls performance.mark on page:start', () => {
    const markSpy = vi.fn()
    const measureSpy = vi.fn()
    vi.stubGlobal('performance', { mark: markSpy, measure: measureSpy })
    hooks['page:start']?.forEach(cb => cb())
    expect(markSpy).toHaveBeenCalledWith('nuxt:page:start')
  })

  it('calls performance.mark and measure on page:finish', () => {
    const markSpy = vi.fn()
    const measureSpy = vi.fn()
    vi.stubGlobal('performance', { mark: markSpy, measure: measureSpy })
    hooks['page:finish']?.forEach(cb => cb())
    expect(markSpy).toHaveBeenCalledWith('nuxt:page:finish')
    expect(measureSpy).toHaveBeenCalledWith('nuxt:page:navigation', 'nuxt:page:start', 'nuxt:page:finish')
  })

  it('calls performance.mark on app:mounted', () => {
    const markSpy = vi.fn()
    vi.stubGlobal('performance', { mark: markSpy, measure: vi.fn() })
    hooks['app:mounted']?.forEach(cb => cb())
    expect(markSpy).toHaveBeenCalledWith('nuxt:app:mounted')
  })

  it('handles measure failure gracefully', () => {
    vi.stubGlobal('performance', { mark: vi.fn(), measure: vi.fn().mockImplementation(() => { throw new Error('marks cleared') }) })
    expect(() => hooks['page:finish']?.forEach(cb => cb())).not.toThrow()
  })
})
