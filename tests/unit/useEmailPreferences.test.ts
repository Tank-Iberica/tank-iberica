import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useEmailPreferences } from '../../app/composables/useEmailPreferences'

// ─── Stub helpers ──────────────────────────────────────────────────────────────

function stubUser(userId: string | null = null) {
  vi.stubGlobal('useSupabaseUser', () => ({
    value: userId ? { id: userId } : null,
  }))
}

function stubClient({
  rows = [] as Record<string, unknown>[],
  queryError = null as unknown,
  upsertError = null as unknown,
} = {}) {
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => ({
      select: () => ({
        eq: () =>
          Promise.resolve(
            queryError ? { data: null, error: queryError } : { data: rows, error: null },
          ),
      }),
      upsert: () =>
        Promise.resolve(upsertError ? { error: upsertError } : { error: null }),
    }),
  }))
}

beforeEach(() => {
  vi.clearAllMocks()
  stubUser(null)
  stubClient()
})

// ─── isAlwaysOn ───────────────────────────────────────────────────────────────

describe('isAlwaysOn', () => {
  it('returns true for confirm_email', () => {
    const c = useEmailPreferences()
    expect(c.isAlwaysOn('confirm_email')).toBe(true)
  })

  it('returns true for suspicious_activity', () => {
    const c = useEmailPreferences()
    expect(c.isAlwaysOn('suspicious_activity')).toBe(true)
  })

  it('returns false for new_lead', () => {
    const c = useEmailPreferences()
    expect(c.isAlwaysOn('new_lead')).toBe(false)
  })

  it('returns false for price_drop', () => {
    const c = useEmailPreferences()
    expect(c.isAlwaysOn('price_drop')).toBe(false)
  })

  it('returns false for marketing_newsletter', () => {
    const c = useEmailPreferences()
    expect(c.isAlwaysOn('marketing_newsletter')).toBe(false)
  })
})

// ─── isEnabled ────────────────────────────────────────────────────────────────

describe('isEnabled', () => {
  it('always returns true for confirm_email regardless of map', () => {
    const c = useEmailPreferences()
    ;(c.preferences as { value: Map<string, boolean> }).value = new Map([
      ['confirm_email', false],
    ])
    expect(c.isEnabled('confirm_email')).toBe(true)
  })

  it('always returns true for suspicious_activity regardless of map', () => {
    const c = useEmailPreferences()
    ;(c.preferences as { value: Map<string, boolean> }).value = new Map([
      ['suspicious_activity', false],
    ])
    expect(c.isEnabled('suspicious_activity')).toBe(true)
  })

  it('returns true for type not in preferences (opt-out default)', () => {
    const c = useEmailPreferences()
    expect(c.isEnabled('new_lead')).toBe(true)
  })

  it('returns true when type is explicitly enabled in map', () => {
    const c = useEmailPreferences()
    ;(c.preferences as { value: Map<string, boolean> }).value = new Map([['new_lead', true]])
    expect(c.isEnabled('new_lead')).toBe(true)
  })

  it('returns false when type is explicitly disabled in map', () => {
    const c = useEmailPreferences()
    ;(c.preferences as { value: Map<string, boolean> }).value = new Map([['new_lead', false]])
    expect(c.isEnabled('new_lead')).toBe(false)
  })
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('preferences map starts empty', () => {
    const c = useEmailPreferences()
    expect(c.preferences.value.size).toBe(0)
  })

  it('loading starts as false', () => {
    const c = useEmailPreferences()
    expect(c.loading.value).toBe(false)
  })

  it('saving starts as false', () => {
    const c = useEmailPreferences()
    expect(c.saving.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useEmailPreferences()
    expect(c.error.value).toBeNull()
  })
})

// ─── loadPreferences ──────────────────────────────────────────────────────────

describe('loadPreferences', () => {
  it('returns immediately when no user', async () => {
    stubUser(null)
    const c = useEmailPreferences()
    await c.loadPreferences()
    expect(c.loading.value).toBe(false)
    expect(c.preferences.value.size).toBe(0)
  })

  it('sets preferences map from DB rows', async () => {
    stubUser('user-1')
    stubClient({
      rows: [
        { id: '1', user_id: 'user-1', email_type: 'new_lead', enabled: true, created_at: '', updated_at: '' },
        { id: '2', user_id: 'user-1', email_type: 'price_drop', enabled: false, created_at: '', updated_at: '' },
      ],
    })
    const c = useEmailPreferences()
    await c.loadPreferences()
    expect(c.preferences.value.get('new_lead')).toBe(true)
    expect(c.preferences.value.get('price_drop')).toBe(false)
  })

  it('sets loading to false after success', async () => {
    stubUser('user-1')
    stubClient({ rows: [] })
    const c = useEmailPreferences()
    await c.loadPreferences()
    expect(c.loading.value).toBe(false)
  })

  it('sets error on DB fetch failure', async () => {
    stubUser('user-1')
    stubClient({ queryError: { message: 'DB error' } })
    const c = useEmailPreferences()
    await c.loadPreferences()
    expect(c.error.value).toBeTruthy()
  })

  it('sets loading to false after DB failure', async () => {
    stubUser('user-1')
    stubClient({ queryError: { message: 'DB error' } })
    const c = useEmailPreferences()
    await c.loadPreferences()
    expect(c.loading.value).toBe(false)
  })

  it('clears previous error before new fetch', async () => {
    stubUser('user-1')
    // Use a single mock that fails then succeeds on consecutive calls
    const mockEq = vi.fn()
      .mockResolvedValueOnce({ data: null, error: { message: 'first error' } })
      .mockResolvedValueOnce({ data: [], error: null })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({ eq: mockEq }),
        upsert: () => Promise.resolve({ error: null }),
      }),
    }))
    const c = useEmailPreferences()
    await c.loadPreferences() // first call: fails
    expect(c.error.value).toBeTruthy()
    await c.loadPreferences() // second call: succeeds → error cleared
    expect(c.error.value).toBeNull()
  })
})

// ─── togglePreference ─────────────────────────────────────────────────────────

describe('togglePreference', () => {
  it('returns false when no user', async () => {
    stubUser(null)
    const c = useEmailPreferences()
    const result = await c.togglePreference('new_lead', false)
    expect(result).toBe(false)
  })

  it('returns false for always-on types', async () => {
    stubUser('user-1')
    stubClient()
    const c = useEmailPreferences()
    const result = await c.togglePreference('confirm_email', false)
    expect(result).toBe(false)
  })

  it('does not call DB for always-on types', async () => {
    stubUser('user-1')
    const mockUpsert = vi.fn().mockResolvedValue({ error: null })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
        upsert: mockUpsert,
      }),
    }))
    const c = useEmailPreferences()
    await c.togglePreference('suspicious_activity', false)
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('returns true on successful upsert', async () => {
    stubUser('user-1')
    stubClient()
    const c = useEmailPreferences()
    const result = await c.togglePreference('new_lead', false)
    expect(result).toBe(true)
  })

  it('optimistically updates preferences map before DB call', async () => {
    stubUser('user-1')
    stubClient()
    const c = useEmailPreferences()
    ;(c.preferences as { value: Map<string, boolean> }).value = new Map([['new_lead', true]])
    const promise = c.togglePreference('new_lead', false)
    // Optimistic update is synchronous — check before await
    expect(c.preferences.value.get('new_lead')).toBe(false)
    await promise
  })

  it('sets saving to false after success', async () => {
    stubUser('user-1')
    stubClient()
    const c = useEmailPreferences()
    await c.togglePreference('new_lead', false)
    expect(c.saving.value).toBe(false)
  })

  it('returns false on upsert error', async () => {
    stubUser('user-1')
    stubClient({ upsertError: { message: 'DB error' } })
    const c = useEmailPreferences()
    const result = await c.togglePreference('new_lead', false)
    expect(result).toBe(false)
  })

  it('rolls back optimistic update on upsert error', async () => {
    stubUser('user-1')
    stubClient({ upsertError: { message: 'DB error' } })
    const c = useEmailPreferences()
    ;(c.preferences as { value: Map<string, boolean> }).value = new Map([['new_lead', true]])
    await c.togglePreference('new_lead', false)
    // Should roll back to true
    expect(c.preferences.value.get('new_lead')).toBe(true)
  })

  it('sets error message on upsert error', async () => {
    stubUser('user-1')
    stubClient({ upsertError: { message: 'Connection error' } })
    const c = useEmailPreferences()
    await c.togglePreference('new_lead', false)
    expect(c.error.value).toBeTruthy()
  })

  it('sets saving to false after upsert error', async () => {
    stubUser('user-1')
    stubClient({ upsertError: { message: 'DB error' } })
    const c = useEmailPreferences()
    await c.togglePreference('new_lead', false)
    expect(c.saving.value).toBe(false)
  })

  it('rolls back by deleting key when previous value was undefined', async () => {
    stubUser('user-1')
    stubClient({ upsertError: { message: 'DB error' } })
    const c = useEmailPreferences()
    // preferences map is empty (no stored value for 'new_lead')
    await c.togglePreference('new_lead', true)
    // Should be removed from map (not just set to undefined)
    expect(c.preferences.value.has('new_lead')).toBe(false)
  })
})

// ─── bulkUpdate ───────────────────────────────────────────────────────────────

describe('bulkUpdate', () => {
  it('returns false when no user', async () => {
    stubUser(null)
    const c = useEmailPreferences()
    const result = await c.bulkUpdate({ new_lead: false })
    expect(result).toBe(false)
  })

  it('returns true when all types are always-on (no rows to upsert)', async () => {
    stubUser('user-1')
    stubClient()
    const c = useEmailPreferences()
    const result = await c.bulkUpdate({ confirm_email: false, suspicious_activity: false })
    expect(result).toBe(true)
  })

  it('skips always-on types in bulk update', async () => {
    stubUser('user-1')
    const mockUpsert = vi.fn().mockResolvedValue({ error: null })
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
        upsert: mockUpsert,
      }),
    }))
    const c = useEmailPreferences()
    await c.bulkUpdate({ confirm_email: false, new_lead: true })
    // Only new_lead should be sent
    const calls = mockUpsert.mock.calls[0]![0] as Record<string, unknown>[]
    expect(calls.every((r) => r.email_type !== 'confirm_email')).toBe(true)
  })

  it('returns true on successful bulk upsert', async () => {
    stubUser('user-1')
    stubClient()
    const c = useEmailPreferences()
    const result = await c.bulkUpdate({ new_lead: false, price_drop: true })
    expect(result).toBe(true)
  })

  it('updates preferences map optimistically', async () => {
    stubUser('user-1')
    stubClient()
    const c = useEmailPreferences()
    c.bulkUpdate({ new_lead: false, price_drop: true })
    // Optimistic: map updated synchronously before await
    expect(c.preferences.value.get('new_lead')).toBe(false)
    expect(c.preferences.value.get('price_drop')).toBe(true)
  })

  it('returns false on upsert error', async () => {
    stubUser('user-1')
    stubClient({ upsertError: { message: 'DB error' } })
    const c = useEmailPreferences()
    const result = await c.bulkUpdate({ new_lead: false })
    expect(result).toBe(false)
  })

  it('rolls back preferences map on upsert error', async () => {
    stubUser('user-1')
    stubClient({ upsertError: { message: 'DB error' } })
    const c = useEmailPreferences()
    ;(c.preferences as { value: Map<string, boolean> }).value = new Map([['new_lead', true]])
    await c.bulkUpdate({ new_lead: false })
    // Should roll back to true
    expect(c.preferences.value.get('new_lead')).toBe(true)
  })

  it('sets saving to false after error', async () => {
    stubUser('user-1')
    stubClient({ upsertError: { message: 'DB error' } })
    const c = useEmailPreferences()
    await c.bulkUpdate({ new_lead: false })
    expect(c.saving.value).toBe(false)
  })
})

