import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useConsent, CURRENT_POLICY_VERSION } from '../../app/composables/useConsent'
import type { ConsentState } from '../../app/composables/useConsent'

// ─── localStorage stub ────────────────────────────────────────────────────────

const localStorageStore = new Map<string, string>()

function resetSingleton() {
  // useConsent has module-level `consent` and `loaded` refs.
  // Since readonly() = identity and ref() = { value }, we can reset via the return value.
  const c = useConsent()
  ;(c.consent as { value: unknown }).value = null
  ;(c.loaded as { value: unknown }).value = false
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorageStore.clear()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => localStorageStore.get(key) ?? null,
    setItem: (key: string, val: string) => localStorageStore.set(key, val),
    removeItem: (key: string) => localStorageStore.delete(key),
    clear: () => localStorageStore.clear(),
  })
  // Restore import.meta.server = false so client paths execute
  vi.stubGlobal('import', { meta: { client: true, server: false } })
  resetSingleton()
})

// ─── Initial / singleton state ────────────────────────────────────────────────

describe('initial state', () => {
  it('consent starts as null', () => {
    const c = useConsent()
    expect(c.consent.value).toBeNull()
  })

  it('loaded starts as false', () => {
    const c = useConsent()
    expect(c.loaded.value).toBe(false)
  })

  it('defaultConsent has necessary=true', () => {
    const c = useConsent()
    expect(c.defaultConsent.necessary).toBe(true)
  })

  it('defaultConsent has analytics=false', () => {
    const c = useConsent()
    expect(c.defaultConsent.analytics).toBe(false)
  })

  it('defaultConsent has marketing=false', () => {
    const c = useConsent()
    expect(c.defaultConsent.marketing).toBe(false)
  })
})

// ─── loadConsent ──────────────────────────────────────────────────────────────

describe('loadConsent', () => {
  it('returns null when localStorage is empty', () => {
    const c = useConsent()
    const result = c.loadConsent()
    expect(result).toBeNull()
  })

  it('sets loaded to true even when no consent found', () => {
    const c = useConsent()
    c.loadConsent()
    expect(c.loaded.value).toBe(true)
  })

  it('parses stored consent from localStorage', () => {
    const stored: ConsentState = {
      necessary: true,
      analytics: true,
      marketing: false,
      timestamp: '2026-01-01T00:00:00.000Z',
      policyVersion: CURRENT_POLICY_VERSION,
    }
    localStorageStore.set('tracciona_consent', JSON.stringify(stored))

    const c = useConsent()
    const result = c.loadConsent()
    expect(result).not.toBeNull()
    expect(result!.analytics).toBe(true)
  })

  it('forces necessary=true even if stored as false', () => {
    const stored = { necessary: false, analytics: false, marketing: false, timestamp: '', policyVersion: CURRENT_POLICY_VERSION }
    localStorageStore.set('tracciona_consent', JSON.stringify(stored))

    const c = useConsent()
    const result = c.loadConsent()
    expect(result!.necessary).toBe(true)
  })

  it('returns null when policyVersion is outdated (#381)', () => {
    const stored: ConsentState = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: '2026-01-01T00:00:00.000Z',
      policyVersion: '2025-01-01',
    }
    localStorageStore.set('tracciona_consent', JSON.stringify(stored))

    const c = useConsent()
    const result = c.loadConsent()
    expect(result).toBeNull()
    expect(c.loaded.value).toBe(true)
  })

  it('sets consent.value after loading', () => {
    const stored: ConsentState = {
      necessary: true,
      analytics: true,
      marketing: false,
      timestamp: '',
      policyVersion: CURRENT_POLICY_VERSION,
    }
    localStorageStore.set('tracciona_consent', JSON.stringify(stored))

    const c = useConsent()
    c.loadConsent()
    expect(c.consent.value).not.toBeNull()
    expect(c.consent.value!.analytics).toBe(true)
  })

  it('sets loaded to true after successful load', () => {
    const stored: ConsentState = { necessary: true, analytics: false, marketing: false, timestamp: '', policyVersion: CURRENT_POLICY_VERSION }
    localStorageStore.set('tracciona_consent', JSON.stringify(stored))

    const c = useConsent()
    c.loadConsent()
    expect(c.loaded.value).toBe(true)
  })

  it('returns null for corrupt JSON', () => {
    localStorageStore.set('tracciona_consent', 'not-json')
    const c = useConsent()
    const result = c.loadConsent()
    expect(result).toBeNull()
  })

  it('sets loaded=true even on corrupt JSON', () => {
    localStorageStore.set('tracciona_consent', 'not-json')
    const c = useConsent()
    c.loadConsent()
    expect(c.loaded.value).toBe(true)
  })

  it('shared state — two consumers see same consent after load', () => {
    const stored: ConsentState = { necessary: true, analytics: true, marketing: false, timestamp: '', policyVersion: CURRENT_POLICY_VERSION }
    localStorageStore.set('tracciona_consent', JSON.stringify(stored))

    const c1 = useConsent()
    c1.loadConsent()

    const c2 = useConsent()
    expect(c2.consent.value!.analytics).toBe(true)
  })
})

// ─── hasConsent ────────────────────────────────────────────────────────────────

describe('hasConsent', () => {
  it('always returns true for necessary', () => {
    const c = useConsent()
    expect(c.hasConsent('necessary')).toBe(true)
  })

  it('returns false for analytics when consent is null', () => {
    const c = useConsent()
    expect(c.hasConsent('analytics')).toBe(false)
  })

  it('returns false for marketing when consent is null', () => {
    const c = useConsent()
    expect(c.hasConsent('marketing')).toBe(false)
  })

  it('returns true for analytics when consent.analytics is true', () => {
    const c = useConsent()
    ;(c.consent as { value: ConsentState }).value = {
      necessary: true,
      analytics: true,
      marketing: false,
      timestamp: '',
    }
    expect(c.hasConsent('analytics')).toBe(true)
  })

  it('returns false for analytics when consent.analytics is false', () => {
    const c = useConsent()
    ;(c.consent as { value: ConsentState }).value = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: '',
    }
    expect(c.hasConsent('analytics')).toBe(false)
  })

  it('returns true for marketing when consent.marketing is true', () => {
    const c = useConsent()
    ;(c.consent as { value: ConsentState }).value = {
      necessary: true,
      analytics: false,
      marketing: true,
      timestamp: '',
    }
    expect(c.hasConsent('marketing')).toBe(true)
  })
})

// ─── saveConsent ───────────────────────────────────────────────────────────────

describe('saveConsent', () => {
  it('updates consent.value', async () => {
    const c = useConsent()
    await c.saveConsent({ necessary: true, analytics: true, marketing: false, timestamp: '' })
    expect(c.consent.value!.analytics).toBe(true)
  })

  it('forces necessary=true regardless of input', async () => {
    const c = useConsent()
    await c.saveConsent({ necessary: false, analytics: false, marketing: false, timestamp: '' })
    expect(c.consent.value!.necessary).toBe(true)
  })

  it('saves to localStorage', async () => {
    const c = useConsent()
    await c.saveConsent({ necessary: true, analytics: true, marketing: false, timestamp: '' })
    const stored = localStorageStore.get('tracciona_consent')
    expect(stored).toBeTruthy()
    const parsed = JSON.parse(stored!)
    expect(parsed.analytics).toBe(true)
  })

  it('adds timestamp when saving', async () => {
    const c = useConsent()
    await c.saveConsent({ necessary: true, analytics: false, marketing: false, timestamp: '' })
    const stored = localStorageStore.get('tracciona_consent')
    const parsed = JSON.parse(stored!)
    expect(parsed.timestamp).toBeTruthy()
  })

  it('does not insert into Supabase when user is not logged in', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: null }))
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({ insert: mockInsert }),
    }))
    const c = useConsent()
    await c.saveConsent({ necessary: true, analytics: true, marketing: false, timestamp: '' })
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('inserts into Supabase when user is logged in', async () => {
    vi.stubGlobal('useSupabaseUser', () => ({ value: { id: 'user-1' } }))
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({ insert: mockInsert }),
    }))
    const c = useConsent()
    await c.saveConsent({ necessary: true, analytics: true, marketing: true, timestamp: '' })
    expect(mockInsert).toHaveBeenCalledTimes(1)
    // Should insert 3 consent types
    const [inserts] = mockInsert.mock.calls[0]!
    expect(inserts).toHaveLength(3)
  })

  it('consent state shared across consumers after saveConsent', async () => {
    const c1 = useConsent()
    await c1.saveConsent({ necessary: true, analytics: true, marketing: false, timestamp: '' })
    const c2 = useConsent()
    expect(c2.consent.value!.analytics).toBe(true)
  })
})

// ─── revokeConsent ─────────────────────────────────────────────────────────────

describe('revokeConsent', () => {
  it('sets analytics to false', async () => {
    const c = useConsent()
    ;(c.consent as { value: ConsentState }).value = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: '',
    }
    await c.revokeConsent()
    expect(c.consent.value!.analytics).toBe(false)
  })

  it('sets marketing to false', async () => {
    const c = useConsent()
    await c.revokeConsent()
    expect(c.consent.value!.marketing).toBe(false)
  })

  it('keeps necessary=true', async () => {
    const c = useConsent()
    await c.revokeConsent()
    expect(c.consent.value!.necessary).toBe(true)
  })

  it('saves to localStorage after revoke', async () => {
    const c = useConsent()
    await c.revokeConsent()
    expect(localStorageStore.has('tracciona_consent')).toBe(true)
  })
})
