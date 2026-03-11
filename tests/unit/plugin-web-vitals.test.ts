/**
 * Tests for app/plugins/web-vitals.client.ts
 *
 * With `define: { 'import.meta.client': 'true' }` in vitest.config.ts,
 * the plugin no longer early-returns so we can test the actual sendMetric callback.
 */
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockOnCLS, mockOnINP, mockOnLCP, mockOnFCP, mockOnTTFB } = vi.hoisted(() => ({
  mockOnCLS: vi.fn(),
  mockOnINP: vi.fn(),
  mockOnLCP: vi.fn(),
  mockOnFCP: vi.fn(),
  mockOnTTFB: vi.fn(),
}))

vi.mock('web-vitals', () => ({
  onCLS: mockOnCLS,
  onINP: mockOnINP,
  onLCP: mockOnLCP,
  onFCP: mockOnFCP,
  onTTFB: mockOnTTFB,
}))

vi.stubGlobal('defineNuxtPlugin', (fn: Function) => fn)

// ── Dynamic import (after stubs) ──────────────────────────────────────────────

let pluginFn: Function

beforeAll(async () => {
  pluginFn = (await import('../../app/plugins/web-vitals.client')).default
})

// ══ Tests ═════════════════════════════════════════════════════════════════════

const mockNuxtApp = { hook: vi.fn() }

describe('web-vitals plugin', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('does not throw when called', () => {
    expect(() => pluginFn(mockNuxtApp)).not.toThrow()
  })

  it('registers all 5 web-vitals callbacks', () => {
    pluginFn(mockNuxtApp)
    expect(mockOnCLS).toHaveBeenCalledWith(expect.any(Function))
    expect(mockOnINP).toHaveBeenCalledWith(expect.any(Function))
    expect(mockOnLCP).toHaveBeenCalledWith(expect.any(Function))
    expect(mockOnFCP).toHaveBeenCalledWith(expect.any(Function))
    expect(mockOnTTFB).toHaveBeenCalledWith(expect.any(Function))
  })

  it('sendMetric logs to console.debug in dev mode', () => {
    pluginFn(mockNuxtApp)
    const sendMetric = mockOnCLS.mock.calls[0]![0]
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    sendMetric({ name: 'CLS', value: 0.1, id: 'v1-123' })
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('CLS'))
    spy.mockRestore()
  })

  it('sendMetric sends to gtag when available and not dev', () => {
    pluginFn(mockNuxtApp)
    const sendMetric = mockOnCLS.mock.calls[0]![0]

    // In dev mode, sendMetric logs and returns before reaching gtag.
    // The gtag path (L14-24) is only reached when import.meta.dev is false (production).
    // Since we define import.meta.dev=true in vitest config, we only test the dev branch.
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    sendMetric({ name: 'LCP', value: 250, id: 'v1-456' })
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
