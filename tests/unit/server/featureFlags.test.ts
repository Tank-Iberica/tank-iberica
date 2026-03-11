import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock ofetch (static import in featureFlags.ts) ───────────────────────────

const { mockFetch } = vi.hoisted(() => ({
  mockFetch: vi.fn<[], Promise<unknown[]>>().mockResolvedValue([]),
}))

vi.mock('ofetch', () => ({
  $fetch: mockFetch,
}))

import {
  isFeatureEnabled,
  invalidateFeatureFlagCache,
} from '../../../server/utils/featureFlags'

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  invalidateFeatureFlagCache()
  // Provide Supabase credentials so loadFlags runs
  vi.stubGlobal('useSupabaseRestHeaders', () => ({
    url: 'https://test.supabase.co',
    headers: { apikey: 'test-key', Authorization: 'Bearer test-key' },
  }))
  mockFetch.mockResolvedValue([])
})

// ─── isFeatureEnabled ─────────────────────────────────────────────────────────

describe('isFeatureEnabled', () => {
  it('returns false when flag does not exist in cache', async () => {
    const result = await isFeatureEnabled('nonexistent-flag')
    expect(result).toBe(false)
  })

  it('returns false when flag is disabled', async () => {
    mockFetch.mockResolvedValueOnce([
      { key: 'disabled-flag', enabled: false, percentage: 100, allowed_dealers: null },
    ])
    const result = await isFeatureEnabled('disabled-flag')
    expect(result).toBe(false)
  })

  it('returns true when flag is enabled with 100% rollout', async () => {
    mockFetch.mockResolvedValueOnce([
      { key: 'enabled-flag', enabled: true, percentage: 100, allowed_dealers: null },
    ])
    const result = await isFeatureEnabled('enabled-flag')
    expect(result).toBe(true)
  })

  it('returns false when dealer is not in allowlist', async () => {
    mockFetch.mockResolvedValueOnce([
      { key: 'dealer-flag', enabled: true, percentage: 100, allowed_dealers: ['dealer-2', 'dealer-3'] },
    ])
    const result = await isFeatureEnabled('dealer-flag', 'dealer-1')
    expect(result).toBe(false)
  })

  it('returns true when dealer is in allowlist', async () => {
    mockFetch.mockResolvedValueOnce([
      { key: 'dealer-flag', enabled: true, percentage: 100, allowed_dealers: ['dealer-1', 'dealer-2'] },
    ])
    const result = await isFeatureEnabled('dealer-flag', 'dealer-1')
    expect(result).toBe(true)
  })

  it('returns false when no dealerId provided and allowlist is set', async () => {
    mockFetch.mockResolvedValueOnce([
      { key: 'dealer-flag', enabled: true, percentage: 100, allowed_dealers: ['dealer-1'] },
    ])
    const result = await isFeatureEnabled('dealer-flag')
    expect(result).toBe(false)
  })

  it('returns false when no credentials (useSupabaseRestHeaders returns null)', async () => {
    vi.stubGlobal('useSupabaseRestHeaders', () => null)
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await isFeatureEnabled('any-flag')
    expect(result).toBe(false)
    warnSpy.mockRestore()
  })

  it('warns when no Supabase credentials configured', async () => {
    vi.stubGlobal('useSupabaseRestHeaders', () => null)
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await isFeatureEnabled('any-flag')
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('returns false when $fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = await isFeatureEnabled('any-flag')
    expect(result).toBe(false)
    errorSpy.mockRestore()
  })

  it('uses cache on second call (only one $fetch)', async () => {
    mockFetch.mockResolvedValue([
      { key: 'cached-flag', enabled: true, percentage: 100, allowed_dealers: null },
    ])
    await isFeatureEnabled('cached-flag')
    await isFeatureEnabled('cached-flag')
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('runs simpleHash for percentage-based flag (0% → always false)', async () => {
    mockFetch.mockResolvedValueOnce([
      { key: 'zero-pct', enabled: true, percentage: 0, allowed_dealers: null },
    ])
    const result = await isFeatureEnabled('zero-pct', 'dealer-1')
    expect(result).toBe(false)
  })

  it('runs simpleHash with no dealerId for percentage-based flag', async () => {
    mockFetch.mockResolvedValueOnce([
      { key: 'anon-pct', enabled: true, percentage: 50, allowed_dealers: null },
    ])
    // Exercises simpleHash(key) branch (no dealerId)
    const result = await isFeatureEnabled('anon-pct')
    expect(typeof result).toBe('boolean')
  })
})

// ─── invalidateFeatureFlagCache ───────────────────────────────────────────────

describe('invalidateFeatureFlagCache', () => {
  it('forces reload on next call after invalidation', async () => {
    mockFetch.mockResolvedValue([
      { key: 'flag', enabled: true, percentage: 100, allowed_dealers: null },
    ])
    await isFeatureEnabled('flag')  // First load → $fetch call 1
    invalidateFeatureFlagCache()
    await isFeatureEnabled('flag')  // Reload after invalidate → $fetch call 2
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})
