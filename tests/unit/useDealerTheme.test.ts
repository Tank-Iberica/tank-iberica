import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDealerTheme } from '../../app/composables/useDealerTheme'

// ─── Stub helpers ──────────────────────────────────────────────────────────────

function stubVerticalConfig(theme: Record<string, string> | null = null) {
  vi.stubGlobal('useVerticalConfig', () => ({
    config: { value: theme !== null ? { theme } : null },
  }))
}

beforeEach(() => {
  vi.clearAllMocks()
  stubVerticalConfig({ 'primary-color': '#23424A', 'font-family': 'Inter', 'bg-color': '#fff' })
})

// ─── mergedTheme ──────────────────────────────────────────────────────────────

describe('mergedTheme', () => {
  it('returns base theme when dealerTheme is null', () => {
    const c = useDealerTheme()
    const result = c.mergedTheme(null)
    expect(result['primary-color']).toBe('#23424A')
    expect(result['font-family']).toBe('Inter')
  })

  it('returns base theme when dealerTheme is undefined', () => {
    const c = useDealerTheme()
    const result = c.mergedTheme(undefined)
    expect(result['primary-color']).toBe('#23424A')
  })

  it('returns base theme when dealerTheme is empty object', () => {
    const c = useDealerTheme()
    const result = c.mergedTheme({})
    expect(result['font-family']).toBe('Inter')
  })

  it('dealer overrides take precedence over base theme', () => {
    const c = useDealerTheme()
    const result = c.mergedTheme({ 'primary-color': '#FF0000' })
    expect(result['primary-color']).toBe('#FF0000')
  })

  it('base theme keys not overridden by dealer are preserved', () => {
    const c = useDealerTheme()
    const result = c.mergedTheme({ 'primary-color': '#FF0000' })
    expect(result['font-family']).toBe('Inter')
    expect(result['bg-color']).toBe('#fff')
  })

  it('dealer theme can add new keys not in base', () => {
    const c = useDealerTheme()
    const result = c.mergedTheme({ 'accent-color': '#00FF00' })
    expect(result['accent-color']).toBe('#00FF00')
    expect(result['primary-color']).toBe('#23424A')
  })

  it('multiple dealer overrides are all applied', () => {
    const c = useDealerTheme()
    const result = c.mergedTheme({
      'primary-color': '#123456',
      'font-family': 'Roboto',
    })
    expect(result['primary-color']).toBe('#123456')
    expect(result['font-family']).toBe('Roboto')
    expect(result['bg-color']).toBe('#fff')
  })

  it('returns empty object when no verticalConfig and dealerTheme is null', () => {
    stubVerticalConfig(null)
    const c = useDealerTheme()
    const result = c.mergedTheme(null)
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('returns dealer theme when no verticalConfig base', () => {
    stubVerticalConfig(null)
    const c = useDealerTheme()
    const result = c.mergedTheme({ 'primary-color': '#ABC' })
    expect(result['primary-color']).toBe('#ABC')
  })

  it('handles verticalConfig with no theme property', () => {
    vi.stubGlobal('useVerticalConfig', () => ({ config: { value: {} } }))
    const c = useDealerTheme()
    const result = c.mergedTheme({ 'primary-color': '#DEF' })
    expect(result['primary-color']).toBe('#DEF')
  })
})

// ─── applyDealerTheme / restoreVerticalTheme ──────────────────────────────────
// These methods are gated by import.meta.client (false in test env).
// We just verify they exist and don't throw.

describe('applyDealerTheme (import.meta.client guard)', () => {
  it('does not throw when called', () => {
    const c = useDealerTheme()
    expect(() => c.applyDealerTheme({ 'primary-color': '#ABC' })).not.toThrow()
  })

  it('does not throw when called with null', () => {
    const c = useDealerTheme()
    expect(() => c.applyDealerTheme(null)).not.toThrow()
  })
})

describe('restoreVerticalTheme (import.meta.client guard)', () => {
  it('does not throw when called', () => {
    const c = useDealerTheme()
    expect(() => c.restoreVerticalTheme()).not.toThrow()
  })
})
