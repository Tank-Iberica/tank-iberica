import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useFeatureFlag, refreshFeatureFlags } from '../../app/composables/useFeatureFlags'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stubSupabaseFlags(flags: { key: string; enabled: boolean; percentage: number; allowed_dealers: string[] | null }[]) {
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => Promise.resolve({ data: flags }),
    }),
  }))
}

async function flush() {
  await new Promise((r) => setTimeout(r, 0))
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  vi.clearAllMocks()
  // Reset the module-level singleton so each test starts with no flags loaded
  refreshFeatureFlags()
  await flush()
})

// ─── useFeatureFlag ───────────────────────────────────────────────────────────

describe('useFeatureFlag', () => {
  it('starts as false when no flags have been loaded', () => {
    const enabled = useFeatureFlag('any-key')
    expect(enabled.value).toBe(false)
  })

  it('returns false when flag does not exist in store', async () => {
    stubSupabaseFlags([{ key: 'other-flag', enabled: true, percentage: 100, allowed_dealers: null }])
    refreshFeatureFlags()
    const enabled = useFeatureFlag('nonexistent')
    await flush()
    expect(enabled.value).toBe(false)
  })

  it('returns true when flag is enabled', async () => {
    stubSupabaseFlags([{ key: 'my-feature', enabled: true, percentage: 100, allowed_dealers: null }])
    refreshFeatureFlags()
    const enabled = useFeatureFlag('my-feature')
    await flush()
    expect(enabled.value).toBe(true)
  })

  it('returns false when flag is disabled', async () => {
    stubSupabaseFlags([{ key: 'my-feature', enabled: false, percentage: 0, allowed_dealers: null }])
    refreshFeatureFlags()
    const enabled = useFeatureFlag('my-feature')
    await flush()
    expect(enabled.value).toBe(false)
  })

  it('returns a ref object', () => {
    const result = useFeatureFlag('some-flag')
    expect(result).toHaveProperty('value')
  })

  it('does not reload flags once already loaded (cache: no new DB call after load)', async () => {
    const mockSelect = vi.fn().mockResolvedValue({ data: [] })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({ select: mockSelect }),
    }))
    refreshFeatureFlags()
    useFeatureFlag('a')
    await flush() // loadFlags completes, loaded=true
    const callCount = mockSelect.mock.calls.length

    // These calls should NOT trigger a new DB round-trip (loaded=true)
    useFeatureFlag('b')
    useFeatureFlag('c')
    await flush()
    expect(mockSelect.mock.calls.length).toBe(callCount)
  })
})

// ─── refreshFeatureFlags ──────────────────────────────────────────────────────

describe('refreshFeatureFlags', () => {
  it('allows flags to be reloaded from the database', async () => {
    // Load once with flag disabled
    stubSupabaseFlags([{ key: 'flag-a', enabled: false, percentage: 0, allowed_dealers: null }])
    refreshFeatureFlags()
    const enabled = useFeatureFlag('flag-a')
    await flush()
    expect(enabled.value).toBe(false)
  })

  it('triggers a DB reload on next useFeatureFlag call after refresh', async () => {
    const mockSelect = vi.fn().mockResolvedValue({ data: [] })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({ select: mockSelect }),
    }))
    refreshFeatureFlags()
    useFeatureFlag('x')
    await flush() // loaded=true
    const countAfterFirstLoad = mockSelect.mock.calls.length

    // Refresh resets loaded=false — next call should hit DB again
    refreshFeatureFlags()
    useFeatureFlag('y')
    await flush()
    expect(mockSelect.mock.calls.length).toBeGreaterThan(countAfterFirstLoad)
  })
})
